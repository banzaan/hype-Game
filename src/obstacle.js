class ObstacleManager {
    constructor() {
        this.obstacles = new PIXI.Container();
        this.newsList = [];
        this.hasShownNews = false; 

        for (let i = 0; i < 3; i++) {
            const cactus = new PIXI.Sprite(sheet.textures["cactus.png"]);
            cactus.scale.set(Math.random() * 0.12 + 0.35);
            cactus.y = -cactus.height;
            cactus.x = i * 80;
            this.obstacles.addChild(cactus);
        }

        this.obstacles.y = app.renderer.height;
        this.obstacles.x = app.renderer.width * 3;
        app.stage.addChildAt(this.obstacles, app.stage.children.length - 2);

        this.fetchDynamicNews();
    }

    async fetchDynamicNews() {
        const feedUrls = [
            'https://thehackernews.com/rss.xml',
            'https://www.bleepingcomputer.com/feed/',
            'https://krebsonsecurity.com/feed/',
            'https://portswigger.net/research/rss',
            'https://securelist.com/feed/'
        ];

        try {
            const promises = feedUrls.map(url => 
                fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
                    .then(res => res.json())
                    .catch(err => {
                        console.log(`Error fetching ${url}:`, err);
                        return null;
                    })
            );

            const results = await Promise.all(promises);
            let allItems = [];

            results.forEach(data => {
                if (data && data.items && data.items.length > 0) {
                    const formattedItems = data.items.map(item => ({
                        title: "⚠️ " + item.title,
                        url: item.link
                    }));
                    allItems = allItems.concat(formattedItems);
                }
            });

            this.newsList = allItems;
        } catch (error) {
            console.log("Error fetching news feeds:", error);
        }
    }

    update() {
        this.obstacles.position.x -= 5.5 * speed;

        const cactusGlobalX = this.obstacles.x;

        if (cactusGlobalX > app.renderer.width - 200 && !this.hasShownNews ) {
            if (this.newsList.length > 0) {
                const randomNews = this.newsList[Math.floor(Math.random() * this.newsList.length)];
                

                const titleLower = randomNews.title.toLowerCase();
                const aiKeywords = [

                    'chatgpt', 'openai', 'gemini', 'claude', 'anthropic', 'llama', 'meta ai', 
                    'copilot', 'midjourney', 'stable diffusion', 'deepseek', 'mistral', 'grok', 'xai',
                    'llm', 'large language model', 'generative ai', 'genai', 'neural network', 
                    'prompt injection', 'jailbreak', 'hallucination', 'ai model', 'ai agent', 'ai-assisted'
                ];
                window.isAIWeaknessTitle = aiKeywords.some(keyword => titleLower.includes(keyword));
                const humanFailureKeywords = [
                    'human error', 'misconfiguration', 'negligence', 
                    'phishing', 'social engineering', 'credential theft', 
                    'replaced by ai', 'job loss', 'layoffs', 'scam', 'man', 'guilty', 'extortion', 'pleads', 'fraud', 'arrested'
                ];
                
                window.isHumanFailureTitle = humanFailureKeywords.some(keyword => titleLower.includes(keyword));
                if (typeof window.triggerNextNews === 'function') {
                    window.triggerNextNews(randomNews.title, randomNews.url);
                }
            }
            this.hasShownNews = true;
        
        }

        if (this.obstacles.x <= -this.obstacles.width) {
            for (let obstacle of this.obstacles.children) {
                obstacle.scale.set(Math.random() * 0.12 + 0.35);
                obstacle.y = -obstacle.height;
            }
            this.obstacles.x = app.renderer.width + speed * 100 + Math.random() * 200 * speed;
            this.obstacles.y = app.renderer.height;
            this.hasShownNews = false; 
            if (typeof dino !== 'undefined' && dino.shadowDead) {
                dino.reviveShadow();
            }
            if (restarting) {
                this.obstacles.x = app.renderer.width * 3;
                this.hasShownNews = false;
                dino.dino.destroy();
                dino = new Dino();
            }
            if (speed < 8) {
                speed += 0.05;
                dino.dino.animationSpeed = 0.35 * speed / 2;
            }
        }
    }
}
