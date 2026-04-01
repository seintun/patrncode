const CODE_FENCE_RE = /```[\s\S]*?```/g;

export function sanitizeCoachingContent(content: string): string {
  if (!content) return content;

  const stripped = content.replace(CODE_FENCE_RE, '[Code removed by coach safety policy]');
  return stripped.replace(/\n{3,}/g, '\n\n').trim();
}
