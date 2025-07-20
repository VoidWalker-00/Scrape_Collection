import puppeteer from "puppeteer";
import path from "path";
import { generateProjectName } from "./misc.js";

export class TableScraper {
  // 1. GettingReady
  async gettingReady(url, selectors) {
    console.log(`[GettingReady] Initializing with URL: ${url}`);
    this.url = url;
    this.selectors = selectors;
    this.projectName = generateProjectName(
      path.join(process.cwd(), "Storage/Database"),
      url,
    );
    this.browser = null;
    this.exportPath = path.join(process.cwd(), "Storage/Database");
    this.logPath = path.join(process.cwd(), "Storage/Logs");
    console.log(`[GettingReady] Project initialized as: ${this.projectName}`);
  }

  // 2. Starting browser
  async init() {
    console.log("[Init] Launching Puppeteer browser...");
    this.browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    const page = await this.browser.newPage();
    console.log("[Init] Browser launched and page created.");
    return page;
  }

  // 3. Close browser
  async close() {
    if (this.browser) {
      console.log("[Close] Closing browser...");
      await this.browser.close();
      console.log("[Close] Browser closed.");
    }
  }

  // 4. Goto Next Page
  async goto(url, page) {
    console.log(`[Goto] Navigating to: ${url}`);
    await page.goto(url);
    console.log(`[Goto] Navigation complete.`);
  }

  // 5. Extract table
  async getTable(page) {
    console.log("[GetTable] Starting table extraction...");
    const data = await page.evaluate((selector) => {
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
      const rows = Array.from(tbody.querySelectorAll(selector.row));
      const body = rows.map((row) => {
        const cells = Array.from(row.querySelectorAll(selector.cellSelector));
        return cells.map((cell) => cell.textContent.trim());
      });

      return { header: header, body: body };
    }, this.selectors);

    if (data) {
      console.log(
        `[GetTable] Extracted Header: ${JSON.stringify(data.header)}`,
      );
      console.log(`[GetTable] Extracted ${data.body.length} rows`);
      console.log("[Table Body]:\n ", data.body);
      return data;
    }
    return null;
  }
  async getNextURL(page) {
    console.log("[getNextURL] Called");

    const nextURL = await page.evaluate((selector) => {
      const nextLink = document.querySelector(selector.nextLink);
      if (!nextLink) {
        console.warn("[getNextURL] Next link not found!");
        return null;
      }
      return nextLink.getAttribute("href");
    }, this.selectors);

    console.log("[getNextURL] Returning:", nextURL);
    return nextURL;
  }

  async extract() {
    console.log("[extract] Extraction started");
    const page = await this.init();
    await this.goto(this.url, page);
    let result = await this.getTable(page);
    const nextURL = await this.getNextURL(page);
    console.log(result.header);
    console.log(result.body);
    while (nextURL) {
      await this.goto(nextURL);
      const body = await this.getTable().body;
      result.body.push(...body);

      console.log(body);

      nextURL = await this.getNextURL();
    }

    await this.close();

    console.log("[extract] Extraction finished, result:", result);
    return result;
  }
}
