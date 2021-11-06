<template>
  <div>
    <div>task: {{ task.name }}</div>
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
