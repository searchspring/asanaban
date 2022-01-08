import { expect } from "chai";
import { xmlToHtml, htmlToXml } from "../../src/utils/asana-specific";

it("new lines", function (done) {
  const input = "<body>aoeu\naoeu\naoeu</body>";
  const output = "<div><p>aoeu</p><p>aoeu</p><p>aoeu</p></div>";
  expect(xmlToHtml(input)).to.equal(output);
  expect(htmlToXml(output)).to.equal(input);
  done();
});

it("ol", function (done) {
  const input = "<body><ol><li>aoeu</li><li>aoeu</li><li>aoeu</li></ol></body>";
  const output = "<div><ol><li>aoeu</li><li>aoeu</li><li>aoeu</li></ol></div>";
  expect(xmlToHtml(input)).to.equal(output);
  expect(htmlToXml(output)).to.equal(input);
  done();
});

it("ol and new lines", function (done) {
  const input =
    "<body><ol><li>aoeu</li><li>aoeu</li><li>aoeu</li></ol>aoeu\naoeu\naoeu</body>";
  const output =
    "<div><ol><li>aoeu</li><li>aoeu</li><li>aoeu</li></ol><p>aoeu</p><p>aoeu</p><p>aoeu</p></div>";
  expect(xmlToHtml(input)).to.equal(output);
  expect(htmlToXml(output)).to.equal(input);
  done();
});

it("new lines and format", function (done) {
  const input =
    "<body><ol><li><u>aoeu</u></li></ol><strong>aoeu</strong>\n<em>aoeu</em>\n<s>aoeu</s></body>";
  const output =
    "<div><ol><li><u>aoeu</u></li></ol><p><strong>aoeu</strong></p><p><em>aoeu</em></p><p><s>aoeu</s></p></div>";
  expect(xmlToHtml(input)).to.equal(output);
  expect(htmlToXml(output)).to.equal(input);
  done();
});

it("block and inline", function (done) {
  const input =
    '<body><ol><li><u>aoeu</u> <strong>aoeu</strong></li></ol>aoeu <a href="https://google.com">asdf</a>\naoeu</body>';
  const output =
    '<div><ol><li><p><u>aoeu</u><strong>aoeu</strong></p></li></ol><p>aoeu <a href="https://google.com">asdf</a></p><p>aoeu</p></div>';
  expect(xmlToHtml(input)).to.equal(output);
  expect(htmlToXml(output)).to.equal(input);
  done();
});

it("single line and format", function (done) {
  const input = "<body><strong>aoeu</strong> <em>aoeu</em> <u>aoeu</u></body>";
  const output = "<div><strong>aoeu</strong> <em>aoeu</em> <u>aoeu</u></div>";
  expect(xmlToHtml(input)).to.equal(output);
  expect(htmlToXml(output)).to.equal(input);
  done();
});
