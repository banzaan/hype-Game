class ObstacleManager {
    constructor() {
        this.obstacles = new PIXI.Container();
        this.newsLayer = new PIXI.Container();
        this.newsList = ["fiat :)"];

        for (let i = 0; i < 1; i++) {
            const obstacleItem = new PIXI.Container();

            const cactus = new PIXI.Sprite(sheet.textures["cactus.png"]);
            cactus.scale.set(Math.random() * 0.1 + 0.25);
            cactus.y = -cactus.height;
            obstacleItem.addChild(cactus);

            obstacleItem.x = i * 220;
            this.obstacles.addChild(obstacleItem);

            const textContainer = this.createNewsContainer(this.newsList[0]);
            textContainer.name = "newsBox";
            textContainer.x = obstacleItem.x - 380; 
            textContainer.y = -cactus.height - 180; 
            this.newsLayer.addChild(textContainer);
        }

        this.obstacles.y = app.renderer.height;
        this.obstacles.x = app.renderer.width * 3;
        
        this.newsLayer.y = app.renderer.height;
        this.newsLayer.x = this.obstacles.x;

        app.stage.addChildAt(this.obstacles, app.stage.children.length - 2);
        app.stage.addChildAt(this.newsLayer, app.stage.children.length - 2);

        this.fetchDynamicNews();
    }

    createNewsContainer(message) {
        const container = new PIXI.Container();


        const text = new PIXI.Text(message, {
            fontFamily: 'Arial',
            fontSize: 30,
            fill: 0xffffff,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: 380, 
            align: 'center'
        });
        text.x = 20;
        text.y = 18;


        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.7); 
        //bg.lineStyle(2.5, 0x000000, 0.8); 
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
        this.obstacles.position.x -= 2.9 * speed;
        this.newsLayer.position.x = this.obstacles.position.x;

        if (this.obstacles.x <= -this.obstacles.width) {
            for (let i = 0; i < this.newsLayer.children.length; i++) {
                const randomNews = this.newsList[Math.floor(Math.random() * this.newsList.length)];
                const newsBox = this.newsLayer.children[i];
                
                newsBox.removeChildren();
                const newBox = this.createNewsContainer(randomNews);
                while(newBox.children.length > 0) {
                    newsBox.addChild(newBox.children[0]);
                }
            }

            this.obstacles.x = app.renderer.width + speed * 100 + Math.random() * 200 * speed;
            this.obstacles.y = app.renderer.height;
            this.newsLayer.x = this.obstacles.x;

            if (restarting) {
                this.obstacles.x = app.renderer.width * 3;
                this.newsLayer.x = this.obstacles.x;
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
