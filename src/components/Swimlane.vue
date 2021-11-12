<template>
  <div class="swimlane">
    <div class="swimlane-content">
      <h2>{{ swimlane.name }}</h2>
      <slot></slot>
    </div>
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
}
/* column min width 100 but extend past screen size no wrap */
.swimlane-content {
  display: flex;
  flex-wrap: nowrap;
}
</style>
