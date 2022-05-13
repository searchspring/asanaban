export function isFilenameExtensionImage(str: string) {
  return /.*\(?:jpg|gif|png|jpeg|svg|webp\)/.test(str);
}