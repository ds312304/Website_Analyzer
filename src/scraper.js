import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

//check for valid url
export function isValidUrl(url) {
    try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

//scrape the website with cheerio
export async function scrapeWithCheerio(url) {
    const response = await axios.get(url, {
        timeout: 15000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
        },
        validateStatus: () => true
    });

    if (response.status >= 400) {
        throw new Error(`Failed to scrape website: ${response.status}`);
    }

    const $ = cheerio.load(response.data);
    const brand = $('meta[property="og:site_name"]').attr('content') || $('meta[name:"application-name"]').attr("content") || $("title").first().text().trim() || null;

    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description').attr('content') || $("p").first().text().trim() || null;

    return { brand, description };
}


async function scrapeWithPuppeteer(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

  const brand = await page.title();
  const description = await page.$eval(
    "meta[name='description']",
    el => el.content,
  ).catch(() => null);

  await browser.close();

  return { brand: brand || null, description: description || null };
}

//scrape the website
export async function scrapeWebsite(url) {
  try {
    return await scrapeWithCheerio(url);
  } catch (err) {
    console.warn("Cheerio failed, trying Puppeteer...", err.message);
    return await scrapeWithPuppeteer(url);
  }
}
