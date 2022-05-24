<template>
  <div v-if="taskEditorSectionIdAndTask?.task.gid">
    <div class="story">
      <span class="story-date">{{
          formatDate(taskEditorSectionIdAndTask.task.created_at)
      }}</span>
      <span class="username">{{
          taskEditorSectionIdAndTask.task.created_by.name
      }}</span>
      created this task.
    </div>
    <n-spin v-if="storiesLoading" />
    <div v-for="(story, index) in taskEditorSectionIdAndTask.task.stories" class="story"
      v-bind:class="{ even: index % 2 === 0 }" :key="story.gid">
      <span class="story-date">{{ formatDate(story.created_at) }}</span>
      <span class="username">{{ story.created_by.name }}: </span>
      <span class="text" v-html="formatStory(story.html_text)"></span>
      <n-icon v-if="usergid && usergid === story.created_by.gid" class="trash" @click="deleteStory(story.gid)">
        <trash-can />
      </n-icon>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import dayjs from "dayjs";
import { xmlToHtml } from "@/utils/asana-specific";
import { usePrefStore } from "@/store/preferences";
import { useAsanaStore } from "@/store/asana";
import { NSpin, NIcon } from "naive-ui";
import { TrashCan } from "@vicons/carbon";
import { useAuthStore } from "@/store/auth/index";

export default defineComponent({
  components: {
    NSpin,
    NIcon,
    TrashCan
  },
  setup() {
    const prefStore = usePrefStore();
    const asanaStore = useAsanaStore();
    const usergid = computed(() => useAuthStore().user?.gid)

    const taskEditorSectionIdAndTask = computed(() => prefStore.taskEditorSectionIdAndTask);
    const storiesLoading = computed(() => asanaStore.storiesLoading);
    const formatDate = (dateString: string) => {
      const date = dayjs(dateString);
      return date.format("YYYY-MM-DD HH:mm");
    };

    const formatStory = (text: string) => xmlToHtml(text);

    const deleteStory = (gid: string) => {
      asanaStore.DELETE_STORY(gid);
    };

    return {
      taskEditorSectionIdAndTask,
      storiesLoading,
      formatDate,
      formatStory,
      deleteStory,
      usergid
    };
  },
});
</script>

<style lang="scss">
.story-date {
  color: #999;
  float: right;
}

.story {
  text-align: left;
  font-size: 0.75rem;
  color: #444444;
  margin-bottom: 0.5em;
  padding: 0.5em;
  border-radius: 7px;
  background-color: #f4f4f8;
}

.story p {
  margin: 0;
}

.even {
  background-color: #e9e9ee;
}

.username {
  font-weight: bold;
}

.text {
  margin-top: 1px;
  margin-left: 2px;
}

.trash {
  display: flex;
  margin-right: 0;
  margin-left: auto;
  font-size: 15px;
}

</style>
