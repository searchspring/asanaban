import store from "@/store";
import { convertColorToHexes, getColumnCount } from "@/utils/asana-specific";
import AsanaSdk from "asana";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import jsonstore from "@/utils/jsonstore";
import { Action, State } from "./state";
import { startWorkers } from "./worker";
import { Section, TaskAndSectionId, Task, User, Project, ProjectParams, TaskTag, AsanaError, BaseResource, PaginationParams, Resource } from "@/types/asana";
import { Move, Swimlane } from "@/types/layout";

let asanaClient: AsanaSdk.Client | null = null;
if (jsonstore.has("refresh_token")) {
  asanaClient = createClient(
    Cookies.get("access_token")!,
    jsonstore.get("refresh_token")
  );
}
startWorkers();

function createClient(accessToken: string, refreshToken: string) {
  const client = AsanaSdk.Client.create();
  client.dispatcher.handleUnauthorized = () => {
    console.error("failed to perform action - signing in again");
    store.commit("asana/clearActions");
    store.commit("asana/clearErrors");
    store.dispatch("asana/signIn");
    return true;
  };
  client.dispatcher.retryOnRateLimit = true;
  const credentials = {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
  client.useOauth({
    credentials: credentials,
  });
  return client;
}

export default {
  namespaced: true,
  state: {
    workspace: jsonstore.get("workspace", null) as string | null,
    projects: jsonstore.get("projects", []) as Project[],
    selectedProject: jsonstore.get("selectedProject", null) as string | null,
    tasks: jsonstore.get("tasks", []) as Task[],
    sections: jsonstore.get("sections", []) as Section[],
    actions: [] as Action[],
    errors: [] as AsanaError[],
    tags: jsonstore.get("tags", []) as TaskTag[],
    users: jsonstore.get("users", []) as User[],
    allTags: jsonstore.get("allTags", []) as TaskTag[],
  } as State,
  getters: {
    getTags: (state: State) => {
      return state.allTags;
    },
    isSectionComplete: (state: State) => (columnName: string) => {
      const columnNameUpper = columnName.toUpperCase()
      return columnNameUpper === 'DONE' || columnNameUpper.startsWith('COMPLETE') || columnNameUpper.startsWith('FINISH')
    },
    swimlanes: (state: State) => {
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
          const tasks = store.state["asana"].tasks.filter((task) => {
            return task.memberships.some((membership) => {
              return membership.section.gid === section.gid;
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
    users: (state: State) => state.users,
  },
  mutations: {
    setStories(state: State, task: Task): void {
      if (asanaClient) {
        asanaClient.stories
          // asana interface has incorrect type defintion for this function
          .findByTask(task.gid, {
            limit: 100,
            fields:
              "html_text,created_by.name,resource_subtype,type,created_at"
          } as any)
          .then(storiesResponse => {
            task.stories = storiesResponse.data.filter(story => {
              return story["resource_subtype"] === "comment_added";
            });
          });
      }
    },
    tokenReceived(state: State, payload: any): void {
      const oneHourFromNow = new Date(new Date().getTime() + 60 * 60 * 1000);

      const access_token = payload.access_token ?? "";
      const refresh_token = payload.refresh_token ?? "";
      const data = payload.data ?? {};
      
      Cookies.set("access_token", access_token, {
        expires: oneHourFromNow,
      });
      jsonstore.set("refresh_token", refresh_token);
      jsonstore.set("user", data);
      asanaClient = createClient(access_token, refresh_token);
    },
    signOut(state: State): void {
      Cookies.remove("access_token");
      jsonstore.remove("refresh_token");
      jsonstore.remove("user");
      jsonstore.remove("selectedProject");
      jsonstore.remove("sections");
      jsonstore.remove("projects");
      jsonstore.remove("tags");
      jsonstore.remove("users");
      jsonstore.remove("allTags");
      asanaClient = null;
      state.projects = [];
      state.sections = [];
      state.tasks = [];
      state.tags = [];
      state.selectedProject = null;
      state.users = [];
      state.allTags = [];
    },
    setWorkspace(state: State): void {
      state.workspace = currentWorkspace(state) ?? null;
      jsonstore.set("workspace", state.workspace);
    },
    setProjects(state: State, payload: Project[]): void {
      state.projects = payload;
      state.projects = sortAndUnique(state.projects);
      jsonstore.set("projects", state.projects);
    },
    addProjects(state: State, payload: Project[]): void {
      state.projects.push(...payload);
      state.projects = sortAndUnique(state.projects);
      jsonstore.set("projects", state.projects);
    },
    setAllTags(state: State, payload: TaskTag[]): void {
      state.allTags.push(...payload);
      state.allTags = sortAndUnique(state.allTags);
      colorizeAllTags(state)
      jsonstore.set("allTags", state.allTags);
    },
    setUsers(state: State, payload: User[]): void {
      state.users = payload;
      state.users = sortAndUnique(state.users);
      jsonstore.set("users", state.users);
    },
    addUsers(state: State, payload: User[]): void {
      state.users.push(...payload);
      state.users = sortAndUnique(state.users);
      jsonstore.set("users", state.users);
    },
    setSelectedProject(state: State, payload: string | null): void {
      state.selectedProject = payload;
      jsonstore.set("selectedProject", state.selectedProject);
    },
    addTasks(state: State, payload: Task[]): void {
      state.tasks.push(...payload);
      colorizeTaskTags(state);
      setTags(state, getTags(state.tasks));
    },
    setTasks(state: State, payload: Task[]): void {
      state.tasks = payload;
      colorizeTaskTags(state);
      setTags(state, getTags(state.tasks));
    },
    mergeTasks(state: State, payload: Task[]): void {
      // replace individual task with each task in payload
      payload.forEach(task => {
        const index = state.tasks.findIndex((t) => t.gid === task.gid);
        if (index !== -1) {
          state.tasks.splice(index, 1, task);
        } else {
          state.tasks.push(task);
        }
      });
      colorizeTaskTags(state);
      setTags(state, getTags(state.tasks));
    },
    setTags(state: State, payload: TaskTag[]): void {
      setTags(state, payload);
    },
    setSections(state: State, payload: Section[]): void {
      state.sections = payload;
      state.sections.forEach(section => {
        section.maxTaskCount = getColumnCount(section.name);
      });

      jsonstore.set("sections", state.sections);
    },
    moveTask(state: State, payload: Move): void {
      const task = state.tasks.find(task => task.gid === payload.taskId);
      if (task?.memberships[0].section?.gid) {
        task.memberships[0].section.gid = payload.endSectionId;
        const siblingTask = state.tasks.find(
          task => task.gid === payload.siblingTaskId
        );
        const index = state.tasks.indexOf(task);
        const siblingIndex = state.tasks.indexOf(siblingTask!);
        state.tasks.splice(index, 1);
        state.tasks.splice(siblingIndex, 0, task);
      }

      state.actions.push({
        description: "moving task",
        func: () => {
          return asanaClient?.sections.addTask(payload.endSectionId, {
            task: payload.taskId,
            insert_after: payload.siblingTaskId,
          });
        },
      });
    },
    clearErrors(state: State): void {
      state.errors = [];
    },
    clearActions(state: State): void {
      state.actions = [];
    },
    createTask(state: State, taskAndSectionId: TaskAndSectionId): void {
      if (asanaClient) {
        state.actions.push({
          description: "creating task",
          func: () => {
            // asana interface has incorrect type defintion for this function
            return asanaClient?.tasks
              .create({
                ...taskAndSectionId.task,
                tags: taskAndSectionId.newTags,
                projects: [state.selectedProject],
                memberships: [
                  {
                    section: taskAndSectionId.sectionId,
                    project: state.selectedProject,
                  },
                ],
              } as any)
              .then(task => {
                state.tasks.push(task as Task);
              });
          },
        });
      }
    },
    updateTask(state: State, taskAndSectionId: TaskAndSectionId): void {
      state.actions.push({
        description: "updating task",
        func: () => {
          const index = state.tasks.findIndex(
            t => t.gid === taskAndSectionId.task.gid
          );
          if (index !== -1) {
            state.tasks.splice(index, 1, taskAndSectionId.task);
          }
          if (taskAndSectionId.htmlText) {
            asanaClient?.stories.createOnTask(
              taskAndSectionId.task.gid,
              { htmlText: taskAndSectionId.htmlText, }
            )
          }
          taskAndSectionId.htmlText = "";

          return asanaClient?.tasks.update(taskAndSectionId.task.gid, {
            name: taskAndSectionId.task.name,
            assignee: taskAndSectionId.task.assignee?.gid,
            html_notes: taskAndSectionId.task.html_notes,
          });
        },
      });
    },
    deleteTask(state: State, taskAndSectionId: TaskAndSectionId): void {
      state.actions.push({
        description: "deleting task",
        func: () => {
          const index = state.tasks.findIndex(
            t => t.gid === taskAndSectionId.task.gid
          );
          if (index !== -1) {
            state.tasks.splice(index, 1);
          }
          return asanaClient?.tasks.delete(taskAndSectionId.task.gid);
        },
      });
    },
    completeTask(state: State, taskAndSectionId: TaskAndSectionId): void {
      state.actions.push({
        description: "completing task",
        func: () => {
          const index = state.tasks.findIndex(
            t => t.gid === taskAndSectionId.task.gid
          );
          if (index !== -1) {
            state.tasks.splice(index, 1);
          }
          return asanaClient?.tasks.update(taskAndSectionId.task.gid, {
            completed: true,
          });
        },
      });
    },
    releaseTask(state: State, task: Task): void {
      state.actions.push({
        description: "releasing task",
        func: () => {
          const index = state.tasks.findIndex(
            t => t.gid === task.gid
            );
          if (index !== -1) {
            state.tasks.splice(index, 1);
          }
          return asanaClient?.tasks.update(task.gid, {
            completed: true,
          });
        },
      });
    },
    addTaskTag(state: State, payload: { task: Task, tagGid: string}): void {
      state.actions.push({
        description: "adding task tag",
        func: () => {
          return asanaClient?.tasks.addTag(payload.task.gid, {
            tag: payload.tagGid,
          });
        },
      });
    },
    removeTaskTag(state: State, payload: { task: Task, tagGid: string}): void {
      state.actions.push({
        description: "removing task tag",
        func: () => {
          return asanaClient?.tasks.removeTag(payload.task.gid, {
            tag: payload.tagGid,
          });
        },
      });
    },
  },
  actions: {
    tokenReceived({ commit, rootState }, payload: any): void {
      commit("tokenReceived", payload);
      rootState.signedIn = true; // can't figure out how to get root state inside the mutation.
    },
    signIn(): void {
      const codeVerifier = "12345678901234567890123456789012345678901234567890";
      const codeChallenge = base64URL(CryptoJS.SHA256(codeVerifier));
      const url =
        "https://app.asana.com/-/oauth_authorize" +
        "?client_id=1201298517859389" +
        "&redirect_uri=" +
        location.protocol +
        "//" +
        location.host +
        "/api" +
        "&response_type=code" +
        "&code_challenge_method=S256" +
        "&code_challenge=" +
        codeChallenge;
      self.location.href = url;
    },
    signOut({ commit, rootState }): void {
      commit("signOut");
      rootState.signedIn = false; // can't figure out how to get root state inside the mutation.
    },
    loadProjects({ commit }): void {
      if (asanaClient) {
        asanaClient.workspaces.findAll().then(workspaceResponse => {
          workspaceResponse.data.forEach(workspace => {
            loadProjectsWithOffset("", workspace.gid, commit);
          });
        });
      }
    },
    setSelectedProject({ commit, dispatch }, project: string): void {
      commit("setSelectedProject", project);
      commit("setWorkspace");
      dispatch("loadTasks");
      dispatch("loadSections");
      dispatch("loadUsers");
      dispatch("loadAllTags");
    },
    loadTasks({ commit, state }): void {
      commit("setTasks", []);
      commit("setTags", []);
      if (asanaClient && state.selectedProject) {
        loadTasksWithOffset("", state, commit, "addTasks");
      }
    },
    async loadQueriedTask({ commit, state }, query: string): Promise<Resource[] | undefined> {
      return await asanaClient?.workspaces.typeahead(
        state.workspace, {
          // interface wrong, casted to any
          resource_type: "task",
          query: query,
          count: 5,
          opt_fields: "name,completed,projects.name"
        } as any
      ).then(taskResponse => taskResponse.data);
    },
    loadSections({ commit, state }): void {
      if (asanaClient && state.selectedProject) {
        asanaClient.sections
          .findByProject(state.selectedProject)
          .then((sectionResponse) => {
            commit("setSections", sectionResponse);
          });
      }
    },
    loadUsers({ commit, state }): void {
      if (asanaClient && state.workspace) {
        asanaClient.users.findByWorkspace(
          state.workspace,
          {
            opt_fields: "name,photo.image_60x60,resource_type,email",
          })
          .then(userResponse => {
          commit("setUsers", userResponse.data);
        });
      }
    },
    loadAllTags({ commit, state }): void {
      if (asanaClient && state.selectedProject) {
        state.allTags = [];
        loadAllTagsWithOffset("", currentWorkspace(state)!, commit);
      }
    },
    moveTask({ commit }, payload) {
      commit("moveTask", payload);
    },
    processAction({ commit, state }): void {
      if (state.actions.length > 0) {
        commit("processAction");
      }
    },
    clearErrors({ commit }): void {
      commit("clearErrors");
    },
    mergeTasks({ commit, state }): void {
      if (asanaClient && state.selectedProject) {
        loadTasksWithOffset("", state, commit, "mergeTasks");
      }
    },
    createTask({ commit, dispatch }, taskAndSectionId: TaskAndSectionId): void {
      commit("createTask", taskAndSectionId);
    },
    updateTask({ commit, dispatch }, taskAndSectionId: TaskAndSectionId): void {
      commit("updateTask", taskAndSectionId);
      dispatch("updateTaskTags", taskAndSectionId);
    },
    deleteTask({ commit }, taskAndSectionId: TaskAndSectionId): void {
      commit("deleteTask", taskAndSectionId);
    },
    loadStories({ commit }, task: Task): void {
      commit("setStories", task);
    },
    completeTask({ commit }, taskAndSectionId: TaskAndSectionId): void {
      commit("completeTask", taskAndSectionId);
    },
    releaseSection({ commit }, taskList: Task[]): void {
      console.log("Releasing Tasks: ", taskList);
      taskList.forEach((task) => {
        commit("releaseTask", task);
      });
    },
    updateTaskTags({ commit }, taskAndSectionId: TaskAndSectionId): void {
      const originalTagIds = taskAndSectionId.task.tags.map(tag => tag.gid)

      const removedTags = originalTagIds.filter(tagId => !taskAndSectionId.newTags.includes(tagId))
      removedTags.forEach((tagGid) => {
        commit("removeTaskTag", { task: taskAndSectionId.task, tagGid: tagGid});
      });

      const addedTags = taskAndSectionId.newTags.filter(tagId => !originalTagIds.includes(tagId))
      addedTags.forEach((tagGid) => {
        commit("addTaskTag", { task: taskAndSectionId.task, tagGid: tagGid});
      });
    },
  },
};

// load tasks with offset
async function loadTasksWithOffset(
  offset: string,
  state: State,
  commit: (cmd: string, payload: Task[]) => void,
  commitAction: string
): Promise<void> {
  // asana interface has incorrect type definition
  const options: any = {
    project: state.selectedProject!,
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
  if (offset) {
    options["offset"] = offset;
  }
  if (asanaClient) {
    const taskResponse = await asanaClient.tasks.findAll(options);
    if (state.actions.length === 0) {
      commit(commitAction, taskResponse.data as Task[]);
      if (taskResponse._response.next_page) {
        loadTasksWithOffset(
          taskResponse._response.next_page.offset,
          state,
          commit,
          commitAction
        );
      }
    }
  }
}

async function loadAllTagsWithOffset(
  offset: string,
  workspaceGid: string,
  commit: (cmd: string, payload: TaskTag[]) => void
  ): Promise<void> {
  const options: PaginationParams = {
    limit: 100,
    opt_fields: "color,name",
  };
  if (offset) {
    options["offset"] = offset;
  }
  if (asanaClient) {
    const tagResponse = await asanaClient.tags.findByWorkspace(workspaceGid, options);
    commit("setAllTags", tagResponse.data as TaskTag[])
    if (tagResponse._response.next_page) {
      loadAllTagsWithOffset(
        tagResponse._response.next_page.offset,
        workspaceGid,
        commit
      );
    }
  }
}

async function loadProjectsWithOffset(
  offset: string,
  workspaceGid: string,
  commit: (cmd: string, payload: Project[]) => void
): Promise<void> {
  const options: ProjectParams = {
    limit: 100,
    workspace: workspaceGid,
    archived: false,
  };
  if (offset) {
    options["offset"] = offset;
  }

  if (asanaClient) {
    const projectResponse = await asanaClient.projects.findAll(options);
    const projects = projectResponse.data.map(p => {
      return {
        ...p,
        workspaceGid: workspaceGid
      } as Project
    });
    commit("addProjects", projects);
    if (projectResponse._response.next_page) {
      loadProjectsWithOffset(
        projectResponse._response.next_page.offset,
        workspaceGid,
        commit
      );
    }
  }
}

function colorizeTaskTags(state: State): void {
  state.tasks.forEach(task => {
    task.tags.forEach(tag => {
      tag.hexes = convertColorToHexes(tag.color === "none"? "white": tag.color);
    });
  });
}

function colorizeAllTags(state: State): void {
  state.allTags.forEach(tag => {
    tag.hexes = convertColorToHexes(tag.color === "none"? "white": tag.color);
  });
}

function setTags(state: State, payload: TaskTag[]): void {
  state.tags = sortAndUnique(payload);
  jsonstore.set("tags", state.tags);
}

function getTags(tasks: Task[]): TaskTag[] {
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

function base64URL(string: CryptoJS.lib.WordArray) {
  return string
    .toString(CryptoJS.enc.Base64)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sortAndUnique<AsanaType extends BaseResource>(stuff: AsanaType[]): AsanaType[] {
  const uniqueStuff = unique(stuff);
  uniqueStuff.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  return uniqueStuff;
}
function unique<AsanaType extends BaseResource>(stuff: AsanaType[]): AsanaType[] {
  stuff.sort((a, b) => {
    return a.gid.localeCompare(b.gid) ?? 0;
  });
  const uniqueStuff = stuff.filter(
    (thing, index, self) => index === self.findIndex((t) => t.gid === thing.gid)
  );
  return uniqueStuff;
}

function currentWorkspace(state: State): string | undefined {
  const match = state.projects.find(p => p.gid === state.selectedProject);
  return match?.workspaceGid;
}