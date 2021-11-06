<template>
  <div class="column">
    <div>{{ columnName }}</div>
    <task
      v-for="task in tasks(section.gid)"
      :task="task"
      :key="task.gid"
    ></task>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getPrettyColumnName } from "../utils/name-converter";
import Task from "./Task.vue";
import store from "../store";
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
  },
});
</script>

<style scoped>
.column {
  display: inline-block;
  vertical-align: top;
  width: 300px;
  white-space: normal;
  background-color: aliceblue;
  margin: 0.2rem;
  min-height: 200px;
}
</style>
