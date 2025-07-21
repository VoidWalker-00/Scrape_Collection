import { TableScraper } from "./tableScraper.js";
import { generateProjectName } from "./misc.js";
import { SocketServer, Logger } from "./logging.js";
import path from "path";

async function main() {
  const url =
    "https://www.worldometers.info/world-population/population-by-country/";
  const selectors = {
    table: "table.datatable",
    head: "thead",
    headerSelector: "th",
    tbody: "tbody",
    row: "tr",
    cellSelector: "td",
    nextLink: null,
  };

  const __dirname = process.cwd();
  const databasePath = path.join(__dirname, "Storage/Database");
  const loggerPath = path.join(__dirname, "Storage/Logs");

  const projectName = generateProjectName(databasePath, url);
  const socketPath = "/tmp/logger.sock";

  const socketClient = new SocketServer(socketPath);
  const logger = new Logger({
    socketClient,
    logFile: path.join(loggerPath, `${projectName}.log`),
    useConsole: true,
  });

  try {
    const scraper = new TableScraper(url, selectors, projectName, logger);

    await logger.info(`[GettingReady] Initializing with URL: ${url}`);
    await logger.info(
      `[GettingReady] Initializing with selector: ${JSON.stringify(selectors)}`,
    );
    await scraper.extract();

    // Make sure to only call close after ALL logging
    await logger.close();
  } catch (err) {
    logger.error("[main] Uncaught error: " + err);
    await logger.close();
  }
}

main();
