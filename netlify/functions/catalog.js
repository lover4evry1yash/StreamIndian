const MOVIES = [
  "RRR","KGF Chapter 1","KGF Chapter 2","Baahubali: The Beginning",
  "Baahubali: The Conclusion","Pushpa","Vikram","Jailer","Leo","Salaar",
  "Sita Ramam","3 Idiots","Dangal","Lagaan","Andhadhun","Drishyam",
  "Pathaan","Jawan","Animal","PK","Swades","Haider","Barfi","Uri"
];

const SERIES = [
  "Sacred Games","Mirzapur","Paatal Lok","The Family Man",
  "Scam 1992","Asur","Delhi Crime","Aarya","Kota Factory",
  "Panchayat","Gullak","Rocket Boys","Farzi","Special OPS"
];

export const handler = async (event) => {
  const parts = event.path.split("/");
  const type = parts.at(-2); // movie | series

  const cursor = event.queryStringParameters?.cursor;
  const start = cursor ? Number(cursor) : 0;
  const limit = 20;

  const source = type === "series" ? SERIES : MOVIES;

  const slice = source.slice(start, start + limit);

  const metas = slice.map((name, i) => ({
    id: `streamindian:${type}:${start + i}`, // deterministic
    type,
    name,
    poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(name)}`
  }));

  const nextCursor =
    start + limit < source.length ? String(start + limit) : null;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      metas,
      ...(nextCursor && { nextCursor })
    })
  };
};