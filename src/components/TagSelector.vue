<template>
  <div style="max-width: 600px;">
    <va-select
      class="mb-4"
      label="tags"
      :options="options"
      :track-by="(option) => option.gid"
      v-model="value"
      multiple
      searchable
      @update:modelValue="setTag()"
    >
      <template #content="{ value }">
        <va-chip
          v-for="chip in value"
          :key="chip"
          size="small"
          class="mr-1 my-1"
          :color="chip.hexes?.background"
          closeable
          @update:modelValue="deleteChip(chip)"
        >
          {{ chip.name }}
        </va-chip>
      </template>
    </va-select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, PropType } from "vue";
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
    let value = ref<TagOption[]>();

    const options = computed(() => {
      const tags = store.getters['asana/getTags'];
      return makeTagOption(tags);
    });

    const deleteChip = (chip) => {
      value.value = value.value?.filter((v) => v !== chip)
      setTag();
    }

    const setTag = () => {
      const tags = value.value?.map((tag) => { 
        return { ...tag }
      });
      tags?.forEach((tag) => { delete tag.text })
      store.dispatch("preferences/setTempTags", tags as TaskTag[]);
    }

    onMounted(() => {
      value.value = makeTagOption(props.task.tags);
    })

    return {
      options,
      value,
      deleteChip,
      setTag,
    }
  },
});

function makeTagOption(tags: TaskTag[]): TagOption[] {
  const tagOptions = tags?.map(tag => {
    return {
      ...tag, 
      text: tag.name
    }
  });
  return tagOptions ?? [];
}
</script>