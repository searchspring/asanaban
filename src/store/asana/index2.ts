import { State } from "./state";
import { defineStore } from "pinia";
import jsonstore from "@/utils/jsonstore";
import { 
  Section,
  TaskAndSectionId,
  Task,
  User,
  Project,
  ProjectParams,
  TaskTag,
  BaseResource,
  PaginationParams,
  Resource
} from "@/types/asana";
import { Move, Swimlane } from "@/types/layout";
import { convertColorToHexes, getColumnCount } from "@/utils/asana-specific";
import { asanaClient } from "../auth";


export const useAsanaStore = defineStore("deploy", {
  state: (): State => ({
    workspace: jsonstore.get("workspace", null) as string | null,
    projects: jsonstore.get("projects", []) as Project[],
    selectedProject: jsonstore.get("selectedProject", null) as string | null,
    tasks: jsonstore.get("tasks", []) as Task[],
    sections: jsonstore.get("sections", []) as Section[],
    actions: [],
    errors: [],
    tags: jsonstore.get("tags", []) as TaskTag[],
    users: jsonstore.get("users", []) as User[],
    allTags: jsonstore.get("allTags", []) as TaskTag[],
  }),
  getters: {
    IS_SECTION_COMPLETE: (state) => (columnName: string) => {
      const columnNameUpper = columnName.toUpperCase()
      return columnNameUpper === 'DONE' || columnNameUpper.startsWith('COMPLETE') || columnNameUpper.startsWith('FINISH')
    },
    SWIMLANES: (state) => {
      const swimlanes: Swimlane[] = [];
      const found: Set<string> = new Set();

      state.sections.forEach(section => {
        if (section.name.indexOf(":") === -1) {
          section.name = "no swimlane:" + section.name;
        }
        if (!section.name.startsWith("no swimlane")) {
          const swimlaneName = section.name.split(":")[0];
          if (!found.has(swimlaneName)) {
            swimlanes.push({ name: swimlaneName });
            found.add(swimlaneName);
          }
        } else {
          // count tasks in this section
          const tasks = state.tasks.filter((task) => {
            return task.memberships.some((membership) => {
              return membership.section?.gid === section.gid;
            });
          });
          if (tasks.length > 0) {
            const swimlaneName = section.name.split(":")[0];
            if (!found.has(swimlaneName)) {
              swimlanes.push({ name: swimlaneName });
              found.add(swimlaneName);
            }
          }
        }
      });
      return swimlanes;
    },
  },
  actions: {
    SET_WORKSPACE(): void {
      const match = this.projects.find(p => p.gid === this.selectedProject);
      this.workspace =  match?.workspaceGid ?? null;
      jsonstore.set("workspace", this.workspace);
    },

    ADD_PROJECTS(payload: Project[]): void {
      this.projects.push(...payload);
      this.projects = sortAndUnique(this.projects);
      jsonstore.set("projects", this.projects);
    },

    ADD_ALL_TAGS(payload: TaskTag[]): void {
      this.allTags.push(...payload);
      this.allTags = sortAndUnique(this.allTags);
      colorizeTags(this.allTags);
      jsonstore.set("allTags", this.allTags);
    },

    SET_USERS(payload: User[]): void {
      this.users = payload;
      this.users = sortAndUnique(this.users);
      jsonstore.set("users", this.users);
    },

    SET_SELECTED_PROJECT(payload: string | null): void {
      this.selectedProject = payload;
      jsonstore.set("selectedProject", this.selectedProject);
    },

    SET_TAGS(payload: TaskTag[]): void {
      this.tags = sortAndUnique(payload);
      jsonstore.set("tags", this.tags);
    },

    SET_SECTIONS(payload: Section[]): void {
      this.sections = payload;
      this.sections.forEach(section => {
        section.maxTaskCount = getColumnCount(section.name);
      });
      jsonstore.set("sections", this.sections);
    },

    SET_TASKS(payload: Task[]): void {
      this.tasks = payload;
      colorizeTaskTags(this.tasks);
      this.SET_TAGS(getAllTaskTags(this.tasks));
    },

    ADD_TASKS(payload: Task[]): void {
      this.tasks.push(...payload);
      colorizeTaskTags(this.tasks);
      this.SET_TAGS(getAllTaskTags(this.tasks));
    },

    CLEAR_ERRORS(): void {
      this.errors = [];
    },

    CLEAR_ACTIONS(): void {
      this.actions = [];
    },

    MERGE_TASKS(payload: Task[]): void {
      // replace individual task with each task in payload
      payload.forEach(task => {
        const index = this.tasks.findIndex((t) => t.gid === task.gid);
        if (index !== -1) {
          this.tasks.splice(index, 1, task);
        } else {
          this.tasks.push(task);
        }
      });
      colorizeTaskTags(this.tasks);
      this.SET_TAGS(getAllTaskTags(this.tasks));
    },

    MOVE_TASK(payload: Move): void {
      const task = this.tasks.find(task => task.gid === payload.taskId);

      if (task?.memberships[0].section?.gid) {
        task.memberships[0].section.gid = payload.endSectionId;
        const siblingTask = this.tasks.find(
          task => task.gid === payload.siblingTaskId
        );

        const index = this.tasks.indexOf(task);
        const siblingIndex = this.tasks.indexOf(siblingTask!);

        this.tasks.splice(index, 1);
        this.tasks.splice(siblingIndex, 0, task);
      }

      this.actions.push({
        description: "moving task",
        func: async () => {
          await asanaClient?.sections.addTask(payload.endSectionId, {
            task: payload.taskId,
            insert_after: payload.siblingTaskId,
          });
          this.UPDATE_CUSTOM_FIELDS(payload.taskId);
        },
      });
    },

    UPDATE_CUSTOM_FIELDS(taskId: string): void {
      const task = this.tasks.find(task => task.gid === taskId)!;
      const columnChangeIdx = task.custom_fields?.findIndex(
        field => field.name === "column-change"
      );

      if (columnChangeIdx === undefined) return;

      const body = {
        custom_fields: {}
      }
      if (columnChangeIdx !== -1) {
        body.custom_fields[task.custom_fields[columnChangeIdx].gid] = new Date().toISOString();
        (task.custom_fields[columnChangeIdx] as any).text_value = new Date().toISOString();
      }
      
      this.actions.push({
        description: "updating custom fields",
        func: async () => {
          await asanaClient?.tasks.update(task.gid, body);
        }
      })
    },

    CREATE_TASK(taskAndSectionId: TaskAndSectionId): void {
      const createTask = async () => {
        // asana interface has incorrect type defintion for this function
        const task = await asanaClient!.tasks
          .create({
            ...taskAndSectionId.task,
            tags: taskAndSectionId.newTags,
            projects: [this.selectedProject],
            memberships: [{
                section: taskAndSectionId.sectionId,
                project: this.selectedProject,
              }],
          } as any);
        this.tasks.push(task as Task);
        this.UPDATE_CUSTOM_FIELDS(task.gid);
      }

      this.actions.push({
        description: "creating task",
        func: createTask
      });
    },

    UPDATE_TASK(taskAndSectionId: TaskAndSectionId): void {
      const updateTask = async () => {
        const index = this.tasks.findIndex(
          t => t.gid === taskAndSectionId.task.gid
        );
        if (index !== -1) {
          this.tasks.splice(index, 1, taskAndSectionId.task);
        }

        await asanaClient?.tasks.update(taskAndSectionId.task.gid, {
          name: taskAndSectionId.task.name,
          assignee: taskAndSectionId.task.assignee?.gid,
          html_notes: taskAndSectionId.task.html_notes,
          due_on: taskAndSectionId.task.due_on,
        });
        
        this.UPDATE_STORIES(taskAndSectionId);
        this.UPDATE_TASK_TAGS(taskAndSectionId);
      }

      this.actions.push({
        description: "updating task",
        func: updateTask
      });
    },

    DELETE_TASK(taskAndSectionId: TaskAndSectionId): void {
      const deleteTask = async () => {
        const index = this.tasks.findIndex(
          t => t.gid === taskAndSectionId.task.gid
        );
        if (index !== -1) {
          this.tasks.splice(index, 1);
        }
        await asanaClient?.tasks.delete(taskAndSectionId.task.gid);
      }

      this.actions.push({
        description: "deleting task",
        func: deleteTask
      });
    },

    COMPLETE_TASK(taskAndSectionId: TaskAndSectionId): void {
      // make helper function for this
      const completeTask = async () => {
        const index = this.tasks.findIndex(
          t => t.gid === taskAndSectionId.task.gid
        );
        if (index !== -1) {
          this.tasks.splice(index, 1);
        }
        await asanaClient?.tasks.update(taskAndSectionId.task.gid, {
          completed: true,
        });
      }

      this.actions.push({
        description: "completing task",
        func: completeTask
      });
    },

    RELEASE_TASK(task: Task): void {
      this.actions.push({
        description: "releasing task",
        func: async () => {
          const index = this.tasks.findIndex(
            t => t.gid === task.gid
            );
          if (index !== -1) {
            this.tasks.splice(index, 1);
          }
          await asanaClient?.tasks.update(task.gid, {
            completed: true,
          });
        },
      });
    },

    ADD_TASK_TAG(payload: { task: Task, tagGid: string}): void {
      this.actions.push({
        description: "adding task tag",
        func: async () => {
          await asanaClient?.tasks.addTag(payload.task.gid, {
            tag: payload.tagGid,
          });
        },
      });
    },

    REMOVE_TASK_TAG(payload: { task: Task, tagGid: string}): void {
      this.actions.push({
        description: "removing task tag",
        func: async () => {
          await asanaClient?.tasks.removeTag(payload.task.gid, {
            tag: payload.tagGid,
          });
        },
      });
    },

    UPDATE_TASK_TAGS(taskAndSectionId: TaskAndSectionId): void {
      const originalTagIds = taskAndSectionId.task.tags.map(tag => tag.gid)

      const removedTags = originalTagIds.filter(
        tagId => !taskAndSectionId.newTags.includes(tagId)
      );
      removedTags.forEach((tagGid) => {
        this.ADD_TASK_TAG({ task: taskAndSectionId.task, tagGid: tagGid});
      });

      const addedTags = taskAndSectionId.newTags.filter(
        tagId => !originalTagIds.includes(tagId)
      );
      addedTags.forEach((tagGid) => {
        this.REMOVE_TASK_TAG({ task: taskAndSectionId.task, tagGid: tagGid});
      });
    },

    UPDATE_STORIES(taskAndSectionId: TaskAndSectionId): void {
      if (taskAndSectionId.htmlText) {
        this.actions.push({
          description: "adding stories",
          func: async () => {
            await asanaClient?.stories.createOnTask(
              taskAndSectionId.task.gid,
              { html_text: taskAndSectionId.htmlText }
            );
            taskAndSectionId.htmlText = "";
          }
        });
      }
    },

    LOAD_STORIES(task: Task): void {
      const loadStories = async () => {
        if (asanaClient) {
          const storiesResponse = await asanaClient?.stories
            // asana interface has incorrect type defintion for this function
            .findByTask(task.gid, {
              limit: 100,
              fields:
                "html_text,\
                created_by.name,\
                resource_subtype,\
                type,created_at"
            } as any)
          task.stories = storiesResponse.data.filter(story => {
            return story["resource_subtype"] === "comment_added";
          });
        }
      }
      this.actions.push({
        description: "loading stories",
        func: loadStories
      })
    },

    LOAD_PROJECTS(): void {
      const loadProjects = async () => {
        if (asanaClient) {
          const workspaces = await asanaClient.workspaces.findAll();
          workspaces.data.forEach(async (workspace) => {
            const options: ProjectParams = {
              limit: 100,
              workspace: workspace.gid,
              archived: false,
            };
            let projectResponse: any = await asanaClient?.projects.findAll(options);
            for (; projectResponse; projectResponse = await projectResponse.nextPage()) {
              const projects = projectResponse.data.map(p => {
                return {
                  ...p,
                  workspaceGid: workspace.gid
                } as Project
              });
              this.ADD_PROJECTS(projects);
            }
          });
        }
      }
      this.actions.push({
        description: "loading projects",
        func: loadProjects
      });
    },

    LOAD_SELECTED_PROJECT(project: string): void {
      this.SET_SELECTED_PROJECT(project);
      this.SET_WORKSPACE();
      this.LOAD_TASKS();
      this.LOAD_SECTIONS();
      this.LOAD_USERS();
      this.LOAD_ALL_TAGS();
    },

    LOAD_TASKS(): void {
      this.actions.push({
        description: "loading tasks",
        func: async () => loadTasks(this.ADD_TASKS)
      });
    },

    LOAD_SECTIONS(): void {
      this.actions.push({
        description: "loading sections",
        func: async () => {
          if (asanaClient && this.selectedProject) {
            const sectionResponse = await asanaClient.sections.findByProject(this.selectedProject);
            // To do: fix type
            this.SET_SECTIONS(sectionResponse as any);
          }
        }
      });
    },

    LOAD_USERS(): void {
      this.actions.push({
        description: "loading users",
        func: async () => {
          if (asanaClient && this.workspace) {
            const userResponse = await asanaClient.users.findByWorkspace(
              this.workspace, {
                opt_fields: 
                  "name,\
                  photo.image_60x60,\
                  resource_type,email",
              })
            // to do: fix type
            this.SET_USERS(userResponse.data as any);
          }
        }
      });
    },

    LOAD_ALL_TAGS(): void {
      const loadAllTags = async () => {
        if (asanaClient && this.selectedProject) {
          this.allTags = [];
          const options: PaginationParams = {
            limit: 100,
            opt_fields: "color,name",
          };
          let tagResponse: any = await asanaClient.tags.findByWorkspace(this.workspace!, options);
          for (; tagResponse; tagResponse = await tagResponse.nextPage()) {
            this.ADD_ALL_TAGS(tagResponse.data as TaskTag[]);
          }
        }
      }
      this.actions.push({
        description: "loading all tags",
        func: loadAllTags
      })
    },

    LOAD_AND_MERGE_TASKS(): void {
      loadTasks(this.MERGE_TASKS);
    },

    async LOAD_QUERIED_TASK(query: string): Promise<Resource[] | undefined> {
      const taskResponse = await asanaClient?.workspaces.typeahead(
        this.workspace!, {
          // interface wrong, casted to any
          resource_type: "task",
          query: query,
          count: 5,
          opt_fields: "name,completed,projects.name"
        } as any);
      return taskResponse?.data;
    },

    RELEASE_SECTION(tasks: Task[]): void {
      tasks.forEach(task => this.RELEASE_TASK(task));
    }
  }
});

