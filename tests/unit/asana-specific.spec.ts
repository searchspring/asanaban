import { expect } from "chai";
import { xmlToHtml, htmlToXml } from "../../src/utils/asana-specific";

it("new lines", function (done) {
  expects(
    "<body>aoeu\naoeu\naoeu</body>",
    "<div><p>aoeu</p><p>aoeu</p><p>aoeu</p></div>",
    done
  );
});

it("ol", function (done) {
  expects(
    "<body><ol><li>aoeu</li><li>aoeu</li><li>aoeu</li></ol></body>",
    "<div><ol><li>aoeu</li><li>aoeu</li><li>aoeu</li></ol></div>",
    done
  );
});

it("ol and new lines", function (done) {
  expects(
    "<body><ol><li>aoeu</li><li>aoeu</li><li>aoeu</li></ol>aoeu\naoeu\naoeu</body>",
    "<div><ol><li>aoeu</li><li>aoeu</li><li>aoeu</li></ol><p>aoeu</p><p>aoeu</p><p>aoeu</p></div>",
    done
  );
});

it("single line and format", function (done) {
  expects(
    "<body><strong>aoeu</strong> <em>aoeu</em> <u>aoeu</u></body>",
    "<div><p><strong>aoeu</strong> <em>aoeu</em> <u>aoeu</u></p></div>",
    done
  );
});

it("block and inline href", function (done) {
  expects(
    '<body><ol><li><u>aoeu</u> <strong>aoeu</strong></li></ol>aoeu <a href="https://google.com">asdf</a>\naoeu</body>',
    '<div><ol><li><p><u>aoeu</u> <strong>aoeu</strong></p></li></ol><p>aoeu <a href="https://google.com" target="_blank">asdf</a></p><p>aoeu</p></div>',
    done
  );
});

it("new lines and format", function (done) {
  expects(
    "<body><ol><li><u>aoeu</u></li></ol><strong>aoeu</strong>\n<em>aoeu</em>\n<s>aoeu</s></body>",
    "<div><ol><li><u>aoeu</u></li></ol><p><strong>aoeu</strong></p><p><em>aoeu</em></p><p><s>aoeu</s></p></div>",
    done
  );
});

it("newlines with styles", function (done) {
  expects(
    "<body><strong>aoeu</strong>\n<em>aoeu</em>\n<u>aoeu</u></body>",
    "<div><p><strong>aoeu</strong></p><p><em>aoeu</em></p><p><u>aoeu</u></p></div>",
    done
  );
});

it("newlines with styles middle combo style", function (done) {
  expects(
    "<body><strong>aoeu</strong>\naoeu <em>aoeu</em>\n<u>aoeu</u></body>",
    "<div><p><strong>aoeu</strong></p><p>aoeu <em>aoeu</em></p><p><u>aoeu</u></p></div>",
    done
  );
});

function expects(input: string, output: string, done: any, debug = false) {
  if (debug) {
    xmlToHtml(input);
    console.info();
    xmlToHtml(
      "<body>" +
        output.replaceAll("<div>", "").replaceAll("</div>", "") +
        "</body>"
    );
  } else {
    expect(xmlToHtml(input)).to.equal(output);
    expect(htmlToXml(output)).to.equal(input);
  }
  done();
}
