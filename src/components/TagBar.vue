<template>
  <div>
    <div v-if="loggedIn" class="tag-container">
      <div
        v-for="tag in tags"
        class="tag"
        :key="tag"
        @click="click(tag)"
        :style="{
          'background-color': tag.hexes?.background,
          color: tag.hexes?.font,
        }"
      >
        {{ tag.name }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useAsanaStore } from "@/store/asana/index2";
import { useAuthStore } from "@/store/auth";
import { usePrefStore } from "@/store/preferences/index2";
import { TaskTag } from "@/types/asana";
import { computed, defineComponent } from "vue";

export default defineComponent({
  setup() {
    const prefStore = usePrefStore();
    const asanaStore = useAsanaStore();
    const authStore = useAuthStore();

    const tags = computed(() => asanaStore.tags);
    const loggedIn = computed(() => authStore.LOGGED_IN);

    const click = (tag: TaskTag) => {
      if (prefStore.search === tag.name) {
        prefStore.SET_SEARCH("");
      } else {
        prefStore.SET_SEARCH(tag.name);
      }
    };

    return {
      tags,
      loggedIn,
      click
    };
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
