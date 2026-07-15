import { Marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

/* [chat pov="Name 1"] [/chat] */
/* (doesn't support nested tag of same type) */
function htmlOpenCloseRegex(tag) {
  if (!isValid(tag)) {
    console.log(`Attempted to construct match for invalid tag: ${tag}`);
    return null;
  }
  // Opening tag, with non-greedy attributes
  const openingRegex = `(\\[${tag}.*?\\])`;
  // Non-greedy innards
  const middleRegex = `(.+?)`;
  // Closing tag
  const endingRegex = `(\\[/${tag}\\])`;
  return new RegExp(`${openingRegex}${middleRegex}${endingRegex}`, "si");
}

function isValid(tag) {
  const validTagRule = /^[a-zA-Z]+$/;
  const match = validTagRule.exec(tag);
  return !!match;
}

function parseAttributes(openingTag) {
  const attrs = {};
  // quotes can't contain " (non-greedy)
  const attrRegex = /\s([a-zA-Z]*)="(.*?)"/gs;
  let match;
  while ((match = attrRegex.exec(openingTag)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

const customBlockAttributes = {};

function customBlock(blockName, prelex) {
  if (!isValid(blockName)) {
    console.log(`Discarding rule with invalid name: '${blockName}'`);
    return null;
  }
  const blockStart = new RegExp(blockName, "i");
  return {
    name: blockName,
    level: "block",
    start(src) {
      return src.match(new RegExp(`\\[${blockName}`, "i"))?.index;
    },
    tokenizer(src, tokens) {
      const rule = htmlOpenCloseRegex(blockName);
      const match = rule.exec(src);
      if (match) {
        const raw = match[0]; // Text to consume from the source
        const attributes = parseAttributes(match[1], blockName);
        customBlockAttributes[blockName].attributes = attributes;
        const innerText = match[2].trim();
        const rawToken = {
          // Additional custom properties
          text: innerText,
          ...attributes,
          // Overwrite parsed attrs with required ones
          type: blockName,
          raw,
          tokens: [], // Array where child inline tokens will be generated
        };
        const text = preprocess(token.text, token.tokens);
        this.lexer.blockTokens(text, token.tokens); // Process nested blocks
        // remove attributes
        customBlockAttributes[blockName] = undefined;
        return token;
      }
    },
    renderer(token) {
      return `<div class=${blockName}>${this.parser.parse(token.tokens)}\n</div>\n`;
    },
  };
}

function textSubType(charName) {
  const normalized = (charName ?? "").toLowerCase().trim();
  if (normalized === "info") {
    return "info";
  }
  if (customBlockAttributes["phoneHeader"]?.attributes["pov"]) {
    const pov = customBlockAttributes["phoneHeader"].attributes["pov"]
      .split(",")
      .map((char) => char.trim().toLowerCase());
    if (pov.includes(normalized)) {
      return "pov";
    }
  }
  return "character";
}

const phoneHeader = customBlock("phoneHeader");

// FIXME: use this along with texts?
/* const multiText = {
  name: "multiText",
  level: "block",
  start(src) {
    return src.match(/^[^:\n]*?[^\s:]+:\s/m)?.index;
  },
  tokenizer(src, tokens) {
    // character name: text (can be associated with multiple lines,
    // but gets interrupted by empty line or new character)
    const rule = /^([^:\n]*?[^\s:]+):(([^:\n]+(?:\n|$))+)/m;
    const match = rule.exec(src);
    if (match) {
      const raw = match[0];
      // FIXME: return early if charName isn't supported?
      // Or have a max length?
      const charName = match[1] ?? textInfo.charName;
      textInfo.charName = charName;
      const texts = match[2];
      // Special casing for "info" type
      const subType = textSubType(charName);
      // FIXME: special behavior for pov char?
      const token = {
        type: "texts",
        subType,
        raw,
        charName,
        charDisplay: [],
        text: texts,
        tokens: [],
      };
      this.lexer.blockTokens(token.text, token.tokens); // Process nested blocks
      if (type !== "info") {
        this.lexer.inline(token.charName, token.charDisplay); // Queue charName for inline processing
      }
      return token;
    }
  },
}; */

const textInfo = { charName: "" };

const texts = {
  name: "texts",
  level: "block",
  start(src) {
    return src.match(/^[^:\n]*?[^\s:]+:\s/m)?.index;
  },
  tokenizer(src, tokens) {
    // character name: text (can be associated with multiple lines,
    // but gets interrupted by empty line or new character)
    const rule = /^([^:\n]*?[^\s:]+):(([^:\n]+(?:\n|$))+)/m;
    const match = rule.exec(src);
    if (match) {
      const raw = match[0];
      // FIXME: return early if charName isn't supported?
      // Or have a max length?
      const charName = match[1] ?? textInfo.charName;
      textInfo.charName = charName;
      const texts = match[2];
      // Special casing for "info" type
      const subType = textSubType(charName);
      // FIXME: special behavior for pov char?
      const token = {
        type: "texts",
        subType,
        raw,
        charName,
        charDisplay: [],
        text: texts,
        tokens: [],
      };
      this.lexer.blockTokens(token.text, token.tokens); // Process nested blocks
      if (type !== "info") {
        this.lexer.inline(token.charName, token.charDisplay); // Queue charName for inline processing
      }
      return token;
    }
  },
  renderer(token) {
    // FIXME: merge character with next token if next token is a paragraph?
    const normalizedCharName = toCssClass(token.charName);
    return `<div class="${token.subType} ${normalizedCharName}"><div class="characterName ${normalizedCharName}">${this.parser.parseInline(token.charDisplay)}</div>${this.parser.parse(token.tokens)}\n</div>`; // parseInline to turn child tokens into HTML
  },
  childTokens: ["charDisplay", "texts"], // Any child tokens to be visited by walkTokens
};

// FIXME: be smarter about this?
function toCssClass(text) {
  const norm = text.replaceAll(/[^a-zA-Z]/, "-");
  return `char-${norm}`;
}

function walkNodes(node) {}

// Override function
const walkTokens = (token) => {
  console.log(`Walking token: ${token.type}`);
  if (token.type === "text") {
    console.log(token.text);
  }
};

export const marker = new Marked([
  { extensions: [phoneHeader, texts], walkTokens },
]);
