import pool from "../db.js";
import * as cheerio from "cheerio";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { generateSummary } from "../services/openaiService.js";

//scrape with cheerio
async function scrapeWithCheerio(urlOrHtml, isHtml = false) {
  try {
    let html = urlOrHtml;
    if (!isHtml) {
      const { data } = await axios.get(urlOrHtml, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      html = data;
    }

    const $ = cheerio.load(html);
    const brand = $("title").text() || "Unbranded";
    const description =
      $('meta[name="description"]').attr("content") || "No description";

    return { brand, description };
  } catch (err) {
    console.error("Cheerio failed:", err.message);
    throw err;
  }
}


//scrape with puppeteer
async function scrapeWithPuppeteer(url) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "en-US,en;q=0.9"
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  const content = await page.content();
  await browser.close();
  return scrapeWithCheerio(content, true);
}

// analyze website
export async function analyzeWebsite(req, res) {

  try {
    const { url } = req.body;
    let websiteContent;
    try {
      websiteContent = await scrapeWithPuppeteer(url);
    } catch {
      websiteContent = await scrapeWithCheerio(url);
    }
    const aiSummary = await generateSummary(websiteContent.description);

    const result = await pool.query("INSERT INTO websites (url, brand,description, aiSummary) VALUES ($1, $2, $3, $4)RETURNING *",
      [url, websiteContent.brand, websiteContent.description, aiSummary]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error in analyzeWebsite:", error);
    res.status(500).json({ error: error.message });
  }
}

//get all websites
export async function getWebsites(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM websites ORDER BY created_at DESC;");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//update website
export async function updateWebsite(req, res) {
  const { id } = req.params;
  const { brand, description } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE websites
       SET brand = $1, description = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *;`,
      [brand, description, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Website not found" })
    };
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// delete website
export async function deleteWebsite(req, res) {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(`DELETE FROM websites WHERE id = $1;`, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Website not found" });
    }
    res.json({ message: "Website deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
