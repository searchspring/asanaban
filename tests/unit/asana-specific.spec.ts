import { expect } from "chai";
// import { xmlToHtml } from "../../src/utils/asana-specific";

// it("XML to HTML", function (done) {
//   expect(xmlToHtml("")).to.equal("<div><p></p></div>");
//   done();
// });

// it("Complex 1", function (done) {
//   // iterate over testData
//   for (let i = 0; i < testData.length; i++) {
//     const test = testData[i];
//     const result = xmlToHtml(test.data);
//     expect(test.expected).to.equal(result);
//   }
//   expect(xmlToHtml(`<body>a test</body>`)).to.equal(`<div><p>a test</p></div>`);
//   done();
// });

// const testData = [
//   { data: `<body>a test</body>`, expected: `<div><p>a test</p></div>` },
//   {
//     data: `<body>a test

// <a href="https://app.asana.com/0/1140147938661566/list" data-asana-gid="1140147937013713" data-asana-accessible="true" data-asana-type="user" data-asana-dynamic="true">@Will Warren</a>

// <a href="https://app.asana.com/0/0/1200406381959866" data-asana-gid="1200406381959866" data-asana-accessible="true" data-asana-type="task" data-asana-dynamic="true">Document disaster guru card to show executives for sign off
// </a>

// </body>`,
//     expected:
//       `<div><p>a test</p>` +
//       `<p><br></p>` +
//       `<p><span><a href="https://app.asana.com/0/1140147938661566/list" data-asana-gid="1140147937013713" data-asana-accessible="true" data-asana-type="user" data-asana-dynamic="true">@Will Warren</a></span><br></p>` +
//       `<p><span><a href="https://app.asana.com/0/0/1200406381959866" data-asana-gid="1200406381959866" data-asana-accessible="true" data-asana-type="task" data-asana-dynamic="true">Document disaster guru card to show executives for sign off</a></span><br></p>` +
//       `</div>`,
//   },
// ];

const xml = `<body>a test

<a href="https://app.asana.com/0/1140147938661566/list" data-asana-gid="1140147937013713" data-asana-accessible="true" data-asana-type="user" data-asana-dynamic="true">@Will Warren</a>

<a href="https://app.asana.com/0/0/1200406381959866" data-asana-gid="1200406381959866" data-asana-accessible="true" data-asana-type="task" data-asana-dynamic="true">Document disaster guru card to show executives for sign off
</a>

<ul><li>aoeu</li><li>aoe</li><li>ua</li><li>oeu</li><li>a</li></ul><ol><li>aoeu</li><li>aoeu</li><li>ao</li><li>eu</li></ol><strong>aaoeu </strong><em>aoeu </em><u>aoeu</u> <s>aoeu</s>

bad link: <a href="http://aoeu">google</a>
good link: <a href="https://google.com">google</a>

😄





</body>`;
const html = `<p>a test</p><p><br></p><p><span data-asana-object="1" data-object-id="1140147938661566" data-preferred-path="/0/1140147938661566/list" contenteditable="false"> <a class="PrimaryNavigationLink BaseLink" href="https://app.asana.com/0/1140147938661566/list">@Will Warren</a></span><br></p><p><br></p><p><span data-asana-object="1" data-object-id="1200406381959866" data-preferred-path="/0/0/1200406381959866" contenteditable="false"> <a class="PrimaryNavigationLink BaseLink" href="https://app.asana.com/0/1147897393625274/1200406381959866">Document disaster guru card to show executives for sign off </a></span><br></p><p><br></p><ol class="ProsemirrorEditor-list"><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>aoeu</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>aoe</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>ua</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>oeu</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="bulleted"><p>a</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered"><p>aoeu</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered"><p>aoeu</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered"><p>ao</p></li><li class="ProsemirrorEditor-listItem" data-list-indent="1" data-list-type="numbered"><p>eu</p></li></ol><p><strong>aaoeu </strong><em>aoeu </em><u>aoeu</u> <del>aoeu</del></p><p><br></p><p>bad link: <a href="http://aoeu" class="ProsemirrorEditor-link">google</a></p><p>good link: <a href="https://google.com" class="ProsemirrorEditor-link">google</a></p><p><br></p><p><span contenteditable="false" class="ProseMirror-widget"> </span><span contenteditable="false" class="ProsemirrorEditor-emojiText">😄</span><img class="ProsemirrorEditor-emoji ProseMirror-widget" title=":smile:" alt="😄" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=" style="background-position: 54.23728813559322% 94.91525423728814%;" contenteditable="false"><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p>`;
it("convert", function (done) {
  expect(convert(xml)).to.equal(html);
  done();
});

function convert(xml: string): string {
  let newXml = xml.replaceAll("<body>", "").replaceAll("</body>", "");
  newXml = newXml + "";
  return newXml;
}
