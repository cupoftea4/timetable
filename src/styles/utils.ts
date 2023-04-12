export function classes(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}