async function loadTasks(action) {
  const asanaStore = useAsanaStore();
  if (asanaClient && asanaStore.selectedProject) {
    asanaStore.SET_TASKS([]);
    asanaStore.SET_TAGS([]);
    const options: any = {
      project: asanaStore.selectedProject!,
      completed_since: "now",
      limit: 100,
      fields:
        "custom_fields,\
        created_by,\
        created_at,\
        created_by.name,\
        tags.name,\
        tags.color,\
        memberships.section.name,\
        memberships.project.name,\
        name,\
        assignee.photo,\
        assignee.name,\
        assignee.email,\
        due_on,\
        modified_at,\
        html_notes,\
        notes,\
        stories",
    };
    let taskResponse: any = await asanaClient.tasks.findAll(options);
    for (; taskResponse; taskResponse = await taskResponse.nextPage()) {
      if (asanaStore.actions.length === 0) {
        action(taskResponse.data as Task[]);
      }
    }
  }
}

function sortAndUnique<T extends BaseResource>(stuff: T[]): T[] {
  const uniqueStuff = unique(stuff);
  uniqueStuff.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
  return uniqueStuff;
}

function unique<T extends BaseResource>(stuff: T[]): T[] {
  stuff.sort((a, b) => {
    return a.gid.localeCompare(b.gid) ?? 0;
  });
  const uniqueStuff = stuff.filter(
    (thing, index, self) => index === self.findIndex((t) => t.gid === thing.gid)
  );
  return uniqueStuff;
}

function colorizeTaskTags(tasks: Task[]): void {
  tasks.forEach(task => colorizeTags(task.tags));
}

function colorizeTags(tags: TaskTag[]): void {
  tags.forEach(tag => {
    tag.hexes = convertColorToHexes(tag.color === "none"? "white": tag.color);
  });
}

function getAllTaskTags(tasks: Task[]): TaskTag[] {
  const tags: TaskTag[] = [];
  tasks.forEach(task => {
    task.tags.forEach(tag => {
      if (!tags.find(t => t.gid === tag.gid)) {
        tags.push(tag);
      }
    });
  });
  return tags;
}