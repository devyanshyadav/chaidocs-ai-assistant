import { Request, Response } from "express";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenAI } from "@google/genai";
import docUrls from "../utils/blog-links.json";
import formatHref from "../utils/format-href";

const chatWithDocs = async (req: Request, res: Response) => {
    const { apiKey, query } = req.body;
    const ai = new GoogleGenAI({ apiKey });
    const embedder = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey
    });

    const modifyPrompt = async () => {
        const systemPrompt = `
You are a precise assistant for navigating the ChaiDocs website, similar to W3Schools. Your task is to return URL(s) from the provided list that match the user's query and provide a natural, concise answer using your coding knowledge. Follow these rules:

1. **URL Selection**:
   - Use only the provided URLs: ${docUrls.map(url => `${url.href}`).join(', ')}.
   - Return an array of URL(s) matching the query's intent. Include multiple URLs if needed, or an empty array if no match.
   - Never generate or include URLs not in the list.

2. **Response**:
   - Analyze the query, even if it has errors or is vague, to infer intent.
   - Provide a concise (1-5 sentences), natural answer that directly addresses the query using its key terms, leveraging your coding knowledge freely, and aligns with the matched URL(s) content if applicable, without referencing URLs, tutorials, or website content.
   - If no URLs match, answer the query confidently if it relates to coding topics you understand, or suggest clarification for unrelated topics.

3. **Output**:
   - Return a JSON object with "topics" (array of URLs) and "hydeResponse" (natural answer).
   - Example:
     Query: "What is PostgreSQL?"
     Output:
     {
       "topics": ["https://chaidocs.com/chai-aur-postgresql/basics"],
       "hydeResponse": "PostgreSQL is a powerful, open-source database system that uses SQL to manage data."
     }
     Query: "How to use Docker commands"
     Output:
     {
       "topics": [],
       "hydeResponse": "Docker commands like 'docker run' or 'docker build' let you create and manage containers for applications."
     }
     Query: "What is blockchain?"
     Output:
     {
       "topics": [],
       "hydeResponse": "Blockchain isn't covered on ChaiDocs. Try clarifying or check the website for other topics."
     }

4. **Constraints**:
   - Do not fabricate URLs or content.
   - Avoid phrases like "tutorial," "guide," "website," "I found," or "aren't covered" in hydeResponse. Answer confidently using your coding knowledge.
   - Keep hydeResponse concise, conversational, and query-focused.
   - Exclude URLs from hydeResponse.

Process the query and return the JSON output.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: query,
            config: {
                systemInstruction: systemPrompt
            }
        });

        return JSON.parse((response.text?.replace(/^```json\s*|\s*```$/gm, '')
            .replace(/^```.*$/gm, '')
            .trim() as string)); // Parse the JSON response
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
            const searchResults = await vectorStore.similaritySearch(query);
            context += searchResults.map((doc) => doc.pageContent).join('\n\n') + '\n\n';
        }

        if (!topics.length) {
            const defaultCollection = "Welcome(chai-aur-general)"; // Fallback collection
            const vectorStore = new QdrantVectorStore(embedder, {
                url: process.env.QDRANT_CLIENT,
                apiKey: process.env.QDRANT_API_KEY,
                collectionName: defaultCollection
            });
            const searchResults = await vectorStore.similaritySearch(query);
            context = searchResults.map((doc) => doc.pageContent).join('\n\n');
        }

        const finalSystemPrompt = `
You are a helpful assistant that answers questions using the provided context and your coding knowledge. 

Context: ${context}
`;

        const finalResponse = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: query,
            config: {
                systemInstruction: finalSystemPrompt
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