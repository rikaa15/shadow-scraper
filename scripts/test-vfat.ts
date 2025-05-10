import fs from "fs";
import Decimal from "decimal.js";
import * as path from "node:path";

function readTSV(filePath: string): string[][] {
  try {
    // Read the file synchronously (use fs.readFile for async)
    const data = fs.readFileSync(path.resolve(filePath), 'utf-8');

    // Split by lines and then by tabs
    const rows = data
      .trim()
      .split('\n')
      .map(row => row.split('\t'));

    return rows;
  } catch (error) {
    console.error('Error reading TSV file:', error);
    return [];
  }
}

(async () => {
  try {
    let totalApr = new Decimal(0)
    let totalValues = 0
    const tsvData = readTSV('./scripts/vfat_usdce.tsv');
    for(let line = 0; line < tsvData.length; line++) {
      if(line > 0) {
        const apr = Number(tsvData[line][11])
        if(apr > 0) {
          totalApr = totalApr.add(apr)
          totalValues += 1
        }
      }
    }
    const avgApr = totalApr.div(totalValues).toNumber()
    console.log('avgApr', avgApr)
  } catch (error) {
    console.error("Error running getSpectraInfo:", error);
  }
})();
