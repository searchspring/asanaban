<template>
  <div class="swimlane">
    <div>swimlane: {{ swimlane.name }}</div>
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
.swimlane {
  white-space: nowrap;
}
</style>
