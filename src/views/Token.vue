<template><div></div></template>

<script lang="ts">
import router from "@/router";
import store from "@/store";
import { parse } from "query-string";
import { defineComponent } from "vue";

if (parse(location.search).payload) {
  let payload = JSON.parse(parse(location.search).payload);
  store.dispatch("asana/tokenReceived", payload);
  router.push({ name: "Home" });
}
export default defineComponent({
  name: "Token",
});
</script>
