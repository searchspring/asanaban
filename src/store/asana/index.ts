import AsanaSdk from "asana";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import jsonstore from "../../utils/jsonstore";
import store from "@/store";
let asanaClient: AsanaSdk = null;
if (jsonstore.has("refresh_token")) {
  asanaClient = createClient(
    Cookies.get("access_token"),
    jsonstore.get("refresh_token")
  );
}

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
  },
  getters: {
    swimlanes: (state): any[] => {
      const swimlanes: any[] = [];
      const found: Set<string> = new Set();
      state.sections.forEach((section: any) => {
        if (section.name.indexOf(":") !== -1) {
          const swimlaneName = section.name.split(":")[0];
          if (!found.has(swimlaneName)) {
            swimlanes.push({ name: swimlaneName });
            found.add(swimlaneName);
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
      asanaClient = null;
      state.projects = [];
      state.sections = [];
      state.tasks = [];
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
    },
    setTasks(state, payload: unknown[]): void {
      state.tasks = payload;
    },
    setSections(state, payload: unknown[]): void {
      state.sections = payload;
      jsonstore.set("sections", state.sections);
    },
    moveTask(state, payload: any): void {
      // find task by taskId
      const task = state.tasks.find((task: any) => task.gid === payload.taskId);
      // update section gid
      task.memberships[0].section.gid = payload.endSectionId;

      // find sibling task
      const siblingTask = state.tasks.find(
        (task: any) => task.gid === payload.siblingTaskId
      );
      // move task to before sibling task in state.tasks
      const index = state.tasks.indexOf(task);
      const siblingIndex = state.tasks.indexOf(siblingTask);
      state.tasks.splice(index, 1);
      state.tasks.splice(siblingIndex, 0, task);

      state.actions.push(() => {
        return asanaClient.sections.addTask(payload.endSectionId, {
          task: payload.taskId,
          insert_after: payload.siblingTaskId,
        });
      });
    },
    processAction(state): void {
      if (state.actions.length > 0) {
        const action = state.actions.shift();
        action()
          .then(() => {
            console.info();
          })
          .catch((error) => {
            state.errors.push(error);
            if (error.status !== 400 && error.status !== 403) {
              state.actions.push(action);
            }
          });
      }
    },
    clearErrors(state): void {
      state.errors = [];
    },
    clearActions(state): void {
      state.actions = [];
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
      if (asanaClient && state.selectedProject) {
        loadTasksWithOffset("", state.selectedProject, commit);
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
  },
};

// load tasks with offset
function loadTasksWithOffset(
  offset: string,
  project: string,
  commit: any
): void {
  const options = {
    project: project,
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
      commit("addTasks", taskResponse.data);
      if (taskResponse._response.next_page) {
        loadProjectsWithOffset(
          taskResponse._response.next_page.offset,
          project,
          commit
        );
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
