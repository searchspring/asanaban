import {
  Project,
  Section,
  Task,
  User
} from "@/types/asana";
import asana from "asana";

export interface State {
  asanaClient: asana.Client | null,
  projects: Project[],
  selectedProject: string | null,
  tasks: Task[],
  sections: Section[],
  actions: any[],
  errors: any[],
  tags: string[],
  users: User[],
}