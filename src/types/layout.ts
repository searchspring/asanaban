export interface Move {
  startSectionId: string;
  endSectionId: string;
  taskId: string;
  siblingTaskId: string;
  endOfColumn: boolean;
}

export interface Swimlane {
  name: string;
}