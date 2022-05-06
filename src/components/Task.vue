<template>
  <div v-bind:id="task.gid" class="task" draggable="true" :style="{ opacity: opacity, ...backgroundAndTextColor }"
    @dragstart="startDrag($event, task)" @dragend="endDrag($event)" @click="edit()">
    <div class="text">
      <div aria-hidden="true" class="assignee-icon" v-if="assignee.name">
        <span class="photo avatar" v-if="!assignee.photo" v-bind:style="{ backgroundColor: getAvatarColor(assignee.name) }">
          <div class="Avatar AvatarPhoto AvatarPhoto--small AvatarPhoto--color2" role="img" :aria-label="assignee.name">
            <div aria-hidden="true">{{getAssigneeInitials(assignee.name)}}</div>
          </div>
        </span>
        <img class="photo" v-if="assignee.photo" :src="assignee.photo" />
      </div>
      {{ task.name }}
      <n-icon class="subtask-icon" v-if="task.subtasks.length > 0">
        <tree-view-alt />
      </n-icon>
    </div>
    <div class="label" v-if="dueDate">
      <hr>
      Due Date
      <div class="date">{{ dueDate }}</div>
    </div>
    <div class="footer">
      <div class="tag" v-for="tag in tags" :key="tag.name" :style="{
        'background-color': tag.hexes?.background,
        color: tag.hexes?.font,
      }">
        {{ tag.name }}
      </div>
      <n-tag round size="small" v-for="field in customEnumFieldValues" :key="field.name" :color="{
        color: field.hexes.background,
        textColor: field.hexes.font,
        borderColor: '#ffffff'
      }">
        {{ field.name }}
      </n-tag>

    </div>
  </div>
</template>

<script lang="ts">
import { Task } from "@/types/asana";
import { computed, defineComponent, PropType } from "vue";
import differenceInDays from "date-fns/differenceInDays/index";
import parseISO from "date-fns/parseISO/index";
import { parse } from "date-fns";
import { asanaDateFormat } from "../utils/date";
import { usePrefStore } from "@/store/preferences";
import { NIcon, NTag } from "naive-ui";
import { TreeViewAlt } from "@vicons/carbon";
import { convertAsanaColorToHex } from "@/utils/asana-specific";
import { getDisplayableCustomFields } from "@/utils/custom-fields";
import avatarColors from "../utils/avatar-colors";

export default defineComponent({
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true
    },
  },
  components: {
    NIcon,
    NTag,
    TreeViewAlt
  },
  methods:{
    getAssigneeInitials(assignee: string) {
      if (assignee) {
        const nameSplit = assignee.split(" ");  
        return nameSplit.length > 1 ? nameSplit[0][0] + nameSplit[nameSplit.length - 1][0] : nameSplit[0][0];
      }
    },
    getAvatarColor(assignee: string) {
      if (!assignee) return avatarColors[0];

      let hash = 0;
      for (let i = 0; i < assignee.length; ++i) {
        hash = ((hash << 5) - hash) + assignee.charCodeAt(i);
        hash |= 0;
      }
      return avatarColors[-(hash % avatarColors.length)];
    }
  },
  setup(props) {
    const prefStore = usePrefStore();
    const assignee = computed(() => {
      return {
        name: props.task.assignee?.name, 
        photo: props.task.assignee?.photo?.image_21x21 ?? ""
      };
    });

    const tags = computed(() => {
      return props.task.tags.map((tag) => {
        return { name: tag.name.substring(0, 1), hexes: tag.hexes };
      });
    });

    const customEnumFieldValues = computed(() => {
      const fields = getDisplayableCustomFields(props.task.custom_fields).filter(f => !!f.enum_value); // We only care about custom fields that currently have an assigned value

      return fields.map(f => {
        return {
          name: f.enum_value!.name, hexes: convertAsanaColorToHex(f.enum_value!.color)
        };
      })
    });

    const dueDate = computed(() => {
      return props.task.due_on?.substring(0, 10) ?? "";
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
      const dueDate = props.task.due_on?.substring(0, 10) ?? "";
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
      prefStore.SHOW_TASK_EDITOR({
        task: props.task,
        htmlText: "",
        newTags: [],
        sectionId: ""
      });
    };

    return {
      assignee,
      tags,
      customEnumFieldValues,
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
  padding: 0.15rem 0.1rem 0rem 0.15rem;
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

.task .subtask-icon {
  margin-left: auto;
}

.text {
  vertical-align: top;
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0.35rem;
  margin-bottom: 0.2rem;
  margin-left: 0.1rem;
  display: flex;
  overflow-wrap: break-word;
  padding: 0px 3px;
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
  width: 21px;
  height: 21px;
}

.avatar {
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 8px;
  font-weight: 700;
  color: white;
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
