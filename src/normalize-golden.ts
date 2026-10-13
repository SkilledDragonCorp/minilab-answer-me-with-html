/** Colophon embeds render time; strip it for deterministic golden compares. */
export const GOLDEN_TIMESTAMP = "<AM_TIMESTAMP>";

const COLOPHON_TIME =
  /(<p class="am-colophon">[\s\S]*?<\/a> 0\.5\.2 · )[\d]{4}-[\d]{2}-[\d]{2} [\d]{2}:[\d]{2}( ·)/g;

export function normalizeGoldenHtml(html: string): string {
  return html.replace(COLOPHON_TIME, `$1${GOLDEN_TIMESTAMP}$2`);
}
