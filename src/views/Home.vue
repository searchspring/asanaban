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
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { mapGetters } from "vuex";
import { defineComponent, onMounted } from "vue";
import Swimlane from "@/components/Swimlane.vue";
import Column from "@/components/Column.vue";
import TagBar from "@/components/TagBar.vue";

export default defineComponent({
  components: {
    Swimlane,
    Column,
    TagBar,
  },
  setup() {
    onMounted(async () => {
      store.dispatch("asana/loadProjects");
      store.dispatch("asana/loadTasks");
      store.dispatch("asana/loadSections");
    });
  },
  computed: {
    ...mapGetters({ swimlanes: "asana/swimlanes" }),
  },
  methods: {
    sections(swimlane: string) {
      return store.state["asana"].sections.filter((section) =>
        section.name.startsWith(swimlane)
      );
    },
  },
});
</script>

<style scoped>
.swimlane-container {
  margin-bottom: 2rem;
}
</style>
