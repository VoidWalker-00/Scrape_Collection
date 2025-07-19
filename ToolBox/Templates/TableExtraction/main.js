import { TableScraper } from "./tableScraper";

function main(url, selectors) {
  const scraper = new TableScraper();
  scraper.gettingReady(url, selectors);
  scraper.init();
  scraper.extract();
  scraper.close();
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
  nextLink: "a.next",
};
main(url);
