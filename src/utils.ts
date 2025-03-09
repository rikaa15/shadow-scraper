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
