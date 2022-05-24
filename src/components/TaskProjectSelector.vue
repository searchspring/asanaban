<template>
  <n-select
    size="small"
    filterable
    placeholder="Select a project"
    v-model:value="selectedProject"
    :options="makeProjectOptions(projects)"
    style="min-width: 500px"
  />
  <n-select
    size="small"
    filterable
    placeholder="Select a section"
    v-model:value="selectedSection"
    v-if="sections"
    :options="makeSectionOptions(sections)"
    style="min-width: 500px"
  />
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana";
import { computed, defineComponent, onMounted, PropType } from "vue";
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
  setup(props) {
    const asanaStore = useAsanaStore();
    const selectedProject = computed(() => props.project);
    const selectedSection = computed(() => props.section);
    const projects = computed(() => asanaStore.projects);
    const sections = computed(() => {
      if (selectedProject.value) {
        return asanaStore.LOAD_SECTIONS(selectedProject.value);
      }
      return [];
    });

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

    return {
      selectedProject,
      selectedSection,
      sections,
      projects,
      makeProjectOptions,
      makeSectionOptions,
    };
  },
});
</script>
