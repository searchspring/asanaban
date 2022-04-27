<template>
  <n-space vertical>
    <n-select v-model:value="assignee" filterable clearable placeholder="Unassigned" :options="options" />
  </n-space>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { NSelect, NSpace } from 'naive-ui';
import { User } from "@/types/asana";
import { useAsanaStore } from "@/store/asana";
import { UserOption } from '@/types/vue';

export default defineComponent({
  components: { NSelect, NSpace },
  props: {
    assigneeGid: {
      type: String
    }
  },
  setup(props, { emit }) {
    const asanaStore = useAsanaStore();
    const assignee = ref(props.assigneeGid ?? null);

    const options = computed(() => {
      const userOptions = makeUserOption(asanaStore.users);
      return userOptions;
    });

    watch([assignee], () => {
      emit("update:assigneeGid", assignee.value);
    });


    return {
      assignee,
      options,
    }
  }
});

function makeUserOption(users: User[]): UserOption[] {
  const userOptions = users.map((user) => {
    return {
      label: user.name,
      value: user.gid,
    }
  });
  return userOptions ?? [];
}
</script>