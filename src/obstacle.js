class ObstacleManager {
    constructor() {
        this.obstacles = new PIXI.Container();
        this.newsList = ["fiat :)"];
        this.activeNewsBox = null; 
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

    createNewsContainer(message) {
        const container = new PIXI.Container();

        const text = new PIXI.Text(message, {
            fontFamily: 'Arial',
            fontSize: 26,
            fill: 0xffffff,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: 380, 
            align: 'center'
        });
        text.x = 20;
        text.y = 18;

        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.8); 
        bg.drawRoundedRect(0, 0, 420, text.height + 36, 16);
        bg.endFill();

        container.addChild(bg);
        container.addChild(text);

        return container;
    }

    async fetchDynamicNews() {
        try {
            const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://thehackernews.com/rss.xml');
            const data = await response.json();
            
            if (data && data.items && data.items.length > 0) {
                this.newsList = data.items.map(item => "⚠️ " + item.title);
                console.log("");
            }
        } catch (error) {
            console.log("", error);
        }
    }

    update() {
        this.obstacles.position.x -= 3.2 * speed;

        const cactusGlobalX = this.obstacles.x;

      
        if (cactusGlobalX > app.renderer.width - 200 && !this.hasShownNews && !dino.dead) {
            const randomNews = this.newsList[Math.floor(Math.random() * this.newsList.length)];
            
            if (this.activeNewsBox) {
                app.stage.removeChild(this.activeNewsBox);
                this.activeNewsBox.destroy();
            }

            
            this.activeNewsBox = this.createNewsContainer(randomNews);
            this.activeNewsBox.x = (app.renderer.width - 420) / 2; 
            this.activeNewsBox.y = 50; 
            
            app.stage.addChild(this.activeNewsBox);
            this.hasShownNews = true;
        }

        
        if ((cactusGlobalX < -50 || dino.dead) && this.activeNewsBox) {
            app.stage.removeChild(this.activeNewsBox);
            this.activeNewsBox.destroy();
            this.activeNewsBox = null;
        }

        if (this.obstacles.x <= -this.obstacles.width) {
            this.obstacles.x = app.renderer.width + speed * 100 + Math.random() * 200 * speed;
            this.obstacles.y = app.renderer.height;
            this.hasShownNews = false; 

            if (restarting) {
                this.obstacles.x = app.renderer.width * 3;
                this.hasShownNews = false;
                if (this.activeNewsBox) {
                    app.stage.removeChild(this.activeNewsBox);
                    this.activeNewsBox.destroy();
                    this.activeNewsBox = null;
                }
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
