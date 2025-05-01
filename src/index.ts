import dotenv from "dotenv"
dotenv.config();
import express from "express";
import scrapeDocs from "./controllers/scrape-docs.controller";
import scrapeLinks from "./controllers/scrape-links.controller";
import chatWithDocs from "./controllers/chat-with-docs.controller";
import cors from "cors";
const app = express();
app.use(cors({
  origin: "https://chaidocs.vercel.app",
}));
app.use(express.json());
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
})

app.get('/', (req, res) => {
  res.json('☕ Welcome to ChaiDocs')
})
app.use('/scrape-docs',scrapeDocs)
app.use('/scrape-links',scrapeLinks)
app.post('/chai-chat',chatWithDocs)

