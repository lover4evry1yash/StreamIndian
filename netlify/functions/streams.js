export const handler = async (event) => {
  const parts = event.path.split("/");
  const type = parts.at(-2);
  const id = parts.at(-1);

  const TORBOX_KEY = process.env.TORBOX_KEY;

  // Extract title slug from ID
  const slug = id.split(":").pop().replace(/-/g, " ");

  const streams = [];

  /* --------------------------------------------------
     1️⃣ Public torrent stream (fallback-safe)
     -------------------------------------------------- */
  streams.push({
    title: "🧲 Public Torrent (Demo)",
    infoHash: "e3c6f9d8c3caa5c9b5d9a0f7e2a3c4b5d6e7f8a9", // demo hash
    fileIdx: 0
  });

  /* --------------------------------------------------
     2️⃣ TorBox premium stream (if key exists)
     -------------------------------------------------- */
  if (TORBOX_KEY) {
    streams.push({
      title: "⚡ TorBox Premium",
      externalUrl: `https://api.torbox.app/v1/stream/${encodeURIComponent(slug)}`,
      behaviorHints: {
        notWebReady: true,
        bingeGroup: "torbox"
      }
    });
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ streams })
  };
};