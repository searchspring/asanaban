<template>
  <div id="nav">
    <router-link to="/">asanaban</router-link>
    <project-selector />
    <sign-in />
  </div>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import SignIn from "@/components/SignIn.vue";
import ProjectSelector from "@/components/ProjectSelector.vue";

export default defineComponent({
  components: {
    SignIn,
    ProjectSelector,
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
#nav div {
  display: inline-block;
  margin-left: 2rem;
}
</style>
