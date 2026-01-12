import { handleCatalogMovies } from "./src/catalog/movies.js";
import { handleCatalogSeries } from "./src/catalog/series.js";

const manifest = {
  id: "org.streamindian",
  version: "1.0.0",
  name: "StreamIndian",
  description: "Indian Movies and Series",
  resources: ["catalog"],
  types: ["movie", "series"],

  // 🔑 THIS WAS MISSING BEFORE
  idPrefixes: ["tmdb:", "demo:", "streamindian:"],

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

      try {
        if (type === "movie") {
          return json(await handleCatalogMovies({ type, id, extra, env }));
        }
        if (type === "series") {
          return json(await handleCatalogSeries({ type, id, extra, env }));
        }
      } catch (e) {
        console.error(e);
        return json({ metas: [] });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" }
  });
}
