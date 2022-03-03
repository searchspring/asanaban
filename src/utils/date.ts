import { format, isValid } from "date-fns";
import { SelectedAsanaDate } from "@/types/asana";

export const asanaDateFormat = "yyyy-MM-dd";

export function formattedDate(date: Date | undefined): string {
  if (isValid(date)) {
    return format(date!, asanaDateFormat);
  }
  if (date === undefined) {
    return "";
  }
  return "Invalid Date";
};

export function isInvalidAsanaDate(date: SelectedAsanaDate): boolean {
  if (date == "Invalid Date") {
    return true;
  }
  return false;
};