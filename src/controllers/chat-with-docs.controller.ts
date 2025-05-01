import { Request, Response } from "express";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenAI } from "@google/genai";
import docUrls from "../utils/blog-links.json";
import formatHref from "../utils/format-href";
import { decrypt } from "../utils/secure-pwd";
import { systemPrompt02 } from "../utils/prompts/system-prompt02";
import { systemPrompt01 } from "../utils/prompts/system-prompt01";
import { NodeHtmlMarkdown } from 'node-html-markdown'

const chatWithDocs = async (req: Request, res: Response) => {
    const { query } = req.body;
    const apiKey = decrypt(req.body.apiKey);
    const ai = new GoogleGenAI({ apiKey });
    const embedder = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey
    });

    const modifyPrompt = async () => {

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: query,
            config: {
                systemInstruction: systemPrompt01(docUrls),
            }
        });
        return JSON.parse((response.text?.replace(/^```json\s*|\s*```$/gm, '')
            .replace(/^```.*$/gm, '')
            .trim() as string));
    };

    try {
        if (!apiKey || !query) throw new Error('Missing credentials');

        const initialResponse = await modifyPrompt();

        const { topics, hydeResponse } = initialResponse;


        let context = "";
        for (const topic of topics) {
            const vectorStore = new QdrantVectorStore(embedder, {
                url: process.env.QDRANT_CLIENT,
                apiKey: process.env.QDRANT_API_KEY,
                collectionName: formatHref(topic)
            });
            const searchResults = await vectorStore.similaritySearch(hydeResponse);
            context += searchResults.map((doc) => doc.pageContent).join('\n\n') + '\n\n';
        }
        console.log(context)

        const finalResponse = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: query,
            config: {
                systemInstruction: systemPrompt02(NodeHtmlMarkdown.translate(context)),
            }
        });

        res.status(200).json({
            error: null,
            data: {
                topics,
                hydeResponse,
                finalResponse: finalResponse.text
            }
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            data: null,
            error: error instanceof Error ? error.message : 'An error occurred while processing the request'
        });
    }
};

export default chatWithDocs;