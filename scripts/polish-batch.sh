#!/usr/bin/env bash
# polish-batch.sh — AEO content polish pipeline
#
# Usage:
#   ./scripts/polish-batch.sh faq              # polish all FAQs (draft or not)
#   ./scripts/polish-batch.sh pillar           # polish all pillars
#   ./scripts/polish-batch.sh cluster          # polish all clusters
#   ./scripts/polish-batch.sh <path/to/file>   # polish single file
#   ./scripts/polish-batch.sh faq --draft-only # only files with draft: true
#   ./scripts/polish-batch.sh --check <type>   # run red-flag grep only (no polish)
#
# Prerequisites:
#   - OPENROUTER_API_KEY env var set
#   - jq installed (macOS: /usr/bin/jq default)
#   - curl at /opt/local/bin/curl OR /usr/bin/curl
#
# What it does:
#   1. Split frontmatter (up to 2nd ---) from body
#   2. POST body to OpenRouter Gemini 2.5 Pro with Pun anti-AI-slop prompt
#   3. sed-scrub bold-keyword-prefix bullets
#   4. Reassemble frontmatter + polished body → overwrite file
#   5. Final grep on 16 red-flag patterns → report 0 matches = PASS
#
# Exit codes:
#   0 = all files processed + 0 red flags
#   1 = input error (bad type, no API key)
#   2 = polish API failed
#   3 = red flags detected after polish

set -euo pipefail

# ---- Setup paths ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTENT_DIR="$REPO_ROOT/src/content"

CURL_BIN=/opt/local/bin/curl
[ -x "$CURL_BIN" ] || CURL_BIN=/usr/bin/curl
JQ_BIN=/usr/bin/jq

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# ---- Arg parsing ----
CHECK_ONLY=false
DRAFT_ONLY=false
TARGET=""

for arg in "$@"; do
  case "$arg" in
    --check) CHECK_ONLY=true ;;
    --draft-only) DRAFT_ONLY=true ;;
    *)
      if [ -z "$TARGET" ]; then TARGET="$arg"; fi
      ;;
  esac
done

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <faq|pillar|cluster|case-analysis|path-to-file> [--draft-only] [--check]" >&2
  exit 1
fi

# ---- Resolve target into file list ----
FILES=()
if [ -f "$TARGET" ]; then
  FILES=("$TARGET")
elif [ -d "$CONTENT_DIR/$TARGET" ]; then
  while IFS= read -r f; do FILES+=("$f"); done < <(find "$CONTENT_DIR/$TARGET" -name '*.md' -type f | sort)
else
  echo "ERROR: $TARGET is neither a file nor a content type (faq/pillar/cluster/case-analysis)" >&2
  exit 1
fi

if $DRAFT_ONLY; then
  FILTERED=()
  for f in "${FILES[@]}"; do
    if head -20 "$f" | grep -q '^draft: true'; then FILTERED+=("$f"); fi
  done
  FILES=("${FILTERED[@]}")
fi

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "No files to process."
  exit 0
fi

# ---- Check-only mode: skip polish, jump to red-flag scan ----
if $CHECK_ONLY; then
  echo "=== Red-flag scan on ${#FILES[@]} file(s) ==="
  RED_FLAGS='ซึ่งสะท้อน|ซึ่งตอกย้ำ|ซึ่งแสดงให้เห็น|ก้าวสำคัญ|จุดเปลี่ยนสำคัญ|เปลี่ยนแปลงครั้งสำคัญ|สรุปแล้ว|โดยสรุป|ตอบโจทย์ทุก|ครอบคลุมทุกด้าน|ยกระดับ|delve|leverage|pivotal|tapestry|robust|In conclusion'
  TOTAL_MATCHES=0
  for f in "${FILES[@]}"; do
    matches=$(grep -cE "$RED_FLAGS" "$f" 2>/dev/null || true)
    matches=${matches:-0}
    if [ "$matches" -gt 0 ]; then
      echo "  ❌ $(basename "$f") — $matches red-flag match(es)"
      grep -nE "$RED_FLAGS" "$f" | head -5 | sed 's/^/     /'
      TOTAL_MATCHES=$((TOTAL_MATCHES + matches))
    else
      echo "  ✓ $(basename "$f")"
    fi
  done
  echo "=== Total red-flag matches: $TOTAL_MATCHES ==="
  if [ "$TOTAL_MATCHES" -gt 0 ]; then exit 3; fi
  exit 0
fi

# ---- Polish loop ----
if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "ERROR: OPENROUTER_API_KEY not set" >&2
  exit 1
fi

SYSTEM_PROMPT='You are a strict anti-AI-slop editor for Pun Nattapatch (@pun_nattapatch), a Thai B2B Sales Consultant. Polish this Thai article so it sounds like Pun (direct, specific, confident, no AI padding).

