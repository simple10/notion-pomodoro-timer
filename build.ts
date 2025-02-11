import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function build() {
  // Delete dist folder if it exists
  const { rmSync } = require('fs');
  try {
    rmSync('dist', { recursive: true, force: true });
    console.log('Cleaned dist folder');
  } catch (err) {
    // Ignore error if folder doesn't exist
  }

  // Read files
  const html = readFileSync("src/index.html", "utf-8");
  const css = readFileSync("src/style.css", "utf-8");

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

  // Copy assets folder recursively
  const { spawnSync } = require('child_process');
  spawnSync('cp', ['-r', 'src/assets', 'dist/']);

  console.log("Build complete! Output written to dist/index.html");
}

build().catch(console.error);