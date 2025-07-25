import puppeteer from "puppeteer";
import { printTable, ExcelWriter } from "./misc.js";

export class TableScraper {
  // 1. GettingReady
  constructor(url, selector, projectName, logger) {
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };

    this.url = url;
    this.selectors = selector;
    this.projectName = projectName;
    this.browser = null;
  }

  // 2. Starting browser
  async init() {
    await this.logger.info("[INFO] [Init] Launching Puppeteer browser...");
    this.browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    const page = await this.browser.newPage();
    await this.logger.info("[INFO] [Init] Browser launched and page created.");
    return page;
  }

  // 3. Close browser
  async close() {
    if (this.browser) {
      await this.logger.info("[INFO] [Close] Closing browser...");
      await this.browser.close();
      await this.logger.info("[INFO] [Close] Browser closed.");
    }
  }

  // 4. Goto Next Page
  async goto(url, page) {
    await this.logger.info(`[Goto] Navigating to: ${url}`);
    await page.goto(url);
    await this.logger.info(`[Goto] Navigation complete.`);
  }

  // 5. Extract table
  async getTable(page) {
    await this.logger.info("[INFO] [GetTable] Starting table extraction...");

    try {
      const data = await page.evaluate(async (selector) => {
        const table = document.querySelector(selector.table);
        if (!table) {
          await this.logger.warn("[WARN] [GetTable] Table not found!");
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
        await this.logger.info(
          `[GetTable] Extracted Header: ${JSON.stringify(data.header)}`,
        );
        await this.logger.info(`[GetTable] Extracted ${data.body.length} rows`);
        await this.logger.info("[INFO] [Table Body]:\n ", data.body);
        return data;
      }
    } catch (err) {
      await this.logger.error("[ERROR] [GetTable] Error:", err);
      return null;
    }
  }
  async getNextURL(page) {
    await this.logger.info("[INFO] [getNextURL] Called");

    try {
      const nextURL = await page.evaluate(async (selector) => {
        const nextLink = document.querySelector(selector.nextLink);
        if (!nextLink) {
          await this.logger.warn("[WARN] [getNextURL] Next link not found!");
          return null;
        }
        return nextLink.getAttribute("href");
      }, this.selectors);

      await this.logger.info("[INFO] [getNextURL] Returning:", nextURL);
      return nextURL;
    } catch (err) {
      await this.logger.error("[ERROR] [getNextURL] Error:", err);
      return null;
    }
  }

  async extract(databasePath) {
    await this.logger.info("[INFO] [extract] Extraction started");

    const writer = new ExcelWriter(databasePath);

    const page = await this.init();
    await this.goto(this.url, page);

    let result = await this.getTable(page);
    const nextURL = await this.getNextURL(page);

    const table = await writer.createTable(result.header, result.body);

    while (nextURL) {
      await this.goto(nextURL);
      const body = await this.getTable().body;
      result.body.push(...body);

      await writer.addRows(table, body);

      nextURL = await this.getNextURL();
    }

    await this.close();
    await this.logger.info("[INFO] [extract] Extraction finished");

    return result;
  }
}
