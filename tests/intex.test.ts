import run from "../src";

test("Runs Default", () => {
  const md = `- A **bolded** text
- An __italicized__ text
- A ^^highlighted^^ text
- A ~~strikethrough~~ text`;
  expect(run(md)).toBe(`<ul>
<li>A <strong>bolded</strong> text</li>
<li>An <em>italicized</em> text</li>
<li>A <span class="rm-highlight">highlighted</span> text</li>
<li>A <del>strikethrough</del> text</li>
</ul>
`);
});
