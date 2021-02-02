import marked from "marked";

const boldRegex = new RegExp("\\*\\*", "g");
const italicsRegex = new RegExp("( _|^_)", "g");
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
    em: (text: string) => `<span class="rm-italics">${text}</span>`,
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
    .replace(italicsRegex, (): string => {
      openingItalics = !openingItalics;
      return openingItalics ? ' <span class="rm-italics">' : " </span>";
    });
};

export default run;
