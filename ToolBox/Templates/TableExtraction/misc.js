const fs = require("fs");
const path = require("path");
const { URL } = require("url");

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
