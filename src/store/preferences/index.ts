import jsonstore from "../../utils/jsonstore";
import store from "@/store";
import { State } from "./state";
import { Assignee, TaskAndSectionId } from "@/types/asana";

export default {
  namespaced: true,
  state: {
    columnStates: jsonstore.get("columnStates", {}),
    search: "",
    taskEditorSectionIdAndTask: null,
  } as State,
  getters: {},
  mutations: {
    toggleColumn(state: State, gid: string) {
      if (!state.columnStates[gid]) {
        state.columnStates[gid] = { collapsed: false };
      }
      state.columnStates[gid] = {
        collapsed: !state.columnStates[gid].collapsed,
      };
      jsonstore.set("columnStates", state.columnStates);
    },
    setSearch(state: State, search: string) {
      state.search = search;
    },
    setTaskEditorSectionId(state: State, sectionIdAndTask: TaskAndSectionId) {
      state.taskEditorSectionIdAndTask = sectionIdAndTask;
    },
    setTaskAssignee(state: State, gid: string | null) {
      if (gid === null) {
        state.taskEditorSectionIdAndTask!.task.assignee = null;
        return;
      }
      if (state.taskEditorSectionIdAndTask?.task.assignee) {
        state.taskEditorSectionIdAndTask.task.assignee.gid = gid;
      } else {
        state.taskEditorSectionIdAndTask!.task.assignee = { 
          gid: gid
        } as Assignee;
      }
    },
  },
  actions: {
    toggleColumn({ commit }, gid: string) {
      commit("toggleColumn", gid);
    },
    setSearch({ commit }, search: string) {
      commit("setSearch", search);
    },
    setTaskAssignee({ commit }, assignee: string | null) {
      commit("setTaskAssignee", assignee);
    },
    hideTaskEditor({ commit }) {
      commit("setTaskEditorSectionId", "");
    },
    showTaskEditor({ commit }, sectionIdAndTask: TaskAndSectionId) {
      commit("setTaskEditorSectionId", sectionIdAndTask);
      if (
        sectionIdAndTask &&
        sectionIdAndTask.task &&
        sectionIdAndTask.task.gid
      ) {
        store.dispatch("asana/loadStories", sectionIdAndTask.task);
      }
    },
  },
};
