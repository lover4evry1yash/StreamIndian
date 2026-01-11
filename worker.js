export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    };

    if (path === "/manifest.json") {
      return new Response(JSON.stringify({
        id: "org.streamindian",
        version: "1.0.0",
        name: "StreamIndian",
        description: "Indian-focused streaming addon",
        resources: ["catalog"],
        types: ["movie", "series"],
        catalogs: [
          {
            type: "movie",
            id: "streamindian-movies",
            name: "StreamIndian Movies",
            extraSupported: ["skip"]
          },
          {
            type: "series",
            id: "streamindian-series",
            name: "StreamIndian Series",
            extraSupported: ["skip"]
          }
        ]
      }), { headers });
    }

    if (path.startsWith("/catalog/")) {
      const type = path.includes("series") ? "series" : "movie";
      const skip = parseInt(url.searchParams.get("skip") || "0", 10);
      const limit = 20;

      const items = [
        "RRR","KGF Chapter 1","KGF Chapter 2","Baahubali",
        "Pushpa","Vikram","Leo","Jailer","Salaar","Sita Ramam",
        "3 Idiots","Dangal","Lagaan","Drishyam","Drishyam 2",
        "Pathaan","Jawan","Animal","PK","Swades",
        "Barfi","Haider","Uri","Andhadhun","Gangs of Wasseypur",
        "Rang De Basanti","Chak De India","Munna Bhai MBBS"
      ];

      const slice = items.slice(skip, skip + limit + 1);

      const metas = slice.slice(0, limit).map((name, index) => ({
        id: `streamindian:${type}:${skip + index}`,
        type,
        name,
        poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(name)}`
      }));

      return new Response(JSON.stringify({ metas }), { headers });
    }

    return new Response("Not Found", { status: 404 });
  }
};
