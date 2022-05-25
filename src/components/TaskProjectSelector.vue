<template>
  <div class="task-project-selector">
    <n-button
      @click="
        () => {
          $emit('update:project', undefined);
          $emit('update:section', undefined);
          isTaskProjectSelectorShown = true;
        }
      "
      v-if="!isTaskProjectSelectorShown"
      >Add task to a project</n-button
    >
    <n-select
      size="small"
      filterable
      placeholder="Select a project"
      :value="project"
      :options="makeProjectOptions(projects)"
      :on-update:value="
        async (val) => {
          $emit('update:project', val);
          $emit('update:section', undefined);
          await updateSections(val);
        }
      "
      v-if="isTaskProjectSelectorShown"
    />
    <n-select
      size="small"
      filterable
      placeholder="Select a section"
      :value="section"
      :options="makeSectionOptions(sections)"
      :on-update:value="(val) => $emit('update:section', val)"
      v-if="isTaskProjectSelectorShown && !sectionsLoading && sections"
    />
    <n-button
      strong
      type="primary"
      class="primary center"
      @click="addMembership()"
      v-if="isTaskProjectSelectorShown && project && section"
    >
      Add task to project
    </n-button>
  </div>
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana";
import { computed, defineComponent, defineEmits, ref } from "vue";
import { NSelect, NButton } from "naive-ui";
import { Project, Section, Task } from "@/types/asana";
import { asanaClient } from "@/store/auth";

export default defineComponent({
  components: {
    NSelect,
    NButton,
  },
  props: {
    task: {
      type: String,
      required: true,
    },
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
    const isTaskProjectSelectorShown = ref(false);

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

    const addMembership = async () => {
      if (props.project && props.section) {
        // asana interface has incorrect type defintion for this function
        await asanaClient?.tasks.addProject(props.task, {
          project: props.project,
          section: props.section as any,
        });
        isTaskProjectSelectorShown.value = false;
      }
    };

    return {
      projects,
      sections,
      sectionsLoading,
      isTaskProjectSelectorShown,
      makeProjectOptions,
      makeSectionOptions,
      updateSections,
      addMembership,
    };
  },
});
</script>

<style scoped>
.task-project-selector {
  display: flex;
  flex-direction: column;
  border: 1px dashed #e3e3e4;
  padding: 5px;
}

.task-project-selector .n-select {
  min-width: 500px;
  margin-bottom: 5px;
}

button.center {
  float: center
}
</style>
