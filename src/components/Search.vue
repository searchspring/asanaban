<template>
  <div>
    <!-- show search bar if signed in -->
    <div v-if="signedIn">
      <input
        type="text"
        v-model="search"
        placeholder="Search for a task..."
        @keyup="onChange()"
      />
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      search: "",
    };
  },
  methods: {
    onChange() {
      store.dispatch("preferences/setSearch", this.search);
    },
    signedIn() {
      return store.state.signedIn;
    },
  },
});
</script>
