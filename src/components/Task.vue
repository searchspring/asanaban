<template>
  <div
    v-bind:id="task.gid"
    class="task"
    draggable="true"
    :style="{ opacity: opacity, ...backgroundAndTextColor }"
    @dragstart="startDrag($event, task)"
    @dragend="endDrag($event)"
    @click="edit()"
  >
    <div class="text">
      <img class="photo" v-if="assignee" :src="assignee" />{{ task.name }}
    </div>
    <div class="label" v-if="dueDate">
      <hr>
      Due Date
      <div class="date">{{ dueDate }}</div>
    </div>
    <div class="footer" v-if="tags.length > 0">
      <div
        class="tag"
        v-for="tag in tags"
        :key="tag.name"
        :style="{
          'background-color': tag.hexes?.background,
          color: tag.hexes?.font,
        }"
      >
        {{ tag.name }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Task, TaskAndSectionId } from "@/types/asana";
import { computed, defineComponent, PropType } from "vue";
import differenceInDays from "date-fns/differenceInDays/index";
import parseISO from "date-fns/parseISO/index";
import { parse } from "date-fns";
import { asanaDateFormat } from "../utils/date";
import { usePrefStore } from "@/store/preferences";

export default defineComponent({
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true
    },
  },
  setup(props) {
    const prefStore = usePrefStore();

    const assignee = computed(() => {
      const photo = props.task?.assignee?.photo?.image_21x21 ?? "";
      return photo;
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
      // custom_fields is undefined for free accounts
      const columnChangeDate = (props.task.custom_fields?.find(field => {
        return field.name === "column-change";
      }) as any)?.text_value;
      const daysSinceMove = differenceInDays(new Date(), parseISO(columnChangeDate) ?? new Date());
      const opacity = ((100 - (daysSinceMove * 2.3)) / 100) + 0.3;
      return Math.max(opacity, 0.3);
    });

    const backgroundAndTextColor = computed(() => {
      const dueDate = props.task?.due_on?.substring(0, 10) ?? "";
      if (dueDate) {
        if (differenceInDays(parse(dueDate, asanaDateFormat, new Date()), new Date()) < 5) {
          return {
            "background-color": "#D44C46", // red
            "color": "white"
          }
        }
        return {
          "background-color": "#7960CE", // purple
          "color": "white"
        }
      }
      return {
        "background-color": "white",
        "color": "black"
      }
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
      const taskCopy: Task = {...props.task}
      prefStore.SHOW_TASK_EDITOR({
        task: taskCopy,
        htmlText: "",
        newTags: [],
        sectionId: ""
      });
    };

    return {
      assignee,
      tags,
      dueDate,
      opacity,
      backgroundAndTextColor,
      startDrag,
      endDrag,
      edit
    }
  }
});
</script>

<style scoped>

hr {
  height: 0.11rem;
  background-color: white;
  border: none;
}
.task {
  border-radius: 5px;
  padding: 0.15rem 0.5rem 0.15rem 0.5rem;
  margin-top: 2px;
  margin-left: 4px;
  margin-bottom: 4px;
  background-color: white;
  margin-right: 2px;
  width: 48%; 
  max-width: 15rem;
  min-height: 2.5rem;
  cursor: move;
  display: inline-block;
  vertical-align: top;
  overflow: auto;
}
.text {
  vertical-align: top;
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0.35rem;
  margin-bottom: 0.2rem;
  margin-left: 0.1rem;
  display: inline-block;
  overflow-wrap: break-word;
  width: 90%;
}
.tag {
  border-radius: 100%;
  border: solid white;
  border-width: thin;
  display: inline-block;
  font-size: 0.7rem;
  padding: 0.1rem 0.35rem 0.1rem 0.35rem;
  margin-top: 0.2rem;
  margin-left: 0.09rem;
  margin-right: 1px;
  margin-bottom: 0.4rem;
  clear: right;
}
.dragging {
  opacity: 0.5;
}
.photo {
  border-radius: 100%;
  border: solid thin white;
  display: inline-block;
  margin-right: 0.45rem;
  vertical-align: middle;
}
.footer {
  display: flex;
  flex-direction: row;
  margin-top: 1px;
}
.label {
  font-size: 0.55rem;
  font-weight: 700;
  text-align: left;
  margin-bottom: 0.4rem;
  margin-top: 0.1rem;
  margin-left: 0.1rem;
}
.date {
  margin-right: 0.1rem;
  font-size: 0.55rem;
  font-weight: 700;
  flex-grow: 1;
  float: right;
}
</style>
