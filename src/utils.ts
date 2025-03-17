import fs from "fs";

export const exportToJson = (
  filename: string,
  items: any[]
) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filename);
    for (const item of items) {
      stream.write(JSON.stringify(item) + '\n');
    }
    stream.on('error', reject);
    stream.end(resolve);
  });
}

function arrayToCSV(array: any[]) {
  const headers = Object.keys(array[0]);
  const rows = array.map(obj =>
    headers.map(header => `"${obj[header]}"`).join(',')
  );
  return [
    headers.join(','), // Header row
    ...rows            // Data rows
  ].join('\n');
}

export const exportArrayToCSV = (
  filename: string,
  items: any[]
) => {
  const csv = arrayToCSV(items)
  fs.writeFileSync(filename, csv, 'utf8');
}
