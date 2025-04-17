// This script is for cropping ABI from JSON file obtained from specific contracts
const fs = require("fs");
const path = require("path");

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Provide an input filename, e.g., `node scripts/crop-abi.js yield.json`");
  process.exit(1);
}

const inputPath = path.join(__dirname, "..", "src", "abi", inputFile);
const outputFile = inputFile.replace(".json", ".min.json");
const outputPath = path.join(__dirname, "..", "src", "abi", outputFile);

try {
  const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  if (!data.abi) {
    console.error(`ABI field not found in ${inputFile}`);
    process.exit(1);
  }

  fs.writeFileSync(outputPath, JSON.stringify(data.abi, null, 2));
  console.log(`Cropped ABI saved to ${outputFile}`);
} catch (err) {
  console.error(`Error processing file ${inputFile}:`, err.message);
  process.exit(1);
}
