<template>
  <div id="nav">
    <div>
      <img src="./assets/logo.png" alt="logo" />
    </div>

    <search />
    <project-selector />
    <actions />
    <div style="margin-left: auto">
      <sign-in />
    </div>
  </div>
  <router-view />
</template>

<script lang="ts">
import router from "@/router";
import { parse } from "query-string";
import ProjectSelector from "@/components/ProjectSelector.vue";
import SignIn from "@/components/SignIn.vue";
import Actions from "@/components/Actions.vue";
import { defineComponent, onMounted } from "vue";
import Search from "./components/Search.vue";
import { useAuthStore } from "./store/auth";

export default defineComponent({
  components: {
    SignIn,
    ProjectSelector,
    Actions,
    Search,
  },
  setup() {
    const authStore = useAuthStore();

    const tryLoginFromSession = () => authStore.LOGIN_FROM_SESSION();

    onMounted(tryLoginFromSession);
    onMounted(() => {
      if (parse(location.search).payload) {
        let payload = JSON.parse(parse(location.search).payload);
        authStore.TOKEN_RECEIVED(payload);
      }
      if (authStore.LOGGED_IN) {
        router.push({ name: "Home" });
      }
    });
  }
});
</script>

<style lang="scss">
body {
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  text-align: left;
  background-color: #3b006d;
  display: flex;
  align-items: center;
}

#nav div,
#nav img {
  vertical-align: middle;
  display: inline-block;
}

#nav>div {
  margin-right: 1rem;
}
</style>
