import { XMLParser, XMLBuilder } from "fast-xml-parser";

export interface Hex {
  background: string;
  font: string;
}

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

function convertAsanaColorToHex(color: string): Hex {
  if (!color) { // light grey color is sometimes passed as "none" or null by Asana
    color = "none";
  }

  const black = "#000000";
  const white = "#ffffff";

  const colors = { 
    "none": { background: "#C6C4C4", font: black },
    "dark-red": { background: "#E0726E", font: black }, 
    "dark-orange": { background: "#DF9077", font: black } , 
    "light-orange": { background: "#E9BE78", font: black }, 
    "dark-brown": { background: "#F5DF82", font: black },
    "light-green": { background: "#B4CC67", font: black }, 
    "dark-green": { background: "#6D9F85", font: white },
    "light-teal": { background: "#71C8C3", font: black },
    "dark-teal": { background: "#ADE5E2", font: black },
    "light-blue": { background: "#4E74CB", font: white }, 
    "dark-purple": { background: "#8A86E1", font: white } , 
    "light-purple": { background: "#A971CE", font: white }, 
    "light-pink": { background: "#EDAEEB", font: black },
    "dark-pink": { background: "#E278B0 ", font: black }, 
    "light-red": { background: "#EE9C9C", font: black },
    "light-warm-gray": { background: "#6D6E6F", font: white },
  };

  return colors[color];
}

function htmlToXml(html: string): string {
  let h = html
    .replaceAll("</p></li>", "</li>")
    .replaceAll("<p>", "")
    .replaceAll("</p>", "\n")
    .replaceAll(/\starget="_blank"/g, "")
    .replaceAll(/\srel="noopener noreferrer nofollow"/g, "");
  if (h.startsWith("<div>")) {
    h = h.replaceAll("<div>", "").replaceAll("</div>", "").trim();
  }
  // Converting mentions to Asana mention format:
  // data-id      => user/task gid
  // data-label   => user/task name
  // span content => user/task name
  const regMention = /<span data-type="([A-Za-z]+)" class="mention" data-id="([0-9]+)" data-label="(.+?)">[@#](.+?)<\/span>/g;
  h = h.replace(regMention, (match, $1, $2, $3, $4) => {
    return '<a href="https://app.asana.com/0/' + $2 + '" data-asana-dynamic="true" data-asana-gid="' + $2 + '" data-asana-accessible="true">' + $4.replaceAll("<", "&lt;") + '</a>';
  }).replace(/<span>/g, '')
    .replace(/<\/span>/g, '\n')
    .replace(/<br>/g, '\n').trim();
  return "<body>" + h + "</body>";
}

function xmlToHtml(xml: string): string {
  if (!xml) {
    return "";
  }
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
    if (currentTag === "a") {
      currentNode[i][":@"][":@target"] = "_blank";
    }
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
  convertAsanaColorToHex,
  xmlToHtml,
  htmlToXml,
};
