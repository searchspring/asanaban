<template>
  <div class="menu-bar">
    <template v-for="(item, index) in items">
      <div
        class="divider"
        v-if="item.type === 'divider'"
        :key="`divider${index}`"
      />
      <menu-item v-else :key="index" v-bind="item" />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Editor } from "@tiptap/vue-3";
import {} from "@tiptap/starter-kit";
import {} from "@tiptap/extension-underline";
import MenuItem from "./MenuItem.vue";

export default defineComponent({
  components: {
    MenuItem,
  },

  props: {
    editor: {
      type: Object as PropType<Editor>,
      required: true,
    },
  },

  setup(props) {
    const bold = {
      icon: "bold",
      title: "Bold",
      action: () => {
        props.editor.chain().focus().toggleBold().run();
      },
      isActive: () => props.editor.isActive("bold"),
    };

    const italic = {
      icon: "italic",
      title: "Italic",
      action: () => props.editor.chain().focus().toggleItalic().run(),
      isActive: () => props.editor.isActive("italic"),
    };

    const underline = {
      icon: "underline",
      title: "Underline",
      action: () => props.editor.chain().focus().toggleUnderline().run(),
      isActive: () => props.editor.isActive("underline"),
    };

    const strikethrough = {
      icon: "strikethrough",
      title: "Strike",
      action: () => props.editor.chain().focus().toggleStrike().run(),
      isActive: () => props.editor.isActive("strike"),
    };

    const bulletList = {
      icon: "list-unordered",
      title: "Bullet List",
      action: () => props.editor.chain().focus().toggleBulletList().run(),
      isActive: () => props.editor.isActive("bulletList"),
    };

    const orderedList = {
      icon: "list-ordered",
      title: "Ordered List",
      action: () => props.editor.chain().focus().toggleOrderedList().run(),
      isActive: () => props.editor.isActive("orderedList"),
    };

    const items = [
      bold,
      italic,
      underline,
      strikethrough,
      bulletList,
      orderedList,
    ];

    return {
      items,
    };
  }
});
</script>

<style lang="scss">
.divider {
  width: 2px;
  height: 1.25rem;
  background-color: rgba(#000, 0.1);
  margin-left: 0.5rem;
  margin-right: 0.75rem;
}
.menu-bar {
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}
</style>
