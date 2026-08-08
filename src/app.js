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


let newsContainer;
let activeNewsLines = []; 
const MAX_NEWS_LINES = 5;
let currentActiveNewsUrl = "";


let pastRecords = []; 
let activeSkeletons = []; 
let shadowDiedThisRun = false; 

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
    shadowDiedThisRun = false;
    sheet = PIXI.loader.resources["assets/SpriteSheet.json"].spritesheet;
    scroller = new Scroller();
    obstacle = new ObstacleManager();

    let style = new PIXI.TextStyle({ fill: "white", fontSize: 50, fontFamily: "Fredoka One" });
    score = new PIXI.Text(dist + "$ saved", style);
    score.anchor.set(1, 0);
    score.position.set(app.renderer.width - 20, 10);
    app.stage.addChildAt(score, app.stage.children.length);


    newsContainer = new PIXI.Container();
    newsContainer.position.set(app.renderer.width / 2, app.renderer.height / 2 - 50);
    app.stage.addChild(newsContainer);

    window.onNewsLoaded = function(items) {
        if (items && items.length > 0 && activeNewsLines.length === 0) {
            let firstNews = items[Math.floor(Math.random() * items.length)];
            currentActiveNewsUrl = firstNews.url;
            addNewNewsLine(firstNews.title, firstNews.url);
        }
    };

    resetBtn = new PIXI.Sprite(sheet.textures["retry.png"]);
    resetBtn.scale.set(0.25);
    resetBtn.anchor.set(0.5);
    resetBtn.position.set(app.renderer.width / 2, app.renderer.height + resetBtn.height * 2);
    resetBtn.visible = false;
    resetBtn.buttonMode = true;
    resetBtn.interactive = true;
    resetBtn.on("pointerdown", reset);
    resetBtn.on("mouseover", function () { resetBtn.hovering = true; });
    resetBtn.on("pointerout", function () { resetBtn.hovering = false; });
    resetBtn.on("mouseout", function () { resetBtn.hovering = false; });
    app.stage.addChildAt(resetBtn, app.stage.children.length);

    window.addEventListener("pointerdown", (e) => {
        if (dino && dino.shadowDino) {
            dino.jump();
        }
    });
    let space = keyboard(32);
    space.press = () => {
        if (dino && dino.shadowDino) {
            dino.jump();
        }
    };

    dino = new Dino();

    app.ticker.add(delta => gameLoop(delta));
}


function evaluateAndSaveRecord() {
    let currentScore = Math.floor(dist);
    if (currentScore > 10) {
        let maxExisting = pastRecords.length > 0 ? Math.max(...pastRecords.map(r => r.score)) : 0;
        
        if (currentScore > maxExisting) {
            pastRecords.push({ score: currentScore, shown: false });
        }
    }
}


function addNewNewsLine(text, url) {
    let cleanText = text.replace(/^[⚠️\s-•]+/, "").trim();
    let dynamicFontSize = Math.max(12, Math.floor(app.renderer.height * 0.022));

    let rowContainer = new PIXI.Container();

    const titleLower = cleanText.toLowerCase();
    
    const aiFailKeywords = [
        'prompt injection', 'jailbreak', 'hallucination', 'ai error', 
        'ai failure', 'security flaw', 'malicious ai', 'deepfake scam'
    ];
    let isAIFail = aiFailKeywords.some(keyword => titleLower.includes(keyword));

    const humanFailKeywords = [
        'human error', 'misconfiguration', 'negligence', 
        'phishing', 'social engineering', 'credential theft', 
        'replaced by ai', 'job loss', 'layoffs', 'scam', 'guilty', 'extortion', 'pleads', 'fraud', 'arrested'
    ];
    let isHumanFail = humanFailKeywords.some(keyword => titleLower.includes(keyword));

    let showShadow = !isAIFail;
    let showHuman = !isHumanFail;

    let newsStyle = new PIXI.TextStyle({
        fill: "#2D4A27",
        fontSize: dynamicFontSize,
        fontFamily: "Fredoka One",
        align: "left",
        dropShadow: true,
        dropShadowColor: "#ffd4e3",
        dropShadowBlur: 2,
        dropShadowDistance: 2,
        wordWrap: true,
        wordWrapWidth: app.renderer.width * 0.75
    });

    let lineObj = new PIXI.Text("", newsStyle);
    lineObj.anchor.set(0, 0);
    lineObj.position.set(0, 0);
    rowContainer.addChild(lineObj);

    
    let iconScale = (dynamicFontSize / 350); 

    let iconsContainer = new PIXI.Container();
    rowContainer.addChild(iconsContainer);

    let charIndex = 0;
    let speedInterval = Math.max(15, Math.floor(1500 / cleanText.length));
    let typingTimer = setInterval(() => {
        if (charIndex < cleanText.length) {
            lineObj.text += cleanText.charAt(charIndex);
            charIndex++;

          
            updateIconsPosition();
        } else {
            clearInterval(typingTimer);
        }
    }, speedInterval);

    function updateIconsPosition() {
        iconsContainer.removeChildren();
        
        
        let metrics = PIXI.TextMetrics.measureText(lineObj.text, newsStyle);
        let lastLineWidth = metrics.lineWidths.length > 0 ? metrics.lineWidths[metrics.lineWidths.length - 1] : 0;
        let lineCount = metrics.lines.length;

        let startX = lastLineWidth + 8; 
        let startY = (lineCount - 1) * metrics.lineHeight + (metrics.lineHeight / 2); 

        let currentX = startX;

        if (showShadow) {
            let shadowIcon = new PIXI.Sprite(sheet.animations["Dino"][0]);
            shadowIcon.scale.set(iconScale);
            shadowIcon.alpha = 0.55;
            shadowIcon.anchor.set(0, 0.5);
            shadowIcon.position.set(currentX, startY);
            iconsContainer.addChild(shadowIcon);
            currentX += dynamicFontSize * 0.9;
        }

        if (showHuman) {
            let dinoIcon = new PIXI.Sprite(sheet.animations["Dino"][0]);
            dinoIcon.scale.set(iconScale);
            dinoIcon.anchor.set(0, 0.5);
            dinoIcon.position.set(currentX, startY);
            iconsContainer.addChild(dinoIcon);
        }
    }

    currentActiveNewsUrl = url;

    rowContainer.interactive = true;
    rowContainer.buttonMode = true;
    rowContainer.on("click", () => { if (url) window.open(url, "_blank"); });
    rowContainer.on("tap", () => { if (url) window.open(url, "_blank"); });

    rowContainer.pivot.x = (app.renderer.width * 0.8) / 2;

    activeNewsLines.push({ obj: rowContainer, url: url, timer: typingTimer });
    newsContainer.addChild(rowContainer);

    if (activeNewsLines.length > MAX_NEWS_LINES) {
        let removed = activeNewsLines.shift();
        if (removed.timer) clearInterval(removed.timer);
        newsContainer.removeChild(removed.obj);
        removed.obj.destroy();
    }

    updateNewsPositions();
}

