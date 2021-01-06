import marked from "marked";

marked.use({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore should be optional
  renderer: {
    text: (text: string) => {
      let openingTag = false;
      const highlightRegex = new RegExp("\\^\\^", "g");
      return text.replace(highlightRegex, (): string => {
        openingTag = !openingTag;
        return openingTag ? '<span class="rm-highlight">' : "</span>";
      });
    },
  },
});

const run = (text: string): string => {
  return marked(text.replace(new RegExp("__", "g"), "_"));
};

export default run;
