import { encode, decode } from "cborg";
const data = await Bun.file("./data/5k.json").json();

const optimized = data.data.map((item) => [
  item.date_created,
  item.primary_name,
  item.manifest.thumbUuid,
  item.culture?.[0] || "Unknown",
]);

// images can be reconstructed with: https://media.getty.edu/iiif/image/<id>/full/!500,500/0/default.jpg

Bun.write("public/encoded.bin", encode(optimized));
