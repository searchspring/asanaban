import jsonstore from "../../utils/jsonstore";

export default {
  namespaced: true,
  state: {
    columnStates: jsonstore.get("columnStates", {}),
  },
  getters: {},
  mutations: {
    toggleColumn(state, gid ) {
      if (!state.columnStates[gid]) {
        state.columnStates[gid] = { collapsed: false };
      }
      state.columnStates[gid] = {
        collapsed: !state.columnStates[gid].collapsed,
      };
      jsonstore.set("columnStates", state.columnStates);
    },
  },
  actions: {
    toggleColumn({ commit }, gid: string) {
      commit("toggleColumn", gid);
    },
  },
};
