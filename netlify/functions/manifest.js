export const handler = async () => {
  const manifest = {
    id: "org.streamindian",
    version: "1.0.0",
    name: "StreamIndian",
    description: "Indian-focused streaming addon (Movies, Series, OTT, Anime)",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series"],
    catalogs: [
      {
        type: "movie",
        id: "streamindian-movies",
        name: "StreamIndian Movies"
      },
      {
        type: "series",
        id: "streamindian-series",
        name: "StreamIndian Series"
      }
    ],
    logo: "https://streamindian.netlify.app/logo.png",
    background: "https://streamindian.netlify.app/bg.png"
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*"
    },
    body: JSON.stringify(manifest)
  };
};
