import { CustomField } from "@/types/asana";

export const ColumnChange = "column-change";
export const Color = "color";

export function getDisplayableCustomFields(fields: CustomField[] | null | undefined) {
    return fields ? fields.filter(isDisplayableCustomField) : [];
}

export function isDisplayableCustomField(f: CustomField) {
    return f.name !== ColumnChange && f.name !== Color && f.enum_options && f.enum_options.length > 0;
}