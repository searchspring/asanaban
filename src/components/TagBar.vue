<template>
  <div>
    <div v-if="signedIn" class="tag-container">
      <div
        v-for="tag in tags"
        class="tag"
        :key="tag"
        @click="click(tag)"
        :style="{
          'background-color': tag.hexes.background,
          color: tag.hexes.font,
        }"
      >
        {{ tag.name }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { defineComponent } from "vue";
import { createNamespacedHelpers } from "vuex";
const { mapState } = createNamespacedHelpers("asana");

export default defineComponent({
  computed: {
    ...mapState(["tags"]),
  },
  methods: {
    signedIn() {
      return store.state.signedIn;
    },
    click(tag: any) {
      // unset search if alread set with this tag
      if (store.state["preferences"].search === tag.name) {
        store.dispatch("preferences/setSearch", "");
      } else {
        store.dispatch("preferences/setSearch", tag.name);
      }
    },
  },
});
</script>

<style scoped>
.tag-container {
  display: flex;
  flex-wrap: nowrap;
  bottom: 0;
  position: fixed;
  width: 100%;
  gap: 1px;
}
.tag {
  flex-basis: 100%;
  text-align: center;
  padding: 0.2rem;
  cursor: pointer;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
