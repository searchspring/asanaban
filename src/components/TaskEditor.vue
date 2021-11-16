<template>
  <div
    class="overlay"
    @click.stop.prevent="hide"
    v-if="taskEditorSectionIdAndTask"
  >
    <div
      tabindex="0"
      class="task-editor"
      @click.stop.prevent
      @keydown.esc="hide"
    >
      <div class="name">
        <label for="name">name</label>
        <input
          autocomplete="off"
          id="name"
          type="text"
          v-model="taskEditorSectionIdAndTask.task.name"
          @keydown.enter="save(taskEditorSectionIdAndTask)"
        />
      </div>
      <button class="primary right" @click="save(taskEditorSectionIdAndTask)">
        save
      </button>
      <button class="secondary left" @click="hide()">cancel</button>
      <button
        class="secondary left"
        @click="deleteTask(taskEditorSectionIdAndTask)"
        v-if="taskEditorSectionIdAndTask.task.gid"
      >
        delete
      </button>
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
const { mapState } = createNamespacedHelpers("preferences");

export default defineComponent({
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
    save(taskEditorSectionIdAndTask: any) {
      if (taskEditorSectionIdAndTask.task.gid) {
        store.dispatch("asana/updateTask", taskEditorSectionIdAndTask);
      } else {
        store.dispatch("asana/createTask", taskEditorSectionIdAndTask);
      }
      store.dispatch("preferences/hideTaskEditor");
    },
    deleteTask(taskEditorSectionIdAndTask: any) {
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
  },
  computed: {
    ...mapState(["taskEditorSectionIdAndTask"]),
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
.name {
  text-align: left;
}
.name label {
  font-size: 0.5rem;
}
.name input {
  width: 100%;
}

.task-editor {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 50%;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 11;
  overflow-x: hidden;
  overflow-y: auto;
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
}
button.left {
  float: left;
}
button.secondary:hover {
  background-color: #cccccc;
}
</style>
