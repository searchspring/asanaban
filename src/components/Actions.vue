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
        {{ error.message }} - {{ error.value.errors[0].message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      showErrors: false,
      errors: store.state["asana"].errors,
      actions: store.state["asana"].actions,
    };
  },
  methods: {
    toggleErrors() {
      this.showErrors = !this.showErrors;
      if (!this.showErrors) {
        store.dispatch("asana/clearErrors");
        this.errors = store.state["asana"].errors;
      }
    },
  },
  computed: {
    hasErrors() {
      return store.state["asana"].errors.length > 0;
    },
    hasActions() {
      return store.state["asana"].actions.length > 0;
    },
    currentAction() {
      return store.state["asana"].actions[0].description;
    },
  },
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
