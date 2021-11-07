<template>
  <div
    v-bind:id="task.gid"
    class="task"
    draggable="true"
    @dragstart="startDrag($event, task)"
  >
    <div>{{ task.name }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    task: Object,
  },
  methods: {
    startDrag(event, task: any) {
      event.dataTransfer.dropEffect = "move";
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "startSectionId",
        task.memberships[0].section.gid
      );
      event.srcElement.classList.add("dragging");
      event.dataTransfer.setData("taskId", task.gid);
    },
  },
});
</script>

<style scoped>
.task {
  padding: 0.3rem;
  margin: 0.1rem;
  background-color: white;
  display: inline-block;
  max-width: 20rem;
  vertical-align: top;
  font-size: 10px;
  min-height: 2rem;
  cursor: move;
}
.dragging {
  opacity: 0.5;
}
</style>
