import jsonstore from "../../utils/jsonstore";

export default {
  namespaced: true,
  state: {
    columnStates: jsonstore.get("columnStates", {}),
    search: "",
    taskEditorSectionIdAndTask: null,
  },
  getters: {},
  mutations: {
    toggleColumn(state: any, gid: string) {
      if (!state.columnStates[gid]) {
        state.columnStates[gid] = { collapsed: false };
      }
      state.columnStates[gid] = {
        collapsed: !state.columnStates[gid].collapsed,
      };
      jsonstore.set("columnStates", state.columnStates);
    },
    setSearch(state: any, search: string) {
      state.search = search;
    },
    setTaskEditorSectionId(state: any, sectionIdAndTask: any) {
      state.taskEditorSectionIdAndTask = sectionIdAndTask;
    },
  },
  actions: {
    toggleColumn({ commit }, gid: string) {
      commit("toggleColumn", gid);
    },
    setSearch({ commit }, search: string) {
      commit("setSearch", search);
    },
    hideTaskEditor({ commit }) {
      commit("setTaskEditorSectionId", "");
    },
    showTaskEditor({ commit }, sectionIdAndTask: any) {
      commit("setTaskEditorSectionId", sectionIdAndTask);
    },
  },
};
