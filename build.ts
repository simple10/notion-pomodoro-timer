import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function build() {
  // Read files
  const html = readFileSync("src/index.html", "utf-8");
  const css = readFileSync("src/style.css", "utf-8");
  const js = readFileSync("src/script.ts", "utf-8");

  // Transpile TypeScript to JavaScript
  const transpiledJs = await Bun.build({
    entrypoints: ["src/script.ts"],
    minify: true,
  });
  const jsContent = await transpiledJs.outputs[0].text();

  // Create the bundled HTML
  const bundledHTML = html
    .replace("</head>", `<style>${css}</style></head>`)
    .replace(
      '<script src="./script.js"></script>',
      `<script>${jsContent}</script>`
    )

  // Ensure dist directory exists
  mkdirSync("dist", { recursive: true });

  // Write the bundled file
  writeFileSync(join("dist", "index.html"), bundledHTML);

  console.log("Build complete! Output written to dist/index.html");
}

build().catch(console.error);