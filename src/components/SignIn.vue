<template>
  <div>
    <button v-if="!signedIn" v-on:click="signIn">Sign In</button>
    <button v-if="signedIn" v-on:click="signOut">Sign Out</button>
    <div v-if="signingIn">Signing in...</div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return { signingIn: false };
  },
  computed: {
    signedIn() {
      return store.state.signedIn;
    },
  },
  methods: {
    signOut() {
      store.dispatch("asana/signOut");
    },
    signIn() {
      this.signingIn = true;
      store.dispatch("asana/signIn");
    },
  },
});
</script>
