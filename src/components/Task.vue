<template>
  <div
    v-bind:id="task.gid"
    class="task"
    draggable="true"
    :style="{ opacity: opacity }"
    @dragstart="startDrag($event, task)"
    @dragend="endDrag($event, task)"
    @click="edit()"
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
          'background-color': tag.hexes?.background,
          color: tag.hexes?.font,
        }"
      >
        {{ tag.name }}
      </div>
      <div class="date" v-if="dueDate">{{ dueDate }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { Task } from "@/types/asana";
import { computed, defineComponent, PropType } from "vue";
import differenceInDays from "date-fns/differenceInDays/index";
import parseISO from "date-fns/parseISO/index";
import { max } from "date-fns";

export default defineComponent({
  props: {
    task: Object as PropType<Task>,
  },
  setup(props) {
    const assignee = computed(() => {
      return props.task &&
        props.task.assignee &&
        props.task.assignee.photo &&
        props.task.assignee.photo.image_21x21
        ? props.task.assignee.photo.image_21x21
        : "";
    });

    const tags = computed(() => {
      if (props.task) {
        return props.task.tags.map((tag) => {
          return { name: tag.name.substring(0, 1), hexes: tag.hexes };
        });
      }
      return [];
    });

    const dueDate = computed(() => {
      return props.task?.due_on?.substring(0, 10) ?? "";
    });

    const opacity = computed(() => {
      const columnChangeDate = (props.task?.custom_fields.find(field => {
        return field.name === "column-change";
      }) as any)?.text_value;
      const daysSinceMove = differenceInDays(new Date(), parseISO(columnChangeDate));
      const opacity = ((100 - (daysSinceMove * 2.3)) / 100) + 0.3;
      return Math.max(opacity, 0.3);
    });

    const startDrag = (event, task: Task) => {
      event.dataTransfer.dropEffect = "move";
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "startSectionId",
        task.memberships[0].section!.gid
      );
      event.srcElement.classList.add("dragging");
      event.dataTransfer.setData("taskId", task.gid);
    };

    const endDrag = (event) => {
      event.srcElement.classList.remove("dragging");
    };

    const edit = () => {
      store.dispatch("preferences/showTaskEditor", { task: props.task });
    };

    return {
      assignee,
      tags,
      dueDate,
      opacity,
      startDrag,
      endDrag,
      edit
    }
  }
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
  overflow-wrap: break-word;
  width: 8rem;
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
