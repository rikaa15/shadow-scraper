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

export const camelToUnderscore = (str: string) => {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    // Add underscore before uppercase letter following lowercase letter
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    // Handle acronyms (uppercase followed by uppercase then lowercase)
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    // Add underscore before number following letter
    // .replace(/([a-zA-Z])(\d)/g, '$1_$2')
    // Add underscore before letter following number
    .replace(/(\d)([a-zA-Z])/g, '$1_$2')
    // Convert all to lowercase
    .toLowerCase();
}

export const arrayToTSV = <T extends Record<string, any>>(
  data: T[],
  columns?: string[],
) => {
  if (!data || data.length === 0) {
    return '';
  }
  const headers = columns || Object.keys(data[0])

  const rows = data.map((item) => {
    return headers
      .map((key) => {
        let value = item[key] ?? '';
        let strValue = String(value)
          .replace(/\t/g, '\\t')
          .replace(/\n/g, '\\n');
        if (strValue.includes('"')) {
          strValue = `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      })
      .join('\t');
  });

  const headerRow = headers
    .map(camelToUnderscore)
    .join('\t');

  // Combine header and rows with newlines
  return headerRow + '\n' + rows.join('\n');
}
