const canvas = document.getElementById("gameCanvas");
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const powerupCircle = document.getElementById("powerup-circle");
const restartBtn = document.getElementById("restart-btn");
const startOverlay = document.getElementById("startOverlay");

let score = 0;
let gameOver = false;
let gameStarted = false;
let platformCounter = 0;

const GRAVITY = 0.2;
const JUMP_FORCE = -7;
const PLATFORM_SPEED = 2;
const POWERUP_DURATION = 30000;

let normalGravity = GRAVITY;
let activePowerupType = null;

// Dino
let dino = {
    x: 150,
    y: 0,
    width: 50,
    height: 50,
    dy: 0,
    jumpsLeft: 1,
    color: "#2ecc71"
};

// Plattformen
let platforms = [];

// Power-Ups
const POWERUP_TYPES = ["doubleJump","lowGravity"];
let nextPowerupAt = 20;
let powerup = null;
let powerupActive = false;
let powerupTimer = 0;

// Wolken
let clouds = [];
for(let i=0;i<5;i++){
    clouds.push({
        x: Math.random()*canvas.width,
        y: 50 + i*60,
        radiusX: 60,
        radiusY: 30,
        speed: 0.5 + Math.random()*0.5
    });
}

// Plattformen erstellen
function createInitialPlatforms(){
    platforms = [];
    const startY = canvas.height*0.45;
    platforms.push({x:0, y:startY, width:800});
    let x = 800;
    while(x < canvas.width + 400){
        const width = Math.random()*200 + 120;
        const y = Math.random()*100 + canvas.height*0.35;
        platforms.push({x, y, width});
        x += width + Math.random()*50 + 50;
    }
    dino.y = platforms[0].y - dino.height - 10;
}

// Steuerung
document.addEventListener("keydown", e => {
    if(!gameStarted && (e.code === "Space" || e.code === "ArrowUp")){
        gameStarted = true;
        startOverlay.style.display = "none";
        requestAnimationFrame(gameLoop);
    }

    if((e.code === "Space" || e.code === "ArrowUp") && dino.jumpsLeft > 0){
        dino.dy = JUMP_FORCE;
        dino.jumpsLeft--;
    }
    /*
    if(e.code === "Digit1"){ // Low Gravity Cheat                                             #cheets
        normalGravity = 0.1;
        powerupActive = true;
        powerupTimer = POWERUP_DURATION;
        activePowerupType = "lowGravity";
    }
    if(e.code === "Digit2"){ // Double Jump Cheat
        dino.jumpsLeft = 2;
        powerupActive = true;
        powerupTimer = POWERUP_DURATION;
        activePowerupType = "doubleJump";
    }
    */
});

// Restart
restartBtn.addEventListener("click", ()=>location.reload());

// Plattform-Kollision
function checkPlatformCollision(){
    platforms.forEach(plat=>{
        if(dino.x + dino.width > plat.x &&
           dino.x < plat.x + plat.width &&
           dino.y + dino.height >= plat.y &&
           dino.y + dino.height <= plat.y + 20 &&
           dino.dy >=0){
               dino.y = plat.y - dino.height;
               dino.dy = 0;
               if(activePowerupType==="doubleJump") dino.jumpsLeft = 2;
               else dino.jumpsLeft = 1;
           }
    });
}

// Power-Up erzeugen
function maybeSpawnPowerup(){
    if(platformCounter >= nextPowerupAt && !powerup){
        const plat = platforms[platforms.length-1];
        const type = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
        powerup = {
            platform: plat,
            offsetX: plat.width/2-15,
            yOffset: -30,
            size: 30,
            type: type,
            color: type==="doubleJump"?"#3498db":"#e74c3c"
        };
        nextPowerupAt = platformCounter + 20;
    }
}

// Power-Up aktivieren
function activatePowerup(){
    if(!powerup) return;
    powerupActive = true;
    powerupTimer = POWERUP_DURATION;
    activePowerupType = powerup.type;
    if(powerup.type==="doubleJump") dino.jumpsLeft = 2;
    else if(powerup.type==="lowGravity") normalGravity = 0.1;
    powerup = null;
}

// Power-Up-Kreis
function updatePowerupCircle(){
    if(!powerupActive){ 
        powerupCircle.style.display="none"; 
        return;
    }
    powerupCircle.style.display="block";
    const percent = powerupTimer/POWERUP_DURATION;
    let color = activePowerupType==="lowGravity"?"#e74c3c":"#3498db";
    powerupCircle.style.background = `conic-gradient(${color} ${percent*360}deg, transparent 0deg)`;
}

// Hintergrund
function drawBackground(){
    ctx.fillStyle="#87CEEB";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    clouds.forEach(cloud => {
        ctx.fillStyle="rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.radiusX, cloud.radiusY, 0, 0, 2*Math.PI);
        ctx.fill();

        cloud.x -= cloud.speed;
        if(cloud.x + cloud.radiusX < 0) cloud.x = canvas.width + cloud.radiusX;
    });
}

// Game Loop
function gameLoop(){
    if(gameOver) return;

    drawBackground();

    dino.dy += normalGravity;
    dino.y += dino.dy;
    checkPlatformCollision();

    if(dino.y > canvas.height){
        gameOver = true;
        alert("Game Over!");
        return;
    }

    ctx.fillStyle = dino.color;
    ctx.fillRect(dino.x,dino.y,dino.width,dino.height);

    platforms.forEach(plat=>{
        plat.x -= PLATFORM_SPEED;
        ctx.fillStyle="#95a5a6";
        ctx.fillRect(plat.x,plat.y,plat.width,10);
    });

    if(platforms[0].x + platforms[0].width < 0){
        platforms.shift();
        platformCounter++;
        const width = Math.random()*200+120;
        const y = Math.random()*100+canvas.height*0.35;
        const lastX = platforms[platforms.length-1].x + platforms[platforms.length-1].width + Math.random()*50+50;
        platforms.push({x:lastX,y,width});
        maybeSpawnPowerup();
    }

    if(powerup){
        powerup.x = powerup.platform.x + powerup.offsetX;
        powerup.y = powerup.platform.y + powerup.yOffset;
        ctx.fillStyle = powerup.color;
        ctx.fillRect(powerup.x,powerup.y,powerup.size,powerup.size);
        if(dino.x+dino.width>powerup.x && dino.x<powerup.x+powerup.size &&
           dino.y+dino.height>powerup.y && dino.y<powerup.y+powerup.size){
               activatePowerup();
           }
    }

    if(powerupActive){
        powerupTimer -=16;
        if(powerupTimer<=0){
            powerupActive=false;
            normalGravity=GRAVITY;
            if(activePowerupType==="doubleJump") dino.jumpsLeft=1;
            activePowerupType=null;
        }
    }

    updatePowerupCircle();
    score += 0.02;
    scoreElement.textContent = "Score: "+Math.floor(score);

    requestAnimationFrame(gameLoop);
}

// Initial
createInitialPlatforms();
