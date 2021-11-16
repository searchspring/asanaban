<template>
  <div
    class="column"
    :class="classObject"
    @mouseenter="mouseInside = true"
    @mouseleave="mouseInside = false"
  >
    <div class="column-nav" @click="toggleColumn(section.gid)">
      <a
        class="nav-item"
        :class="{ mouseInside: mouseInside }"
        v-if="!columnCollapsed(section.gid)"
        a
        href="javascript:;"
        @click.prevent.stop="showTaskEditor(section.gid)"
        >add task</a
      >
      <div class="nav-title">{{ columnName ? columnName : "unknown" }}</div>
      <div class="count nav-item" v-if="!columnCollapsed(section.gid)">
        {{ taskCount(section.gid) }} of {{ maxTaskCount() }}
      </div>
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
  data() {
    return {
      mouseInside: false,
    };
  },
  computed: {
    columnName(state) {
      return getPrettyColumnName(state.section.name);
    },
    classObject() {
      const section = this.$props["section"];
      if (section) {
        return {
          collapsed: this.columnCollapsed(section.gid),
          "over-budget": this.overBudget(),
          "search-match": this.tasks(section.gid).length > 0 && !emptySearch(),
        };
      }
      return {};
    },
  },
  methods: {
    showTaskEditor(sectionId: string) {
      store.dispatch("preferences/showTaskEditor", {
        sectionId: sectionId,
        task: {},
      });
    },
    columnCollapsed(gid: string) {
      if (!store.state["preferences"].columnStates[gid]) {
        return false;
      }
      return store.state["preferences"].columnStates[gid].collapsed;
    },
    overBudget() {
      const section = this.$props["section"];
      if (section) {
        return (
          section.maxTaskCount !== "-1" &&
          this.taskCount(section.gid) > section.maxTaskCount
        );
      }
      return false;
    },
    taskCount(sectionId: string) {
      return store.state["asana"].tasks.filter((task) => {
        return task.memberships.some((membership) => {
          return membership.section.gid === sectionId;
        });
      }).length;
    },
    maxTaskCount() {
      const section = this.$props["section"];
      if (section) {
        if (section.maxTaskCount === "-1") {
          return "∞";
        }
        return section.maxTaskCount;
      }
      return "";
    },
    tasks(sectionId: string) {
      return store.state["asana"].tasks.filter((task) => {
        return task.memberships.some((membership) => {
          const isInSection = membership.section.gid === sectionId;
          const isInSearch =
            emptySearch() ||
            taskHasSearchHit(task, store.state["preferences"].search);
          return isInSection && isInSearch;
        });
      });
    },
    toggleColumn(gid: string) {
      store.dispatch("preferences/toggleColumn", gid);
    },
    onDrop(event, endSectionId: string) {
      const startSectionId = event.dataTransfer.getData("startSectionId");
      const taskId = event.dataTransfer.getData("taskId");
      let el = event.target;
      while (el && el.classList && !el.classList.contains("task")) {
        el = el.parentElement;
      }
      const siblingTaskId = el
        ? el.getAttribute("id")
        : getLastTaskId(endSectionId);
      removeDragOverClass();
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
    onDragEnd() {
      removeDragOverClass();
    },
  },
});

function emptySearch() {
  return store.state["preferences"].search.trim() === "";
}
function taskHasSearchHit(task: any, search: string) {
  let text = task.name + " " + task.notes;
  task.tags.forEach((tag) => {
    text += " " + tag.name;
  });
  if (task.assignee) {
    text += " " + task.assignee.name;
  }
  return text.toLowerCase().indexOf(search.toLowerCase()) !== -1;
}

function getLastTaskId(sectionId: string) {
  const tasks = store.state["asana"].tasks.filter((task) => {
    return task.memberships[0].section.gid === sectionId;
  });

  const taskId = tasks.length === 0 ? null : tasks[tasks.length - 1].gid;
  return taskId;
}

function removeDragOverClass() {
  const columns = document.getElementsByClassName("droppable");
  for (let i = 0; i < columns.length; i++) {
    columns[i].classList.remove("drag-over");
  }
}
</script>

<style scoped>
.column-nav {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-weight: bold;
  text-align: center;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  flex-wrap: nowrap;
  font-size: 0.8rem;
}
.nav-title {
  flex-grow: 1;
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
}
.nav-item {
  font-size: 0.5rem;
  margin-left: 0.2rem;
  margin-right: 0.2rem;
}
.column-nav div,
.column-nav a {
  vertical-align: bottom;
}
.column {
  text-align: left;
  background-color: #dddddd;
  margin-left: 1px;
  flex-basis: 100%;
  display: flex;
  flex-flow: column;
}
.droppable {
  flex: 1 1 auto;
}
.column.collapsed {
  min-width: 1.5rem !important;
  max-width: 1.5rem;
  font-size: 1rem;
  writing-mode: vertical-rl;
  padding-left: 0.1rem;
  padding-right: 0.1rem;
}
.drag-over {
  background-color: #f0f0f0;
}
.count {
  font-size: 0.5rem;
}
.over-budget {
  background-color: red;
}
.search-match {
  background-color: yellow;
}
a.nav-item:hover {
  text-decoration: underline;
}
a.nav-item {
  text-decoration: none;
  font-weight: normal;
  color: black;
  display: inline-block;
  opacity: 0.3;
}
a.nav-item.mouseInside {
  opacity: 1;
}
</style>
