import { TableScraper } from "./tableScraper.js";
import { generateProjectName } from "./misc.js";
import { SocketServer, Logger } from "./logging.js";
import path from "path";
// import fs from "fs";
import selectors from "./Selectors.json" assert { type: "json" };

async function main() {
  const __dirname = process.cwd();
  const databasePath = path.join(__dirname, "Storage/Database");
  const loggerPath = path.join(__dirname, "Storage/Logs");

  const url =
    "https://www.worldometers.info/world-population/population-by-country/";
  // const selectors = JSON.parse(
  //   fs.readFileSync(path.join(__dirname, "Selectors.json"), "utf-8"),
  // );

  const projectName = generateProjectName(databasePath, url);
  const databaseFile = path.join(databasePath, `${projectName}.xlsx`);
  const logFile = path.join(loggerPath, `${projectName}.log`);
  const socketPath = "/tmp/logger.sock";

  const socketClient = new SocketServer(socketPath);
  const logger = new Logger({
    socketClient,
    logFile: logFile,
    useConsole: true,
  });

  try {
    const scraper = new TableScraper(url, selectors, projectName, logger);

    await logger.info(
      "Log",
      `[GettingReady] Initializing with URL: ${url}`,
      "info",
    );
    await logger.info(
      "Log",
      `[GettingReady] Initializing with selector: ${JSON.stringify(selectors)}`,
      "info",
    );
    socketClient.send("Table", databaseFile);
    await scraper.extract(databaseFile);

    // Make sure to only call close after ALL logging
    await logger.close();
  } catch (err) {
    logger.error("[main] Uncaught error: " + err);
    await logger.close();
  }
}

main();
