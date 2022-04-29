<template>
  <n-space vertical>
    <!-- Minor note: we don't put clearable because the Asana API doesn't properly allow removing values -->
    <n-select v-model:value="selectedEnumGid" filterable placeholder="" :render-tag="renderTag" :options="options" />
  </n-space>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { NSelect, NSpace } from 'naive-ui';
import { TagOption } from '@/types/vue';
import { TaskTag } from "@/types/asana";
import { staticTag } from '@/utils/renderTag';
import asana from 'asana';
import { convertAsanaColorToHex } from '@/utils/asana-specific';

export default defineComponent({
  components: { NSelect, NSpace },
  props: {
    field: {
      type: Object as PropType<asana.resources.CustomField>,
      required: true
    },
    selectedGid: String
  },
  setup(props, { emit }) {
    const selectedEnumGid = ref(props.selectedGid);

    const options = computed(() => {
      return makeFieldOptions(props.field.enum_options!);
    });

    watch([selectedEnumGid], () => {
      emit("update:selectedGid", selectedEnumGid.value);
    });

    return {
      selectedEnumGid,
      options,
      renderTag: staticTag,
    }
  }
});

// value prop of component only accepts an array of strings, so need array of tagIds
function makeTagId(tags: TaskTag[] | undefined): string[] {
  const tagIds = tags?.map((tag) => {
    return tag.gid;
  });
  return tagIds ?? [];
}

function makeFieldOptions(values: asana.resources.EnumValue[]): TagOption[] {
  const options = values.map((v) => {
    const h = convertAsanaColorToHex(v.color);
    return {
      label: v.name,
      value: v.gid,
      color: h.background,
      font: h.font
    } as TagOption
  });
  return options;
}
</script>