let app = new PIXI.Application({ roundPixels: true, antialias: false });
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
app.view.id = "game-canvas";

document.body.appendChild(app.view);

let scroller;
let dino;
let obstacle;
let sheet;
let score;
let resetBtn;
let speed;
let dist;
let restarting = false;

let newsTextObj;
let liveNewsList = []; 
let typingTimer = null;
let fullCurrentNewsText = "";
let currentActiveNewsUrl = "";

const TICK_RATE = 16;
let lastUpdate = 0;

window.WebFontConfig = {
    google: {
        families: ['Fredoka One']
    }
};

/* jshint ignore:start */
(function () {
    var wf = document.createElement('script');
    wf.src = ('https:' === document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();

setTimeout(function () {
    PIXI.loader
        .add([
            "assets/SpriteSheet.json",
            "assets/sky.png"
        ]).on("progress", loadProgressHandler)
        .load(closeLoader);
}, 600);

function loadProgressHandler(loader, resource) {
    let progress = (loader.progress / 100) * 80;
    document.getElementById("loader-progress").style.width = progress + "%";
    if (progress === 80) {
        document.getElementById("shine").style.opacity = 1;
        document.getElementById("shine").style.left = "120%";
    }
}

function closeLoader() {
    setTimeout(function () {
        let parent = document.getElementById("loader");
        for (let i = 0; i < parent.children.length; i++) {
            let child = parent.children[i];
            child.classList.remove("pop-up-animation");
            child.classList.add("close-animation");
            child.style.animationDelay = 0.3 * (parent.children.length - i) + "s";
        }
        setup();
        setTimeout(function () {
            document.getElementById("game-canvas").style.top = 0;
        }, 500);
    }, 1300);
}

function setup() {
    speed = 3;
    dist = 0;
    sheet = PIXI.loader.resources["assets/SpriteSheet.json"].spritesheet;
    scroller = new Scroller();
    obstacle = new ObstacleManager();

    let style = new PIXI.TextStyle({ fill: "white", fontSize: 50, fontFamily: "Fredoka One" });
    score = new PIXI.Text(dist + " usdc", style);
    score.anchor.set(1, 0);
    score.position.set(app.renderer.width - 20, 10);
    app.stage.addChildAt(score, app.stage.children.length);

    let dynamicFontSize = Math.max(20, Math.floor(app.renderer.height * 0.035));

    let newsStyle = new PIXI.TextStyle({
        fill: "white",
        fontSize: dynamicFontSize,
        fontFamily: "Fredoka One",
        align: "center",
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 2,
        dropShadowDistance: 2,
        wordWrap: true,
        wordWrapWidth: app.renderer.width * 0.8
    });
    
    newsTextObj = new PIXI.Text("", newsStyle);
    newsTextObj.anchor.set(0.5, 1);
    // انتقال زیرنویس به بخش پایین صفحه (بالاتر از کف زمین)
    newsTextObj.position.set(app.renderer.width / 2, app.renderer.height - 30);
    newsTextObj.interactive = false;
    newsTextObj.buttonMode = false;
    app.stage.addChild(newsTextObj);


    window.onNewsLoaded = function(items) {
        liveNewsList = items;
        if (newsTextObj.text === "" && liveNewsList.length > 0) {
            let firstNews = liveNewsList[Math.floor(Math.random() * liveNewsList.length)];
            currentActiveNewsUrl = firstNews.url;
            typeWriterEffect(firstNews.title);
        }
    };

    resetBtn = new PIXI.Sprite(sheet.textures["retry.png"]);
    resetBtn.scale.set(0.25);
    resetBtn.anchor.set(0.5);
    resetBtn.position.set(app.renderer.width / 2, app.renderer.height + resetBtn.height * 2);
    resetBtn.visible = false;
    resetBtn.buttonMode = true;
    resetBtn.interactive = true;
    resetBtn.on("click", reset);
    resetBtn.on("mouseover", function () {
        resetBtn.hovering = true;
    });
    resetBtn.on("mouseout", function () {
        resetBtn.hovering = false;
    });
    app.stage.addChildAt(resetBtn, app.stage.children.length);


    window.addEventListener("pointerdown", (e) => {
        if (dino.dead && speed === 0) {
            reset();
        } else if (!dino.dead) {
            dino.jump();
        }
    });
    let space = keyboard(32);
    space.press = () => {
        if (!dino.dead) {
            dino.jump();
        }
    };

    dino = new Dino();

    app.ticker.add(delta => gameLoop(delta));
}

function typeWriterEffect(text) {
    if (typingTimer) {
        clearInterval(typingTimer);
    }
    fullCurrentNewsText = text;
    newsTextObj.text = "";
    let charIndex = 0;
    let speedInterval = Math.max(20, Math.floor(2000 / text.length));

    typingTimer = setInterval(() => {
        if (charIndex < text.length) {
            newsTextObj.text += text.charAt(charIndex);
            charIndex++;
        } else {
            clearInterval(typingTimer);
        }
    }, speedInterval);
}


window.triggerNextNews = function(title, url) {
    if (dino && dino.dead) return;
    currentActiveNewsUrl = url;
    typeWriterEffect(title);
};

function gameLoop(delta) {
    let now = (new Date()).getTime();
    let timeDiff = now - lastUpdate;
    if (timeDiff < TICK_RATE)
        return;

    lastUpdate = now;

    dino.update();
    obstacle.update();
    scroller.update();
    dino.checkCollision(obstacle);

    if (dino.dead && !newsTextObj.interactive && speed === 0) {
        if (typingTimer) clearInterval(typingTimer);
        if (fullCurrentNewsText !== "") {
            newsTextObj.text = fullCurrentNewsText; 
        }
        newsTextObj.interactive = true;
        newsTextObj.buttonMode = true;
        
        newsTextObj.removeAllListeners();
        newsTextObj.on("click", () => {
            if (currentActiveNewsUrl) {
                window.open(currentActiveNewsUrl, "_blank");
            }
        });
        newsTextObj.on("tap", () => {
            if (currentActiveNewsUrl) {
                window.open(currentActiveNewsUrl, "_blank");
            }
        });
    }

    if (!dino.dead && !restarting) {
        dist += 0.05 * delta * speed;
        if (Math.floor(dist) % 5 === 0) {
            score.text = Math.floor(dist) + " usdc";
        }
    }
    if (dino.dead && speed === 0) {
        resetBtn.visible = true;
        resetBtn.y = lerp(resetBtn.y, app.renderer.height / 2, 0.1);
        
        let targetScale = resetBtn.hovering ? 0.3 : 0.25;
        let newScale = lerp(resetBtn.scale.x, targetScale, 0.1);
        resetBtn.scale.set(newScale);
    }
    if (restarting) {
        speed = lerp(speed, 5, 0.08);
        if (speed >= 3) {
            speed = 3;
        }
        resetBtn.y = lerp(resetBtn.y, app.renderer.height + resetBtn.height * 2, 0.1);
    }
}

function reset() {
    restarting = true;
    dist = 0;
    newsTextObj.interactive = false;
    newsTextObj.buttonMode = false;
    if (liveNewsList.length > 0) {
        let firstNews = liveNewsList[Math.floor(Math.random() * liveNewsList.length)];
        currentActiveNewsUrl = firstNews.url;
        typeWriterEffect(firstNews.title);
    }
}

function lerp(value1, value2, amount) {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
}
