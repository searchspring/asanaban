<template>
  <div
    class="column"
    :class="classObject"
    @mouseenter="mouseInside = true"
    @mouseleave="mouseInside = false"
  >
    <div class="column-nav" @click="toggleColumn(section?.gid ?? '')">
      <a
        class="nav-item"
        :class="{ mouseInside: mouseInside }"
        v-if="!columnCollapsed(section?.gid ?? '')"
        href="javascript:;"
        @click.prevent.stop="showTaskEditor(section?.gid ?? '')"
        >add task</a
      >
      <div class="nav-title">{{ columnName ? columnName : "unknown" }}</div>
      <div class="count nav-item" v-if="!columnCollapsed(section?.gid ?? '')">
        {{ taskCount(section?.gid ?? '') }} of {{ maxTaskCount() }}
      </div>
      <div class="nav-item" v-if="isSectionComplete(columnName)">
        <a
          class="nav-item"
          :class="{ mouseInside: mouseInside }"
          v-if="!columnCollapsed(section?.gid ?? '')"
          href="javascript:;"
          @click.prevent.stop="release(section?.gid ?? '')"
          >release</a
        >
      </div>
    </div>
    <div
      v-if="!columnCollapsed(section?.gid ?? '')"
      @drop="onDrop($event, section?.gid ?? '')"
      @dragenter="onDragEnter($event)"
      @dragend="onDragEnd()"
      @dragover.prevent
      class="droppable"
      v-bind:id="section?.gid"
    >
      <task
        v-for="task in tasks(section?.gid ?? '')"
        :task="task"
        :key="task.gid"
      ></task>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { Section, Task as TaskType } from "@/types/asana";
import { defineComponent, PropType, computed } from "vue";
import { getPrettyColumnName } from "../utils/asana-specific";
import Task from "./Task.vue";
export default defineComponent({
  components: { Task },
  props: {
    section: Object as PropType<Section>,
  },
  data() {
    return {
      mouseInside: false,
    };
  },
  setup(props) {
    const columnName = computed(() => {
      return getPrettyColumnName(props.section?.name ?? "");
    });
    const classObject = computed(() => {
      const section = props["section"];
      if (section) {
        return {
          collapsed: columnCollapsed(section.gid),
          "over-budget": overBudget(),
          "search-match": tasks(section.gid).length > 0 && !emptySearch(),
        };
      }
      return {};
    });

    const showTaskEditor = (sectionId: string) => {
      store.dispatch("preferences/showTaskEditor", {
        sectionId: sectionId,
        task: {},
      });
    };

    const isSectionComplete = (columnName: string) => {
      return store.getters['asana/isSectionComplete'](columnName)
    };

    const release = (sectionId: string) => {
      let count = taskCount(sectionId);
      const response = confirm(
        `Release ${count} task${count > 1 ? 's' : ''} and mark as complete?`
      );
      if (response) {
        store.dispatch("asana/releaseSection", tasks(sectionId));
      }
    };

    const columnCollapsed = (gid: string) => {
      if (!store.state["preferences"].columnStates[gid]) {
        return false;
      }
      return store.state["preferences"].columnStates[gid].collapsed;
    };

    const overBudget = () => {
      const section = props["section"];
      if (section) {
        return (
          section.maxTaskCount !== "-1" &&
          taskCount(section.gid) > section.maxTaskCount
        );
      }
      return false;
    };

    const taskCount = (sectionId: string) => {
      return store.state["asana"].tasks.filter((task) => {
        return task.memberships.some((membership) => {
          return membership.section.gid === sectionId;
        });
      }).length;
    };

    const maxTaskCount = () => {
      const section = props["section"];
      if (section) {
        if (section.maxTaskCount === "-1") {
          return "∞";
        }
        return section.maxTaskCount;
      }
      return "";
    };

    const tasks = (sectionId: string) => {
      return store.state["asana"].tasks.filter((task) => {
        return task.memberships.some((membership) => {
          const isInSection = membership.section.gid === sectionId;
          const isInSearch =
            emptySearch() ||
            taskHasSearchHit(task, store.state["preferences"].search);
          return isInSection && isInSearch;
        });
      });
    };

    const toggleColumn = (gid: string) => {
      store.dispatch("preferences/toggleColumn", gid);
    };

    const onDrop = (event, endSectionId: string) => {
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
    };

    const onDragEnter = (event) => {
      removeDragOverClass();
      event.currentTarget.classList.add("drag-over");
    };

    const onDragEnd = () => {
      removeDragOverClass();
    };

    return {
      columnName,
      classObject,
      showTaskEditor,
      isSectionComplete,
      release,
      columnCollapsed,
      overBudget,
      taskCount,
      maxTaskCount,
      tasks,
      toggleColumn,
      onDrop,
      onDragEnter,
      onDragEnd,
    };
  },
});

function emptySearch() {
  return store.state["preferences"].search.trim() === "";
}
function taskHasSearchHit(task: TaskType, search: string) {
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
    return task.memberships[0].section?.gid === sectionId;
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
