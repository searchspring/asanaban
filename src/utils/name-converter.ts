function getPrettyColumnName(columnName: string): string {
  const parts = columnName.split(/[:|]/);
  if (parts && parts.length > 0) {
    return parts[1];
  }
  return columnName;
}

export { getPrettyColumnName };