HARD RULES:
1. NEVER start bullets with bold-keyword format like - **keyword**: — rewrite as plain prose bullets. Labels on their own line like **Label** (in section sub-headers) are OK.
2. Remove AI padding: ขับเคลื่อน, ยกระดับ, ตอบโจทย์ทุก, ครอบคลุมทุกด้าน, leverage, robust, pivotal, delve, tapestry, meticulous, groundbreaking, seamlessly
3. Remove tacked-on significance phrases: ซึ่งสะท้อน, ซึ่งตอกย้ำ, ซึ่งแสดงให้เห็น, reflecting, highlighting, underscoring, symbolizing
4. Kill negative parallelism — allow "ไม่ใช่ X แต่คือ Y" max 1 time per article
5. No signposted endings: สรุปแล้ว, โดยสรุป, In conclusion, To sum up, As we have seen
6. Keep ALL specific facts, prices, percentages, client names, tables, markdown links intact — do not invent new numbers
7. Vary sentence length — mix short (<10 words) and long, not all medium
8. Preserve ## headings + - bullets + | tables | + all markdown structure
9. Keep Thai text in Thai (English technical terms like workflow, pipeline, commission stay English)
10. Use ผม (not พวกเรา or ที่ปรึกษา) as primary pronoun
11. Return ONLY the polished markdown body, no code fences wrapping the output, no preamble, no commentary'

POLISHED=0
FAILED=0

for f in "${FILES[@]}"; do
  base=$(basename "$f")
  echo "=== polish: $base ==="

  # Split frontmatter + body
  awk 'BEGIN{c=0} /^---$/{c++; print; if(c==2) exit; next} c>=1{print}' "$f" > "$TMP_DIR/fm.md"
  awk 'BEGIN{c=0} /^---$/{c++; next} c>=2{print}' "$f" > "$TMP_DIR/body.md"
  body=$(cat "$TMP_DIR/body.md")

  if [ -z "$(echo "$body" | tr -d '[:space:]')" ]; then
    echo "  (empty body, skip)"
    continue
  fi

  # POST to OpenRouter
  "$CURL_BIN" -s -X POST "https://openrouter.ai/api/v1/chat/completions" \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$("$JQ_BIN" -n \
      --arg sys "$SYSTEM_PROMPT" \
      --arg content "$body" \
      '{
        model: "google/gemini-2.5-pro",
        messages: [
          {role: "system", content: $sys},
          {role: "user", content: $content}
        ]
      }')" \
    --max-time 120 > "$TMP_DIR/resp.json"

  polished=$("$JQ_BIN" -r '.choices[0].message.content // empty' "$TMP_DIR/resp.json")

  if [ -z "$polished" ]; then
    echo "  ❌ polish failed:"
    "$JQ_BIN" -r '.error // .' "$TMP_DIR/resp.json" | head -5 | sed 's/^/     /'
    FAILED=$((FAILED + 1))
    continue
  fi

  # Scrub code fences + bold-keyword-prefix bullets
  polished=$(echo "$polished" \
    | sed -e '/^```markdown$/d' -e '/^```md$/d' -e '/^```$/d' \
    | sed -E 's/^(-[[:space:]]+)\*\*([^*]+)\*\*:?([[:space:]]*)/\1\2\3/')

  # Reassemble: frontmatter + blank + polished body
  {
    cat "$TMP_DIR/fm.md"
    echo
    echo "$polished"
  } > "$f"

  lines=$(echo "$polished" | wc -l | tr -d ' ')
  echo "  ✓ polished ($lines lines)"
  POLISHED=$((POLISHED + 1))
done

echo ""
echo "=== Polish summary: $POLISHED ok, $FAILED failed ==="

# ---- Final red-flag scan ----
RED_FLAGS='ซึ่งสะท้อน|ซึ่งตอกย้ำ|ซึ่งแสดงให้เห็น|ก้าวสำคัญ|จุดเปลี่ยนสำคัญ|เปลี่ยนแปลงครั้งสำคัญ|สรุปแล้ว|โดยสรุป|ตอบโจทย์ทุก|ครอบคลุมทุกด้าน|ยกระดับ|delve|leverage|pivotal|tapestry|robust|In conclusion'
TOTAL_MATCHES=0
echo ""
echo "=== Final red-flag scan ==="
for f in "${FILES[@]}"; do
  matches=$(grep -cE "$RED_FLAGS" "$f" 2>/dev/null || true)
  matches=${matches:-0}
  if [ "$matches" -gt 0 ]; then
    echo "  ❌ $(basename "$f") — $matches red flag(s)"
    grep -nE "$RED_FLAGS" "$f" | head -3 | sed 's/^/     /'
    TOTAL_MATCHES=$((TOTAL_MATCHES + matches))
  fi
done

if [ "$TOTAL_MATCHES" -eq 0 ]; then
  echo "  ✓ all clean — 0 red-flag matches"
fi

echo "=== Total red flags: $TOTAL_MATCHES ==="
[ "$TOTAL_MATCHES" -gt 0 ] && exit 3
[ "$FAILED" -gt 0 ] && exit 2
exit 0
