<template>
  <div>
    <select v-model="assignee">
      <option value="null">No Assignee</option>
      <option
        v-for="user in users"
        :key="user.gid"
        :value="user.gid"
      >{{ user.name }}</option>
    </select>
  </div>
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana/index2";
import { usePrefStore } from "@/store/preferences/index2";
import { computed, defineComponent, onMounted, ref, watch } from "vue";

export default defineComponent({
  setup() {
    const asanaStore = useAsanaStore();
    const prefStore = usePrefStore();

    const assignee = ref<string | null>(null);
    const users = computed(() => asanaStore.users)

    onMounted(() => {
      assignee.value = prefStore.taskEditorSectionIdAndTask?.task.assignee?.gid ?? null;
    })

    watch([assignee], () => {
      prefStore.SET_TASK_ASSIGNEE(assignee.value);
    })

    return {
      users,
      assignee
    };
  },
});
</script>