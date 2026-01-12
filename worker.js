import { handleCatalogMovies } from "./src/catalog/movies.js";
import { handleCatalogSeries } from "./src/catalog/series.js";
import manifest from "./src/manifest.js";

export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // 🔹 Manifest
      if (pathname === "/manifest.json") {
        return new Response(JSON.stringify(manifest), {
          headers: { "content-type": "application/json" }
        });
      }

      // 🔹 Catalog routes
      if (pathname.startsWith("/catalog/")) {
        const parts = pathname.split("/").filter(Boolean);
        // /catalog/:type/:id.json
        const type = parts[1];
        const id = parts[2]?.replace(".json", "");

        const extra = Object.fromEntries(url.searchParams.entries());

        let result;

        if (type === "movie") {
          result = await handleCatalogMovies({ type, id, extra });
        } else if (type === "series") {
          result = await handleCatalogSeries({ type, id, extra });
        } else {
          result = { metas: [] };
        }

        // 🔒 Always return valid JSON
        return new Response(JSON.stringify(result), {
          headers: { "content-type": "application/json" }
        });
      }

      // 🔹 Fallback
      return new Response("Not Found", { status: 404 });

    } catch (err) {
      // 🔥 THIS IS WHAT FIXES ERROR 1101
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
