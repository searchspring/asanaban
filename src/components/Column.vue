<template>
  <div class="column" :class="{ collapsed: columnCollapsed(section.gid) }">
    <div class="column-name" @click="toggleColumn(section.gid)">
      {{ columnName }}
    </div>
    <div
      v-if="!columnCollapsed(section.gid)"
      @drop="onDrop($event, section.gid)"
      @dragenter="onDragEnter($event)"
      @dragend="onDragEnd($event)"
      @dragover.prevent
      class="droppable"
      v-bind:id="section.gid"
    >
      <task
        v-for="task in tasks(section.gid)"
        :task="task"
        :key="task.gid"
      ></task>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { defineComponent } from "vue";
import { getPrettyColumnName } from "../utils/name-converter";
import Task from "./Task.vue";
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
        return false;
      }
      return store.state["preferences"].columnStates[gid].collapsed;
    },
    onDrop(event, endSectionId: string) {
      const startSectionId = event.dataTransfer.getData("startSectionId");
      const taskId = event.dataTransfer.getData("taskId");
      // const siblingTaskId = event.target.getAttribute("id");
      let el = event.target;
      while (el && el.classList && !el.classList.contains("task")) {
        el = el.parentElement;
      }
      const siblingTaskId = el
        ? el.getAttribute("id")
        : getLastTaskId(endSectionId);
      document.getElementById(taskId)?.classList.remove("dragging");
      removeDragOverClass();
      removeDraggingClass();
      store.dispatch("asana/moveTask", {
        startSectionId: startSectionId,
        endSectionId: endSectionId,
        taskId: taskId,
        siblingTaskId: siblingTaskId,
      });
    },
    onDragEnter(event) {
      removeDragOverClass();
      event.currentTarget.classList.add("drag-over");
    },
    onDragEnd(event) {
      const taskId = event.dataTransfer.getData("taskId");
      document.getElementById(taskId)?.classList.remove("dragging");
      removeDragOverClass();
    },
  },
});

function getLastTaskId(sectionId: string) {
  const tasks = store.state["asana"].tasks.filter((task) => {
    return task.memberships[0].section.gid === sectionId;
  });

  const taskId = tasks.length === 0 ? null : tasks[tasks.length - 1].gid;
  return taskId;
}

function removeDraggingClass() {
  const dragging = document.getElementsByClassName("dragging");
  for (let i = 0; i < dragging.length; i++) {
    dragging[i].classList.remove("dragging");
  }
}

function removeDragOverClass() {
  const columns = document.getElementsByClassName("droppable");
  for (let i = 0; i < columns.length; i++) {
    columns[i].classList.remove("drag-over");
  }
}
</script>

<style scoped>
/* make text unselectable */
.column-name {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.column {
  vertical-align: top;
  text-align: left;
  min-width: 10rem;
  background-color: aliceblue;
  margin-left: 0.2rem;
  min-height: 200px;
}
.droppable {
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
.drag-over {
  background-color: #f0f0f0;
}
</style>
