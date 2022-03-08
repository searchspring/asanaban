<template>
  <div class="swimlane">
    <div class="content" :class="{ collapsed: collapsed(swimlane?.name) }">
      <h2 v-on:click="toggle(swimlane?.name)">{{ swimlane?.name }}</h2>
      <div class="columns">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Swimlane } from "@/types/layout";
import { defineComponent, PropType } from "vue";
import { usePrefStore } from "@/store/preferences";

export default defineComponent({
  props: {
    swimlane: Object as PropType<Swimlane>,
  },
  setup() {
    const prefStore = usePrefStore();

    const toggle = (swimlaneName: string) => {
      prefStore.TOGGLE_SWIMLANE(swimlaneName);
    };

    const collapsed = (swimlaneName: string) => {
      if (!prefStore.swimlaneStates[swimlaneName]) {
        return false;
      }
      return prefStore.swimlaneStates[swimlaneName].collapsed;
    };

    return {
      collapsed,
      toggle,
    };
  },
});
</script>

<style scoped>
.swimlane {
  margin-bottom: 1px;
}
h2 {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-size: 1rem;
  writing-mode: vertical-rl;
  background-color: #f0f0f0;
  text-align: center;
  margin: 0;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  min-height: 10rem;
  cursor: pointer;
}
/* column min width 100 but extend past screen size no wrap */
.content,
.columns {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
}
.collapsed h2 {
  writing-mode: horizontal-tb;
  min-height: 1rem;
  min-width: 10rem;
  padding: 0;
}
.collapsed .columns {
  display: none;
}
</style>
