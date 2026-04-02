export function decodeHtmlEntities(value: string): string {
  let text = value;
  for (let i = 0; i < 2; i++) {
    const next = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    if (next === text) break;
    text = next;
  }
  return text;
}

export function stripTrailingSections(value: string): string {
  return value.split(/\b(?:Constraints|Follow-up|Note)\s*:/i)[0].trim();
}

export function formatExampleExplanation(value: string): string {
  const decoded = decodeHtmlEntities(value).trim();
  const cleaned = stripTrailingSections(decoded);
  const normalizeArrow = (text: string) => text.replace(/\s*-->\s*/g, ' -> ').trim();
  const arrowSteps = Array.from(
    cleaned.matchAll(/(\d+\s*-->\s*[^\n;]+?)(?=\s+\d+\s*-->|;|$)/g),
  ).map((match) => normalizeArrow(match[1]).replace(/->/g, '→'));

  if (arrowSteps.length > 1) {
    return arrowSteps.join('\n');
  }

  return normalizeArrow(cleaned)
    .replace(/\s*;\s*/g, '\n')
    .replace(/->/g, '→');
}
