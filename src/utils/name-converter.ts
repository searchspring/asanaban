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
    adjustedHex = LightenDarkenColor(hex, -100);
    font = "#ffffff";
  } else {
    adjustedHex = LightenDarkenColor(hex, 100);
  }
  return { background: "#" + adjustedHex, font: font };
}

export { getPrettyColumnName, getColumnCount, convertColorToHexes };
