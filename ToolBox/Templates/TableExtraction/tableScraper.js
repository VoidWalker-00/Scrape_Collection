import puppeteer from "puppeteer";
import { path } from "path";
import { generateProjectName } from "./misc";

export class TableScraper {
  // 1. GettingReady
  async gettingReady(url, selectors) {
    console.log(`[GettingReady] Initializing with URL: ${url}`);
    this.url = url;
    this.selectors = selectors;
    this.projectName = generateProjectName(
      path.join(__dirname, "Storage/Database"),
      url,
    );
    this.exportPath = path.join(__dirname, "Storage/Database");
    this.logPath = path.join(__dirname, "Storage/Logs");
    console.log(`[GettingReady] Project initialized as: ${this.projectName}`);
  }

  // 2. Starting browser
  async init() {
    console.log("[Init] Launching Puppeteer browser...");
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    this.page = await this.browser.newPage();
    console.log("[Init] Browser launched and page created.");
  }

  // 3. Close browser
  async close() {
    console.log("[Close] Closing browser...");
    await this.browser.close();
    console.log("[Close] Browser closed.");
  }

  // 4. Goto Next Page
  async goto(url) {
    console.log(`[Goto] Navigating to: ${url}`);
    await this.page.goto(url);
    console.log(`[Goto] Navigation complete.`);
  }

  // 5. Extract table
  async getTable() {
    console.log("[GetTable] Starting table extraction...");
    const data = await this.page.evaluate((selector) => {
      const table = document.querySelector(selector.table);
      if (!table) {
        console.warn("[GetTable] Table not found!");
        return null;
      }

      const headerEls = table
        .querySelector(selector.head)
        .querySelectorAll(selector.headerSelector);

      const header = Array.from(headerEls).map((el) => el.textContent.trim());

      const tbody = table.querySelector(selector.tbody);
      const rows = Array.from(tbody.querySelectorAll(selector.rowSelector));
      const body = rows.map((row) =>
        Array.from(row.querySelectorAll(selector.cellSelector)).map((cell) =>
          cell.textContent.trim(),
        ),
      );

      return { header, body };
    }, this.selectors);

    if (data) {
      console.log(
        `[GetTable] Extracted Header: ${JSON.stringify(data.header)}`,
      );
      console.log(`[GetTable] Extracted ${data.body.length} rows`);
    }

    return data;
  }
}
