const DATA = {
  movie: [
    "RRR","KGF 1","KGF 2","Baahubali 1","Baahubali 2","Pushpa",
    "Vikram","Jailer","Leo","Salaar","Sita Ramam","3 Idiots",
    "Dangal","Lagaan","Andhadhun","Drishyam","Pathaan","Jawan",
    "Animal","PK","Swades","Haider","Barfi","Uri"
  ],
  series: [
    "Sacred Games","Mirzapur","Paatal Lok","The Family Man",
    "Scam 1992","Asur","Delhi Crime","Aarya","Kota Factory",
    "Panchayat","Gullak","Rocket Boys","Farzi","Special OPS"
  ]
};

export const handler = async (event) => {
  const parts = event.path.split("/");
  const type = parts.at(-2);

  const page = Number(event.queryStringParameters?.cursor || 0);
  const LIMIT = 20;

  const list = DATA[type] || [];
  const start = page * LIMIT;
  const end = start + LIMIT;

  const metas = list.slice(start, end).map((name, idx) => ({
    id: `streamindian:${type}:${start + idx}`, // stable ID
    type,
    name,
    poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(name)}`
  }));

  const hasNext = end < list.length;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      metas,
      ...(hasNext && { nextCursor: String(page + 1) })
    })
  };
};