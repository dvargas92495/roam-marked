import marked from "marked";

const boldRegex = new RegExp("\\*\\*", "g");
const italicsRegex = new RegExp("(?:([^a-zA-Z0-9])_|^_)", "g");
const highlightRegex = new RegExp("\\^\\^", "g");

marked.use({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore should be optional
  renderer: {
    text: (text: string) => {
      let openingTag = false;
      return text.replace(highlightRegex, (): string => {
        openingTag = !openingTag;
        return openingTag ? '<span class="rm-highlight">' : "</span>";
      });
    },
    strong: (text: string) => `<span class="rm-bold">${text}</span>`,
    em: (text: string) => `<em class="rm-italics">${text}</em>`,
  },
});

const wrap = ({ text, fcn }: { text: string; fcn: (t: string) => string }) => {
  let openingBold = false;
  let openingItalics = false;
  return fcn(text.replace(new RegExp("__", "g"), "_"))
    .replace(boldRegex, (): string => {
      openingBold = !openingBold;
      return openingBold ? '<span class="rm-bold">' : "</span>";
    })
    .replace(italicsRegex, (_, preChar): string => {
      openingItalics = !openingItalics;
      return openingItalics
        ? `${preChar}<em class="rm-italics">`
        : `${preChar}</em>`;
    });
};

const run = (text: string): string =>
  wrap({
    text,
    fcn: marked,
  });

export const parseInline = (text: string): string =>
  wrap({
    text,
    fcn: marked.parseInline,
  });

export default run;
