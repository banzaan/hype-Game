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

        this.fetchNewsFromBackend();
    }

    async fetchNewsFromBackend() {
        try {
            const response = await fetch('https://bandino.duckdns.org/api/news');
            const data = await response.json();
            if (data && data.length > 0) {
                this.newsList = data; 
                console.log("News loaded successfully in ObstacleManager:", this.newsList.length);
            }
        } catch (error) {
            console.log("Error fetching news from backend:", error);
        }
    }

    update() {
        this.obstacles.position.x -= 5.5 * speed;

        const cactusGlobalX = this.obstacles.x;

        if (cactusGlobalX > app.renderer.width - 200 && !this.hasShownNews) {
            if (this.newsList.length > 0) {
                const selectedNews = this.newsList[Math.floor(Math.random() * this.newsList.length)];
                
                window.isAIWeaknessTitle = selectedNews.isAI;
                window.isHumanFailureTitle = selectedNews.isHuman;

                if (typeof window.triggerNextNews === 'function') {
                    window.triggerNextNews(selectedNews);
                }
            } else {
                this.fetchNewsFromBackend();
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
