<template>
  <div class="column" :class="[classObject, singleTaskView ? 'single-task-view' : '']" @mouseenter="mouseInside = true" @mouseleave="mouseInside = false">
    <div class="column-nav" :class="singleTaskView ? 'single-task-view' : ''" @click="toggleColumn(section?.gid ?? '')">
      <a class="nav-item mouseInside" v-if="!columnCollapsed(section?.gid ?? '')" href="javascript:;"
        @click.prevent.stop="showTaskEditor(section?.gid ?? '')">add task</a>
      <div class="nav-title">{{ columnName ? columnName : "unknown" }}</div>
      <div class="count nav-item" v-if="!columnCollapsed(section?.gid ?? '')">
        {{ taskCount(section?.gid ?? '') }} of {{ maxTaskCount() }}
      </div>
      <div class="nav-item" v-if="isSectionComplete(columnName)">
        <a class="nav-item mouseInside" v-if="!columnCollapsed(section?.gid ?? '')" href="javascript:;"
          @click.prevent.stop="release(section?.gid ?? '')">release</a>
      </div>
    </div>
    <div v-if="!columnCollapsed(section?.gid ?? '')" @drop="onDrop($event, section?.gid ?? '')"
      @dragenter="onDragEnter($event)" @dragstart="onDragStart()" @dragend="onDragEnd()" @dragover.prevent
      class="droppable" v-bind:id="section?.gid">
      <task v-for="task in tasks(section?.gid ?? '')" :singleTaskView="singleTaskView" :task="task" :key="task.gid" />
    </div>
  </div>
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana";
import { usePrefStore } from "@/store/preferences";
import { Section, Task as TaskType } from "@/types/asana";
import { defineComponent, PropType, computed, ref } from "vue";
import { getPrettyColumnName } from "../utils/asana-specific";
import Task from "./Task.vue";
export default defineComponent({
  components: { Task },
  props: {
    section: Object as PropType<Section>,
    singleTaskView: Boolean
  },
  setup(props) {
    const asanaStore = useAsanaStore();
    const prefStore = usePrefStore();

    const mouseInside = ref(false);
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
      prefStore.SHOW_TASK_EDITOR({
        sectionId: sectionId,
        htmlText: "",
        newTags: [],
        task: {} as TaskType
      });
    };

    const isSectionComplete = (columnName: string) => {
      return asanaStore.IS_SECTION_COMPLETE(columnName)
    };

    const release = (sectionId: string) => {
      let count = taskCount(sectionId);
      const response = confirm(
        `Release ${count} task${count > 1 ? 's' : ''} and mark as complete?`
      );
      if (response) {
        asanaStore.RELEASE_SECTION(tasks(sectionId));
      }
    };

    const columnCollapsed = (gid: string) => {
      if (!prefStore.columnStates[gid]) {
        return false;
      }
      return prefStore.columnStates[gid].collapsed;
    };

    const overBudget = () => {
      const section = props.section;
      if (section) {
        return (
          section.maxTaskCount !== "-1" &&
          taskCountForSameNameColumn(section) > parseInt(section.maxTaskCount)
        );
      }
      return false;
    };

    const taskCount = (sectionId: string) => {
      return asanaStore.tasks.filter((task) => {
        return task.memberships.some((membership) => {
          return membership.section?.gid === sectionId;
        });
      }).length;
    };

    const taskCountForSameNameColumn = (section: Section) => {
      const columnName = getPrettyColumnName(section.name).toLowerCase();
      const sectionsToSum = asanaStore.sections.filter(s => {
        const c = getPrettyColumnName(s.name).toLowerCase();
        return columnName === c;
      });

      return sectionsToSum.reduce((val, s) => val + taskCount(s.gid), 0);
    }

    const maxTaskCount = () => {
      const section = props.section;
      if (section) {
        if (section.maxTaskCount === "-1") {
          return "∞";
        }
        return section.maxTaskCount;
      }
      return "";
    };

    const tasks = (sectionId: string) => {
      return asanaStore.tasks.filter((task) => {
        return task.memberships.some((membership) => {
          const isInSection = membership.section?.gid === sectionId;
          const isInSearch =
            emptySearch() ||
            taskHasSearchHit(task, prefStore.search);
          return isInSection && isInSearch;
        });
      });
    };

    const toggleColumn = (gid: string) => {
      prefStore.TOGGLE_COLUMN(gid);
    };

    const onDrop = (event, endSectionId: string) => {
      asanaStore.reloadState.locked = false;
      asanaStore.reloadState.lastLocked = new Date();

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
      asanaStore.MOVE_TASK({
        startSectionId: startSectionId,
        endSectionId: endSectionId,
        taskId: taskId,
        siblingTaskId: siblingTaskId,
        endOfColumn: el === null
      });
    };

    const onDragEnter = (event) => {
      removeDragOverClass();
      event.currentTarget.classList.add("drag-over");
    };

    const onDragStart = () => {
      asanaStore.reloadState.locked = true;
    }

    const onDragEnd = () => {
      removeDragOverClass();
    };

    return {
      mouseInside,
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
      onDragStart,
      onDragEnd,
    };
  },
});

function emptySearch() {
  return usePrefStore().search.trim() === "";
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
  const tasks = useAsanaStore().tasks.filter((task) => {
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
  background-color: #dddddd;
  border-radius: 5px 5px 0 0;
}

.nav-title {
  font-size: 110%;
  flex-grow: 1;
  padding: 0.3rem 0.2rem;
}

.nav-item {
  font-size: 0.7rem;
  margin-left: 0.2rem;
  margin-right: 0.2rem;
  padding-top: 0.3rem;
}

.column-nav div,
.column-nav a {
  vertical-align: bottom;
}

.column {
  text-align: left;
  /*background-color: #eaeaea;*/
  background-image: linear-gradient(to top, rgba(200, 200, 200, .4), rgba(200, 200, 200, .8));
  border-radius: 5px;
  margin-left: 2px;
  flex-basis: 100%;
  display: flex;
  flex-flow: column;
}



.droppable {
  flex: 1 1 auto;
  width: 100%;
}

.column.collapsed {
  min-width: 1.5rem !important;
  max-width: 1.5rem;
  font-size: 1rem;
  writing-mode: vertical-rl;
}

.drag-over {
  background-color: #f0f0f0;
}

.over-budget {
  background-image: linear-gradient(to top, rgba(248, 113, 113, 0.4), rgba(248, 113, 113, 0.8));
}

.search-match {
  background-image: linear-gradient(to top, rgba(253, 224, 71, 0.4), rgba(253, 224, 71, 0.8));
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

.column.single-task-view {
  width: 20vw;
}
.column-nav.single-task-view {
  width: 20vw;
}
</style>
