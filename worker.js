import { handleCatalogMovies } from "./src/catalog/movies.js";
import { handleCatalogSeries } from "./src/catalog/series.js";

const manifest = {
  id: "org.streamindian",
  version: "1.0.0",
  name: "StreamIndian",
  description: "Indian Movies and Series",
  resources: ["catalog"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "movie",
      id: "demo",
      name: "Movies",
      extra: [{ name: "skip", isRequired: false }]
    },
    {
      type: "series",
      id: "demo",
      name: "Series",
      extra: [{ name: "skip", isRequired: false }]
    }
  ]
};

export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // ✅ Manifest
      if (pathname === "/manifest.json") {
        return new Response(JSON.stringify(manifest), {
          headers: { "content-type": "application/json" }
        });
      }

      // ✅ Catalog
      if (pathname.startsWith("/catalog/")) {
        const parts = pathname.split("/").filter(Boolean);
        // /catalog/:type/:id.json
        const type = parts[1];
        const id = parts[2]?.replace(".json", "");
        const extra = Object.fromEntries(url.searchParams.entries());

        let result = { metas: [] };

        if (type === "movie") {
          result = await handleCatalogMovies({ type, id, extra });
        } else if (type === "series") {
          result = await handleCatalogSeries({ type, id, extra });
        }

        return new Response(JSON.stringify(result), {
          headers: { "content-type": "application/json" }
        });
      }

      return new Response("Not Found", { status: 404 });

    } catch (err) {
      // 🔒 Prevent Cloudflare Error 1101
      console.error("Worker crash:", err);

      return new Response(
        JSON.stringify({ metas: [] }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    }
  }
};
