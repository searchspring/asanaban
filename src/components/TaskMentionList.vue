<template>
  <div class="items">
    <template v-if="items.length">
      <button
        class="item"
        :class="{ 'is-selected': index === selectedIndex }"
        v-for="(item, index) in items"
        :key="index"
        :value="item.gid"
        @click="selectItem(index)"
        @keydown="onKeyDown({ event: $event })"
      >
        {{ (item.completed ? '☑' : '☐') + ' ' + item.name }}
        <span style="color: grey;">
          {{ item.projects[0]?.name }}
        </span>
      </button>
    </template>
    <div class="item" v-else>
      No result
    </div>
  </div>
</template>

<script lang="ts">
import { QueriedTask } from "@/types/asana";
import { defineComponent, PropType, ref, watch } from "vue";

export default defineComponent({
  props: {
    items: {
      type: Array as PropType<QueriedTask[]>,
      required: true,
    },
    command: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const selectedIndex = ref(0);

    const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    };

    const selectItem = (index: number) => {
      const item = props.items[index]
      if (item) {
        props.command({
          id: item.gid,
          label: item.name
        })
      }
    };

    const upHandler = () => {
      selectedIndex.value = ((selectedIndex.value + props.items.length) - 1) % props.items.length;
    };

    const downHandler = () => {
      selectedIndex.value = (selectedIndex.value + 1) % props.items.length;
    };

    const enterHandler = () => {
      selectItem(selectedIndex.value);
    };

    watch([props.items], () => {
      selectedIndex.value = 0;
    });

    return {
      selectedIndex,
      selectItem,
      onKeyDown,
    };
  }
})
</script>

<style scoped lang="scss">
.items {
  padding: 0.2rem;
  position: relative;
  border-radius: 0.5rem;
  background: #FFF;
  color: rgba(0, 0, 0, 0.8);
  overflow: hidden;
  font-size: 0.9rem;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0px 10px 20px rgba(0, 0, 0, 0.1),
  ;
}
.item {
  display: block;
  margin: 0;
  width: 100%;
  text-align: left;
  background: transparent;
  border-radius: 0.4rem;
  border: 1px solid transparent;
  padding: 0.2rem 0.4rem;
  &.is-selected {
    border-color: #000;
  }
}
</style>