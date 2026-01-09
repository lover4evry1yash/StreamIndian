 export const handler = async (event) => {
  const parts = event.path.split('/');
  const type = parts[parts.length - 2];

  const skip = parseInt(event.queryStringParameters?.skip || "0", 10);
  const limit = 20;

  const allItems = [
    "RRR","KGF Chapter 1","KGF Chapter 2","Baahubali: The Beginning",
    "Baahubali: The Conclusion","Pushpa: The Rise","Pushpa 2","Vikram",
    "Jailer","Leo","Salaar","Sita Ramam","3 Idiots","Dangal","Lagaan",
    "Andhadhun","Drishyam","Drishyam 2","Pathaan","Jawan",
    "Animal","Rocky Aur Rani","Brahmastra","Kabir Singh","Super 30",
    "Chak De India","PK","Munna Bhai MBBS","Dil Chahta Hai","Swades",
    "Gangs of Wasseypur","Rang De Basanti","Barfi","Haider","Uri"
  ];

  const slice = allItems.slice(skip, skip + limit + 1);

  const metas = slice.slice(0, limit).map((name, index) => ({
    id: `streamindian:${type}:${skip + index}`,
    type,
    name,
    poster: "https://via.placeholder.com/300x450?text=" + encodeURIComponent(name)
  }));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({ metas })
  };
};