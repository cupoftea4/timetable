const DOMAIN_PATTERN = /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,63}$/iu;
const BARE_URL_PATTERN = /^[\w-]+(?:\.[\w-]+)+(?::\d+)?(?:[/?#]|$)/u;
const INLINE_URL_PATTERN = /(?<![\w:/])(?:https?:\/\/|\/\/)[^\s<>"']+/giu;

function getWebUrl(value: string): string | null {
  const normalizedValue = value.trim().replace(/&(?:amp;)+/giu, "&");
  if (!normalizedValue || /[\s\\]/u.test(normalizedValue)) return null;

  const candidate = normalizedValue.startsWith("//")
    ? `https:${normalizedValue}`
    : BARE_URL_PATTERN.test(normalizedValue)
      ? `https://${normalizedValue}`
      : normalizedValue;

  try {
    const url = new URL(candidate);
    const isWebProtocol = url.protocol === "https:" || url.protocol === "http:";
    const hasEmbeddedCredentials = url.username !== "" || url.password !== "";
    if (!isWebProtocol || !DOMAIN_PATTERN.test(url.hostname) || hasEmbeddedCredentials) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function parseLessonLink(text: string) {
  const directUrl = getWebUrl(text);
  if (directUrl) return { text, directUrl, links: [directUrl], parts: [{ text, href: directUrl }] };

  const parts: { text: string; href: string | null }[] = [];
  let end = 0;
  for (const match of text.matchAll(INLINE_URL_PATTERN)) {
    const candidate = match[0].replace(/[.,;]+$/u, "");
    const href = getWebUrl(candidate);
    if (!href) continue;
    parts.push({ text: text.slice(end, match.index), href: null }, { text: candidate, href });
    end = match.index + candidate.length;
  }
  parts.push({ text: text.slice(end), href: null });
  const links = [...new Set(parts.flatMap((part) => (part.href ? [part.href] : [])))];
  return { text, directUrl, links, parts };
}
