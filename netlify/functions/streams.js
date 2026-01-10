export const handler = async (event) => {
  const parts = event.path.split("/");
  const type = parts.at(-2);
  const id = parts.at(-1);

  // Temporary demo streams (safe + stable)
  const streams = [
    {
      title: "▶ Demo Stream (Test)",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    }
  ];

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ streams })
  };
};