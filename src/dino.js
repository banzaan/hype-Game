class Dino{
    constructor() {
        this.dino = new PIXI.extras.AnimatedSprite(sheet.animations["Dino"]);
        this.dino.scale.set(0.48);
        
        this.shadowDino = new PIXI.extras.AnimatedSprite(sheet.animations["Dino"]);
        this.shadowDino.scale.set(0.48);
        this.shadowDino.alpha = 0.55;
        
        let targetX = app.renderer.width * 0.12;
        let shadowX = app.renderer.width * -0.08;

        if(restarting){
            this.dino.position.set((-app.renderer.width/2), app.renderer.height - this.dino.height * 1.1);
            this.shadowDino.position.set((-app.renderer.width/2), app.renderer.height - this.shadowDino.height * 1.1);
            restarting = false;
        }else{
            this.dino.position.set(targetX, app.renderer.height - this.dino.height * 1.1);
            this.shadowDino.position.set(shadowX, app.renderer.height - this.shadowDino.height * 1.1);
        }

        this.dino.animationSpeed = 0.35 * speed / 2;
        this.dino.play();
        app.stage.addChildAt(this.dino, app.stage.children.length - 5);

        this.shadowDino.animationSpeed = 0.35 * speed / 2;
        this.shadowDino.play();
        app.stage.addChildAt(this.shadowDino, app.stage.children.length - 5);

        this.dinoDead = new PIXI.Sprite(sheet.textures["Dino_dead.png"]);
        this.dinoDead.scale.set(0.7);
        this.dinoDead.visible = false;
        app.stage.addChildAt(this.dinoDead, app.stage.children.length - 5);

        this.shadowDinoDead = new PIXI.Sprite(sheet.textures["Dino_dead.png"]);
        this.shadowDinoDead.scale.set(0.7);
        this.shadowDinoDead.alpha = 0.55;
        this.shadowDinoDead.visible = false;
        app.stage.addChildAt(this.shadowDinoDead, app.stage.children.length - 5);

        this.vy = 0;
        this.vx = 0;
        this.airborn = false;
        this.dead = false;

        this.shadowVy = 0;
        this.shadowAirborn = false;
        this.shadowDead = false;
    }

    update(){
        let targetX = app.renderer.width * 0.12;
        let shadowX = app.renderer.width * -0.08;

        if(this.airborn && !this.dead){
            this.dino.position.y += this.vy;
            this.vy += 1;

            if(this.dino.position.y >= app.renderer.height - this.dino.height * 1.1){
                this.airborn = false;
                this.vy = 0;
                this.dino.position.y = app.renderer.height - this.dino.height * 1.1;
                this.dino.gotoAndPlay(0);
            }
        }


        if(this.shadowDino && !this.shadowDead){

            let shouldJump = typeof isAIWeaknessTitle !== 'undefined' ? !isAIWeaknessTitle : true;

            if(shouldJump) {
                if(typeof obstacle !== 'undefined' && obstacle && obstacle.obstacles) {
                    let obstX = obstacle.obstacles.x;
                    if(obstX > shadowX && obstX - shadowX < 440 && !this.shadowAirborn){
                        this.shadowAirborn = true;
                        this.shadowVy = -26;
                        this.shadowDino.gotoAndStop(3);
                    }
                }
            }

            if(this.shadowAirborn){
                this.shadowDino.position.y += this.shadowVy;
                this.shadowVy += 1;

                if(this.shadowDino.position.y >= app.renderer.height - this.shadowDino.height * 1.1){
                    this.shadowAirborn = false;
                    this.shadowVy = 0;
                    this.shadowDino.position.y = app.renderer.height - this.shadowDino.height * 1.1;
                    this.shadowDino.gotoAndPlay(0);
                }
            } else {
                this.shadowDino.position.y = app.renderer.height - this.shadowDino.height * 1.1;
            }
        }

        if(this.dead){
            if(this.airborn){
                this.dino.position.y += this.vy;
                this.vy += 1;
                if(this.dino.position.y >= app.renderer.height - this.dino.height * 0.5){
                    this.airborn = false;
                    this.vy = 0;
                }
            }

            this.dino.x -= 4.5 * speed;
        }

        if(this.shadowDead){
            if(this.shadowAirborn){
                this.shadowDino.position.y += this.shadowVy;
                this.shadowVy += 1;
                if(this.shadowDino.position.y >= app.renderer.height - this.shadowDino.height * 0.5){
                    this.shadowAirborn = false;
                    this.shadowVy = 0;
                }
            }

            this.shadowDino.x -= 4.5 * speed;
        }

        if(restarting){
            this.dino.x -= 5.5 * speed;
            if(this.shadowDino){
                this.shadowDino.x -= 5.5 * speed;
            }
        }

        if(this.dino.x < targetX && !restarting && !this.dead){
            this.dino.x = lerp(this.dino.x, targetX, 0.02);
            if(this.dino.x >= targetX - 1){
                this.dino.x = targetX;
            }
        }

        if(this.shadowDino && this.shadowDino.x < shadowX && !restarting && !this.shadowDead){
            this.shadowDino.x = lerp(this.shadowDino.x, shadowX, 0.02);
            if(this.shadowDino.x >= shadowX - 1){
                this.shadowDino.x = shadowX;
            }
        }
    }

    jump(){

        let blockJumpHuman = typeof isHumanFailureTitle !== 'undefined' ? isHumanFailureTitle : false;


        if(blockJumpHuman) {
            if(blockJumpHuman) {

                let flashScreen = new PIXI.Graphics();
                flashScreen.beginFill(0xFF0000, 0.5); 
                flashScreen.drawRect(0, 0, app.renderer.width, app.renderer.height);
                flashScreen.endFill();
                

                app.stage.addChild(flashScreen);
        

                setTimeout(() => {
                    app.stage.removeChild(flashScreen);
                    flashScreen.destroy();
                }, 150);
        
                return; 
            }
            return; 
        }

        if(!this.airborn && !this.dead){
            this.airborn = true;
            this.vy -= 26;
            this.dino.gotoAndStop(3);
        }
    }

    checkCollision(obstacle){
        let obstX = obstacle.obstacles.x;
        let obstY = obstacle.obstacles.y;
        let obstW = obstacle.obstacles.height * 0.8;
        let obstH = obstacle.obstacles.height;

        let dinoX = this.dino.x + this.dino.width/3; 
        let dinoY = this.dino.y;
        let dinoW = this.dino.width/2.5;
        let dinoH = this.dino.height*0.9;

        if(dinoX + dinoW >= obstX &&
            dinoX <= obstX + obstW &&
            dinoY + dinoH >= obstY - obstH &&
            !this.dead){
                this.dead = true;
                this.dinoDead.position.set(this.dino.x, this.dino.y + this.dino.height/2);
                this.dino.destroy();
                this.dino = this.dinoDead;
                this.dino.visible = true;
                this.vy = -15;
                this.airborn = true;
        }


        let checkShadowCollision = typeof isAIWeaknessTitle !== 'undefined' ? isAIWeaknessTitle : false;

        if(this.shadowDino && !this.shadowDead && checkShadowCollision){
            let shadowXCoord = this.shadowDino.x + this.shadowDino.width/3;
            let shadowYCoord = this.shadowDino.y;
            let shadowW = this.shadowDino.width/2.5;
            let shadowH = this.shadowDino.height*0.9;

            if(shadowXCoord + shadowW >= obstX &&
                shadowXCoord <= obstX + obstW &&
                shadowYCoord + shadowH >= obstY - obstH){
                    this.shadowDead = true;
                    this.shadowDinoDead.position.set(this.shadowDino.x, this.shadowDino.y + this.shadowDino.height/2);
                    this.shadowDino.destroy();
                    this.shadowDino = this.shadowDinoDead;
                    this.shadowDino.visible = true;
                    this.shadowVy = -15;
                    this.shadowAirborn = true;
            }
        }
    }
    reviveShadow() {
        if (this.shadowDead) {
            this.shadowDead = false;
            this.shadowAirborn = false;
            this.shadowVy = 0;
            

            if (this.shadowDinoDead && this.shadowDinoDead.parent) {
                this.shadowDinoDead.parent.removeChild(this.shadowDinoDead);
            }


            let shadowX = app.renderer.width * -0.08;
            this.shadowDino = new PIXI.extras.AnimatedSprite(sheet.animations["Dino"]);
            this.shadowDino.scale.set(0.48);
            this.shadowDino.alpha = 0.55;
            this.shadowDino.position.set(app.renderer.width * -0.3, app.renderer.height - this.shadowDino.height * 1.1);
            this.shadowDino.animationSpeed = 0.35 * speed / 2;
            this.shadowDino.play();
            app.stage.addChildAt(this.shadowDino, app.stage.children.length - 5);


            speed = 3;
            

            if (this.dead) {
                dist = 0;
                if (typeof score !== 'undefined') {
                    score.text = "0 usdc";
                }
            }
        }
    }
}
