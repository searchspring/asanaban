<template>
  <div id="nav">
    <div>
      <img src="./assets/logo.png" alt="logo" />
    </div>

    <search />
    <project-selector />
    <actions />
    <div style="margin-left: auto">
      <n-space>
        <background-selector />
        <sign-in />
      </n-space>
    </div>
  </div>
  <router-view />
</template>

<script lang="ts">
import { defineComponent, onMounted, watch } from "vue";
import router from "@/router";
import { parse } from "query-string";

import ProjectSelector from "@/components/ProjectSelector.vue";
import SignIn from "@/components/SignIn.vue";
import Actions from "@/components/Actions.vue";
import Search from "@/components/Search.vue";
import BackgroundSelector from "@/components/BackgroundSelector.vue";
import { NSpace } from "naive-ui";

import { useAuthStore } from "@/store/auth";
import { usePrefStore } from "@/store/preferences";

export default defineComponent({
  components: {
    SignIn,
    ProjectSelector,
    Actions,
    Search,
    BackgroundSelector,
    NSpace
  },
  setup() {
    const authStore = useAuthStore();
    const prefStore = usePrefStore();

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

    watch(()=>prefStore.backgroundImage, () => {
if (prefStore.backgroundImage) {
        document.body.style.backgroundImage = `url('${prefStore.backgroundImage}')`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
      } else {
        document.body.style.backgroundImage = "";
        document.body.style.backgroundSize = "";
        document.body.style.backgroundAttachment = "";
      }
    }, { immediate: true});
  }
});
</script>

<style lang="scss">
body {
  margin: 0;
  line-height: 1.2 !important;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 3.5vh;
}

#nav {
  text-align: left;
  background-color: #3b006d;
  display: flex;
  align-items: center;
  position: fixed;
  width: 100vw;
  height: 3.5vh;
  left: 0;
  top: 0;
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
