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
          :href="makeAsanaHref(taskEditorSectionIdAndTask.task.gid)"
          >open in asana</a
        >
        <label for="name">name</label>
        <BasicInput
          v-model:input="taskName"
          @keydown.enter="save(taskEditorSectionIdAndTask)"
        ></BasicInput>
      </div>
      <div class="assignee-date-selector">
        <div class="assignee">
          <label for="assignee">assignee</label>
          <AssigneeSelector v-model:assigneeGid="assigneeGid" />
        </div>
        <div class="due-date">
          <label>due date</label>
          <DateSelector v-model:date="dueDate" />
        </div>
      </div>
      <div class="description">
        <label for="description">description</label>
        <TextEditor
          :html="htmlNotes"
          :forDescription="true"
          v-on:update="htmlNotes = $event"
        />
      </div>
      <div class="tags">
        <label>tags</label>
        <TagSelector :task="taskEditorSectionIdAndTask.task" />
      </div>
      <template
        v-for="(field, index) in taskEditorSectionIdAndTask.task.custom_fields"
        :key="field.name"
      >
        <div class="field" v-if="isDisplayableCustomField(field)">
          <label>{{ field.name }}</label>
          <custom-enum-field-selector
            :field="field"
            v-model:selectedGid="customFieldSelectedGids[index]"
          />
        </div>
      </template>
      <div
        class="subtasks"
        v-if="taskEditorSectionIdAndTask.task.subtasks?.length > 0"
      >
        <label>subtasks</label>
        <n-list style="font-size: 0.8rem">
          <n-list-item
            v-for="subtask in taskEditorSectionIdAndTask.task.subtasks"
            :key="subtask.gid"
          >
            <template #prefix>
              <n-icon color="green" v-if="subtask.completed">
                <check-circle />
              </n-icon>
              <n-icon v-else>
                <check-circle-regular />
              </n-icon>
            </template>
            {{ subtask.name }}
            <template #suffix>
              <a :href="makeAsanaHref(subtask.gid)" target="_blank">
                <n-icon>
                  <external-link-alt />
                </n-icon>
              </a>
            </template>
          </n-list-item>
        </n-list>
      </div>
      <div class="attachments">
        <div
          v-for="attachment in taskEditorSectionIdAndTask.task.attachments?.filter(
            (el) => isImageFormat(el.name)
          )"
          class="attachment"
          :key="attachment.gid"
        >
          <a :href="attachment.permanent_url" target="_blank" rel="noopener">
            <img :src="attachment.view_url" />
          </a>
        </div>
      </div>
      <div class="stories">
        <Stories />
      </div>
      <div class="new-comment" v-if="taskEditorSectionIdAndTask.task.gid">
        <label for="new comment">new comment</label>
        <TextEditor
          :html="taskEditorSectionIdAndTask.htmlText"
          :forDescription="false"
          v-on:update="updateHtmlText($event, taskEditorSectionIdAndTask)"
        />
      </div>
      <div class="button-bar">
        <n-button strong secondary class="primary left" @click="hide()"
          >cancel</n-button
        >
        <n-button
          strong
          type="primary"
          class="primary right"
          @click="save(taskEditorSectionIdAndTask)"
        >
          save
        </n-button>
        <div class="middle-buttons">
          <n-button
            strong
            secondary
            type="error"
            class="secondary left"
            @click="deleteTask(taskEditorSectionIdAndTask)"
            v-if="taskEditorSectionIdAndTask.task.gid"
          >
            delete
          </n-button>
          <n-button
            strong
            secondary
            class="secondary right"
            @click="completeTask(taskEditorSectionIdAndTask)"
            v-if="taskEditorSectionIdAndTask.task.gid"
          >
            complete
          </n-button>
        </div>
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
import { Assignee, TaskAndSectionId, User } from "@/types/asana";
import TagSelector from "./TagSelector.vue";
import DateSelector from "./DateSelector.vue";
import { asanaDateFormat, formattedDate } from "../utils/date";
import { parse } from "date-fns";
import { useAsanaStore } from "@/store/asana";
import { usePrefStore } from "@/store/preferences";
import AssigneeSelector from "./AssigneeSelector.vue";
import { NButton, NList, NListItem, NIcon } from "naive-ui";
import { ExternalLinkAlt, CheckCircleRegular, CheckCircle } from "@vicons/fa";
import { isDisplayableCustomField } from "@/utils/custom-fields";
import CustomEnumFieldSelector from "./CustomEnumFieldSelector.vue";
import { isImageFormat } from "../utils/match";

