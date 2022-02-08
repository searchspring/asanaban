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
import store from "@/store";
import { defineComponent, onMounted, ref, watch } from "vue";
import { createNamespacedHelpers } from "vuex";
const { mapState } = createNamespacedHelpers("asana");

export default defineComponent({
  computed: {
    ...mapState(["users"]),
  },
  setup() {
    const assignee = ref<string | null>();

    onMounted(() => {
      assignee.value = store.state["preferences"].taskEditorSectionIdAndTask.task.assignee?.gid ?? null;
    })

    watch([assignee], () => {
      store.dispatch("preferences/setTaskAssignee", assignee.value);
    })

    return {
      assignee
    };
  },
});
</script>