<template>
  <n-select
    size="small"
    filterable
    placeholder="Select a project"
    :value="project"
    :options="makeProjectOptions(projects)"
    :on-update:value="(val) => {$emit('update:project', val)}"
  />
  <n-select
    size="small"
    filterable
    placeholder="Select a section"
    :value="section"
    :on-update:value="updateSection"
  />
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana";
import { computed, defineComponent, defineEmits } from "vue";
import { NSelect } from "naive-ui";
import { Project, Section, Task } from "@/types/asana";

export default defineComponent({
  components: {
    NSelect,
  },
  props: {
    project: {
      type: String,
      required: false,
    },
    section: {
      type: String,
      required: false,
    },
  },
  emits: ["update:project", "update:section"],
  setup(props) {
    const asanaStore = useAsanaStore();
    const projects = computed(() => asanaStore.projects);
    const emit = defineEmits(["update:project", "update:section"]);

    const makeProjectOptions = (projects: Project[]) => {
      return projects.map((p) => {
        return {
          label: p.name,
          value: p.gid,
        };
      });
    };

    const makeSectionOptions = (sections: Project[]) => {
      return sections.map((p) => {
        return {
          label: p.name,
          value: p.gid,
        };
      });
    };

    const updateProject = (val) => {
      emit("update:project", val);
    };

    const updateSection = (val) => {
      emit("update:section", val);
    };

    return {
      projects,
      makeProjectOptions,
      makeSectionOptions,
      updateProject,
      updateSection,
    };
  },
});
</script>

<style scoped>
n-select {
  min-width: 500px;
}
</style>
