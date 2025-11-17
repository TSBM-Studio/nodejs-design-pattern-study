import fs from "fs/promises";
import path from "path";
import { URL } from "url";
import fetch from "node-fetch";

const visitedUrls = new Set();

async function download(url, filename) {
  console.log(`Downloading ${url}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} for ${url}`);
  }

  const body = await response.text();
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, body);

  console.log(`Downloaded and saved: ${filename}`);
  return body;
}

function urlToFilename(url) {
  const { hostname, pathname } = new URL(url);
  let filename = path.join(hostname, pathname);
  if (filename.endsWith("/")) {
    filename += "index.html";
  }
  return path.join("downloads", filename);
}

function getPageLinks(url, body) {
  // TODO: parse HTML and extract links
  return [];
}

async function spider(url) {
  if (visitedUrls.has(url)) {
    return;
  }
  visitedUrls.add(url);

  const filename = urlToFilename(url);

  let body;
  try {
    body = await download(url, filename);
  } catch (err) {
    console.error(`Error downloading ${url}:`, err);
    return; // non-fatal: log and continue
  }

  const links = getPageLinks(url, body);

  // WARNING: sequential crawling, very slow when many links
  for (const link of links) {
    await spider(link);
  }
}

async function main() {
  const url = process.argv[2] ?? "https://example.com/";
  await spider(url);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
