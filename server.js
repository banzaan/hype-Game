require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


let analyzedNewsCache = [];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateAndAnalyzeNews() {
    console.log("⏳ Fetching and analyzing news with Gemini...");
    
    const feedUrls = [
        'https://thehackernews.com/rss.xml',
        'https://www.bleepingcomputer.com/feed/',
        'https://krebsonsecurity.com/feed/',
        'https://securelist.com/feed/'
    ];

    try {
        let allItems = [];
        for (const url of feedUrls) {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
            const data = await response.json();
            if (data && data.items) {
                allItems = allItems.concat(data.items.slice(0, 10)); 
            }
        }

        let freshNews = [];

        for (let i = 0; i < allItems.length; i++) {
            let item = allItems[i];
            
            const prompt = `Analyze this cybersecurity and tech news headline: "${item.title}".
            To evaluate accurately, keep these criteria in mind:
            - Consider whether the headline implies a crisis, breakdown, or weakness specifically for AI systems.
            - Consider whether it implies user harm, financial loss, wasted time, or data leaks.
            
            Based on your analysis, determine:
            1. isAI (boolean): True if this headline indicates a critical failure, weakness, or crisis specifically in an AI model or system. Otherwise false.
            2. isHuman (boolean): True if this headline indicates a direct human error, configuration mistake, or negligence. Otherwise false.
            3. projectName (string): Extract the main software, platform, company, or tool name mentioned in the headline. If none, return "General".
            4. question (string or null): If a specific project name is found, create a short, engaging Yes/No question addressed to the player asking if they have used it, formatted like: "Did you ever work with [projectName]?". If projectName is "General", return null.
            
            Return ONLY a valid JSON object with format: 
            {
               "isAI": true/false, 
               "isHuman": true/false, 
               "projectName": "Name or General", 
               "question": "The generated question or null"
            }`;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: prompt,
                });
                
                let textRes = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                let analysis = JSON.parse(textRes);

                const analyzedItem = {
                    title: item.title,
                    url: item.link,
                    isAI: analysis.isAI,
                    isHuman: analysis.isHuman,
                    projectName: analysis.projectName,
                    question: analysis.question
                };

                freshNews.push(analyzedItem);
                analyzedNewsCache = [...freshNews]; 

                console.log(`Processed item ${i + 1} of ${allItems.length}`);
                await delay(10000);

            } catch (err) {
                console.log(`Error analyzing item ${i}:`, err.message);
                await delay(10000);
            }
        }

        console.log("✅ News update process finished. Total cached:", analyzedNewsCache.length);

    } catch (error) {
        console.log("❌ Error in background news task:", error);
    }
}

app.get('/api/news', (req, res) => {
    if (analyzedNewsCache.length === 0) {
        await updateAndAnalyzeNews();
    }
    res.json(analyzedNewsCache);
});


//updateAndAnalyzeNews();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
});
