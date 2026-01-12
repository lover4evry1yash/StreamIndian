import { addonBuilder } from "stremio-addon-sdk";
import { handleCatalogMovies } from "./src/catalog/movies.js";
import { handleCatalogSeries } from "./src/catalog/series.js";

const builder = new addonBuilder({
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
});

builder.defineCatalogHandler(async (args) => {
  try {
    if (args.type === "movie") {
      return await handleCatalogMovies(args);
    }

    if (args.type === "series") {
      return await handleCatalogSeries(args);
    }

    return { metas: [] };
  } catch (err) {
    console.error("Catalog error:", err);
    return { metas: [] };
  }
});

const addonInterface = builder.getInterface();

export default {
  fetch(request, env) {
    // 🔑 this injects env correctly for Cloudflare
    return addonInterface.fetch(request, env);
  }
};
