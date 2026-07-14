const { Editor } = toastui;
const { codeSyntaxHighlight } = Editor.plugin;

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

const editor = new Editor({
  // Where to put the editor
  el: document.getElementById("editor"),
  previewStyle: "vertical",
  plugins: [phonePlugin, [codeSyntaxHighlight, { highlighter: Prism }]],
});
window.editor = editor;
