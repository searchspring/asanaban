<template>
  <div>
    <select v-if="signedIn()" v-model="selectedProject" @change="onChange">
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
import store from "@/store";
import { defineComponent } from "vue";
import { createNamespacedHelpers } from "vuex";
const { mapState } = createNamespacedHelpers("asana");

export default defineComponent({
  computed: {
    ...mapState(["projects"]),
  },
  data() {
    return {
      selectedProject: store.state["asana"].selectedProject,
    };
  },
  methods: {
    onChange(event: Event) {
      const selectedProject = (event.target as HTMLSelectElement).value;
      store.dispatch("asana/setSelectedProject", selectedProject);
    },
    signedIn() {
      return store.state.signedIn;
    },
  },
});
</script>
