#!/usr/bin/env bash
# repurpose-pillar.sh — Turn a pillar article into multi-platform content
#
# Usage:
#   ./scripts/repurpose-pillar.sh pillar/<slug>.md
#   ./scripts/repurpose-pillar.sh all-pillars   # loop every pillar
#
# Generates (per pillar):
#   - 3 TikTok/Reel scripts (Yapmaxxing format — hook ≤3s + tension + payoff)
#   - 2 Facebook posts (deep-dive, 300-500 words, Pun voice)
#   - 1 IG carousel outline (6-slide)
#
# Output lands in:
#   /Users/r_nat/Documents/claude-code-pun-nattapatch/output/content/reel/
#   /Users/r_nat/Documents/claude-code-pun-nattapatch/output/content/article/
#   /Users/r_nat/Documents/claude-code-pun-nattapatch/output/content/carousel/
#
# Prereqs: OPENROUTER_API_KEY env var, jq, curl

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_ROOT="/Users/r_nat/Documents/claude-code-pun-nattapatch/output/content"

CURL_BIN=/opt/local/bin/curl
[ -x "$CURL_BIN" ] || CURL_BIN=/usr/bin/curl
JQ_BIN=/usr/bin/jq

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "Usage: $0 <pillar/slug.md | all-pillars>" >&2
  exit 1
fi

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "ERROR: OPENROUTER_API_KEY not set" >&2
  exit 1
fi

mkdir -p "$OUTPUT_ROOT/reel" "$OUTPUT_ROOT/article" "$OUTPUT_ROOT/carousel"

# ---- Build file list ----
FILES=()
if [ "$TARGET" = "all-pillars" ]; then
  while IFS= read -r f; do FILES+=("$f"); done < <(find "$REPO_ROOT/src/content/pillar" -name '*.md' | sort)
elif [ -f "$REPO_ROOT/src/content/$TARGET" ]; then
  FILES=("$REPO_ROOT/src/content/$TARGET")
elif [ -f "$TARGET" ]; then
  FILES=("$TARGET")
else
  echo "ERROR: $TARGET not found" >&2
  exit 1
fi

# ---- System prompt (Pun's voice + Yapmaxxing for reels) ----
SYSTEM_PROMPT='You are a content repurposing editor for Pun Nattapatch (@pun_nattapatch), a Thai B2B Sales Consultant + Agentic AI Transformation Specialist.

Given a Thai pillar article, generate a JSON object with these keys:

1. reels (array of 3 objects):
   Each has: title (Thai, ≤60 chars), hook (≤3 sec spoken, no intro — skip "สวัสดีครับ"), body (15-30 sec middle — tension, specific numbers, before/after), payoff (10-15 sec — actionable takeaway, CUT the safest last line), caption (1-3 lines with keyword + CTA like "DM คำว่า X")
   Format per reel follows Yapmaxxing: Hook → Tension → Payoff, with SHORT and LONG sentences mixed.

2. fb_posts (array of 2 objects):
   Each has: title (Thai, ≤80 chars), hook (opening 2-3 lines that create tension or specific claim), body (300-500 Thai words — deep dive, specific numbers, real client examples mentioned in source), cta (1-2 lines ending with action — link to /intake-form or /booking or /services)
   Voice: Pun writes "ผม" first-person, practitioner not educator, specific numbers, no AI padding.

3. carousel (1 object):
   Has: title (Thai, ≤50 chars), slides (array of 6 objects). Each slide has: heading (≤10 Thai words), body (≤40 Thai words). Slide 1 = Hook, Slides 2-5 = content + framework, Slide 6 = CTA.

HARD RULES:
- Thai content stays Thai. English technical terms (workflow, commission, KPI, pipeline, n8n, AI Agent, Google Sheets, Claude Code) stay English.
- Use "ผม" (not "พวกเรา" or "ที่ปรึกษา")
- Specific numbers everywhere (฿30,000 not "ราคาไม่สูง" / "12 คน" not "ทีม")
- NO AI padding: ขับเคลื่อน, ยกระดับ, ตอบโจทย์ทุก, ครอบคลุมทุกด้าน, leverage, robust, pivotal, delve
- NO signposted endings (สรุปแล้ว, โดยสรุป, In conclusion)
- NO bold-keyword-prefix bullets like - **keyword**: — use plain prose
- NO tacked-on significance phrases (ซึ่งสะท้อน, ซึ่งตอกย้ำ)
- NO brand names (HubSpot, Salesforce, Power BI, Tableau, competitor consultants)
- Reel hooks MUST be different styles: one curiosity, one bold claim, one pain point
- FB posts MUST be different angles: one case study, one framework

Return ONLY the JSON object. No preamble, no markdown code fences.'

