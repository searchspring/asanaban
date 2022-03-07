<template>
  <div>
    <div class="swimlane-container">
      <swimlane
        v-for="swimlane in swimlanes"
        :swimlane="swimlane"
        :key="swimlane.name"
      >
        <column
          v-for="section in sections(swimlane.name)"
          :section="section"
          :key="section.gid"
        />
      </swimlane>
    </div>
    <tag-bar />
    <task-editor />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import Swimlane from "@/components/Swimlane.vue";
import Column from "@/components/Column.vue";
import TagBar from "@/components/TagBar.vue";
import TaskEditor from "@/components/TaskEditor.vue";
import { useAsanaStore } from "@/store/asana/index2";

export default defineComponent({
  components: {
    Swimlane,
    Column,
    TagBar,
    TaskEditor,
  },
  setup() {
    const asanaStore = useAsanaStore();

    const swimlanes = computed(() => asanaStore.SWIMLANES);

    const sections = (swimlane: string) => {
      return asanaStore.sections.filter((section) =>
        section.name.startsWith(swimlane)
      );
    };

    onMounted(() => {
      asanaStore.LOAD_PROJECTS();
      asanaStore.LOAD_TASKS();
      asanaStore.LOAD_SECTIONS();
    });

    return {
      swimlanes,
      sections
    };
  }
});
</script>

<style scoped>
.swimlane-container {
  margin-bottom: 2rem;
}
</style>
