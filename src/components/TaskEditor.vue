<template>
  <div class="overlay" @click.stop.prevent="hide" v-if="taskEditorSectionId">
    <div
      tabindex="0"
      class="task-editor"
      @click.stop.prevent
      @keydown.esc="hide"
    >
      <input
        autocomplete="off"
        id="name"
        type="text"
        v-model="task.name"
        @keydown.enter="save(taskEditorSectionId)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { defineComponent } from "vue";
import { createNamespacedHelpers } from "vuex";
const { mapState } = createNamespacedHelpers("preferences");

export default defineComponent({
  data() {
    return {
      task: {
        name: "",
      },
    };
  },
  watch: {
    taskEditorSectionId(val) {
      if (val) {
        window.setTimeout(() => {
          document.getElementById("name")?.focus();
        }, 0);
      }
    },
  },
  methods: {
    save(sectionId: string) {
      store.dispatch("asana/createTask", {
        task: this.task,
        sectionId: sectionId,
      });
      store.dispatch("preferences/hideTaskEditor");
    },
    hide() {
      store.dispatch("preferences/hideTaskEditor");
    },
  },
  computed: {
    ...mapState(["taskEditorSectionId"]),
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

.task-editor {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 50%;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 11;
}
</style>
