const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve index.html at root
    if (path === "/" || path === "/index.html") {
      return new Response(Bun.file("src/index.html"));
    }

    // Serve style.css
    if (path === "/style.css") {
      return new Response(Bun.file("src/style.css"), {
        headers: { "Content-Type": "text/css" },
      });
    }

    // Serve script.js (will handle TypeScript compilation automatically)
    if (path === "/script.js") {
      const result = await Bun.build({
        entrypoints: ["src/script.ts"],
        minify: false,
      });
      return new Response(result.outputs[0], {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    if (path.startsWith("/assets/sounds/")) {
      return new Response(Bun.file("src/" + path), {
        headers: { "Content-Type": "audio/mpeg" },
      })
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);