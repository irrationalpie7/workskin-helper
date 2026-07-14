import { marked } from "./marked.mjs";
const { Editor } = toastui;
// FIXME ??
console.log(toastui);

function div(entering, className) {
  return {
    type: entering ? "openTag" : "closeTag",
    tagName: "div",
    outerNewLine: true,
    ...(entering ? { classNames: [className] } : {}),
  };
}

function phonePlugin() {
  const toHTMLRenderers = {
    phone(node) {
      const [header, rest] = node.literal.trim().split("\n", 2);
      // $$phone [pov: Character, Character Alias 1, Character Alias 2] [heading]
      console.log("about to parse phone:");
      console.log(header);
      console.log(rest);
      const regex = new RegExp("^\\[pov:(.*?)\\](?:\\s+\\[(.*?)\\])?$");
      const match = regex.exec(header.trim());
      const rawPOV = match
        ? match[1].split(",").map((s) => s.replaceAll('"', "'").trim())
        : [];
      const rawHeader = match
        ? (match[2] ?? "").trim()
        : `Invalid header: '${header.trim()}'`;

      const newLiteral = `[heading pov="${rawPOV.join(",")}"]${rawHeader}[/heading]\n\n${rest}`;

      console.log("to be parsed:");
      console.log(newLiteral);
      const html = marked.parse(newLiteral);
      // see https://github.com/cure53/DOMPurify#how-do-i-use-it
      const clean = DOMPurify.sanitize(html);
      console.log("post parsing:");
      console.log(html);
      console.log(clean);

      return [
        div(true, "phone"),
        { type: "html", content: clean },
        div(false, "phone"),
      ];
    },
  };
  return { toHTMLRenderers };
}

export function createEditor(element) {
  // const { codeSyntaxHighlight } = Editor.plugin;
  return new Editor({
    // Where to put the editor
    el: element,
    previewStyle: "vertical",
    initialEditType: "wysiwyg",
    plugins: [phonePlugin], //, [codeSyntaxHighlight, { highlighter: Prism }]],
  });
}
