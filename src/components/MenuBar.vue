<template>
  <div>
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

<script>
import MenuItem from "./MenuItem.vue";

export default {
  components: {
    MenuItem,
  },

  props: {
    editor: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      items: [
        {
          icon: "bold",
          title: "Bold",
          action: () => {
            this.editor.chain().focus().toggleBold().run();
          },
          isActive: () => this.editor.isActive("bold"),
        },
        {
          icon: "italic",
          title: "Italic",
          action: () => this.editor.chain().focus().toggleItalic().run(),
          isActive: () => this.editor.isActive("italic"),
        },
        {
          icon: "underline",
          title: "Underline",
          action: () => this.editor.chain().focus().toggleUnderline().run(),
          isActive: () => this.editor.isActive("underline"),
        },
        {
          icon: "strikethrough",
          title: "Strike",
          action: () => this.editor.chain().focus().toggleStrike().run(),
          isActive: () => this.editor.isActive("strike"),
        },
        {
          icon: "list-unordered",
          title: "Bullet List",
          action: () => this.editor.chain().focus().toggleBulletList().run(),
          isActive: () => this.editor.isActive("bulletList"),
        },
        {
          icon: "list-ordered",
          title: "Ordered List",
          action: () => this.editor.chain().focus().toggleOrderedList().run(),
          isActive: () => this.editor.isActive("orderedList"),
        },
      ],
    };
  },
};
</script>

<style lang="scss">
.divider {
  width: 2px;
  height: 1.25rem;
  background-color: rgba(#000, 0.1);
  margin-left: 0.5rem;
  margin-right: 0.75rem;
}
</style>
