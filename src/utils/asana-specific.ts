import colorConvert from "color-convert";
import { LightenDarkenColor } from "lighten-darken-color";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

function getPrettyColumnName(columnName: string): string {
  const parts = columnName.split(/[:|]/);
  if (parts && parts.length > 0) {
    return parts[1];
  }
  return columnName;
}

function getColumnCount(columnName: string): string {
  const parts = columnName.split(/[:|]/);
  if (parts && parts.length === 3) {
    return parts[2];
  }
  return "-1";
}

function convertColorToHexes(color: string): any {
  if (!color) {
    return {
      background: "#FFFFFF",
      font: "#000000",
    };
  }
  const parts = color.split("-");
  const brightness = parts[0];
  const hue = parts[parts.length - 1];
  const hex = colorConvert.keyword.hex(hue);
  let adjustedHex = "";
  let font = "#000000";
  if (brightness === "dark") {
    adjustedHex = LightenDarkenColor(hex, -50);
    font = "#ffffff";
  } else {
    adjustedHex = LightenDarkenColor(hex, 100);
  }
  if (adjustedHex.length === 4) {
    adjustedHex = "00" + adjustedHex;
  }
  return { background: "#" + adjustedHex, font: font };
}

function xmlToHtml(xml: string): string {
  console.log("xmlToHtml", xml);
  const parser = new XMLParser({
    // ignoreAttributes: false,
    trimValues: false,
    preserveOrder: true,
  });
  const builder = new XMLBuilder({
    // ignoreAttributes: false,
    preserveOrder: true,
  });

  const obj = parser.parse(xml);
  // console.log("obj", obj[0].body);

  for (let i = 0; i < obj[0].body.length; i++) {
    console.log(obj[0].body[i]);
  }
  let html = "";
  for (let i = 0; i < obj[0].body.length; i++) {
    for (const key of Object.keys(obj[0].body[i])) {
      const value = obj[0].body[i][key];

      if (key === "#text") {
        if (value.indexOf("\n") !== -1) {
          const lines = value.split("\n");
          for (let i = 0; i < lines.length; i++) {
            html += "<p>" + lines[i] + "</p>";
          }
        } else {
          html += value;
        }
      } else {
        let wrap = false;
        if (
          (key === "strong" || key == "em" || key == "s" || key == "u") &&
          value.indexOf("\n") !== -1
        ) {
          wrap = true;
        }
        const temp = {};
        
        temp[key] = value;
        html +=
          (wrap ? "<p>" : "") + builder.build([temp]) + (wrap ? "</p>" : "");
      }
    }
  }
  html = "<div>" + html + "</div>";
  console.log("xmlToHtml out", html);
  return html;
}

function htmlToXml(html: string): string {
  console.log("htmlToXml", html);

  let h = html.replaceAll("<p>", "").replaceAll("</p>", "\n");
  if (h.startsWith("<div>")) {
    h = h.replaceAll("<div>", "").replaceAll("</div>", "").trim();
  }
  return "<body>" + h + "</body>";
}

export {
  getPrettyColumnName,
  getColumnCount,
  convertColorToHexes,
  xmlToHtml,
  htmlToXml,
};
