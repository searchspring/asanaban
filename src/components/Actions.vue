<template>
  <div>
    <div>actions {{ actions.length }}, errors: {{ errors.length }}</div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    self.setTimeout(() => {
      processActions();
    }, 1000);
  },
  data() {
    return {
      actions: store.state["asana"].actions,
      errors: store.state["asana"].errors,
    };
  },
});

function processActions() {
  store.dispatch("asana/processAction").finally(() => {
    self.setTimeout(() => {
      processActions();
    }, 1000);
  });
}
</script>
