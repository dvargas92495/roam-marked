import run from "../src";

test("Runs Default", () => {
  const md = `- A **bolded** text
- An __italicized__ text
- A ^^highlighted^^ text
- A ~~strikethrough~~ text
- A **bolded ** text
- An __italicized __ text
- __italicized __ text`;
  expect(run(md)).toBe(`<ul>
<li>A <span class="rm-bold">bolded</span> text</li>
<li>An <em class="rm-italics">italicized</em> text</li>
<li>A <span class="rm-highlight">highlighted</span> text</li>
<li>A <del>strikethrough</del> text</li>
<li>A <span class="rm-bold">bolded </span> text</li>
<li>An <em class="rm-italics">italicized </em> text</li>
<li><em class="rm-italics">italicized </em> text</li>
</ul>
`);
});
