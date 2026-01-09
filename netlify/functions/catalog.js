export const handler = async (event) => {
  const parts = event.path.split('/');
  const type = parts[parts.length - 2];

  // Read skip from query
  const skip = parseInt(event.queryStringParameters?.skip || "0", 10);
  const limit = 20; // items per page

  // Fake dataset (later replaced by TMDB)
  const allItems = [
    "RRR",
    "KGF Chapter 1",
    "KGF Chapter 2",
    "Baahubali: The Beginning",
    "Baahubali: The Conclusion",
    "Pushpa: The Rise",
    "Pushpa 2",
    "Vikram",
    "Jailer",
    "Leo",
    "Salaar",
    "Sita Ramam",
    "3 Idiots",
    "Dangal",
    "Lagaan",
    "Andhadhun",
    "Drishyam",
    "Drishyam 2",
    "Pathaan",
    "Jawan",
    "Animal",
    "Rocky Aur Rani",
    "Brahmastra",
    "Kabir Singh",
    "Super 30",
    "Chak De India",
    "PK",
    "Munna Bhai MBBS",
    "Dil Chahta Hai",
    "Swades"
  ];

  // Slice based on skip
  const page = allItems.slice(skip, skip + limit);

  const metas = page.map((name, index) => ({
    id: `streamindian:${skip + index}`,
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