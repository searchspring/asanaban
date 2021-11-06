<template>
  <div class="task">
    <div>{{ task.name }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    task: Object,
  },
});
</script>

<style scoped>
.task {
  padding: 0.3rem;
  margin: 0.1rem;
  background-color: white;
  display: inline-block;
  max-width: 20rem;
  vertical-align: top;
  font-size: 10px;
  min-height: 2rem;
}
</style>
