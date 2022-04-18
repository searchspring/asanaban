<template>
  <div
    tabindex="0"
    class="overlay"
    v-if="taskEditorSectionIdAndTask"
    @keydown.esc="hide"
  >
    <div tabindex="0" class="task-editor" @keydown.esc="hide">
      <div class="name">
        <a
          v-if="taskEditorSectionIdAndTask.task.gid"
          class="tiny-link right"
          target="_blank"
          rel="noopener"
          :href="
            'https://app.asana.com/0/' +
            projectId +
            '/' +
            taskEditorSectionIdAndTask.task.gid +
            ''
          "
          >open in asana</a
        >
        <label for="name">name</label>
        <BasicInput v-model:input="taskEditorSectionIdAndTask.task.name" @keydown.enter="save(taskEditorSectionIdAndTask)"></BasicInput>
      </div>
      <div class="assignee-date-selector">
        <div class="assignee">
          <label for="assignee">assignee</label>
          <AssigneeSelector :task="taskEditorSectionIdAndTask.task"></AssigneeSelector>
         </div>
        <div class="due-date">
          <label>due date</label>
          <DateSelector v-model:date="dueDate"></DateSelector>
        </div>
      </div>
      <div class="description">
        <label for="description">description</label>
        <TextEditor
          :html="taskEditorSectionIdAndTask.task.html_notes"
          v-on:update="updateHtmlNotes($event, taskEditorSectionIdAndTask)"
        />
      </div>
      <div class="tags">
        <label>tags</label>
        <TagSelector :task="taskEditorSectionIdAndTask.task"></TagSelector>
      </div>
      <div class="stories">
        <Stories></Stories>
      </div>
      <div class="new-comment" v-if="taskEditorSectionIdAndTask.task.gid">
        <label for="new comment">new comment</label>
        <TextEditor
          :html="taskEditorSectionIdAndTask.htmlText"
          v-on:update="updateHtmlText($event, taskEditorSectionIdAndTask)"
        />
      </div>
      <div class="button-bar">
        <button class="primary right" @click="save(taskEditorSectionIdAndTask)">
          save
        </button>
        <button
          class="primary right"
          @click="completeTask(taskEditorSectionIdAndTask)"
          v-if="taskEditorSectionIdAndTask.task.gid"
        >
          complete
        </button>
        <button class="secondary left" @click="hide()">cancel</button>
        <button
          class="secondary left"
          @click="deleteTask(taskEditorSectionIdAndTask)"
          v-if="taskEditorSectionIdAndTask.task.gid"
        >
          delete
        </button>
      </div>
      <!-- <div style="font-size: 12px; white-space: pre; text-align: left">
        {{ JSON.stringify(taskEditorSectionIdAndTask.task, "", "  ") }}
      </div> -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import BasicInput from "./BasicInput.vue";
import TextEditor from "./TextEditor.vue";
import Stories from "./Stories.vue";
import { TaskAndSectionId } from "@/types/asana";
import TagSelector from "./TagSelector.vue";
import DateSelector from "./DateSelector.vue";
import { asanaDateFormat } from "../utils/date";
import { parse } from "date-fns";
import { useAsanaStore } from "@/store/asana";
import { usePrefStore } from "@/store/preferences";
import AssigneeSelector from "./AssigneeSelector.vue";

export default defineComponent({
  components: { TextEditor, Stories, TagSelector, DateSelector, BasicInput, AssigneeSelector },
  setup() {
    const asanaStore = useAsanaStore();
    const prefStore = usePrefStore();
    const dueDate = ref<Date>();
    const projectId = asanaStore.selectedProject;

    const taskEditorSectionIdAndTask = computed(() => {
      return prefStore.taskEditorSectionIdAndTask;
    });

    watch([taskEditorSectionIdAndTask], () => {
      if (taskEditorSectionIdAndTask.value) {
        window.setTimeout(() => {
          document.getElementById("name")?.focus();
        }, 0);

        const dueDateString = prefStore.taskEditorSectionIdAndTask?.task?.due_on;
        // to handle when creating a new task with no date or a task initially has no due date
        if (dueDateString === null || dueDateString === undefined) {
          dueDate.value = undefined;
        } else {
          dueDate.value = parse(dueDateString, asanaDateFormat, new Date());
        }
      }
    });

    watch([dueDate], () => {
      prefStore.SET_DUE_DATE(dueDate.value);
    });

    const save = (taskEditorSectionIdAndTask: TaskAndSectionId) => {
      if (taskEditorSectionIdAndTask.task.gid) {
        asanaStore.UPDATE_TASK(taskEditorSectionIdAndTask);
      } else {
        asanaStore.CREATE_TASK(taskEditorSectionIdAndTask);
      }
      hide();
    };

    const deleteTask = (taskEditorSectionIdAndTask: TaskAndSectionId) => {
      const response = confirm(
        `Are you sure you want to delete task "${taskEditorSectionIdAndTask.task.name}"?`
      );
      if (response) {
        asanaStore.DELETE_TASK(taskEditorSectionIdAndTask);
        hide();
      }
    };

    const hide = () => {
      prefStore.HIDE_TASK_EDITOR();
    };

    const updateHtmlNotes = (html: string, taskEditorSectionIdAndTask: TaskAndSectionId) => {
      taskEditorSectionIdAndTask.task.html_notes = html;
    };

    const updateHtmlText = (html: string, taskEditorSectionIdAndTask: TaskAndSectionId) => {
      taskEditorSectionIdAndTask.htmlText = html;
    };

    const completeTask = (taskEditorSectionIdAndTask: TaskAndSectionId) => {
      asanaStore.COMPLETE_TASK(taskEditorSectionIdAndTask);
      hide();
    };

    return {
      taskEditorSectionIdAndTask,
      projectId,
      dueDate,
      save,
      deleteTask,
      hide,
      updateHtmlNotes,
      updateHtmlText, 
      completeTask,
    }
  },
});
</script>

<style scoped>
/* modal editor window with blurred background */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10;
}
label {
  display: block;
  font-size: 0.85rem;
  color: grey;
  font-weight: 400;
  margin-bottom: 0.35rem;
  margin-top: 0.7rem;
}
.assignee {
  flex: 1;
  text-align: left;
}
.due-date {
  flex: 0.3;
  margin-left: 2rem;
  text-align: left;
}
.assignee-date-selector {
  display: flex;
}

.tags,

.name,

.description {
  text-align: left;
}
.new-comment {
  text-align: left;
}
.stories {
  margin-top: 1rem;
}
.tiny-link {
  font-size: 0.6rem;
}
.right {
  float: right;
}
input,
textarea {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #999999;
  min-height: 10rem;
}

.task-editor {
  border-radius: 8px;
  padding: 20px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  max-height: 90%;
  min-height: 50%;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 11;
  overflow-x: hidden;
}

button.primary {
  margin-top: 1rem;
  width: 10rem;
  background-color: #cccccc;
  border: none;
  cursor: pointer;
}
button.primary:hover {
  background-color: #dddddd;
}

button.secondary {
  margin-top: 1rem;
  width: 10rem;
  float: right;
  background-color: #aaaaaa;
  border: none;
  cursor: pointer;
}
button.right {
  float: right;
  margin-left: 1px;
}
button.left {
  float: left;
  margin-right: 1px;
}
button.secondary:hover {
  background-color: #cccccc;
}

.button-bar {
  height: 1.2rem;
  clear: both;
}
</style>
