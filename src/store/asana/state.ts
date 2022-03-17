import {
  AsanaError,
  Project,
  Section,
  Task,
  TaskTag,
  User
} from "@/types/asana";

export interface Action {
  description: string,
  func: () => Promise<any>,
  isProcessing: boolean,
  retries: number,
}

export interface WorkerError {
  message: string,
  description: string,
}

export interface State {
  workspace: string | null,
  projects: Project[],
  selectedProject: string | null,
  tasks: Task[],
  sections: Section[],
  actions: Action[],
  errors: WorkerError[],
  tags: TaskTag[],
  users: User[],
  allTags: TaskTag[],
}