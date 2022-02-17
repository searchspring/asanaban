import asana from "asana";
import { Hex } from "@/utils/asana-specific";

export type Resource = asana.resources.Resource;
export type BaseResource = Omit<Resource, "resource_subtype" | "id">;

// interface doesn't have ProjectCompact type https://developers.asana.com/docs/project-compact
export type Project = BaseResource & {
  workspaceGid: string,
};

export type Section = asana.resources.Sections.Type & { maxTaskCount: string };
export type Tag = asana.resources.Tags.Type;
export type TaskTag = Resource & {
  color: string,
  hexes?: Hex,
};
export type User = asana.resources.Users.Type & {
  email: string,
  photo: { image_60x60: string} | null,
};
export type Stories = asana.resources.Stories.Type;
export type Task = Omit<asana.resources.Tasks.Type, "tags"> & {
  created_by: Resource,
  html_notes: string | undefined,
  stories: Stories[],
  tags: TaskTag[],
};

export type Assignee = asana.resources.Assignee;
export type TaskParams = asana.resources.Tasks.FindAllParams;
export type ProjectParams = asana.resources.Projects.FindAllParams;
export type PaginationParams = asana.resources.PaginationParams;

export type AsanaError = asana.errors.AsanaError;

export type TaskAndSectionId = {
  task: Task,
  htmlText: string,
  newTags: string[],
  sectionId: string,
}