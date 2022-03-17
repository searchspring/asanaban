<template>
  <div v-if="hasActions || hasErrors">
    <div class="action">
      {{ actions.length }}
      <span v-if="hasErrors">, errors: {{ errors.length }}</span>
      <span v-if="hasActions" class="current">{{ currentAction }}</span>
    </div>
    <div v-if="hasErrors">
      <a href="javascript:;" @click="toggleErrors">{{
        !showErrors ? "show errors" : "hide errors"
      }}</a>
    </div>
    <div v-if="showErrors" class="errors">
      <div class="error" v-for="error in errors" :key="error.message">
        {{ error.message }} - {{ error.description }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana";
import { computed, defineComponent, ref } from "vue";

export default defineComponent({
  setup() {
    const asanaStore = useAsanaStore();

    const showErrors = ref(false);
    const errors = computed(() => asanaStore.errors);
    const actions = computed(() => asanaStore.actions);
    const hasErrors = computed(() => asanaStore.errors.length > 0);
    const hasActions = computed(() => asanaStore.actions.length > 0);
    const currentAction = computed(() => asanaStore.actions[0].description);

    const toggleErrors = () => {
      showErrors.value = !showErrors.value;
      if (!showErrors.value) {
        asanaStore.CLEAR_ERRORS();
      }
    };

    return {
      showErrors,
      errors,
      actions,
      hasErrors,
      hasActions,
      currentAction,
      toggleErrors
    };
  }
});
</script>

<style scoped>
.action {
  background: #cccccc;
  padding: 0.2rem;
  padding-right: 1rem;
  padding-left: 1rem;
  font-size: 0.9rem;
}
.current {
  font-size: 0.5rem;
}
.error {
  color: red;
  display: block !important;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  margin-bottom: 1px;
  background-color: #ffdddd;
}
.errors {
  margin: 0;
}
</style>
