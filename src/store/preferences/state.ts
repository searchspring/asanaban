import { TaskAndSectionId } from "@/types/asana";

export interface ColumnState {
  [gid: string]: { collapsed: boolean };
}

export interface State {
  columnStates: ColumnState,
  search: string,
  taskEditorSectionIdAndTask: TaskAndSectionId | null
}