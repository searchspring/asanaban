import colorConvert from "color-convert";
import { LightenDarkenColor } from "lighten-darken-color";

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
function convertChildToHtml(child: any): string {
  const serializer = new XMLSerializer();
  const childHtml = serializer.serializeToString(child);
  return childHtml;
}

function xmlToHtml(xml: string): string {
  const parser = new DOMParser();
  xml = xml.replaceAll("\n\n", "<br/><br/>");
  const xmlDoc = parser.parseFromString(xml, "text/xml");
  const chlidren = xmlDoc.querySelector("body")?.childNodes;
  let html = "";
  if (chlidren) {
    for (let i = 0; i < chlidren.length; i++) {
      const child = chlidren[i];
      const childHtml = convertChildToHtml(child);
      html += childHtml + "\n";
    }
  }

  console.log(html);

  return "<div>" + html + "</div>";
}

export { getPrettyColumnName, getColumnCount, convertColorToHexes, xmlToHtml };
