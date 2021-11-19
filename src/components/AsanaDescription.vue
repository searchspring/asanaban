<template>
  <!-- <quill-editor
    v-model:value="state.content"
    :options="state.editorOption"
    :disabled="state.disabled"
    @blur="onEditorBlur($event)"
    @focus="onEditorFocus($event)"
    @ready="onEditorReady($event)"
    @change="onEditorChange($event)"
  /> -->
  <div id="editor" style="margin-bottom: 23px"></div>
  <div style="display: none" id="content2"></div>
</template>

<script lang="ts">
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import { xmlToHtml } from "../utils/asana-specific";
export default {
  props: {
    xml: String,
  },
  setup(props: any) {
    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks,
    });
    const state = EditorState.create({
      doc: DOMParser.fromSchema(mySchema).parse(
        createElementFromHTML(xmlToHtml(props.xml))
      ),
      plugins: exampleSetup({ schema: mySchema }),
    });
    setTimeout(() => {
      new EditorView(document.querySelector("#editor"), { state });
    }, 0);

    return {};
  },
};

function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}
</script>

<style>
@import "https://prosemirror.net/css/editor.css";
.ProseMirror p, .ProseMirror ul, .ProseMirror ol, .ProseMirror li{
  margin:0;
  inset-block-end: 0;
  inset-block-start: 0;
  padding-top: 0; 
}
#editor {
  font-size: 0.7rem;
}
</style>
