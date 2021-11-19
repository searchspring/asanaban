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

function xmlToHtml(xml: string): string {
  let newXml =xml.replaceAll("<body>", "");
  newXml = newXml.replaceAll("</body>", "");
  const lines =  newXml.split("\n");
  for (let i = 0; i < lines.length; i++) {
    lines[i] = "<p>" + lines[i] + "</p>";
  }
  return "<div>" + lines.join("\n") + "</div>"
}

export { getPrettyColumnName, getColumnCount, convertColorToHexes, xmlToHtml };
