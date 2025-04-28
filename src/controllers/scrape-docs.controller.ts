import { QdrantVectorStore } from '@langchain/qdrant';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Request, Response } from 'express';
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import fs from 'fs';
import { DOC_BASE_URL, LINKS_FILE_PATH } from '../utils/constant';
import formatHref from '../utils/format-href';

export type LinkData = {
    topic: string,
    href: string
}
const embedder = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GEMINI_API_KEY,
});

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
});


const createLoader = (url: string) => {
    return new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        gotoOptions: {
            waitUntil: 'networkidle2',
        },
        evaluate: async (page) => {
            return await page.evaluate(() => {
                const articleContent = document.querySelector('main');
                if (articleContent) {
                    return articleContent.innerHTML;
                }
                return '';
            });
        }
    });
};
function getSeriesName(url:string) {
    const parts = url.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length >= 2) {
      return parts[1]; // Returns 'chai-aur-html'
    } else {
      return ""; // Returns null if the URL doesn't have enough segments
    }
  }
export const readLinksFromFile = async (): Promise<LinkData[]> => {
    try {
        if (!fs.existsSync(LINKS_FILE_PATH)) {
            console.log('Links file does not exist yet');
            return [];
        }

        const data = await fs.promises.readFile(LINKS_FILE_PATH, 'utf-8');
        return JSON.parse(data) as LinkData[];
    } catch (error) {
        console.error('Error reading links from file:', error);
        return [];
    }
};


const scrapeDocs = async (req: Request, res: Response) => {
    try {
        const urls = await readLinksFromFile();

        if (!urls.length) {
            res.status(400).json({
                success: false,
                message: 'No URLs to process'
            });
        }

        const results = [];
        const client = process.env.QDRANT_CLIENT;
        const apiKey = process.env.QDRANT_API_KEY;

        if (!client || !apiKey) {
            res.status(500).json({
                success: false,
                message: 'Missing Qdrant configuration'
            });
        }

        const concurrencyLimit = 3;
        const batches = [];

        for (let i = 0; i < urls.length; i += concurrencyLimit) {
            const batch = urls.slice(i, i + concurrencyLimit);
            batches.push(batch);
        }

        for (const batch of batches) {
            const batchPromises = batch.map(async (url) => {
                try {
                    const loader = createLoader(`${DOC_BASE_URL}/${url.href}`);
                    const docs = await loader.load();
                    const splitDocs = await textSplitter.splitDocuments(docs);

                    await QdrantVectorStore.fromDocuments(splitDocs, embedder, {
                        url: client,
                        collectionName: formatHref(url.href),
                        apiKey: apiKey
                    });

                    return {
                        url: url.href,
                        success: true,
                        docsCount: splitDocs.length
                    };
                } catch (error) {
                    console.error(`Error processing ${url.href}:`, error);
                    return {
                        url: url.href,
                        success: false,
                        error: (error as Error).message
                    };
                }
            });

            // Wait for current batch to complete before moving to next batch
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        res.status(200).json({
            success: true,
            message: 'Documents scraped and vectorized',
            data: results,
        });
    } catch (error) {
        console.error('Error in scrapeDocs:', error);
        res.status(500).json({
            success: false,
            message: 'Error while scraping or vectorizing',
            error: (error as Error).message
        });
    }
};

export default scrapeDocs;