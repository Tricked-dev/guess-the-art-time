import { decode, encode } from "cborg";
const data = await Bun.file("./data/5k.json").json();
const data2 = await Bun.file("./data/50k.json").json();

const filters: ((date: string) => boolean)[] = [
  function filterCenturies(date) {
    return !date?.includes("century");
  },
  function filterBefore(date) {
    return !date?.includes("before");
  },
  function filterAfter(date) {
    return !date?.includes("negative");
  },
  function filterText(date) {
    return !date?.includes("text");
  },
];

let removeText = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pattern = removeText
  .map((word) => "\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b")
  .join("|");

// Create a regular expression object with the pattern
const regex = new RegExp(pattern, "gi");

const optimized = [...data2.data, ...data.data]
  .filter(
    (item) =>
      filters.every((filter) => filter(item.date_created)) &&
      item?.primary_name &&
      item?.date_created
  )
  .map((item) => [
    item.date_created.split(";")[0].replace(regex, "").trim(),
    item.primary_name,
    item.manifest.thumbUuid,
    item.culture?.[0] || "Unknown",
  ]);

// images can be reconstructed with: https://media.getty.edu/iiif/image/<id>/full/!500,500/0/default.jpg

function partitionArray(array: any[], parts: number) {
  const chunkSize = Math.ceil(array.length / parts);
  const partitions = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    const partition = array.slice(i, i + chunkSize);
    partitions.push(partition);
  }

  return partitions;
}

let partitions = partitionArray(optimized, 10);

for (let i = 0; i < partitions.length; i++) {
  const data = partitions[i];
  Bun.write(`public/data/encoded-${i}.bin`, encode(data));
}
