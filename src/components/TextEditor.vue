<template>
  <div class="editor" v-if="editor">
    <menu-bar class="editor__header" :editor="editor" />
    <editor-content class="editor__content" :editor="editor" />
  </div>
</template>

<script lang="ts">
import { useEditor, EditorContent } from "@tiptap/vue-3";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Mention from "@tiptap/extension-mention"
import { xmlToHtml, htmlToXml } from "@/utils/asana-specific";
import MenuBar from "./MenuBar.vue";
import StarterKit from "@tiptap/starter-kit";
import { defineComponent } from "vue";
import { userSuggestion, taskSuggestion } from "../utils/suggestion";

Link.configure({
  openOnClick: false,
});
export default defineComponent({
  components: {
    EditorContent,
    MenuBar,
  },
  props: {
    html: String,
  },
  emits: ["update"],
  setup(props, { emit }) {
    const editor = useEditor({
      content: xmlToHtml(props.html ?? ""),
      extensions: [
        StarterKit.configure({}),
        TextAlign,
        Highlight,
        Underline,
        Link,
        Mention.extend({
          name: "user"
        }).configure({
          HTMLAttributes: {
            class: 'mention',
          },
          suggestion: userSuggestion
        }),
        Mention.extend({
          name: "task"
        }).configure({
          HTMLAttributes: {
            class: 'mention',
          },
          suggestion: taskSuggestion
        })
      ],
      onUpdate: ({ editor }) => {
        emit("update", htmlToXml(editor.getHTML()));
      },
    });

    return { editor };
  },
});
</script>

<style lang="scss">
.editor {
  font-size: 0.8rem;
  color: #0d0d0d;
  margin-bottom: 0.5rem;
  min-height: 7rem;
  &__header {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    flex-wrap: wrap;
    padding: 0.25rem;
    background: #dddddd;
  }
  &__content {
    border-left: 1px solid #dddddd;
    border-right: 1px solid #dddddd;
    border-bottom: 1px solid #dddddd;
    flex: 1 1 auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding: 0.3rem;
  }
}
.ProseMirror-focused {
  outline: none;
}
.ProseMirror p {
  margin-top: 0.8rem;
  height: 1.5rem;
  width: 100%;
}
ol li { 
  list-style: decimal;
  margin-left: 1.5rem;
}
ul li { 
  list-style: disc;
  margin-left: 1.5rem;
}
</style>