function updateNewsPositions() {
    let lineHeight = Math.max(100, Math.floor(app.renderer.height * 0.08));
    let startY = - (activeNewsLines.length * lineHeight) / 2;

    for (let i = 0; i < activeNewsLines.length; i++) {
        activeNewsLines[i].obj.position.set(0, startY + (i * lineHeight));
        let alphaFactor = (i + 1) / activeNewsLines.length;
        activeNewsLines[i].obj.alpha = Math.max(0.4, alphaFactor);
    }
}

window.triggerNextNews = function(title, url) {
    addNewNewsLine(title, url);
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

    if (!restarting) {
        dist += 0.05 * delta * speed;
        if (Math.floor(dist) % 5 === 0) {
            score.text = Math.floor(dist) + "$ saved";
        }
    }


    let shadowIsGone = dino && (!dino.shadowDino || dino.shadowDino.visible === false || dino.shadowDino.dead);
    if (shadowIsGone && !shadowDiedThisRun) {
        shadowDiedThisRun = true;
        evaluateAndSaveRecord();

        if (sheet && sheet.textures["Dino_dead.png"]) {
            let shadowSkeleton = new PIXI.Sprite(sheet.textures["Dino_dead.png"]);
            shadowSkeleton.scale.set(0.4); 
            shadowSkeleton.anchor.set(0.5);
            

            let posX = (dino.shadowDino && dino.shadowDino.x) ? dino.shadowDino.x : 150;
            let posY = (dino.shadowDino && dino.shadowDino.y) ? dino.shadowDino.y : (app.renderer.height - 120);
            
            shadowSkeleton.position.set(posX, posY);
            app.stage.addChild(shadowSkeleton);
            

            activeSkeletons.push(shadowSkeleton);
        }
    }


    for (let i = 0; i < pastRecords.length; i++) {
        let record = pastRecords[i];

        if (!record.shown && Math.floor(dist) >= record.score && !restarting) {
            if (sheet && sheet.textures["Dino_dead.png"]) {
                let recordSkeleton = new PIXI.Sprite(sheet.textures["Dino_dead.png"]);
                recordSkeleton.scale.set(0.48);
                recordSkeleton.anchor.set(0.5);
                recordSkeleton.position.set(app.renderer.width, app.renderer.height - recordSkeleton.height * 1.1);
                app.stage.addChild(recordSkeleton);
                
                activeSkeletons.push(recordSkeleton);
                record.shown = true; 
            }
        }
    }


    for (let i = activeSkeletons.length - 1; i >= 0; i--) {
        let skel = activeSkeletons[i];
        if (!restarting) {
            skel.x -= 5.5 * speed;
            if (skel.x < -100) {
                skel.parent.removeChild(skel);
                skel.destroy();
                activeSkeletons.splice(i, 1);
            }
        }
    }


    if (dino.dead && !restarting) {
        resetBtn.visible = true;
        resetBtn.y = app.renderer.height * 0.65;
        
        let targetScale = resetBtn.hovering ? 0.3 : 0.25;
        let newScale = lerp(resetBtn.scale.x, targetScale, 0.1);
        resetBtn.scale.set(newScale);
    }

    if (restarting) {
        speed = lerp(speed, 5, 0.08);
        if (speed >= 3) {
            speed = 3;
        }
    }
}

function reset() {

    evaluateAndSaveRecord();


    for (let i = 0; i < activeSkeletons.length; i++) {
        if (activeSkeletons[i] && activeSkeletons[i].parent) {
            activeSkeletons[i].parent.removeChild(activeSkeletons[i]);
            activeSkeletons[i].destroy();
        }
    }
    activeSkeletons = [];


    for (let i = 0; i < pastRecords.length; i++) {
        pastRecords[i].shown = false;
    }

    restarting = true;
    dist = 0;
    shadowDiedThisRun = false; 
    resetBtn.visible = false; 
    

    for (let i = 0; i < activeNewsLines.length; i++) {
        if (activeNewsLines[i].timer) {
            clearInterval(activeNewsLines[i].timer);
        }
        newsContainer.removeChild(activeNewsLines[i].obj);
        activeNewsLines[i].obj.destroy();
    }
    activeNewsLines = [];
}

function lerp(value1, value2, amount) {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
}
