<template>
  <div class="projects">
    <label for="projects">Projects</label>
    <div class="project-list">
      <div
        class="project"
        v-for="membership in taskMemberships"
        :key="membership.project.gid"
      >
        <span class="column even">{{ membership.project.name }}</span>
        <span class="column" v-if="membership.section">{{
          getPrettySwimlaneName(membership.section.name)
        }}</span>
        <span class="column even" v-if="membership.section">{{
          getPrettyColumnName(membership.section.name)
        }}</span>
        <n-icon
          class="trash column"
          @click="removeMembership(membership.project.gid)"
        >
          <trash-can />
        </n-icon>
      </div>
    </div>
    <div class="task-project-selector">
      <n-button
        @click="showTaskProjectSelector()"
        v-if="!isTaskProjectSelectorShown"
        >Add task to a project</n-button
      >
      <n-select
        size="small"
        filterable
        placeholder="Select a project"
        v-model:value="selectedProject"
        :options="makeProjectOptions(projects)"
        :on-update:value="async (val) => await updateSections(val)"
        v-if="isTaskProjectSelectorShown"
      />
      <n-select
        size="small"
        filterable
        placeholder="Select a section"
        v-model:value="selectedSection"
        :options="makeSectionOptions(sections)"
        :disabled="sectionsLoading || sections === undefined"
        v-if="isTaskProjectSelectorShown"
      />
      <n-button
        strong
        type="primary"
        class="primary center"
        @click="addMembership(selectedProject, selectedSection)"
        :disabled="!selectedProject || !selectedSection"
        v-if="isTaskProjectSelectorShown"
      >
        Add task to project
      </n-button>
    </div>
  </div>
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana";
import { computed, defineComponent, defineEmits, PropType, ref } from "vue";
import { NSelect, NButton, NIcon } from "naive-ui";
import { Membership,Project, Section, MembershipEdits, Resource } from "@/types/asana";
import { asanaClient } from "@/store/auth";
import { TrashCan } from "@vicons/carbon";
import { getPrettyColumnName, getPrettySwimlaneName } from "@/utils/asana-specific";

export default defineComponent({
  components: {
    NSelect,
    NButton,
    NIcon,
    TrashCan,
  },
  props: {
    taskId: {
      type: String,
      required: true,
    },
    memberships: {
      type: Object as PropType<Membership[]>,
      required: true,
    },
    membershipEdits: {
      type: Object as PropType<MembershipEdits>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const asanaStore = useAsanaStore();
    const projects = computed<Project[]>(() => asanaStore.projects);
    const sections = ref<Section[]>();
    const sectionsLoading = ref(false);
    const isTaskProjectSelectorShown = ref(false);
    const selectedProject = ref<string>();
    const selectedSection = ref<string>();
    const taskMemberships = ref(props.memberships);
    const taskMembershipEdits = ref(props.membershipEdits);

    const openProject = (gid: string) => {
      asanaStore.LOAD_SELECTED_PROJECT(gid);
    };

    const makeProjectOptions = (projects: Project[]) => {
      return projects.map((p) => {
        return {
          label: p.name,
          value: p.gid,
        };
      });
    };

    const makeSectionOptions = (sections: Section[]) => {
      if (sections === undefined) return [];
      return sections.map((p) => {
        return {
          label:
            getPrettySwimlaneName(p.name) + " | " + getPrettyColumnName(p.name),
          value: p.gid,
        };
      });
    };

    const updateSections = async (val) => {
      selectedProject.value = val;
      selectedSection.value = undefined;
      sectionsLoading.value = true;
      sections.value = (await getSectionsByProject(
        val
      )) as unknown as Section[];
      sectionsLoading.value = false;
    };

    const getSectionsByProject = async (proj) =>
      await asanaClient?.sections.findByProject(proj);

    const showTaskProjectSelector = () => {
      isTaskProjectSelectorShown.value = true;
    };
    const hideTaskProjectSelector = () => {
      isTaskProjectSelectorShown.value = false;
    };

    const upsertNewMembership = (
      memberships: Membership[],
      newMembership: Membership
    ) => {
      const sameProjectIdx = memberships.findIndex(
        (m) => m.project.gid === newMembership.project.gid
      );
      if (sameProjectIdx === -1) {
        memberships.push(newMembership);
      } else {
        memberships[sameProjectIdx] = newMembership;
      }
    };

    const addMembership = (projectId: string, sectionId: string) => {
      const project = projects.value.find((p) => p.gid === projectId);
      const section = sections.value?.find((s) => s.gid === sectionId);
      if (project && section) {
        upsertNewMembership(taskMemberships.value, {
          project: project as unknown as Resource,
          section: section,
        });
      }

      // create a unique edit ID based on the task and project
      taskMembershipEdits.value[props.taskId + projectId] = {
        taskId: props.taskId,
        projectId: projectId,
        sectionId: sectionId,
        isDelete: false,
        isDone: false,
      };

      hideTaskProjectSelector();
      selectedProject.value = undefined;
      selectedSection.value = undefined;

      emit("update:memberships", taskMemberships.value);
      emit("update:membershipEdits", taskMembershipEdits.value);
    };

    const removeMembership = (projectId: string) => {
      taskMemberships.value = taskMemberships.value.filter(
        (m) => m.project.gid !== projectId
      );
      // create a unique edit ID based on the task and project
      taskMembershipEdits.value[props.taskId + projectId] = {
        taskId: props.taskId,
        projectId: projectId,
        isDelete: true,
        isDone: false,
      };
      emit("update:memberships", taskMemberships.value);
      emit("update:membershipEdits", taskMembershipEdits.value);
    };

    return {
      projects,
      sections,
      sectionsLoading,
      isTaskProjectSelectorShown,
      taskMemberships,
      selectedProject,
      selectedSection,
      getPrettySwimlaneName,
      getPrettyColumnName,
      openProject,
      removeMembership,
      makeProjectOptions,
      makeSectionOptions,
      showTaskProjectSelector,
      hideTaskProjectSelector,
      updateSections,
      addMembership,
    };
  },
});
</script>

<style scoped>
label {
  display: block;
  font-size: 0.85rem;
  color: grey;
  font-weight: 400;
  margin-bottom: 0.35rem;
  margin-top: 0.7rem;
}
.projects {
  text-align: left;
}
.project {
  display: flex;
  font-size: 12px;
  border-radius: 7px;
  background: #f4f4f8;
  margin-bottom: 0.5em;
  overflow: hidden;
}

.column {
  display: flex;
  padding: 5px;
  text-align: center;
  flex-basis: 25%;
  align-items: center;
  justify-content: center;
}

.even {
  background-color: #e9e9ee;
}

.trash {
  flex-shrink: 3;
  font-size: 1.2em;
  vertical-align: middle;
  cursor: pointer;
  align-self: center;
}
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
  float: center;
}
</style>
