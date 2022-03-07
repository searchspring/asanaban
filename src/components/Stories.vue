<template>
  <div v-if="taskEditorSectionIdAndTask.task.gid">
    <div class="story">
      <span class="story-date">{{
        formatDate(taskEditorSectionIdAndTask.task.created_at)
      }}</span>
      <span class="username">{{
        taskEditorSectionIdAndTask.task.created_by.name
      }}</span>
      created this task.
    </div>
    <div
      v-for="(story, index) in taskEditorSectionIdAndTask.task.stories"
      class="story"
      v-bind:class="{ even: index % 2 === 0 }"
      :key="story.gid"
    >
      <span class="story-date">{{ formatDate(story.created_at) }}</span>
      <span class="username">{{ story.created_by.name }}</span
      >:
      <span class="text" v-html="formatStory(story.html_text)"></span>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import dayjs from "dayjs";
import { xmlToHtml } from "@/utils/asana-specific";
import { usePrefStore } from "@/store/preferences/index2";

export default defineComponent({
  setup() {
    const prefStore = usePrefStore();

    const taskEditorSectionIdAndTask = computed(() => prefStore.taskEditorSectionIdAndTask);

    const formatDate = (dateString: string) => {
      const date = dayjs(dateString);
      return date.format("YYYY-MM-DD HH:mm");
    };

    const formatStory = (text: string) => xmlToHtml(text);

    return {
      taskEditorSectionIdAndTask,
      formatDate,
      formatStory
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
  font-size: 0.6em;
  color: #444444;
  margin-bottom: 0.5em;
}
.story p {
  margin: 0;
}
.even {
  background-color: #efefef;
}
.username {
  font-weight: bold;
}
</style>