export default defineComponent({
  components: {
    TextEditor,
    Stories,
    TagSelector,
    DateSelector,
    BasicInput,
    AssigneeSelector,
    NButton,
    NList,
    NListItem,
    NIcon,
    ExternalLinkAlt,
    CheckCircleRegular,
    CheckCircle,
    CustomEnumFieldSelector,
  },
  setup() {
    const asanaStore = useAsanaStore();
    const prefStore = usePrefStore();
    const taskName = ref<string>();
    const assigneeGid = ref<string>();
    const dueDate = ref<Date>();
    const htmlNotes = ref<string>();
    const customFieldSelectedGids = ref<(string | undefined)[]>([]);
    const projectId = computed(() => asanaStore.selectedProject);

    const taskEditorSectionIdAndTask = computed(() => {
      return prefStore.taskEditorSectionIdAndTask!;
    });

    // This component is re-used, so we don't call setup() again. So we watch the taskEditorSectionIdAndTask to identify when a new "task" is being edited(and thus re-initialize our input fields)
    watch([taskEditorSectionIdAndTask], () => {
      if (taskEditorSectionIdAndTask.value) {
        window.setTimeout(() => {
          document.getElementById("name")?.focus();
        }, 0);

        taskName.value = taskEditorSectionIdAndTask.value.task.name;
        assigneeGid.value = taskEditorSectionIdAndTask.value.task.assignee?.gid;
        htmlNotes.value = taskEditorSectionIdAndTask.value.task.html_notes;

        customFieldSelectedGids.value = [];
        taskEditorSectionIdAndTask.value.task.custom_fields?.forEach((el) =>
          customFieldSelectedGids.value.push(el.enum_value?.gid)
        );

        const dueDateString =
          prefStore.taskEditorSectionIdAndTask?.task?.due_on;
        // to handle when creating a new task with no date or a task initially has no due date
        if (dueDateString === null || dueDateString === undefined) {
          dueDate.value = undefined;
        } else {
          dueDate.value = parse(dueDateString, asanaDateFormat, new Date());
        }
      }
    });

    const save = (taskEditorSectionIdAndTask: TaskAndSectionId) => {
      const task = taskEditorSectionIdAndTask.task;
      task.name = taskName.value ?? "";

      const dateString = formattedDate(dueDate.value);
      task.due_on = dateString;

      if (!assigneeGid.value) {
        task.assignee = null;
      } else {
        const selectedUser = asanaStore.users.find(
          (user) => user.gid === assigneeGid.value
        );
        setAssigneeOnExistingTask(selectedUser!, taskEditorSectionIdAndTask);
      }

      task.html_notes = htmlNotes.value;
      task.custom_fields?.forEach((el, idx) => {
        const field = el;
        if (isDisplayableCustomField(field)) {
          const selectedVal =
            field.enum_options?.find(
              (o) => o.gid === customFieldSelectedGids.value[idx]
            ) ?? null;
          field.enum_value = selectedVal;
        }
      });

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

    const updateHtmlText = (
      html: string,
      taskEditorSectionIdAndTask: TaskAndSectionId
    ) => {
      taskEditorSectionIdAndTask.htmlText = html;
    };

    const completeTask = (taskEditorSectionIdAndTask: TaskAndSectionId) => {
      asanaStore.COMPLETE_TASK(taskEditorSectionIdAndTask);
      hide();
    };

    const makeAsanaHref = (taskId: string) =>
      `https://app.asana.com/0/${projectId.value}/${taskId}`;

    return {
      taskEditorSectionIdAndTask,
      projectId,
      dueDate,
      taskName,
      assigneeGid,
      htmlNotes,
      isDisplayableCustomField,
      customFieldSelectedGids,
      save,
      deleteTask,
      hide,
      updateHtmlText,
      completeTask,
      makeAsanaHref,
      isImageFormat,
    };
  },
});

function setAssigneeOnExistingTask(
  assignee: User,
  taskEditorSectionIdAndTask: TaskAndSectionId
) {
  const gid = assignee.gid;
  const photo = assignee.photo;

  if (taskEditorSectionIdAndTask?.task.assignee) {
    taskEditorSectionIdAndTask.task.assignee.gid = gid;
    taskEditorSectionIdAndTask.task.assignee.photo = photo;
  } else {
    taskEditorSectionIdAndTask.task.assignee = {
      gid: gid,
      photo: photo,
    } as unknown as Assignee;
  }
}
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
.description,
.subtasks,
.field {
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
  color: #4b9d5f;
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
  padding: 5px 15px 10px 15px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  max-height: 90%;
  min-height: 42%;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 11;
  overflow-x: hidden;
}

button.primary {
  margin-top: 1rem;
  width: 6rem;
  border: none;
  cursor: pointer;
}

button.secondary {
  margin-top: 1rem;
  width: 6rem;
  border: none;
  cursor: pointer;
}

button.right {
  float: right;
  margin-left: 7px;
}

button.left {
  float: left;
  margin-right: 7px;
}

.button-bar {
  height: 1.2rem;
  clear: both;
  margin-bottom: 2rem;
}

.middle-buttons {
  display: flex;
  justify-content: center;
}

.attachments {
  text-align: left;
  overflow-x: scroll;
  overflow-y: hidden;
  white-space: nowrap;
  width: 100%;
  height: 150px;
  padding: 15px 0;
}

.attachments .attachment {
  display: inline-block;
  width: 30%;
  margin-left: 5px;
  height: 100%;
}

.attachments .attachment img {
  width: 100%;
  height: 100%;
  display: inline-block;
  object-fit: cover;
}
</style>
