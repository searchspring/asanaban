import {
  AsanaError,
  Project,
  Section,
  Task,
  TaskTag,
  User
} from "@/types/asana";
import asana from "asana";

export interface Action {
  description: string,
  func: () => any
}

export interface State {
  asanaClient: asana.Client | null,
  projects: Project[],
  selectedProject: string | null,
  tasks: Task[],
  sections: Section[],
  actions: Action[],
  errors: AsanaError[],
  tags: TaskTag[],
  users: User[],
  allTags: TaskTag[],
}