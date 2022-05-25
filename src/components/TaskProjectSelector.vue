<template>
  <n-select
    size="small"
    filterable
    placeholder="Select a project"
    :value="project"
    :options="makeProjectOptions(projects)"
    :on-update:value="
      async (val) => {
        $emit('update:project', val);
        await updateSections(val);
      }
    "
  />
  <n-select
    size="small"
    filterable
    placeholder="Select a section"
    v-if="!sectionsLoading && sections"
    :value="section"
    :options="makeSectionOptions(sections)"
    :on-update:value="(val) => $emit('update:section', val)"
  />
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana";
import { computed, defineComponent, defineEmits, ref } from "vue";
import { NSelect } from "naive-ui";
import { Project, Section, Task } from "@/types/asana";
import { asanaClient } from "@/store/auth";

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
    const sections = ref<Section[]>();
    const sectionsLoading = ref(false);

    const makeProjectOptions = (projects: Project[]) => {
      return projects.map((p) => {
        return {
          label: p.name,
          value: p.gid,
        };
      });
    };

    const makeSectionOptions = (sections: Section[]) => {
      return sections.map((p) => {
        return {
          label: p.name,
          value: p.gid,
        };
      });
    };

    const updateSections = async (val) => {
      sectionsLoading.value = true;
      sections.value = (await getSectionsByProject(
        val
      )) as unknown as Section[];
      sectionsLoading.value = false;
    };

    const getSectionsByProject = async (proj) =>
      await asanaClient?.sections.findByProject(proj);

    return {
      projects,
      sections,
      sectionsLoading,
      makeProjectOptions,
      makeSectionOptions,
      updateSections,
    };
  },
});
</script>

<style scoped>
n-select {
  min-width: 500px;
}
</style>
