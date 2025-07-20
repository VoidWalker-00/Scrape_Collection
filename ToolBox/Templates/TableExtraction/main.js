import { TableScraper } from "./tableScraper.js";

function main(url, selectors) {
  const scraper = new TableScraper();
  scraper.gettingReady(url, selectors);
  scraper.extract();
}

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
main(url, selectors);
