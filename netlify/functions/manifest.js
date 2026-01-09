exports.handler = async () => {
  const manifest = {
    id: "org.streamindian",
    version: "1.0.0",
    name: "StreamIndian",
    description: "Indian-focused streaming addon (Movies, Series, OTT, Anime)",

    resources: [
      { name: "catalog", types: ["movie", "series"] },
      { name: "meta", types: ["movie", "series"] },
      { name: "stream", types: ["movie", "series"] }
    ],

    types: ["movie", "series"],

    catalogs: [
      {
        type: "movie",
        id: "streamindian-movies",
        name: "StreamIndian Movies",
        extra: [{ name: "skip", isRequired: false }],
        extraSupported: ["skip"]
      },
      {
        type: "series",
        id: "streamindian-series",
        name: "StreamIndian Series",
        extra: [{ name: "skip", isRequired: false }],
        extraSupported: ["skip"]
      }
    ],

    logo: "https://streamindian.netlify.app/logo.png",
    background: "https://streamindian.netlify.app/bg.png"
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(manifest)
  };
};