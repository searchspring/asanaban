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
        <input
          autocomplete="off"
          id="name"
          type="text"
          v-model="taskEditorSectionIdAndTask.task.name"
          @keydown.enter="save(taskEditorSectionIdAndTask)"
        />
      </div>
      <div class="assignee">
        <label for="assignee">assignee</label>
        <AssigneeSelector></AssigneeSelector>
      </div>
      <div class="description">
        <label for="description">description</label>
        <TextEditor
          :html="taskEditorSectionIdAndTask.task.html_notes"
          v-on:update="updateHtmlNotes($event, taskEditorSectionIdAndTask)"
        />
      </div>
      <TagSelector :task="taskEditorSectionIdAndTask.task"></TagSelector>
      <Stories></Stories>
      <div class="new comment" v-if="taskEditorSectionIdAndTask.task.gid">
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
import store from "@/store";
import { defineComponent } from "vue";
import { createNamespacedHelpers } from "vuex";
import AssigneeSelector from "./AssigneeSelector.vue";
import TextEditor from "./TextEditor.vue";
import Stories from "./Stories.vue";
import { TaskAndSectionId } from "@/types/asana";
import TagSelector from "./TagSelector.vue";
const { mapState } = createNamespacedHelpers("preferences");

export default defineComponent({
  components: { AssigneeSelector, TextEditor, Stories, TagSelector },
  watch: {
    taskEditorSectionIdAndTask(val) {
      if (val) {
        window.setTimeout(() => {
          document.getElementById("name")?.focus();
        }, 0);
      }
    },
  },
  methods: {
    save(taskEditorSectionIdAndTask: TaskAndSectionId) {
      if (taskEditorSectionIdAndTask.task.gid) {
        store.dispatch("asana/updateTask", taskEditorSectionIdAndTask);
      } else {
        store.dispatch("asana/createTask", taskEditorSectionIdAndTask);
      }
      store.dispatch("preferences/hideTaskEditor");
    },
    deleteTask(taskEditorSectionIdAndTask: TaskAndSectionId) {
      const response = confirm(
        `Are you sure you want to delete task "${taskEditorSectionIdAndTask.task.name}"?`
      );
      if (response) {
        store.dispatch("asana/deleteTask", taskEditorSectionIdAndTask);
        store.dispatch("preferences/hideTaskEditor");
      }
    },
    hide() {
      store.dispatch("preferences/hideTaskEditor");
    },
    updateHtmlNotes(html: string, taskEditorSectionIdAndTask: TaskAndSectionId) {
      taskEditorSectionIdAndTask.task.html_notes = html;
    },
    updateHtmlText(html: string, taskEditorSectionIdAndTask: TaskAndSectionId) {
      taskEditorSectionIdAndTask.htmlText = html;
    },
    completeTask(taskEditorSectionIdAndTask: TaskAndSectionId) {
      store.dispatch("asana/completeTask", taskEditorSectionIdAndTask);
      store.dispatch("preferences/hideTaskEditor");
    },
  },
  computed: {
    ...mapState(["taskEditorSectionIdAndTask"]),
    projectId: {
      get() {
        return store.state["asana"].selectedProject;
      },
      set(val: string) {
        store.dispatch("asana/setSelectedProject", val);
      },
    },
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
}
.name,
.description {
  text-align: left;
}
label {
  font-size: 0.5rem;
}
.tiny-link {
  font-size: 0.5rem;
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
}
textarea {
  min-height: 10rem;
}

.task-editor {
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
  width: 10rem;
  background-color: #cccccc;
  border: none;
  cursor: pointer;
}
button.primary:hover {
  background-color: #dddddd;
}

button.secondary {
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
