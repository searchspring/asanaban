import jsonstore from "../../utils/jsonstore";
import store from "@/store";
import { State } from "./state";
import { Assignee, TaskAndSectionId } from "@/types/asana";
import { format, isValid } from "date-fns";

export default {
  namespaced: true,
  state: {
    columnStates: jsonstore.get("columnStates", {}),
    swimlaneStates: jsonstore.get("swimlaneStates", {}),
    search: "",
    taskEditorSectionIdAndTask: null,
    dateFormatString: "yyyy-MM-dd"
  } as State,
  getters: {
    isSaveDisabled: (state: State) => (date: string) => {
      if (date === "Invalid Date") {
        return true;
      }
      return false;
    },
    formattedDate: (state: State) => (date: Date | undefined) => {
      if (isValid(date)) {
        return format(date!, state.dateFormatString);
      }
      if (date === undefined) {
        return "";
      }
      return "Invalid Date";
    },
    dateFormatString: (state: State) => {
      return state.dateFormatString;
    }
  },
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
    toggleSwimlane(state: State, swimlaneName: string) {
      if (!state.swimlaneStates[swimlaneName]) {
        state.swimlaneStates[swimlaneName] = { collapsed: false };
      }
      state.swimlaneStates[swimlaneName] = {
        collapsed: !state.swimlaneStates[swimlaneName].collapsed,
      };
      jsonstore.set("swimlaneStates", state.swimlaneStates);
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
          gid: gid,
        } as Assignee;
      }
    },
    setNewTags(state: State, tags: string[]) {
      state.taskEditorSectionIdAndTask!.newTags = tags;
    },
    setDueDate(state: State, date: string) {
      if (date === "Invalid Date") {
        date = ""
      }
      state.taskEditorSectionIdAndTask!.task.due_on = date;
    },
  },
  actions: {
    toggleColumn({ commit }, gid: string) {
      commit("toggleColumn", gid);
    },
    toggleSwimlane({ commit }, swimlaneName: string) {
      commit("toggleSwimlane", swimlaneName);
    },
    setSearch({ commit }, search: string) {
      commit("setSearch", search);
    },
    setTaskAssignee({ commit }, assignee: string | null) {
      commit("setTaskAssignee", assignee);
    },
    setNewTags({ commit }, tags: string[]) {
      commit("setNewTags", tags);
    },
    setDueDate({ commit, getters }, date: Date) {
      const dateString = getters.formattedDate(date);
      commit("setDueDate", dateString);
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
