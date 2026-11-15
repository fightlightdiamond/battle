import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "deck.generated.css"), "utf8");
let html = readFileSync(join(root, "slides.html"), "utf8");

html = html.replace("/*__CSS__*/", css);

html = html.replace(/<!--svg:([\w-]+)-->/g, (_, name) => {
  const raw = readFileSync(join(root, "diagrams", "svg", `${name}.svg`), "utf8");
  const svg = raw.replace(/<\?xml[^>]*>\s*/g, "").replace(/<svg\b([^>]*)>/, (_, attrs) => {
    const cleaned = attrs
      .replace(/\swidth="[^"]*"/g, "")
      .replace(/\sheight="[^"]*"/g, "")
      .replace(/\sstyle="[^"]*"/g, "")
      .replace(/preserveAspectRatio="[^"]*"/g, 'preserveAspectRatio="xMidYMid meet"');
    return `<svg${cleaned}>`;
  });
  return svg.trim();
});

writeFileSync(join(root, "index.html"), html);
console.log("wrote index.html");
