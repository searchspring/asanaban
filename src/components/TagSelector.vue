<template>
  <div>
    <va-select
      label="tags"
      :options="options"
      :track-by="(option) => option.gid"
      v-model="value"
      multiple
      searchable
    >
      <template #content="{ value }">
        <va-chip
          v-for="tag in value"
          :key="tag"
          size="small"
          :color="tag.hexes?.background"
          closeable
          @update:modelValue="deleteTag(tag)"
        >
          {{ tag.name }}
        </va-chip>
      </template>
    </va-select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, PropType, watch } from "vue";
import store from "@/store";
import { Task, TaskTag } from "@/types/asana";
import { TagOption } from "@/types/vue";

export default defineComponent ({
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true
    }
  },
  setup(props) {
    const value = ref<TagOption[]>([]);

    const options = computed(() => {
      const tags = store.getters['asana/getTags'];
      return makeTagOption(tags);
    });

    const deleteTag = (tag) => {
      value.value = value.value.filter((v) => v !== tag)
    }

    onMounted(() => {
      value.value = makeTagOption(props.task.tags);
    })

    watch([value], () => {
      const tagIds = value.value.map((tag) => tag.gid);
      store.dispatch("preferences/setNewTags", tagIds);
    })

    return {
      options,
      value,
      deleteTag,
    }
  },
});

function makeTagOption(tags: TaskTag[]): TagOption[] {
  const tagOptions = tags?.map((tag) => {
    return {
      ...tag, 
      text: tag.name
    }
  });
  return tagOptions ?? [];
}
</script>