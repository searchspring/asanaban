import { format, isValid } from "date-fns";

export const asanaDateFormat = "yyyy-MM-dd";

export function formattedDate(date: Date | undefined): string {
  // naive date picker ensures only date will only be invalid if it is undefined (no date)
  if (!isValid(date)) {
    return "";
  } else {
    return format(date!, asanaDateFormat);
  }
};