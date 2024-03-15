import { decode, encode } from "cborg";
const data = await Bun.file("./data/5k.json").json();

const filters: ((date: string) => boolean)[] = [
  function filterCenturies(date) {
    return !date.includes("century");
  },
  function filterBefore(date) {
    return !date.includes("before");
  },
];

const optimized = data.data
  .filter((item) => filters.every((filter) => filter(item.date_created)))
  .map((item) => [
    item.date_created.split(";")[0],
    item.primary_name,
    item.manifest.thumbUuid,
    item.culture?.[0] || "Unknown",
  ]);

// images can be reconstructed with: https://media.getty.edu/iiif/image/<id>/full/!500,500/0/default.jpg

Bun.write("public/encoded.bin", encode(optimized));
