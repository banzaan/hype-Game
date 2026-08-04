class ObstacleManager {
    constructor() {
        this.obstacles = new PIXI.Container();
        this.newsList = [
            { title: "FOMO in the SOC: Where AI Platforms like Claude Actually Fit", url: "https://thehackernews.com" }
        ];
        this.hasShownNews = false; 

        for (let i = 0; i < 1; i++) {
            const obstacleItem = new PIXI.Container();

            const cactus = new PIXI.Sprite(sheet.textures["cactus.png"]);
            cactus.scale.set(Math.random() * 0.1 + 0.25);
            cactus.y = -cactus.height;
            obstacleItem.addChild(cactus);

            obstacleItem.x = i * 220;
            this.obstacles.addChild(obstacleItem);
        }

        this.obstacles.y = app.renderer.height;
        this.obstacles.x = app.renderer.width * 3;

        app.stage.addChildAt(this.obstacles, app.stage.children.length - 2);

        this.fetchDynamicNews();
    }

    async fetchDynamicNews() {
        try {
            const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://thehackernews.com/rss.xml');
            const data = await response.json();
            
            if (data && data.items && data.items.length > 0) {
                this.newsList = data.items.map(item => ({
                    title: "⚠️ " + item.title,
                    url: item.link
                }));
            }
        } catch (error) {
            console.log("Error fetching news:", error);
        }
    }

    update() {
        this.obstacles.position.x -= 5.5 * speed;

        const cactusGlobalX = this.obstacles.x;


        if (cactusGlobalX > app.renderer.width - 200 && !this.hasShownNews && !dino.dead) {
            const randomNews = this.newsList[Math.floor(Math.random() * this.newsList.length)];
            

            if (typeof window.triggerNextNews === 'function') {
                window.triggerNextNews(randomNews.title, randomNews.url);
            }

            this.hasShownNews = true;
        }

        if (this.obstacles.x <= -this.obstacles.width) {
            this.obstacles.x = app.renderer.width + speed * 100 + Math.random() * 200 * speed;
            this.obstacles.y = app.renderer.height;
            this.hasShownNews = false; 

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
