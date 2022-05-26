<template>
  <div class="projects">
    <label for="projects">Projects</label>
    <div class="project-list">
      <div
        class="project"
        v-for="membership in taskMemberships"
        :key="membership.project.gid"
      >
        <span
          class="column even project-link"
          @click="openProject(membership.project.gid)"
          >{{ membership.project.name }}</span
        >
        <span class="column" v-if="membership.section">{{
          getSwimlane(membership.section.name)
        }}</span>
        <span class="column even" v-if="membership.section">{{
          getSection(membership.section.name)
        }}</span>
        <n-icon
          class="trash column"
          @click="removeMembership(taskId, membership.project.gid)"
        >
          <trash-can />
        </n-icon>
      </div>
    </div>
    <div class="task-project-selector">
      <n-button
        @click="
          () => {
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
        v-model:value="selectedProject"
        :options="makeProjectOptions(projects)"
        :on-update:value="
          async (val) => {
            selectedProject = val;
            await updateSections(val);
          }
        "
        v-if="isTaskProjectSelectorShown"
      />
      <n-select
        size="small"
        filterable
        placeholder="Select a section"
        v-model:value="selectedSection"
        :options="makeSectionOptions(sections)"
        v-if="isTaskProjectSelectorShown && !sectionsLoading && sections"
      />
      <n-button
        strong
        type="primary"
        class="primary center"
        @click="addMembership(taskId, selectedProject, selectedSection)"
        v-if="isTaskProjectSelectorShown && selectedProject && selectedSection"
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
import { Membership, Project, Section, MembershipEdit, Resource } from "@/types/asana";
import { asanaClient } from "@/store/auth";
import { TrashCan } from "@vicons/carbon";

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
      type: Object as PropType<MembershipEdit[]>,
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

    const getSwimlane = (s: string) => {
      const arraySplit = s.split(":");
      return arraySplit.length > 1 ? arraySplit[0] : "No Swimlane";
    };

    const getSection = (s: string) => {
      const arraySplit = s.split(":");
      return arraySplit[1] ? arraySplit[1].split("|")[0] : s;
    };

    const openProject = (gid: string) => {
      asanaStore.LOAD_SELECTED_PROJECT(gid);
    };

    // const removeMembership = (task_gid: string, project_gid: string) => {
    //   asanaStore.REMOVE_PROJECT_FROM_TASK(task_gid, project_gid);
    // };

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
        console.log(getSwimlane(p.name));
        console.log(getSection(p.name));
        return {
          label: getSwimlane(p.name) + ' | ' + getSection(p.name),
          value: p.gid,
        };
      });
    };

    const updateSections = async (val) => {
      console.log(selectedProject.value);
      selectedSection.value = undefined;
      sectionsLoading.value = true;
      sections.value = (await getSectionsByProject(
        val
      )) as unknown as Section[];
      sectionsLoading.value = false;
    };

    const getSectionsByProject = async (proj) =>
      await asanaClient?.sections.findByProject(proj);

    const addMembership = (taskId: string, projectId: string, sectionId: string) => {
      const project = projects.value.find(p => p.gid === projectId);
      const section = sections.value?.find(s => s.gid === sectionId);
      if (project && section) {
        taskMemberships.value.push({
          project: project as unknown as Resource,
          section: section
        }
        )
      }
      
      taskMembershipEdits.value.push({
        projectId: projectId,
        sectionId: sectionId,
        delete: false,
      });
      isTaskProjectSelectorShown.value = false;
      emit("update:membershipEdits", taskMembershipEdits.value);
    };

    const removeMembership = (taskId: string, projectId: string) => {
      taskMemberships.value = taskMemberships.value.filter(
        (m) => m.project.gid !== projectId
      );
      taskMembershipEdits.value.push({
        projectId: projectId,
        delete: true,
      });
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
      getSwimlane,
      getSection,
      openProject,
      removeMembership,
      makeProjectOptions,
      makeSectionOptions,
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

.project-link {
  cursor: pointer;
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
