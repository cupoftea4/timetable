export function classes(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}
