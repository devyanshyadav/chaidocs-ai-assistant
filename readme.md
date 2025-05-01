# ChaiDocs AI Backend for ChatGenie

![ChaiDocs Banner](/public/banner.png)  
*ChaiDocs AI powers ChatGenie, your go-to Chrome extension for instant access to programming docs and blogs from ChaiDocs website.*

ChaiDocs AI is the backend server for **ChatGenie**, a powerful Chrome extension that enables developers to instantly access programming documentation, blogs, and tutorials from the ChaiDocs website (a resource similar to W3Schools). Built with Node.js, it leverages advanced AI models, vector search, and web scraping to deliver precise, natural language answers to coding-related queries, making it an essential tool for developers.

**ChatGenie** integrates seamlessly with your browser, allowing you to interact with ChaiDocs resources via a popup or context menu. Learn more about ChatGenie on the [Chrome Web Store](https://chromewebstore.google.com/detail/chaigenie-chat-powered-pr/leegenpbbglelignaoipjcaglbekpfpj).

## About ChatGenie

Chat with **ChaiGenie** to instantly access programming docs, blogs, and tutorials from ChaiDocs, right in your browser. Unlock a seamless learning experience with ChaiGenie, powered by Hitesh Choudhary’s *Chai aur Code* resources:

✨ **Key Features**:
- **Instant Access to Resources**: Retrieve programming docs and blogs from a pre-scraped vector database.
- **Intelligent Search**: Search across multiple languages like Python, JavaScript, and more with fast, relevant results.
- **Browser Integration**: Use via popup or context menu for quick access while browsing.
- **Personalized Learning**: Get related topic suggestions to enhance your coding journey.

## Features of ChaiDocs AI Backend

- **Automated Content Scraping**: Extracts documentation links and blog content from the ChaiDocs website.
- **Documentation Vectorization**: Processes and vectorizes content for efficient similarity-based search.
- **AI-Powered Chat**: Enables natural language interaction with documentation, delivering concise and accurate answers.
- **Vector Storage with Qdrant**: Stores vectorized documents for fast, relevance-based retrieval.
- **Google Generative AI Integration**: Utilizes advanced AI for embeddings and content generation.
- **Dynamic Topic Matching**: Maps user queries to relevant documentation URLs dynamically.

## Project Structure

### Key Files

- **`src/index.ts`**: Application entry point, initializing the Express server.
- **`src/controllers/scrape-links.controller.ts`**: Handles scraping of documentation links.
- **`src/controllers/scrape-docs.controller.ts`**: Scrapes and vectorizes documentation content.
- **`src/controllers/chat-with-docs.controller.ts`**: Manages AI-powered chat interactions with vectorized content.
- **`src/utils/constant.ts`**: Defines constants like base URLs and file paths.
- **`src/utils/format-href.ts`**: Formats URLs for consistency and readability.
- **`src/utils/blog-links.json`**: Stores scraped documentation links.
- **`src/utils/prompts`**: Include System Prompts.


## Prerequisites

- **Node.js**: Version 16 or higher
- **TypeScript**: For type-safe development
- **Qdrant**: A running instance for vector storage
- **Google Generative AI API Key**: For embeddings and content generation
- **npm**: Package manager for dependency installation

## Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd chaidocs
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the project root and add the following:
   ```env
   PORT=3000
   GEMINI_API_KEY=<your-google-genai-api-key>
   QDRANT_CLIENT=<your-qdrant-client-url>
   QDRANT_API_KEY=<your-qdrant-api-key>
   SECRET_KEY=<your-secret-key>
   ```

4. **Build the Project**:
   ```bash
   npm run build
   ```

5. **Run the Application**:
   ```bash
   npm run dev
   ```

## API Endpoints

The backend exposes the following endpoints to power ChatGenie:

- **GET /**: Returns a welcome message.
  ```bash
  curl http://localhost:3000/
  ```

- **GET /scrape-links**: Scrapes links from the ChaiDocs website.
  ```bash
  curl http://localhost:3000/scrape-links
  ```

- **POST /scrape-docs**: Scrapes and vectorizes documentation content.
  ```bash
  curl -X POST http://localhost:3000/scrape-docs
  ```

- **POST /chai-chat**: Interacts with documentation using natural language queries.
  ```bash
  curl -X POST http://localhost:3000/chai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "<your-google-genai-api-key>",
    "query": "What is PostgreSQL?"
  }'
  ```

### Example Response for `/chai-chat`
```json
{
  "error": null,
  "data": {
    "topics": ["https://chaidocs.com/chai-aur-postgresql/basics"],
    "hydeResponse": "PostgreSQL is a powerful, open-source database system that uses SQL to manage data.",
    "finalResponse": "PostgreSQL is an open-source relational database that uses SQL for querying and managing data efficiently."
  }
}
```

## Technologies Used

- **Node.js**: Backend runtime environment.
- **TypeScript**: Ensures type-safe development.
- **Express.js**: Web server framework for API endpoints.
- **Puppeteer**: Powers web scraping of documentation links and content.
- **LangChain**: Facilitates AI-powered document processing and vectorization.
- **Qdrant**: Vector database for efficient similarity search.
- **Google Generative AI**: Provides embeddings and content generation via the Gemini model.

## Usage

1. **Scrape Links**:
   Use the `/scrape-links` endpoint to collect documentation URLs from ChaiDocs. Links are saved to `src/utils/blog-links.json`.

2. **Vectorize Content**:
   Run the `/scrape-docs` endpoint to scrape content from collected URLs and store it in Qdrant collections (e.g., `Welcome(chai-aur-postgresql)`).

3. **Chat with Documentation**:
   Query the `/chai-chat` endpoint with natural language questions. The system:
   - Matches queries to relevant URLs.
   - Performs vector searches across dynamic collections.
   - Returns a concise, AI-generated response with matched URLs.