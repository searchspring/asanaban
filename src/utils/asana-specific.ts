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

function htmlToXml(html: string): string {
  let h = html
    .replaceAll("</p></li>", "</li>")
    .replaceAll("<p>", "")
    .replaceAll("</p>", "\n");
  if (h.startsWith("<div>")) {
    h = h.replaceAll("<div>", "").replaceAll("</div>", "").trim();
  }
  return "<body>" + h + "</body>";
}

function xmlToHtml(xml: string): string {
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: false,
    preserveOrder: true,
  });
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: true,
  });
  xml = xml.replaceAll("\n", "<br/>");
  const asanaDoc = parser.parse(xml);
  const oldKey = "body";
  const newKey = "div";
  delete Object.assign(asanaDoc[0], { [newKey]: asanaDoc[0][oldKey] })[oldKey];
  const tipTapDoc = [{ div: [] }] as any;
  recursivePTags(tipTapDoc[0].div, asanaDoc[0].div, true);
  return builder.build(tipTapDoc);
}

const recursiveElements = ["ul", "li", "ol"];
function recursivePTags(
  tipTapDoc: any,
  currentNode: any,
  isRootNode = false
): void {
  let nonRecursiveStack = [] as any[];
  for (let i = 0; i < currentNode.length; i++) {
    const currentTag = Object.keys(currentNode[i])[0];
    if (currentTag === "br") {
      tipTapDoc.push({ p: nonRecursiveStack });
      nonRecursiveStack = [] as any[];
    } else if (recursiveElements.indexOf(currentTag) !== -1) {
      const recurseObj = {} as any;
      recurseObj[currentTag] = [];
      tipTapDoc.push(recurseObj);
      recursivePTags(
        tipTapDoc[tipTapDoc.length - 1][currentTag],
        currentNode[i][currentTag]
      );
      nonRecursiveStack = [] as any[];
    } else {
      nonRecursiveStack.push(currentNode[i]);
    }
  }
  if (nonRecursiveStack.length > 0) {
    if (
      ((nonRecursiveStack[0]["#text"] ||
        nonRecursiveStack[0]["strong"] ||
        nonRecursiveStack[0]["em"] ||
        nonRecursiveStack[0]["u"] ||
        nonRecursiveStack[0]["s"]) &&
        nonRecursiveStack.length > 1) ||
      isRootNode
    ) {
      tipTapDoc.push({ p: nonRecursiveStack });
    } else {
      tipTapDoc.push(...nonRecursiveStack);
    }
  }
}

export {
  getPrettyColumnName,
  getColumnCount,
  convertColorToHexes,
  xmlToHtml,
  htmlToXml,
};
