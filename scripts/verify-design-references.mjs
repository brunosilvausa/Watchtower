import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";

const root = resolve(import.meta.dirname, "../design-system");
const entries = await readdir(resolve(root, "references"), { recursive: true });
let checked = 0;
for (const entry of entries) {
  if (!/\.(html|css)$/.test(entry)) continue;
  const file = resolve(root, "references", entry);
  const source = await readFile(file, "utf8");
  const urls = [...source.matchAll(/(?:src|href)=["']([^"']+)["']|@import\s+["']([^"']+)["']/g)].map(match => match[1] ?? match[2]);
  for (const url of urls) {
    if (/^(?:https?:|data:|#|mailto:)/.test(url)) continue;
    const target = resolve(dirname(file), decodeURIComponent(url.split(/[?#]/)[0]));
    assert(!relative(root, target).startsWith(".."), `Reference escapes design system: ${entry} ${url}`);
    assert((await stat(target)).isFile(), `Missing reference: ${entry} ${url}`);
    checked++;
  }
}
const css = await readFile(resolve(root, "tokens/fonts.css"), "utf8");
assert(!css.includes("https:"), "Fonts must be local");
for (const match of css.matchAll(/url\("([^"]+)"\)/g)) assert((await stat(resolve(root, "tokens", match[1]))).isFile());
const components = await readdir(resolve(root, "components"));
for (const file of components.filter(name => /\.(ts|tsx)$/.test(name))) {
  const source = await readFile(resolve(root, "components", file), "utf8");
  assert(!source.includes("design-system-export"), `Source dependency in ${file}`);
  assert(!source.includes("dangerouslySetInnerHTML"), `Unsafe SVG injection in ${file}`);
}
console.log(`Design references: ${checked} local links, local fonts and source independence verified.`);
