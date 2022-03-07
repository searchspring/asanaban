<template>
  <div>
    <select v-if="loggedIn" v-model="selectedProject">
      <option disabled value="null">Select a project</option>
      <option
        v-for="project in projects"
        :value="project.gid"
        :key="project.gid"
      >
        {{ project.name }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana/index2";
import { useAuthStore } from "@/store/auth";
import { computed, defineComponent, onMounted, ref, watch } from "vue";

export default defineComponent({
  setup() {
    const asanaStore = useAsanaStore();
    const authStore = useAuthStore();

    const selectedProject = ref<string | null>();
    const loggedIn = computed(() => authStore.LOGGED_IN);
    const projects = computed(() => asanaStore.projects);

    onMounted(() => {
      selectedProject.value = asanaStore.selectedProject;
    })

    watch([selectedProject], () => {
      if (selectedProject.value) {
        asanaStore.LOAD_SELECTED_PROJECT(selectedProject.value);
      }
    })

    return {
      selectedProject,
      projects,
      loggedIn
    }
  }
});
</script>
