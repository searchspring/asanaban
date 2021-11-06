<template>
  <div class="column" :class="{collapsed: columnCollapsed(section.gid)}">
    <div class="column-name" @click="toggleColumn(section.gid)">
      {{ columnName }}
    </div>
    <div v-if="!columnCollapsed(section.gid)">
      <task
        v-for="task in tasks(section.gid)"
        :task="task"
        :key="task.gid"
      ></task>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getPrettyColumnName } from "../utils/name-converter";
import Task from "./Task.vue";
import store from "@/store";
export default defineComponent({
  components: { Task },
  props: {
    section: Object,
  },
  computed: {
    columnName(state) {
      return getPrettyColumnName(state.section.name);
    },
  },
  methods: {
    tasks(sectionId: string) {
      return store.state["asana"].tasks.filter((task) => {
        return task.memberships[0].section.gid === sectionId;
      });
    },
    toggleColumn(gid: string) {
      store.dispatch("preferences/toggleColumn", gid);
    },
    columnCollapsed(gid: string) {
      if (!store.state["preferences"].columnStates[gid]) {
        return false
      }
      return store.state["preferences"].columnStates[gid].collapsed;
    },
  },
});
</script>

<style scoped>
.column {
  display: inline-block;
  vertical-align: top;
  text-align: left;
  min-width: 10rem;
  white-space: normal;
  background-color: aliceblue;
  margin-left: 0.2rem;
  min-height: 200px;
}
.column-name {
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
  cursor: pointer;
}
.column.collapsed {
  background-color: green;
  min-width: 1.5rem !important;
  max-width: 1.5rem;
  font-size: 1rem;
  display: inline-block;
  writing-mode: vertical-rl;
  background-color: #f0f0f0;
  text-align: center;
}
</style>
