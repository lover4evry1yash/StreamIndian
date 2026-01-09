export const handler = async (event) => {
  const parts = event.path.split('/');
  const type = parts[parts.length - 2];

  const metas = [
    {
      id: "streamindian:movie1",
      type,
      name: "RRR",
      poster: "https://m.media-amazon.com/images/M/MV5BM2Y5Y2U3NzktZTE1OC00YjU4LTg2N2ItY2QzZTU5NWI4ZWI4XkEyXkFqcGc@._V1_.jpg"
    },
    {
      id: "streamindian:movie2",
      type,
      name: "KGF Chapter 1",
      poster: "https://m.media-amazon.com/images/M/MV5BN2Y0ZmUxZWMtZGU5NS00OWE5LWE4MjQtZDRmYmE3ZTM3OWFjXkEyXkFqcGc@._V1_.jpg"
    },
    {
      id: "streamindian:movie3",
      type,
      name: "Baahubali: The Beginning",
      poster: "https://m.media-amazon.com/images/M/MV5BN2RmM2NmZjctNDQ1Ni00Y2Y0LTg0OGYtZDJjYzZmNjg5Y2I2XkEyXkFqcGc@._V1_.jpg"
    }
  ];

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ metas })
  };
};