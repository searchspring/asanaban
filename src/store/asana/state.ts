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
  func: () => any
}

export interface State {
  workspace: string | null,
  projects: Project[],
  selectedProject: string | null,
  tasks: Task[],
  sections: Section[],
  actions: Action[],
  errors: AsanaError[],
  tags: TaskTag[],
  users: User[],
}