export const handler = async (event) => {
  const { type, id } = event.path.split('/').slice(-2);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      metas: [
        {
          id: "streamindian-test-1",
          type: type,
          name: "StreamIndian Test Content",
          poster: "https://via.placeholder.com/300x450?text=StreamIndian"
        }
      ]
    })
  };
};