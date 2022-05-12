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
import { getColumnCount, getPrettyColumnName, convertAsanaColorToHex } from "@/utils/asana-specific";
import { asanaClient, useAuthStore } from "../auth";
import { ColumnChange } from "@/utils/custom-fields";


export const useAsanaStore = defineStore("asana", {
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
    lastUpdatedTime: null,
    reloadState: {
      locked: false,
      lastLocked: null,
      lastReloadStart: null
    },
    storiesLoading: false
  }),
  getters: {
    IS_SECTION_COMPLETE: (state) => (columnName: string) => {
      const columnNameUpper = columnName.toUpperCase()
      return columnNameUpper === 'DONE' ||
        columnNameUpper.startsWith('COMPLETE') ||
        columnNameUpper.startsWith('FINISH') ||
        columnNameUpper.startsWith('DEPLOYED')
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
      this.workspace = match?.workspaceGid ?? null;
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

      const taskLimitsByColumnName: Record<string, string> = {};

      this.sections.forEach(section => {
        const thisColumnLimit = getColumnCount(section.name);
        const justColumnName = getPrettyColumnName(section.name).toLowerCase();
        section.maxTaskCount = thisColumnLimit;

        if (thisColumnLimit !== "-1" && !taskLimitsByColumnName[justColumnName]) { // Store the limit by the _first_ column (that has a limit)
          taskLimitsByColumnName[justColumnName] = thisColumnLimit;
        }
      });

      // Now that we have our limits, go back over each section and (re-)set the limit for columns of the same name
      this.sections.forEach(section => {
        const justColumnName = getPrettyColumnName(section.name).toLowerCase();
        if (section.maxTaskCount === "-1" && taskLimitsByColumnName[justColumnName]) {
          section.maxTaskCount = taskLimitsByColumnName[justColumnName];
        }
      });

      jsonstore.set("sections", this.sections);
    },

    CLEAR_ERRORS(): void {
      this.errors = [];
    },

    CLEAR_ACTIONS(): void {
      this.actions = [];
    },

    ADD_ACTION(description: string, func: () => Promise<any>): void {
      this.actions.push({
        description: description,
        func: func,
        isProcessing: false,
        retries: 0
      });
    },

    MERGE_TASKS(payload: Task[]): void {
      const reloadInterrupted = this.reloadState.lastLocked &&
        this.reloadState.lastReloadStart &&
        this.reloadState.lastLocked.getTime() > this.reloadState.lastReloadStart.getTime();

      if (this.reloadState.locked || reloadInterrupted) return;

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
    },

    MOVE_TASK(payload: Move): void {
      const task = this.tasks.find(task => task.gid === payload.taskId);

      if (task?.memberships[0].section?.gid) {
        task.memberships[0].section.gid = payload.endSectionId;
        const siblingTask = this.tasks.find(
          task => task.gid === payload.siblingTaskId
        );

        const index = this.tasks.indexOf(task);
        const siblingIndex = !siblingTask ? -1 : this.tasks.indexOf(siblingTask);
        const movingUp = index > siblingIndex;
        const columnChange = payload.startSectionId !== payload.endSectionId;

        let relative_pos = "";
        if (columnChange) {
          relative_pos = payload.endOfColumn ? "insert_after" : "insert_before";
        } else {
          relative_pos = movingUp ? "insert_before" : "insert_after";
        }

        let insertIdx = columnChange && !movingUp ? siblingIndex - 1 : siblingIndex;
        if (payload.endOfColumn) {
          insertIdx++;
        }

        this.tasks.splice(index, 1);
        this.tasks.splice(insertIdx, 0, task);

        this.ADD_ACTION(
          "moving task",
          async () => {
            await asanaClient?.sections.addTask(payload.endSectionId, {
              task: payload.taskId,
              [relative_pos]: payload.siblingTaskId,
            });
            if (payload.startSectionId !== payload.endSectionId) {
              this.UPDATE_CUSTOM_FIELDS(payload.taskId);
            }
          },
        );
      }
    },

    UPDATE_CUSTOM_FIELDS(taskId: string): void {
      const task = this.tasks.find(task => task.gid === taskId)!;
      const columnChangeIdx = task?.custom_fields?.findIndex(field => field.name === ColumnChange);

      if (columnChangeIdx === undefined) return;

      const body = {
        custom_fields: {}
      }
      if (columnChangeIdx !== -1 && task.custom_fields) {
        body.custom_fields[task.custom_fields[columnChangeIdx].gid] = new Date().toISOString();
        (task.custom_fields[columnChangeIdx] as any).text_value = new Date().toISOString();
      }

      this.ADD_ACTION(
        "updating custom fields",
        async () => {
          await asanaClient?.tasks.update(task.gid, body);
        }
      )
    },

    CREATE_TASK(taskAndSectionId: TaskAndSectionId): void {
      const createTask = async () => {

        // asana interface has incorrect type defintion for this function
        const task = await asanaClient!.tasks.create({
          ...taskAndSectionId.task,
          tags: taskAndSectionId.newTags,
          projects: [this.selectedProject],
          memberships: [{
            section: taskAndSectionId.sectionId,
            project: this.selectedProject,
          }],
        } as any) as Task;
        task.created_by = { name: useAuthStore().user?.name ?? "" };
        this.tasks.push(task);
        this.UPDATE_CUSTOM_FIELDS(task.gid);
      }

      this.ADD_ACTION("creating task", createTask);
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
          assignee: taskAndSectionId.task.assignee?.gid ?? null,
          html_notes: taskAndSectionId.task.html_notes,
          due_on: taskAndSectionId.task.due_on,
          custom_fields: taskAndSectionId.task.custom_fields?.reduce((obj, cur) => ({ ...obj, [cur.gid]: cur.enum_value?.gid ?? cur.number_value ?? cur.text_value }), {})
        } as any); // asana interface has incorrect type defintion for assignee - had to typecast to allow null type for assignee field

        this.UPDATE_STORIES(taskAndSectionId);
        this.UPDATE_TASK_TAGS(taskAndSectionId);
      }

      this.ADD_ACTION("updating task", updateTask);
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

      this.ADD_ACTION("deleting task", deleteTask);
    },

    COMPLETE_TASK(taskAndSectionId: TaskAndSectionId): void {
      this.ADD_ACTION(
        "completing task",
        async () => {
          completeTask(this.tasks, taskAndSectionId.task.gid);
        }
      );
    },

    RELEASE_TASK(task: Task): void {
      this.ADD_ACTION(
        "releasing task",
        async () => {
          completeTask(this.tasks, task.gid);
        },
      );
    },

    ADD_TASK_TAG(payload: { task: Task, tagGid: string }): void {
      this.ADD_ACTION(
        "adding task tag",
        async () => {
          await asanaClient?.tasks.addTag(payload.task.gid, {
            tag: payload.tagGid,
          });
        },
      );
    },

    REMOVE_TASK_TAG(payload: { task: Task, tagGid: string }): void {
      this.ADD_ACTION(
        "removing task tag",
        async () => {
          await asanaClient?.tasks.removeTag(payload.task.gid, {
            tag: payload.tagGid,
          });
        },
      );
    },

    UPDATE_TASK_TAGS(taskAndSectionId: TaskAndSectionId): void {
      const originalTagIds = taskAndSectionId.task.tags.map(tag => tag.gid)

      const removedTags = originalTagIds.filter(
        tagId => !taskAndSectionId.newTags.includes(tagId)
      );
      removedTags.forEach((tagGid) => {
        this.REMOVE_TASK_TAG({ task: taskAndSectionId.task, tagGid: tagGid });
      });

      const addedTags = taskAndSectionId.newTags.filter(
        tagId => !originalTagIds.includes(tagId)
      );
      addedTags.forEach((tagGid) => {
        this.ADD_TASK_TAG({ task: taskAndSectionId.task, tagGid: tagGid });
      });
    },

    UPDATE_STORIES(taskAndSectionId: TaskAndSectionId): void {
      if (taskAndSectionId.htmlText) {
        this.ADD_ACTION(
          "adding stories",
          async () => {
            await asanaClient?.stories.createOnTask(
              taskAndSectionId.task.gid,
              { html_text: taskAndSectionId.htmlText }
            );
            taskAndSectionId.htmlText = "";
          }
        );
      }
    },

    LOAD_STORIES(task: Task): void {
      this.storiesLoading = true; // Set this before the action is invoked
      const loadStories = async () => {
        if (asanaClient) {
          const storiesResponse = await asanaClient.stories
            // asana interface has incorrect type defintion for this function
            .findByTask(task.gid, {
              limit: 100,
              fields:
                "html_text,\
                created_by.name,\
                resource_subtype,\
                type,created_at"
            } as any)
            .catch(() => {
              this.storiesLoading = false;
              return { data: [] }; // Keep the response the same to allow the next steps to work
            });

          task.stories = storiesResponse.data.filter(story => {
            return story["resource_subtype"] === "comment_added";
          });
          this.storiesLoading = false;
        }
      }
      this.ADD_ACTION("loading stories", loadStories);
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
              opt_fields: "custom_field_settings, custom_field_settings.custom_field.name"
            };
            let projectResponse: any = await asanaClient?.projects.findAll(options);
            for (; projectResponse; projectResponse = await projectResponse.nextPage()) {
              const projects = projectResponse.data.map(p => {
                return {
                  ...p,
                  custom_field_settings: undefined, // we only care about the custom fields
                  custom_fields: p.custom_field_settings.map((el) => {
                    return { 
                      name: el.custom_field.name, 
                      gid: el.custom_field.gid
                    }
                  }),
                  workspaceGid: workspace.gid
                } as Project
              });
              this.ADD_PROJECTS(projects);
              console.log(projects);
            }
          });
        }
      }
      this.ADD_ACTION("loading projects", loadProjects);
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
      this.ADD_ACTION(
        "loading tasks",
        async () => loadTasks(this.MERGE_TASKS, null)
      );
    },

    LOAD_SECTIONS(): void {
      this.ADD_ACTION(
        "loading sections",
        async () => {
          if (asanaClient && this.selectedProject) {
            const sectionResponse = await asanaClient.sections.findByProject(this.selectedProject);
            this.SET_SECTIONS(sectionResponse as Section[]);
          }
        }
      );
    },

    LOAD_USERS(): void {
      this.ADD_ACTION(
        "loading users",
        async () => {
          if (asanaClient && this.workspace) {
            const userResponse = await asanaClient.users.findByWorkspace(
              this.workspace, {
              opt_fields:
                "name,\
                  photo.image_21x21,\
                  resource_type,email",
            })
            this.SET_USERS(userResponse.data as User[]);
          }
        }
      );
    },

    LOAD_ALL_TAGS(): void {
      const loadAllTags = async () => {
        if (asanaClient && this.selectedProject) {
          const options: PaginationParams = {
            limit: 100,
            opt_fields: "color,name",
          };
          let tagResponse: any = await asanaClient.tags.findByWorkspace(this.workspace!, options);
          this.allTags = [];
          for (; tagResponse; tagResponse = await tagResponse.nextPage()) {
            this.ADD_ALL_TAGS(tagResponse.data as TaskTag[]);
          }
        }
      }
      this.ADD_ACTION("loading all tags", loadAllTags);
    },

    LOAD_AND_MERGE_TASKS(): void {
      this.reloadState.lastReloadStart = new Date();
      loadTasks(this.MERGE_TASKS, this.lastUpdatedTime);
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

async function loadTasks(action: (tasks: Task[]) => any, lastUpdated: string | null) {
  const asanaStore = useAsanaStore();
  if (asanaClient && asanaStore.selectedProject) {
    const options = {
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
        stories,\
        subtasks,\
        subtasks.name,\
        subtasks.completed", // Note: subtasks (for field retrieval) is apparently deprecated, but the only alternative is to call /tasks/<id>/subtasks (which would be crazy slow)
    };
    if (lastUpdated) {
      options["modified_since"] = lastUpdated;
    }
    let taskResponse: any = await asanaClient.tasks.findAll(options);
    
    const tasks: Task[] = [];
    for (; taskResponse; taskResponse = await taskResponse.nextPage()) {
      tasks.push(...taskResponse.data);
    }
    action(tasks);


    if (!lastUpdated) {
      asanaStore.SET_TAGS(getAllTaskTags(tasks));
    }

    asanaStore.lastUpdatedTime = new Date().toISOString();
  }
}

async function completeTask(tasks: Task[], gid: string) {
  const index = tasks.findIndex(t => t.gid === gid);
  if (index !== -1) {
    tasks.splice(index, 1);
  }
  await asanaClient?.tasks.update(gid, {
    completed: true,
  });
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
    tag.hexes = convertAsanaColorToHex(tag.color);
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