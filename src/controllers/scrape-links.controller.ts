import { Request, Response } from "express";
import puppeteer from 'puppeteer';
import { DOC_URL } from "../utils/constant";
import fs from 'fs';

const scrapeLinks = async (req: Request, res: Response) => {
    try {
        const browser = await puppeteer.launch({
            headless: true
        });

        const page = await browser.newPage();
        await page.goto(DOC_URL);

        const links = await page.evaluate(() => {
            const div = document.querySelector('.sidebar-content ul');
            if (!div) return [];

            const linkElements = div.querySelectorAll('a');
            return Array.from(linkElements).map(link => ({
                topic: link.textContent?.trim() || '',
                href: link.getAttribute('href') || ''
            }));
        });

        await browser.close();
        await fs.promises.writeFile(
            "src/utils/blog-links.json", 
            JSON.stringify(links, null, 2)
          );
        res.status(200).json({
            success: true,
            data: links,
        });
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to scrape links',
            error: (error as Error).message
        });
    }
};

export default scrapeLinks;