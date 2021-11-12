<template>
  <div id="nav">
    <search />
    <project-selector />
    <sign-in />
    <actions />
  </div>
  <router-view />
</template>

<script lang="ts">
import ProjectSelector from "@/components/ProjectSelector.vue";
import SignIn from "@/components/SignIn.vue";
import Actions from "@/components/Actions.vue";
import { defineComponent } from "vue";
import Search from "./components/Search.vue";

export default defineComponent({
  components: {
    SignIn,
    ProjectSelector,
    Actions,
    Search,
  },
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
}
#nav div {
  display: inline-block;
}
#nav > div {
  margin-right: 1rem;
}
</style>
