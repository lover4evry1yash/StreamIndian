import { handleCatalogMovies } from "./src/catalog/movies.js";
import { handleCatalogSeries } from "./src/catalog/series.js";

const manifest = {
  id: "org.streamindian",
  version: "1.0.0",
  name: "StreamIndian",
  description: "Indian Movies and Series",
  resources: ["catalog"],
  types: ["movie", "series"],
  idPrefixes: ["tmdb:", "demo:", "streamindia:"],
  catalogs: [
    {
      type: "movie",
      id: "demo",
      name: "Movies",
      extra: [{ name: "search", isRequired: false }]
    },
    {
      type: "series",
      id: "demo",
      name: "Series",
      extra: [{ name: "search", isRequired: false }]
    }
  ]
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Manifest
    if (path === "/manifest.json") {
      return new Response(JSON.stringify(manifest), {
        headers: { "content-type": "application/json" }
      });
    }

    // Catalog
    if (path.startsWith("/catalog/")) {
      const parts = path.split("/").filter(Boolean);
      const type = parts[1];
      const id = parts[2]?.replace(".json", "");
      const extra = Object.fromEntries(url.searchParams.entries());

      // Safety: wrong ID → return empty catalog
      if (id !== "demo") {
        console.log(`Invalid catalog ID: ${id}`);
        return new Response(JSON.stringify({ metas: [], hasMore: false }), {
          headers: { "content-type": "application/json" }
        });
      }

      try {
        if (type === "movie") {
          return new Response(JSON.stringify(await handleCatalogMovies({ type, id, extra, env })), {
            headers: { "content-type": "application/json" }
          });
        }
        if (type === "series") {
          return new Response(JSON.stringify(await handleCatalogSeries({ type, id, extra, env })), {
            headers: { "content-type": "application/json" }
          });
        }
      } catch (e) {
        console.error("Catalog handler crash:", e.message);
        return new Response(JSON.stringify({ metas: [], hasMore: false }), {
          headers: { "content-type": "application/json" }
        });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};