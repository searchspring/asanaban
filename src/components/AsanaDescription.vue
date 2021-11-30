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
  <div id="editor" style="margin-bottom: 23px" :change="changed()"></div>
  <!-- <div style="display: none" id="content2"><p>a test</p><p><br></p><p><span data-asana-object="1" data-object-id="1140147938661566" data-preferred-path="/0/1140147938661566/list" contenteditable="false"> <a class="PrimaryNavigationLink BaseLink" href="https://app.asana.com/0/1140147938661566/list">@Will Warren</a></span><br></p><p><br></p><p><span data-asana-object="1" data-object-id="1200406381959866" data-preferred-path="/0/0/1200406381959866" contenteditable="false"> <a class="PrimaryNavigationLink BaseLink" href="https://app.asana.com/0/1147897393625274/1200406381959866">Document disaster guru card to show executives for sign off </a></span><br></p><p><br></p><ol class="ProsemirrorEditor-list"><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>aoeu</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>aoe</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>ua</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>oeu</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>a</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered"><p>aoeu</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered"><p>aoeu</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered"><p>ao</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered"><p>eu</p></li></ol><p><strong>aaoeu </strong><em>aoeu </em><u>aoeu</u> <del>aoeu</del></p><p><br></p><p>bad link: <a href="http://aoeu" class="ProsemirrorEditor-link">google</a></p><p>good link: <a href="https://google.com" class="ProsemirrorEditor-link">google</a></p><p><br></p><p><span contenteditable="false" class="ProseMirror-widget"> </span><span contenteditable="false" class="ProsemirrorEditor-emojiText">😄</span><img class="ProsemirrorEditor-emoji ProseMirror-widget" title=":smile:" alt="😄" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=" style="background-position: 54.23728813559322% 94.91525423728814%;" contenteditable="false"><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p></div> -->
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
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block", "list"),
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

    return {changed: () => {
      console.log("changed");
      
    }};
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
