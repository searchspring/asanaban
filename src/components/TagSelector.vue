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
    >
      <template #content="{ value }">
        <va-chip
          v-for="chip in value"
          :key="chip"
          size="small"
          class="mr-1 my-1"
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
import { defineComponent, ref, computed } from "vue";
import store from "@/store";

export default defineComponent ({
  setup() {
    let value = ref<string[]>();

    // const options =  [
    //     { gid: '0', text: 'one', name: 'one' },
    //     { gid: '1', text: 'two', name: 'two' },
    //     { gid: '2', text: 'three', name: 'three' },
    //     { gid: '3', text: 'four', name: 'four' },
    //     { gid: '4', text: 'five', name: 'five' },
    //   ];
    
    const options = [
      { gid: '1201827305125769', color: 'light-teal', name: 'tag1', hexes: {background: '#64e4e4', font: '#000000'} },
      { gid: '1201831364375631', color: 'light-purple', name: 'tag2', hexes: {background: '#64e4e4', font: '#000000'} }
    ];

    // const options = computed(() => {
    //   return store.getters['asana/getTags'];
    // });

    const deleteChip = (chip) => {
      value.value = value.value?.filter((v) => v !== chip)
    }

    return {
      options,
      value,
      deleteChip,
    }
  },
});
</script>