import { marked } from "./marked.mjs";
const { Editor } = toastui;

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
      const regex = new RegExp("^\\[pov:(.*?)\\](?:\\s+\\[(.*?)\\])?$");
      const match = regex.exec(header.trim());
      const rawPOV = match
        ? match[1].split(",").map((s) => s.replaceAll('"', "'").trim())
        : [];
      const rawHeader = match
        ? (match[2] ?? "").trim()
        : `Invalid header: '${header.trim()}'`;

      const newLiteral = `[heading pov="${rawPOV.join(",")}"]${rawHeader}[/heading]\n\n${rest}`;

      const html = window.myMarked.parse(newLiteral);
      // see https://github.com/cure53/DOMPurify#how-do-i-use-it
      const clean = DOMPurify.sanitize(html);

      return [
        div(true, "phone"),
        { type: "html", content: html },
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
