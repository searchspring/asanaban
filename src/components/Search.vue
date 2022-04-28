<template>
  <div v-if="loggedIn">
    <n-input type="text" size="small" placeholder="Search for a task..." v-model:value="search" />
  </div>
</template>

<script lang="ts">
import { useAuthStore } from "@/store/auth";
import { usePrefStore } from "@/store/preferences";
import { computed, defineComponent, ref, watch } from "vue";
import { NInput } from "naive-ui";

export default defineComponent({
  components: {
    NInput
  },
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
