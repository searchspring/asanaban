<template>
  <div
    v-bind:id="task.gid"
    class="task"
    draggable="true"
    @dragstart="startDrag($event, task)"
    @dragend="endDrag($event, task)"
  >
    <div class="text">
      <img class="photo" v-if="assignee" :src="assignee" />{{ task.name }}
    </div>
    <div class="footer" v-if="dueDate || tags.length > 0">
      <div
        class="tag"
        v-for="tag in tags"
        :key="tag"
        :style="{
          'background-color': tag.hexes.background,
          color: tag.hexes.font,
        }"
      >
        {{ tag.name }}
      </div>
      <div class="date" v-if="dueDate">{{ dueDate }}</div>
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
      return this.$props.task &&
        this.$props.task.assignee &&
        this.$props.task.assignee.photo &&
        this.$props.task.assignee.photo.image_21x21
        ? this.$props.task.assignee.photo.image_21x21
        : "";
    },
    tags() {
      if (this.$props.task) {
        return this.$props.task.tags.map((tag) => {
          return { name: tag.name.substring(0, 1), hexes: tag.hexes };
        });
      }
      return [];
    },
    dueDate() {
      if (this.$props.task) {
        return this.$props.task.due_on
          ? this.$props.task.due_on.substring(0, 10)
          : "";
      }
      return "";
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
  min-height: 2.1rem;
  cursor: move;
  display: inline-block;
  vertical-align: top;
}
.text {
  vertical-align: top;
  font-size: 0.6rem;
  margin: 0.3rem;
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
.footer {
  display: flex;
  flex-direction: row;
  margin-top: 1px;
}
.date {
  font-size: 0.5rem;
  flex-grow: 1;
  text-align: right;
}
</style>
