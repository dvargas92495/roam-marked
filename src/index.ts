import marked from "marked";
import XRegExp from "xregexp";

const RENDERED_TODO =
  '<span><label class="check-container"><input type="checkbox" disabled=""><span class="checkmark"></span></label></span>';
const RENDERED_DONE =
  '<span><label class="check-container"><input type="checkbox" checked="" disabled=""><span class="checkmark"></span></label></span>';

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const TODO_REGEX = /^{{(?:\[\[)?TODO(?:\]\])?}}/;
const DONE_REGEX = /^{{(?:\[\[)?DONE(?:\]\])?}}/;
const IFRAME_REGEX = new RegExp(
  `^{{(?:\\[\\[)?iframe(?:\\]\\])?:(${URL_REGEX.source})}}`
);
const BUTTON_REGEX = /^{{(?:\[\[)?((?:(?!}}[^}])[\w\s-])*)(?:\]\])?(?::(.*))?}}/;
const TAG_REGEX = /^#?\[\[(.*?)\]\]/;
const BLOCK_REF_REGEX = /^\(\((.*?)\)\)/;
const toAlias = (r: RegExp) =>
  new RegExp(`^\\[(.*?)\\]\\(${r.source.substring(1)}\\)`);
const ALIAS_REGEX = toAlias(TAG_REGEX);
const ALIAS_REF_REGEX = toAlias(BLOCK_REF_REGEX);
const HASHTAG_REGEX = /^#([^\s]*)/;
const ATTRIBUTE_REGEX = /^(.*?)::/;
const BOLD_REGEX = /^\*\*(.*?)\*\*/;
const ITALICS_REGEX = /^__(.*?)__/;
const HIGHLIGHT_REGEX = /^\^\^([^^]*)\^\^/;
const INLINE_STOP_REGEX = /({{|\*\*|__|\^\^|#?\[\[(.*?)\]\]|#[^\s]|\(\(|\[(.*?)\]\((.*?)\))/;
const HR_REGEX = /^---$/;
const HTML_REGEXES = [HIGHLIGHT_REGEX, BUTTON_REGEX, BLOCK_REF_REGEX, HR_REGEX];

const defaultComponents = (component: string, afterColon?: string) => {
  const opts = afterColon?.trim?.() || "";
  switch (component) {
    case "youtube":
    case "video":
      return `<iframe src="${opts.replace(
        "watch?v=",
        "embed/"
      )}" class="rm-iframe rm-video-player"></iframe>`;
    default:
      return "";
  }
};

let lastSrc = "";
// https://github.com/markedjs/marked/blob/d2347e9b9ae517d02138fa6a9844bd8d586acfeb/src/Tokenizer.js#L33-L59
function indentCodeCompensation(raw: string, text: string) {
  const matchIndentToCode = raw.match(/^(\s+)(?:```)/);

  if (matchIndentToCode === null) {
    return text;
  }

  const indentToCode = matchIndentToCode[1];

  return text
    .split("\n")
    .map((node) => {
      const matchIndentInNode = node.match(/^\s+/);
      if (matchIndentInNode === null) {
        return node;
      }

      const [indentInNode] = matchIndentInNode;

      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length);
      }

      return node;
    })
    .join("\n");
}

const opts = {
  tokenizer: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore should accept boolean return value
    tag(src) {
      for (const r of HTML_REGEXES) {
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
    fences(src: string) {
      const newSrc = src.replace(/```$/, "\n```");
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore should accept boolean return value
      const rules = this.rules;
      const cap = (rules.block.fences as RegExp).exec(
        newSrc
      ) as RegExpExecArray;
      if (cap) {
        const raw = cap[0];
        const text = indentCodeCompensation(raw, cap[3] || "");

        return {
          type: "code",
          raw,
          lang: cap[2] ? cap[2].trim() : cap[2],
          text,
        };
      }
      return false;
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore should accept boolean return value
    inlineText(src) {
      if (src === lastSrc) {
        throw new Error(`Infinite loop on byte: ${src.charCodeAt(0)}`);
      }
      lastSrc = src;
      const match = INLINE_STOP_REGEX.exec(src);
      if (match) {
        return {
          type: "text",
          raw: src.substring(0, match.index),
          text: src.substring(0, match.index),
        };
      }
      const attribute = ATTRIBUTE_REGEX.exec(src);
      if (attribute) {
        const raw = attribute[0];
        const page = attribute[1];
        const href = this.context().pagesToHrefs?.(page);
        const text = `${page}:`;
        if (href) {
          return {
            type: "strong",
            raw,
            text,
            tokens: [
              {
                type: "link",
                raw: text,
                text,
                href,
                tokens: [
                  {
                    type: "text",
                    raw: text,
                    text,
                  },
                ],
              },
            ],
          };
        } else {
          return {
            type: "strong",
            raw,
            text,
            tokens: [
              {
                type: "text",
                raw: text,
                text,
              },
            ],
          };
        }
      }
      return false;
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore should accept boolean return value
    link(src) {
      const context = this.context();
      if (TAG_REGEX.test(src)) {
        const match = XRegExp.matchRecursive(src, "#?\\[\\[", "\\]\\]", "i", {
          valueNames: ["between", "left", "match", "right"],
        });
        const raw = match.map((m) => m.value).join("");
        if (context.pagesToHrefs) {
          const text = match[1].value;
          const href = context.pagesToHrefs(text);
          if (href) {
            return {
              type: "link",
              raw,
              href,
              text,
            };
          } else {
            return {
              type: "text",
              raw,
              text,
            };
          }
        } else {
          return {
            type: "text",
            raw,
            text: raw,
          };
        }
      }

      const hashMatch = HASHTAG_REGEX.exec(src);
      if (hashMatch) {
        const raw = hashMatch[0];
        if (context.pagesToHrefs) {
          const text = hashMatch[1];
          const href = context.pagesToHrefs(text);
          if (href) {
            return {
              type: "link",
              raw,
              href,
              text,
            };
          } else {
            return {
              type: "text",
              raw,
              text,
            };
          }
        } else {
          return {
            type: "text",
            raw,
            text: raw,
          };
        }
      }

      const aliasMatch = ALIAS_REGEX.exec(src);
      if (aliasMatch) {
        const raw = aliasMatch[0];
        if (context.pagesToHrefs) {
          const text = aliasMatch[1];
          const href = context.pagesToHrefs(aliasMatch[2]);
          if (href) {
            return {
              type: "link",
              raw,
              href,
              text,
              title: "alias",
            };
          } else {
            return {
              type: "text",
              raw,
              text,
            };
          }
        } else {
          return {
            type: "text",
            raw,
            text: raw,
          };
        }
      }

      const aliasRefMatch = ALIAS_REF_REGEX.exec(src);
      if (aliasRefMatch) {
        const raw = aliasRefMatch[0];
        const text = aliasRefMatch[1];
        const ref = aliasRefMatch[2];
        const href = context.pagesToHrefs?.(
          context.blockReferences?.(ref)?.page || "",
          ref
        );
        if (href) {
          return {
            type: "link",
            raw,
            href,
            text,
            title: "alias",
          };
        } else {
          return {
            type: "text",
            raw,
            text,
          };
        }
      }
      return false;
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore should acce
    context: () => ({} as RoamContext),
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore should be optional
  renderer: {
    link(href: string, title?: string, text?: string): string | false {
      if (title === "alias") {
        const html = this.link(href, undefined, text);
        if (html) {
          return html.replace("href=", 'class="rm-alias" href=');
        }
      }
      return false;
    },
    strong: (text: string) => `<span class="rm-bold">${text}</span>`,
    em: (text: string) => `<em class="rm-italics">${text}</em>`,
    html(text: string) {
      if (TODO_REGEX.test(text)) {
        return RENDERED_TODO;
      } else if (DONE_REGEX.test(text)) {
        return RENDERED_DONE;
      } else if (HR_REGEX.test(text)) {
        return "<hr>";
      } else if (IFRAME_REGEX.test(text)) {
        const match = IFRAME_REGEX.exec(text);
        return `<iframe src="${match?.[1]}" frameborder="0" height="100%" width="100%"></iframe>`;
      } else if (HIGHLIGHT_REGEX.test(text)) {
        const match = HIGHLIGHT_REGEX.exec(text);
        return `<span class="rm-highlight">${match?.[1]}</span>`;
      } else if (BUTTON_REGEX.test(text)) {
        const match = BUTTON_REGEX.exec(text)?.[1] || "";
        const afterColon = BUTTON_REGEX.exec(text)?.[2];
        const context = this.context();
        return (
          context.components?.(match, afterColon) ||
          defaultComponents(match, afterColon) ||
          `<button class="bp3-button">${match}</button>`
        );
      } else if (BLOCK_REF_REGEX.test(text)) {
        const match = BLOCK_REF_REGEX.exec(text)?.[1] || "";
        const context = this.context();
        const blockRefInfo = context.blockReferences?.(match);
        if (!blockRefInfo) {
          return text;
        }
        return `<span class="rm-block-ref">${blockRefInfo.text}</span>`;
      } else {
        return text;
      }
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore should acce
    context: () => ({} as RoamContext),
  },
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore should accept boolean return value
marked.use(opts);

export type RoamContext = {
  pagesToHrefs?: (page: string, uid?: string) => string;
  components?: (c: string, ac?: string) => string | false;
  blockReferences?: (ref: string) => { text: string; page: string };
};
const contextualize = <T>(method: (text: string) => T) => (
  text: string,
  context?: RoamContext
): T => {
  opts.tokenizer.context = () => ({
    ...context,
  });
  opts.renderer.context = () => ({
    ...context,
  });
  lastSrc = "";
  return method(text);
};

export const lexer = contextualize(marked.lexer);
export const parseInline = contextualize(marked.parseInline);
export default contextualize<string>(marked);
