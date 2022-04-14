<template>
  <n-space vertical>
    <n-select 
      v-model:value="assignee" 
      filterable
      clearable
      placeholder="Unassigned"
      :options="options"
    />
  </n-space>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, PropType } from 'vue';
import { NSelect, NSpace } from 'naive-ui';
import { Task, User } from "@/types/asana";
import { useAsanaStore } from "@/store/asana";
import { usePrefStore } from "@/store/preferences";
import { UserOption } from '@/types/vue';

export default defineComponent({
  components: { NSelect, NSpace },
  props: {
    task: {
      type: Object as PropType<Task>,
      required: true,
    }
  },
  setup (props) {
    const asanaStore = useAsanaStore();
    const prefStore = usePrefStore();
    const assignee = ref<string | null>(null);

    const options = computed(() => {
      const users = asanaStore.users;
      const userOptions = makeUserOption(users);
      return userOptions;
    });

    onMounted(() => {
      assignee.value = (!props.task.assignee?.gid || props.task.assignee?.gid === "null") ? null : props.task.assignee!.gid;
    });

    watch([assignee], () => {
      if (!assignee.value) {
        prefStore.SET_TASK_ASSIGNEE(null);
        return;
      } 
      const selectedUser = asanaStore.users.find((user) => user.gid === assignee.value) as User;
      prefStore.SET_TASK_ASSIGNEE(selectedUser);
    });

    return {
      assignee,
      options,
    }
  }
});

function makeUserOption(users: User[]): UserOption[] {
  const userOptions = users?.map((user) => {
    return {
      label: user.name,
      value: user.gid, 
    }
  });
  return userOptions ?? [];
}
</script>