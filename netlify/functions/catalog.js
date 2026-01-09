export const handler = async (event) => {
  const parts = event.path.split('/');
  const type = parts[parts.length - 2];
  const id = parts[parts.length - 1].replace('.json', '');

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      metas: [
        {
          id: "streamindian:test",
          type,
          name: "StreamIndian Test Item",
          poster: "https://via.placeholder.com/300x450?text=StreamIndian"
        }
      ]
    })
  };
};