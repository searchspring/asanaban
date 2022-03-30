<template>
  <n-space vertical>
    <n-select 
      v-model:value="tagIds" 
      multiple
      filterable
      placeholder=""
      :render-tag="renderTag"
      :options="options"
    />
  </n-space>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, PropType, h } from 'vue'
import { NSelect, NSpace, NTag, SelectRenderTag } from 'naive-ui';
import { TagOption } from '@/types/vue';
import { Task, TaskTag } from "@/types/asana";
import { useAsanaStore } from "@/store/asana";
import { usePrefStore } from "@/store/preferences";
import { Color } from 'csstype';

export default defineComponent({
  components: { NSelect, NSpace },
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true
    }
  },
  setup (props) {
    const asanaStore = useAsanaStore();
    const prefStore = usePrefStore();
    const tagIds = ref<string[]>([]);

    const options = computed(() => {
      const tags = asanaStore.allTags;
      return makeTagOption(tags);
    });

    onMounted(() => {
      tagIds.value = makeTagId(props.task.tags);
    });

    watch([tagIds], () => {
      prefStore.SET_NEW_TAGS(tagIds.value);
    });

    const renderTag: SelectRenderTag = ({ option, handleClose }) => {
      return h(
        NTag,
        {
          closable: true,
          round: true,
          themeOverrides: { 
            color: option.color as Color, 
            border: option.color as Color,
            textColor: option.font as Color, 
            closeColor: option.font as Color,
          },
          onClose: (e: MouseEvent) => {
            e.stopPropagation()
            handleClose()
          }
        },
        { default: () => option.label }
      );
    }

    return {
      tagIds,
      options,
      renderTag,
    }
  }
});

// value prop of component only accepts an array of strings, so need array of tagIds
function makeTagId(tags: TaskTag[]): string[] { 
  const tagIds = tags?.map((tag) => {
    return tag.gid
  });
  return tagIds ?? [];
}

function makeTagOption(tags: TaskTag[]): TagOption[] {
  const tagOptions = tags?.map((tag) => {
    return {
      label: tag.name,
      value: tag.gid, 
      color: tag.hexes?.background,
      font: tag.hexes?.font
    } as TagOption
  });
  return tagOptions ?? [];
}
</script>