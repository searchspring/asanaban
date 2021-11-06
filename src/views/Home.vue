<template>
  <div>
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
</template>

<script lang="ts">
import store from "@/store";
import { mapGetters } from "vuex";
import { defineComponent, onMounted } from "vue";
import Swimlane from "@/components/Swimlane.vue";
import Column from "@/components/Column.vue";

export default defineComponent({
  components: {
    Swimlane,
    Column,
  },
  setup() {
    onMounted(async () => {
      await store.dispatch("asana/checkSignedIn");
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
