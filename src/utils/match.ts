export function isFilenameExtensionImage(str: string) {
  return new RegExp(".*(?:jpg|gif|png|jpeg|svg|webp)").test(str);
}