import puppeteer from "puppeteer";
import { path } from "path";
import { generateProjectName } from "./misc";

class TableScraper {
  // 1. GettingReady
  async gettingReady(url) {
    // Load `Tag_Log.json`, extract selectors for the given URL
    this.url = url;
    this.selectors = {
      table: "table",
      head: "thead",
      tbody: "tbody",
      row: "tr",
      nextLink: "a.next",
    };
    this.projectName = generateProjectName(
      path.join(__dirname, "Storage/Database"),
      url,
    );
    this.exportPath = path.join(__dirname, "Storage/Database");
    this.logPath = path.join(__dirname, "Storage/Logs");
  }

  // 2. Starter
  async starter() {
    // Launch Puppeteer browser instance
    // Navigate to URL
    this.browser = puppeteer.launch({
      headless: false,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    const page = await this.browser.newPage();
    await page.goto(this.url);

    return page;
  }

  // 3. Ender
  async ender() {
    // Close browser instance
    await this.browser.close();
  }

  // 4. GatherTable
  async gatherTable() {
    // Use page.$eval() or page.$$eval() to extract data
    // Return as JSON
	const page = await this.starter();
	const data = await page.eval((selector) => {
		const table = document.querySelector(selector.table);
		const head = table.querySelector(selector.head);
		const tbody = table.querySelector(selector.tbody);
		const rows = tbody.querySelectorAll(selector.row);
		const tableData = [];
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowData = {};
	}, this.selectors);
  }

  // 5. GatherNextLink
  async gatherNextLink() {
    // Extract next page URL using pagination selector
  }

  // 6. Exporter
  async exporter(jsonData) {
    // Save JSON to Google Sheets or local file
  }

  // 7. Assemble
  async assemble(url) {
    // Orchestrate the full scraping flow
    // Includes logging, error handling, chaining
  }
}
