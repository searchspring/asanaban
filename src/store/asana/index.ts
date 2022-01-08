import store from "@/store";
import { convertColorToHexes, getColumnCount } from "@/utils/asana-specific";
import AsanaSdk from "asana";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import jsonstore from "../../utils/jsonstore";
import { startWorkers } from "./worker";
let asanaClient: AsanaSdk = null;
if (jsonstore.has("refresh_token")) {
  asanaClient = createClient(
    Cookies.get("access_token"),
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
    projects: jsonstore.get("projects", []),
    selectedProject: jsonstore.get("selectedProject", null),
    tasks: jsonstore.get("tasks", []),
    sections: jsonstore.get("sections", []),
    actions: [] as any[],
    errors: [] as any[],
    tags: jsonstore.get("tags", []),
  },
  getters: {
    swimlanes: (state): any[] => {
      const swimlanes: any[] = [];
      const found: Set<string> = new Set();
      state.sections.forEach((section: any) => {
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
            swimlanes.push({ name: section.name.split(":")[0] });
          }
        }
      });
      return swimlanes;
    },
  },
  mutations: {
    tokenReceived(state, payload: any): void {
      const oneHourFromNow = new Date(new Date().getTime() + 60 * 60 * 1000);
      Cookies.set("access_token", payload.access_token, {
        expires: oneHourFromNow,
      });
      jsonstore.set("refresh_token", payload.refresh_token);
      jsonstore.set("user", payload.data);
      asanaClient = createClient(payload.access_token, payload.refresh_token);
    },
    signOut(state): void {
      Cookies.remove("access_token");
      jsonstore.remove("refresh_token");
      jsonstore.remove("user");
      jsonstore.remove("selectedProject");
      jsonstore.remove("sections");
      jsonstore.remove("projects");
      jsonstore.remove("tags");
      asanaClient = null;
      state.projects = [];
      state.sections = [];
      state.tasks = [];
      state.tags = [];
      state.selectedProject = null;
    },
    setProjects(state, payload: unknown[]): void {
      state.projects = payload;
      state.projects = sortAndUnique(state.projects);
      jsonstore.set("projects", state.projects);
    },
    addProjects(state, payload: unknown[]): void {
      state.projects.push(...payload);
      state.projects = sortAndUnique(state.projects);
      jsonstore.set("projects", state.projects);
    },
    setSelectedProject(state, payload: unknown): void {
      state.selectedProject = payload;
      jsonstore.set("selectedProject", state.selectedProject);
    },
    addTasks(state, payload: unknown[]): void {
      state.tasks.push(...payload);
      colorizeTaskTags(state);
      setTags(state, getTags(state.tasks));
    },
    setTasks(state, payload: unknown[]): void {
      state.tasks = payload;
      colorizeTaskTags(state);
      setTags(state, getTags(state.tasks));
    },
    mergeTasks(state, payload: unknown[]): void {
      // replace individual task with each task in payload
      payload.forEach((task: any) => {
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
    setTags(state, payload: unknown[]): void {
      setTags(state, payload);
    },
    setSections(state, payload: unknown[]): void {
      state.sections = payload;
      state.sections.forEach((section: any) => {
        section.maxTaskCount = getColumnCount(section.name);
      });

      jsonstore.set("sections", state.sections);
    },
    moveTask(state, payload: any): void {
      const task = state.tasks.find((task: any) => task.gid === payload.taskId);
      task.memberships[0].section.gid = payload.endSectionId;
      const siblingTask = state.tasks.find(
        (task: any) => task.gid === payload.siblingTaskId
      );
      const index = state.tasks.indexOf(task);
      const siblingIndex = state.tasks.indexOf(siblingTask);
      state.tasks.splice(index, 1);
      state.tasks.splice(siblingIndex, 0, task);

      state.actions.push({
        description: "moving task",
        func: () => {
          return asanaClient.sections.addTask(payload.endSectionId, {
            task: payload.taskId,
            insert_after: payload.siblingTaskId,
          });
        },
      });
    },
    clearErrors(state): void {
      state.errors = [];
    },
    clearActions(state): void {
      state.actions = [];
    },
    createTask(state, taskAndSectionId: any): void {
      if (asanaClient) {
        state.actions.push({
          description: "creating task",
          func: () => {
            return asanaClient.tasks
              .create({
                ...taskAndSectionId.task,
                projects: [state.selectedProject],
                memberships: [
                  {
                    section: taskAndSectionId.sectionId,
                    project: state.selectedProject,
                  },
                ],
              })
              .then((task: any) => {
                state.tasks.push(task);
              });
          },
        });
      }
    },
    updateTask(state, taskAndSectionId: any): void {
      state.actions.push({
        description: "updating task",
        func: () => {
          const index = state.tasks.findIndex(
            (t: any) => t.gid === taskAndSectionId.task.gid
          );
          if (index !== -1) {
            state.tasks.splice(index, 1, taskAndSectionId.task);
          }
          return asanaClient.tasks.update(taskAndSectionId.task.gid, {
            name: taskAndSectionId.task.name,
            html_notes: taskAndSectionId.task.html_notes,
          });
        },
      });
    },
    deleteTask(state, taskAndSectionId: any): void {
      state.actions.push({
        description: "deleting task",
        func: () => {
          const index = state.tasks.findIndex(
            (t: any) => t.gid === taskAndSectionId.task.gid
          );
          if (index !== -1) {
            state.tasks.splice(index, 1);
          }
          return asanaClient.tasks.delete(taskAndSectionId.task.gid);
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
        asanaClient.workspaces.findAll().then((workspaceResponse) => {
          workspaceResponse.data.forEach((workspace) => {
            loadProjectsWithOffset("", workspace.gid, commit);
          });
        });
      }
    },
    setSelectedProject({ commit, dispatch }, project: unknown): void {
      commit("setSelectedProject", project);
      dispatch("loadTasks");
      dispatch("loadSections");
    },
    loadTasks({ commit, state }): void {
      commit("setTasks", []);
      commit("setTags", []);
      if (asanaClient && state.selectedProject) {
        loadTasksWithOffset("", state, commit, "addTasks");
      }
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
    createTask({ commit }, taskAndSectionId: any): void {
      commit("createTask", taskAndSectionId);
    },
    updateTask({ commit }, taskAndSectionId: any): void {
      commit("updateTask", taskAndSectionId);
    },
    deleteTask({ commit }, taskAndSectionId: any): void {
      commit("deleteTask", taskAndSectionId);
    },
  },
};

// load tasks with offset
function loadTasksWithOffset(
  offset: string,
  state: any,
  commit: any,
  commitAction: string
): void {
  const options = {
    project: state.selectedProject,
    completed_since: "now",
    limit: 100,
    fields:
      "custom_fields,tags.name,tags.color,memberships.section.name,memberships.project.name,name,assignee.photo,assignee.name,assignee.email,due_on,modified_at,html_notes,notes,stories",
  };
  if (offset) {
    options["offset"] = offset;
  }
  if (asanaClient) {
    asanaClient.tasks.findAll(options).then((taskResponse) => {
      if (state.actions.length === 0) {
        commit(commitAction, taskResponse.data);
        if (taskResponse._response.next_page) {
          loadTasksWithOffset(
            taskResponse._response.next_page.offset,
            state,
            commit,
            commitAction
          );
        }
      }
    });
  }
}

function loadProjectsWithOffset(
  offset: string,
  workspaceGid: string,
  commit: any
): void {
  const options = {
    limit: 100,
    workspace: workspaceGid,
    archived: false,
  };
  if (offset) {
    options["offset"] = offset;
  }

  if (asanaClient) {
    asanaClient.projects.findAll(options).then((projectResponse: any) => {
      commit("addProjects", projectResponse.data);
      if (projectResponse._response.next_page) {
        loadProjectsWithOffset(
          projectResponse._response.next_page.offset,
          workspaceGid,
          commit
        );
      }
    });
  }
}

function colorizeTaskTags(state: any): void {
  state.tasks.forEach((task: any) => {
    task.tags.forEach((tag: any) => {
      tag.hexes = convertColorToHexes(tag.color);
    });
  });
}

function setTags(state, payload: unknown[]): void {
  state.tags = sortAndUnique(payload);
  jsonstore.set("tags", state.tags);
}

function getTags(tasks: any[]): string[] {
  const tags = [] as any[];
  tasks.forEach((task) => {
    task.tags.forEach((tag) => {
      if (tags.indexOf(tag.name) === -1) {
        tags.push(tag);
      }
    });
  });
  return tags;
}

function base64URL(string) {
  return string
    .toString(CryptoJS.enc.Base64)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sortAndUnique(stuff: any[]): any[] {
  const uniqueStuff = unique(stuff);
  uniqueStuff.sort((a: any, b: any) => {
    return a.name.localeCompare(b.name);
  });

  return uniqueStuff;
}
function unique(stuff: any[]): any[] {
  stuff.sort((a: any, b: any) => {
    return a.gid.localeCompare(b.gid);
  });
  const uniqueStuff = stuff.filter(
    (thing, index, self) => index === self.findIndex((t) => t.gid === thing.gid)
  );
  return uniqueStuff;
}
