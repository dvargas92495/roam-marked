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

const run = (text: string): string => {
  let openingBold = false;
  let openingItalics = false;
  return marked(text.replace(new RegExp("__", "g"), "_"))
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

export default run;
