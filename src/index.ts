import marked from "marked";

const boldRegex = new RegExp("\\*\\*", "g");
const italicsRegex = new RegExp("__", "g");
const highlightRegex = new RegExp("\\^\\^", "g");

marked.use({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore should be optional
  renderer: {
    text: (text: string) => {
      let openingTag = false;
      let openingBold = false;
      let openingItalics = false;
      return text
        .replace(highlightRegex, (): string => {
          openingTag = !openingTag;
          return openingTag ? '<span class="rm-highlight">' : "</span>";
        })
        .replace(boldRegex, (): string => {
          openingBold = !openingBold;
          return openingBold ? '<span class="rm-bold">' : "</span>";
        })
        .replace(italicsRegex, (): string => {
          openingItalics = !openingItalics;
          return openingItalics ? '<span class="rm-italics">' : "</span>";
        });
    },
  },
});

const run = (text: string): string => {
  return marked(text);
};

export default run;
