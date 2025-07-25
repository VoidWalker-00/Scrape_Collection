import fs from "fs";
import path from "path";
import { URL } from "url";
import { Workbook } from "exceljs";

export function generateProjectName(baseDir, url) {
  // Sanitize URL into name
  let urlName;
  try {
    const parsed = new URL(url);
    urlName = parsed.hostname.replace(/\./g, "_");
  } catch (e) {
    urlName = "unknown";
  }

  // Get current date
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const base = `${date}_${urlName}`;

  // Generate unique number prefix
  let num = 1;
  let finalName;
  do {
    finalName = `${String(num).padStart(3, "0")}_${base}`;
    num++;
  } while (fs.existsSync(path.join(baseDir, finalName)));

  return finalName;
}

/**
 * Pretty-print a table given header and body rows
 * @param {string[]} header - Array of column names
 * @param {string[][]} body - Array of row arrays
 * @returns {string} - Table as string
 */
export default function printTable(header, body) {
  // Combine header and body to compute max column widths
  const rows = [header, ...body];
  const colWidths = header.map((_, i) =>
    Math.max(...rows.map((row) => (row[i] ? String(row[i]).length : 0))),
  );

  // Function to print a row
  const printRow = (row) =>
    "| " +
    row
      .map((cell, i) => String(cell ?? "").padEnd(colWidths[i], " "))
      .join(" | ") +
    " |";

  // Create the separator row
  const sep = "|-" + colWidths.map((w) => "-".repeat(w)).join("-|-") + "-|";

  // Print header, separator, and body
  const lines = [printRow(header), sep, ...body.map(printRow)];

  return lines.join("\n");
}

export class ExcelWriter {
  constructor(filePath) {
    this.workbook = new Workbook();
    this.worksheet = this.workbook.addWorksheet("Sheet1");
    this.filePath = filePath;
  }

  async write() {
    await this.workbook.xlsx.writeFile(this.filePath);
  }

  async createTable(header, body) {
    const table = this.worksheet.addTable({
      name: "Table",
      ref: "A1",
      headerRow: true,
      columns: header.map((col) => ({ name: col })),
      rows: body,
    });

    await this.write();
    return table;
  }

  async addRows(table, rows) {
    table.addRow(rows);
    table.commit();

    await this.write();
  }
}

export function sendTableMeta(socketClient, { filePath, url, ...extra }) {
  const payload = {
    filePath,
    url,
    ...extra,
  };
  socketClient.send(JSON.stringify(payload) + "\n");
}
