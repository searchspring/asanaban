<template>
  <div>
    <!-- show search bar if signed in -->
    <div v-if="loggedIn">
      <input
        type="text"
        v-model="search"
        placeholder="Search for a task..."
      />
    </div>
  </div>
</template>

<script lang="ts">
import { useAuthStore } from "@/store/auth";
import { usePrefStore } from "@/store/preferences";
import { computed, defineComponent, ref, watch } from "vue";

export default defineComponent({
  setup() {
    const prefStore = usePrefStore();
    const authStore = useAuthStore();

    const search = ref("");
    const loggedIn = computed(() => authStore.LOGGED_IN);

    watch([search], () => {
      prefStore.SET_SEARCH(search.value);
    });

    return {
      search,
      loggedIn
    };
  },
});
</script>
