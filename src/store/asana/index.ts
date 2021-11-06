import AsanaSdk from "asana";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import jsonstore from "../../utils/jsonstore";

let asanaClient: AsanaSdk = null;
if (jsonstore.has("refresh_token")) {
  asanaClient = createClient(
    Cookies.get("access_token"),
    jsonstore.get("refresh_token")
  );
}

function createClient(accessToken: string, refreshToken: string) {
  const client = AsanaSdk.Client.create();
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
  },
  getters: {
    // eslint-disable-next-line
    swimlanes: (state) => {
      const swimlanes: Record<string, unknown>[] = [];
      const found: Set<string> = new Set();
      // eslint-disable-next-line
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
    // eslint-disable-next-line
    tokenReceived(state, payload: any) {
      const oneHourFromNow = new Date(new Date().getTime() + 60 * 60 * 1000);
      Cookies.set("access_token", payload.access_token, {
        expires: oneHourFromNow,
      });
      jsonstore.set("refresh_token", payload.refresh_token);
      jsonstore.set("user", payload.data);
      asanaClient = createClient(payload.access_token, payload.refresh_token);
    },
    // eslint-disable-next-line
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
    // eslint-disable-next-line
    setProjects(state, payload: unknown[]): void {
      state.projects = payload;
      state.projects = sortAndUnique(state.projects);
      jsonstore.set("projects", state.projects);
    },
    // eslint-disable-next-line
    addProjects(state, payload: unknown[]): void {
      state.projects.push(...payload);
      state.projects = sortAndUnique(state.projects);
      jsonstore.set("projects", state.projects);
    },
    //eslint-disable-next-line
    setSelectedProject(state, payload: unknown): void {
      state.selectedProject = payload;
      jsonstore.set("selectedProject", state.selectedProject);
    },
    // eslint-disable-next-line
    addTasks(state, payload: unknown[]): void {
      state.tasks.push(...payload);
      state.tasks = unique(state.tasks);
    },
    // eslint-disable-next-line
    setTasks(state, payload: unknown[]): void {
      state.tasks = payload;
      state.tasks = unique(state.tasks);
    },
    // eslint-disable-next-line
    setSections(state, payload: unknown[]): void {
      state.sections = payload;
      jsonstore.set("sections", state.sections);
    },
  },
  actions: {
    // eslint-disable-next-line
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
    // eslint-disable-next-line
    checkSignedIn({ commit, dispatch }): void {
      if (asanaClient !== null) {
        asanaClient.users
          .me()
          .then(function () {
            // do nothing
          })
          .catch(function (err) {
            if (err.status === 401) {
              dispatch("signIn"); // TODO replace with refresh token endpoint
            }
          });
      }
    },
    // eslint-disable-next-line
    signOut({ commit, rootState }): void {
      commit("signOut");
      rootState.signedIn = false; // can't figure out how to get root state inside the mutation.
    },
    // eslint-disable-next-line
    loadProjects({ commit }): void {
      if (asanaClient) {
        asanaClient.workspaces.findAll().then((workspaceResponse) => {
          workspaceResponse.data.forEach((workspace) => {
            loadProjectsWithOffset("", workspace.gid, commit);
          });
        });
      }
    },
    // eslint-disable-next-line
    setSelectedProject({ commit, dispatch }, project: unknown): void {
      commit("setSelectedProject", project);
      dispatch("loadTasks");
      dispatch("loadSections");
    },
    // eslint-disable-next-line
    loadTasks({ commit, state }): void {
      commit("setTasks", []);
      if (asanaClient && state.selectedProject) {
        loadTasksWithOffset("", state.selectedProject, commit);
      }
    },
    // eslint-disable-next-line
    loadSections({ commit, state }): void {
      if (asanaClient && state.selectedProject) {
        asanaClient.sections
          .findByProject(state.selectedProject)
          .then((sectionResponse) => {
            commit("setSections", sectionResponse);
          });
      }
    },
  },
};

// load tasks with offset
function loadTasksWithOffset(
  offset: string,
  project: string,
  // eslint-disable-next-line
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
  // eslint-disable-next-line
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
    asanaClient.projects
      .findAll(options)
      // eslint-disable-next-line
      .then((projectResponse: any) => {
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

// eslint-disable-next-line
function sortAndUnique(stuff: any[]): any[] {
  const uniqueStuff = unique(stuff);
  // eslint-disable-next-line
  uniqueStuff.sort((a: any, b: any) => {
    return a.name.localeCompare(b.name);
  });

  return uniqueStuff;
}
// eslint-disable-next-line
function unique(stuff: any[]): any[] {
  // unique by gid
  // eslint-disable-next-line
  stuff.sort((a: any, b: any) => {
    return a.gid.localeCompare(b.gid);
  });
  // eslint-disable-next-line
  // remove duplicates
  const uniqueStuff = stuff.filter(
    (thing, index, self) => index === self.findIndex((t) => t.gid === thing.gid)
  );
  return uniqueStuff;
}