for f in "${FILES[@]}"; do
  base=$(basename "$f" .md)
  echo "=== Repurposing: $base ==="

  # Extract body (skip frontmatter)
  body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2{print}' "$f")

  if [ -z "$(echo "$body" | tr -d '[:space:]')" ]; then
    echo "  (empty body, skip)"
    continue
  fi

  # Build user message with explicit prefix/suffix
  user_msg=$(printf 'Source pillar (Thai):\n\n%s\n\nReturn the JSON object now.' "$body")

  "$CURL_BIN" -s -X POST "https://openrouter.ai/api/v1/chat/completions" \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$("$JQ_BIN" -n \
      --arg sys "$SYSTEM_PROMPT" \
      --arg user "$user_msg" \
      '{
        model: "google/gemini-2.5-pro",
        messages: [
          {role: "system", content: $sys},
          {role: "user", content: $user}
        ]
      }')" \
    --max-time 180 > "$TMP_DIR/resp.json"

  raw=$("$JQ_BIN" -r '.choices[0].message.content // empty' "$TMP_DIR/resp.json")
  if [ -z "$raw" ]; then
    echo "  ❌ API error:"; "$JQ_BIN" -r '.error // .' "$TMP_DIR/resp.json" | head -5
    continue
  fi

  # Strip code fences Gemini sometimes adds
  cleaned=$(echo "$raw" | sed -e '/^```json$/d' -e '/^```$/d')

  if ! echo "$cleaned" > "$TMP_DIR/parsed.json" || ! "$JQ_BIN" empty "$TMP_DIR/parsed.json" 2>/dev/null; then
    echo "  ❌ invalid JSON, saving raw for debug"
    echo "$raw" > "$OUTPUT_ROOT/_debug-$base.txt"
    continue
  fi

  # Write reel files
  reel_count=$("$JQ_BIN" -r '.reels | length' "$TMP_DIR/parsed.json")
  for i in $(seq 0 $((reel_count - 1))); do
    out="$OUTPUT_ROOT/reel/reel-from-${base}-$((i+1)).md"
    {
      echo "---"
      echo "source_pillar: $base"
      echo "repurposed_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
      echo "format: tiktok-reel-yapmaxxing"
      echo "idx: $((i+1))"
      echo "---"
      echo ""
      echo "# $("$JQ_BIN" -r ".reels[$i].title" "$TMP_DIR/parsed.json")"
      echo ""
      echo "## Hook (≤3 วิ)"
      "$JQ_BIN" -r ".reels[$i].hook" "$TMP_DIR/parsed.json"
      echo ""
      echo "## Body (15-30 วิ)"
      "$JQ_BIN" -r ".reels[$i].body" "$TMP_DIR/parsed.json"
      echo ""
      echo "## Payoff (10-15 วิ)"
      "$JQ_BIN" -r ".reels[$i].payoff" "$TMP_DIR/parsed.json"
      echo ""
      echo "## Caption"
      "$JQ_BIN" -r ".reels[$i].caption" "$TMP_DIR/parsed.json"
    } > "$out"
    echo "  ✓ reel $((i+1)): $out"
  done

  # Write FB posts
  fb_count=$("$JQ_BIN" -r '.fb_posts | length' "$TMP_DIR/parsed.json")
  for i in $(seq 0 $((fb_count - 1))); do
    out="$OUTPUT_ROOT/article/fb-from-${base}-$((i+1)).md"
    {
      echo "---"
      echo "source_pillar: $base"
      echo "repurposed_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
      echo "format: facebook-post"
      echo "idx: $((i+1))"
      echo "---"
      echo ""
      echo "# $("$JQ_BIN" -r ".fb_posts[$i].title" "$TMP_DIR/parsed.json")"
      echo ""
      "$JQ_BIN" -r ".fb_posts[$i].hook" "$TMP_DIR/parsed.json"
      echo ""
      "$JQ_BIN" -r ".fb_posts[$i].body" "$TMP_DIR/parsed.json"
      echo ""
      echo "---"
      echo ""
      "$JQ_BIN" -r ".fb_posts[$i].cta" "$TMP_DIR/parsed.json"
    } > "$out"
    echo "  ✓ fb $((i+1)): $out"
  done

  # Write carousel
  out="$OUTPUT_ROOT/carousel/carousel-from-${base}.md"
  {
    echo "---"
    echo "source_pillar: $base"
    echo "repurposed_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "format: ig-carousel-6-slide"
    echo "---"
    echo ""
    echo "# $("$JQ_BIN" -r ".carousel.title" "$TMP_DIR/parsed.json")"
    echo ""
    slide_count=$("$JQ_BIN" -r '.carousel.slides | length' "$TMP_DIR/parsed.json")
    for s in $(seq 0 $((slide_count - 1))); do
      echo "## Slide $((s+1)): $("$JQ_BIN" -r ".carousel.slides[$s].heading" "$TMP_DIR/parsed.json")"
      echo ""
      "$JQ_BIN" -r ".carousel.slides[$s].body" "$TMP_DIR/parsed.json"
      echo ""
    done
  } > "$out"
  echo "  ✓ carousel: $out"
done

echo ""
echo "=== Repurpose summary ==="
echo "  Reels:     $(find "$OUTPUT_ROOT/reel" -name 'reel-from-*.md' | wc -l | tr -d ' ')"
echo "  FB posts:  $(find "$OUTPUT_ROOT/article" -name 'fb-from-*.md' | wc -l | tr -d ' ')"
echo "  Carousels: $(find "$OUTPUT_ROOT/carousel" -name 'carousel-from-*.md' | wc -l | tr -d ' ')"
