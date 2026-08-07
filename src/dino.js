class Dino{
    constructor() {
        this.dino = new PIXI.extras.AnimatedSprite(sheet.animations["Dino"]); //[cite: 6]
        this.dino.scale.set(0.48); //[cite: 6]
        
        this.shadowDino = new PIXI.extras.AnimatedSprite(sheet.animations["Dino"]); //[cite: 6]
        this.shadowDino.scale.set(0.48); //[cite: 6]
        this.shadowDino.alpha = 0.55; //[cite: 6]
        
        let targetX = app.renderer.width * 0.12; //[cite: 6]
        let shadowX = app.renderer.width * -0.08; //[cite: 6]

        if(restarting){
            this.dino.position.set((-app.renderer.width/2), app.renderer.height - this.dino.height * 1.1); //[cite: 6]
            this.shadowDino.position.set((-app.renderer.width/2), app.renderer.height - this.shadowDino.height * 1.1); //[cite: 6]
            restarting = false; //[cite: 6]
        }else{
            this.dino.position.set(targetX, app.renderer.height - this.dino.height * 1.1); //[cite: 6]
            this.shadowDino.position.set(shadowX, app.renderer.height - this.shadowDino.height * 1.1); //[cite: 6]
        }

        this.dino.animationSpeed = 0.35 * speed / 2; //[cite: 6]
        this.dino.play(); //[cite: 6]
        app.stage.addChildAt(this.dino, app.stage.children.length - 5); //[cite: 6]

        this.shadowDino.animationSpeed = 0.35 * speed / 2; //[cite: 6]
        this.shadowDino.play(); //[cite: 6]
        app.stage.addChildAt(this.shadowDino, app.stage.children.length - 5); //[cite: 6]

        this.dinoDead = new PIXI.Sprite(sheet.textures["Dino_dead.png"]); //[cite: 6]
        this.dinoDead.scale.set(0.7); //[cite: 6]
        this.dinoDead.visible = false; //[cite: 6]
        app.stage.addChildAt(this.dinoDead, app.stage.children.length - 5); //[cite: 6]

        this.vy = 0; //[cite: 6]
        this.vx = 0; //[cite: 6]
        this.airborn = false; //[cite: 6]
        this.dead = false; //[cite: 6]

        this.shadowVy = 0;
        this.shadowAirborn = false;
    }

    update(){
        let targetX = app.renderer.width * 0.12; //[cite: 6]
        let shadowX = app.renderer.width * -0.08; //[cite: 6]

        if(this.airborn && !this.dead){
            this.dino.position.y += this.vy; //[cite: 6]
            this.vy += 1; //[cite: 6]

            if(this.dino.position.y >= app.renderer.height - this.dino.height * 1.1){ //[cite: 6]
                this.airborn = false; //[cite: 6]
                this.vy = 0; //[cite: 6]
                this.dino.position.y = app.renderer.height - this.dino.height * 1.1; //[cite: 6]
                this.dino.gotoAndPlay(0); //[cite: 6]
            }
        }


        if(this.shadowDino){
            if(typeof obstacle !== 'undefined' && obstacle && obstacle.obstacles) {
                let obstX = obstacle.obstacles.x;
                if(obstX > shadowX && obstX - shadowX < 220 && !this.shadowAirborn){
                    this.shadowAirborn = true;
                    this.shadowVy = -26;
                    this.shadowDino.gotoAndStop(3);
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
                this.dino.position.y += this.vy; //[cite: 6]
                this.vy += 1; //[cite: 6]
                if(this.dino.position.y >= app.renderer.height - this.dino.height * 0.5){
                    this.airborn = false; //[cite: 6]
                    this.vy = 0; //[cite: 6]
                }
            }

            this.dino.x -= 4.5 * speed;
        }

        if(restarting){
            this.dino.x -= 5.5 * speed; //[cite: 6]
            if(this.shadowDino){
                this.shadowDino.x -= 5.5 * speed; //[cite: 6]
            }
        }

        if(this.dino.x < targetX && !restarting && !this.dead){
            this.dino.x = lerp(this.dino.x, targetX, 0.02); //[cite: 6]
            if(this.dino.x >= targetX - 1){ //[cite: 6]
                this.dino.x = targetX; //[cite: 6]
            }
        }

        if(this.shadowDino && this.shadowDino.x < shadowX && !restarting){
            this.shadowDino.x = lerp(this.shadowDino.x, shadowX, 0.02); //[cite: 6]
            if(this.shadowDino.x >= shadowX - 1){ //[cite: 6]
                this.shadowDino.x = shadowX; //[cite: 6]
            }
        }
    }

    jump(){
        if(!this.airborn && !this.dead){ //[cite: 6]
            this.airborn = true; //[cite: 6]
            this.vy -= 26; //[cite: 6]
            this.dino.gotoAndStop(3); //[cite: 6]
        }
    }

    checkCollision(obstacle){
        let dinoX = this.dino.x + this.dino.width/3; //[cite: 6]
        let dinoY = this.dino.y; //[cite: 6]
        let dinoW = this.dino.width/2.5; //[cite: 6]
        let dinoH = this.dino.height*0.9; //[cite: 6]
        let obstX = obstacle.obstacles.x; //[cite: 6]
        let obstY = obstacle.obstacles.y; //[cite: 6]
        let obstW = obstacle.obstacles.height * 0.8; //[cite: 6]
        let obstH = obstacle.obstacles.height; //[cite: 6]

        if(dinoX + dinoW >= obstX &&
            dinoX <= obstX + obstW &&
            dinoY + dinoH >= obstY - obstH &&
            !this.dead){ //[cite: 6]
                this.dead = true; //[cite: 6]
                this.dinoDead.position.set(this.dino.x, this.dino.y + this.dino.height/2); //[cite: 6]
                this.dino.destroy(); //[cite: 6]
                this.dino = this.dinoDead; //[cite: 6]
                this.dino.visible = true; //[cite: 6]
                this.vy = -15; //[cite: 6]
                this.airborn = true; //[cite: 6]
        }
    }
}
