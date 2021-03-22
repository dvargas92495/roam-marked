import run, { lexer } from "../src";
import fs from "fs";

test("Runs Default", () => {
  const md = `- A **bolded** text
- An __italicized__ text
- A ^^highlighted^^ text
- A ~~strikethrough~~ text
- A **bolded ** text
- An __italicized __ text
- __italicized __ text
- A {{[[TODO]]}} This is a todo block
- A {{[[DONE]]}} This is a done block
- \`\`\`javascript
console.log("Render");
console.log("this");
console.log("block");
\`\`\``;

  fs.writeFileSync("debug.json", JSON.stringify(lexer(md), null, 4));
  expect(run(md)).toBe(`<ul>
<li>A <span class="rm-bold">bolded</span> text</li>
<li>An <em class="rm-italics">italicized</em> text</li>
<li>A <span class="rm-highlight">highlighted</span> text</li>
<li>A <del>strikethrough</del> text</li>
<li>A <span class="rm-bold">bolded </span> text</li>
<li>An <em class="rm-italics">italicized </em> text</li>
<li><em class="rm-italics">italicized </em> text</li>
<li>A <span><label class="check-container"><input type="checkbox" disabled=""><span class="checkmark"></span></label></span> This is a todo block</li>
<li>A <span><label class="check-container"><input type="checkbox" checked="" disabled=""><span class="checkmark"></span></label></span> This is a done block</li>
<li><pre><code class="language-javascript">console.log(&quot;Render&quot;);
console.log(&quot;this&quot;);
console.log(&quot;block&quot;);
</code></pre>
</li>
</ul>
`);
});

test("Runs code block without newline", () => {
  const md = `- \`\`\`javascript
console.log("Render");
console.log("this");
console.log("block");\`\`\``;

  fs.writeFileSync("debug.json", JSON.stringify(lexer(md), null, 4));
  expect(run(md)).toBe(`<ul>
<li><pre><code class="language-javascript">console.log(&quot;Render&quot;);
console.log(&quot;this&quot;);
console.log(&quot;block&quot;);
</code></pre>
</li>
</ul>
`);
});

test("Runs buttons", () => {
  const md = `- {{pull references}}`;

  fs.writeFileSync("debug.json", JSON.stringify(lexer(md), null, 4));
  expect(run(md)).toBe(`<ul>
<li><button>pull references</button></li>
</ul>
`);
});

test("Runs queries", () => {
  const md = `- {{[[query]]: {and:{or:[[TODO]] [[DONE]]} [[January 26th, 2021]]}}}`;

  fs.writeFileSync("debug.json", JSON.stringify(lexer(md), null, 4));
  expect(run(md)).toBe(`<ul>
<li><button>[[query]]: {and:{or:[[TODO]] [[DONE]]} [[January 26th, 2021]]}</button></li>
</ul>
`);
});

test("Runs tags as links", () => {
  const md = `- Started with [[Hello World]]
- Then #Vargas is my last name
- This [[Page]] has no href`;

  const pages = {
    "Hello World": "/hello-world",
    Vargas: "/asdfasdf",
  } as { [key: string]: string };
  const context = {
    pagesToHrefs: (tag: string) => pages[tag],
  };
  fs.writeFileSync("debug.json", JSON.stringify(lexer(md, context), null, 4));
  expect(run(md, context)).toBe(`<ul>
<li>Started with <a href="/hello-world">Hello World</a></li>
<li>Then <a href="/asdfasdf">Vargas</a> is my last name</li>
<li>This Page has no href</li>
</ul>
`);
});

test("Links without context is just text", () => {
  const md = `- Started with [[Hello World]]
- Then #Vargas is my last name
- This [[Page]] has no href`;

  fs.writeFileSync("debug.json", JSON.stringify(lexer(md), null, 4));
  expect(run(md)).toBe(`<ul>
<li>Started with [[Hello World]]</li>
<li>Then #Vargas is my last name</li>
<li>This [[Page]] has no href</li>
</ul>
`);
});

test("Double tag on context", () => {
  const md = `- Started with [[Hello World]] [[Page]]`;
  const context = {
    pagesToHrefs: (t: string) => `/${t.toLowerCase().replace(" ", "-")}`,
  };
  fs.writeFileSync("debug.json", JSON.stringify(lexer(md, context), null, 4));
  expect(run(md, context)).toBe(`<ul>
<li>Started with <a href="/hello-world">Hello World</a> <a href="/page">Page</a></li>
</ul>
`);
});

test("Nested Links", () => {
  const md = `- One type of [[[[Nested]] Links]]
- And another [[Example [[Nested]] Link]]
- A Final [[Link [[Nested]]]]`;
  const pages = {
    "[[Nested]] Links": "/start",
    "Example [[Nested]] Link": "/middle",
    "Link [[Nested]]": "/end",
    Nested: "/nested",
  } as { [key: string]: string };
  const context = {
    pagesToHrefs: (tag: string) => pages[tag],
  };

  fs.writeFileSync("debug.json", JSON.stringify(lexer(md, context), null, 4));
  expect(run(md, context)).toBe(`<ul>
<li>One type of <a href="/start"><a href="/nested">Nested</a> Links</a></li>
<li>And another <a href="/middle">Example <a href="/nested">Nested</a> Link</a></li>
<li>A Final <a href="/end">Link <a href="/nested">Nested</a></a></li>
</ul>
`);
});

test("Renders iframe", () => {
  const md = `- {{iframe:https://givebutter.com/roamjs}}`;
  fs.writeFileSync("debug.json", JSON.stringify(lexer(md), null, 4));
  expect(run(md)).toBe(`<ul>
<li><iframe src="https://givebutter.com/roamjs" frameborder="0" height="100%" width="100%"></iframe></li>
</ul>
`);
});

test("Renders page aliases", () => {
  const md = `- Resolve an alias [Page]([[Hello World]])
- An invalid [alias](wat)`;
  const context = {
    pagesToHrefs: (t: string) => `/${t.toLowerCase().replace(" ", "-")}`,
  };
  fs.writeFileSync("debug.json", JSON.stringify(lexer(md, context), null, 4));
  expect(run(md, context)).toBe(`<ul>
<li>Resolve an alias <a href="/hello-world">Page</a></li>
<li>An invalid <a href="wat">alias</a></li>
</ul>
`);
});
