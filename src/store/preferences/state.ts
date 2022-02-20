import { TaskAndSectionId } from "@/types/asana";

export interface ColumnState {
  [gid: string]: { collapsed: boolean };
}

export interface SwimlaneState {
  [swimlaneName: string]: { collapsed: boolean };
}

export interface State {
  columnStates: ColumnState;
  swimlaneStates: SwimlaneState;
  search: string;
  taskEditorSectionIdAndTask: TaskAndSectionId | null;
}
