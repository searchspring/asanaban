<template>
  <div v-if="loggedIn">
    <n-select size="small" filterable placeholder="Select a project" v-model:value="selectedProject" :options="makeProjectOptions(projects)" style="min-width: 500px;" />
  </div>
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana";
import { useAuthStore } from "@/store/auth";
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { NSelect } from "naive-ui";
import { Project } from "@/types/asana";

export default defineComponent({
  components: {
    NSelect
  },
  setup() {
    const asanaStore = useAsanaStore();
    const authStore = useAuthStore();

    const selectedProject = ref<string | null>(null);
    const loggedIn = computed(() => authStore.LOGGED_IN);
    const projects = computed(() => asanaStore.projects);

    onMounted(() => {
      selectedProject.value = asanaStore.selectedProject;
    });

    watch([selectedProject], () => {
      if (selectedProject.value) {
        asanaStore.LOAD_SELECTED_PROJECT(selectedProject.value);
      }
    });

    return {
      selectedProject,
      projects,
      loggedIn,
      makeProjectOptions,
    }
  }
});

function makeProjectOptions(projects: Project[]) {
  return projects.map(p => {
    return {
      label: p.name,
      value: p.gid
    };
  });
}
</script>
