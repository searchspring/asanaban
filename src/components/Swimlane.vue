<template>
  <div class="swimlane">
    <h2>{{ swimlane.name }}</h2>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    swimlane: Object,
  },
});
</script>

<style scoped>
h2 {
  font-size: 1rem;
  display: inline-block;
  writing-mode: vertical-rl;
  margin:0;
  background-color: #f0f0f0;
  padding-top:2em;
  padding-bottom:2em;
}
.swimlane {
  white-space: nowrap;
}
</style>
