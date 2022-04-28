<template>
  <button v-if="loggedIn" v-on:click="logout">Sign Out</button>
  <button v-else v-on:click="login">Sign In</button>
  <div v-if="loggingIn">Signing in...</div>
</template>

<script lang="ts">
import { useAuthStore } from "@/store/auth";
import { computed, defineComponent, ref } from "vue";

export default defineComponent({
  setup() {
    const authStore = useAuthStore();

    const loggedIn = computed(() => authStore.LOGGED_IN);
    const loggingIn = ref(false);

    const login = () => {
      loggingIn.value = true;
      authStore.LOGIN();
    }

    const logout = () => {
      authStore.LOGOUT()
    };

    return {
      loggedIn,
      loggingIn,
      login,
      logout
    };
  }
});
</script>
