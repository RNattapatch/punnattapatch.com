/**
 * reading-time.ts — minimal reading-time estimator for Thai + English mixed prose.
 *
 * Thai text doesn't use word breaks, so word-counting via whitespace
 * underestimates wildly. We estimate by character count using a Thai-tuned
 * speed (300 chars/min for Thai, equivalent to ~50 wpm for prose readers).
 * For English-leaning text, fall back to wpm.
 */

export function estimateReadingTimeMinutes(text: string): number {
  if (!text) return 0;

  const stripped = text
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]*`/g, '') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → label only
    .replace(/<[^>]+>/g, '') // html
    .replace(/^---[\s\S]*?---/m, ''); // frontmatter

  const totalChars = stripped.length;

  // Detect Thai-heavy content
  const thaiChars = (stripped.match(/[\u0E00-\u0E7F]/g) || []).length;
  const isThaiHeavy = thaiChars / Math.max(totalChars, 1) > 0.3;

  if (isThaiHeavy) {
    // 300 Thai chars per minute (slower than English wpm-equivalent)
    return Math.max(1, Math.ceil(totalChars / 300));
  }

  // English-leaning: 220 words per minute average
  const words = stripped.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
