<template>
  <div
    v-bind:id="task.gid"
    class="task"
    draggable="true"
    @dragstart="startDrag($event, task)"
    @dragend="endDrag($event, task)"
  >
    <img class="photo" v-if="assignee" :src="assignee" />
    <div class="text">{{ task.name }}</div>
    <div>
      <div class="tag" v-for="tag in tags" :key="tag">{{ tag }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    task: Object,
  },
  computed: {
    assignee() {
      if (this.$props.task) {
        return this.$props.task.assignee
          ? this.$props.task.assignee.photo.image_21x21
          : "";
      }
      return "";
    },
    tags() {
      if (this.$props.task) {
        return this.$props.task.tags.map((tag) => tag.name.substring(0, 1));
      }
      return [];
    },
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
    endDrag(event) {
      event.srcElement.classList.remove("dragging");
    },
  },
});
</script>

<style scoped>
.task {
  margin-left: 1px;
  margin-bottom: 1px;
  background-color: white;
  width: 8rem;
  min-height: 2rem;
  cursor: move;
  display: inline-block;
  padding: 0.3rem;
  vertical-align: top;
}
.text {
  vertical-align: top;
  font-size: 0.6rem;
  display: inline-block;
}
.dragging {
  opacity: 0.5;
}
.photo {
  border-radius: 100%;
  display: inline-block;
}
.tag {
  border-radius: 100%;
  background-color: #cccccc;
  display: inline-block;
  font-size: 0.5rem;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  margin-right: 1px;
}
</style>
