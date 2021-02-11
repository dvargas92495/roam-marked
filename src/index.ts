import marked from "marked";

const RENDERED_TODO =
  '<span><label class="check-container"><input type="checkbox" disabled=""><span class="checkmark"></span></label></span>';
const RENDERED_DONE =
  '<span><label class="check-container"><input type="checkbox" checked="" disabled=""><span class="checkmark"></span></label></span>';

const TODO_REGEX = /^{{(?:\[\[)?TODO(?:\]\])?}}/;
const DONE_REGEX = /^{{(?:\[\[)?DONE(?:\]\])?}}/;
const BOLD_REGEX = /^\*\*([^*]* )\*\*/;
const ITALICS_REGEX = /^__([^_]*)__/;
const HIGHLIGHT_REGEX = /^\^\^([^^]*)\^\^/;
const INLINE_STOP_REGEX = /({{|\*\*|__|\^\^)/;

const TAG_REGEXES = [TODO_REGEX, DONE_REGEX, HIGHLIGHT_REGEX];

marked.use({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore should be optional
  tokenizer: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore should accept boolean return value
    tag(src) {
      for (const r of TAG_REGEXES) {
        const match = r.exec(src);
        if (match) {
          return {
            type: "html",
            raw: match[0],
            text: match[0],
          };
        }
      }
      return false;
    },
    emStrong(src: string) {
      const match = BOLD_REGEX.exec(src);
      if (match) {
        return {
          type: "strong",
          raw: match[0],
          text: match[1],
        };
      }
      const emMatch = ITALICS_REGEX.exec(src);
      if (emMatch) {
        return {
          type: "em",
          raw: emMatch[0],
          text: emMatch[1],
        };
      }
      return false;
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore should accept boolean return value
    inlineText(src) {
      const match = INLINE_STOP_REGEX.exec(src);
      if (match) {
        return {
          type: "text",
          raw: src.substring(0, match.index),
          text: src.substring(0, match.index),
        };
      }
      return false;
    },
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore should be optional
  renderer: {
    strong: (text: string) => `<span class="rm-bold">${text}</span>`,
    em: (text: string) => `<em class="rm-italics">${text}</em>`,
    html: (text: string) => {
      if (TODO_REGEX.test(text)) {
        return RENDERED_TODO;
      } else if (DONE_REGEX.test(text)) {
        return RENDERED_DONE;
      } else if (HIGHLIGHT_REGEX.test(text)) {
        const match = HIGHLIGHT_REGEX.exec(text);
        return `<span class="rm-highlight">${match?.[1]}</span>`;
      } else {
        return text;
      }
    },
  },
});

export const lexer = marked.lexer;

export const parseInline = marked.parseInline;

export default (text: string): string => marked(text);
