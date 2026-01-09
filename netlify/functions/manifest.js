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
catalogs: [
  {
    type: "movie",
    id: "streamindian-movies",
    name: "StreamIndian Movies",
    extra: [
      {
        name: "skip",
        isRequired: false
      }
    ],
    extraSupported: ["skip"]
  },
  {
    type: "series",
    id: "streamindian-series",
    name: "StreamIndian Series",
    extra: [
      {
        name: "skip",
        isRequired: false
      }
    ],
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*"
    },
    body: JSON.stringify(manifest)
  };
};
