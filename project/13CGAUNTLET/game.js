// matrix array for the main title
const title = 
[
    [0,0,0,1,1,1,0,0,0,1,1,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,1,1,1,1,0,1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0],
    [0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
    [0,0,1,0,1,1,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,0,0,0],
    [0,0,1,0,0,0,1,0,1,1,1,1,1,0,1,0,0,0,1,0,1,0,0,1,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
    [0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
    [0,0,0,1,1,1,0,0,1,0,0,0,1,0,0,1,1,1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,0,1,0,0,0,0]
] 

const overTitle = [
    [0,0,0,0,1,0,0,0,1,1,1,1,1,0,0,1,1,0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,0,0,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,1,1,1,1,0,1,0,0,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0]
]

const mapArray = []; // array of all existing map tiles
let enemies = []; // array of all existing enemies
let arrival; // object for the wind rose, the end of the stage
let player; // player object
let sky; // object for the animated background

// player stats
let health = 3;
let score = 0;
let finalScore = 0;

let supertime = 0; // supertime is the main time counter that regulate all in-game events and ui changes
let isStarting = 0; // waiting cooldown for the main menu to avoid multi-click after a gameover
let worldCD = 0; // the 13 second counter used to evolve the game world

// world stats: the dimension, the maximum horizontal and vertical range of view for world tiles. the stage level.
let world;
const worldX = 250;
const worldY = 250;
let LOS = 30;
let stage = 0;

let gameStarted = false; // state to indicate the player is leaving the main menu
let prisonMade = false; // state to indicate the base square-shaped world is ready
let newStage = true; // the player is entering a new stage
let isGameOver = false; // gameover state
let scoreChange = false; // state needed for score calculate after a gameover

// counter color and shape
const r = 0.93; const g = 0.82; const b = 0.007;
let addR = (1 - r) / 13;
let remG = g / 13;
let remB = b / 13;
let remA = 1 / (5*60);
let baseTextDim = 50;
// frequency of counter "beeps";
let frequency = 500;

function gameInit() {
    setGame(); // new game is started
}

// the camera is fixed is centered on the main menu; gravity and sky are set; the title tiles are placed; a character for command testing is added
function setGame(){
    canvasFixedSize = vec2(1280, 720);
    cameraScale = 2.4 * 11;
    cameraPos = vec2(0,0);

    gravity = -.01;
    sky = new Sky();

    buildTitle();
    setPlayer();
}

function buildTitle(){
    for (let y = 0; y < title.length; y++) {
        for (let x = 0; x < title[y].length; x++) {
            if (title[y][x] === 1) {
                mapArray.push(new EvoTile(vec2(x - 25,(title.length - y) -7), vec2(1.01, 1.01), false));
            }
        }
    }
    for (let y = 0; y < overTitle.length; y++) {
        for (let x = 0; x < overTitle[y].length; x++) {
            if (overTitle[y][x] === 1) {
                mapArray.push(new EvoTile(vec2(x - 25,(overTitle.length - y) ), vec2(1.01, 1.01), false));
            }
        }
    }
}

function setPlayer(){
    if (player) {
        resetPlayerPointer();
        resetPlayer();
    }
    player = new Player(vec2(-3, 20), vec2(0.9, 0.9));
}

function resetPlayer(){
    player.destroy();
    player = undefined;
}
// this functon resets to undefined the pointer indicating the windrose position
function resetPlayerPointer(){
    player.pointer.destroy();
    player.pointer = undefined;
}
// update functions are used as statemachines. the main menu cooldown is started; if the game is not started, the enter button is listened;
// if the game is started the square-shaped first world is added with a new character
// when the game is started, the game will observe for the gameover state and updates the score counters;
// at gameover, the world is emptied;
function gameUpdate() {
    if (supertime % 60 === 0) {
        isStarting++;
    }
    if (!isGameOver) {
        checkEnemies();
        if (!gameStarted && keyIsDown("Enter") && isStarting >= 2) {
            resetPlayer();
            gameStarted = true;
        }
        if(gameStarted && !prisonMade){
            zzfx(...[,0,216,,.01,,,,,,,,,,,.5,,,.01]);
            resetWorldValues();
            createBaseWorld();
            if (player && player.pointer) {
                resetPlayerPointer();
            }
            prisonMade = true;
        }
        if (player && prisonMade) {
            health = player.health;
            score = player.points;
            activePlayerCamera();
            isGameOver = health === 0 ? true : false;
        }
    } else {
        mapArray.forEach(tile => {
            tile.destroy();
        });
    }
}

function checkEnemies(){
    enemies = enemies.filter(e => !e.isDead);
}

function resetWorldValues(){
    mapArray.forEach(tile => {
        tile.destroy();
    });

    supertime = 0;
    worldCD = 0;
    gravity = -.01;
    frequency = 500;
    stage++;

    newStage = true;
    // for further enhance performance and hide the randomic nature of the map outside the square-shaped base world, the game will start with fewer number of revealed tiles;
    LOS = 20;

    sky.skyColor = sky.baseSky;
    sky.horizonColor = sky.baseHorizon;
}

function createBaseWorld(){
    world = createWorld(worldX, worldY,[3,4],[3,4]);
    if (!player) {
        player = new Player(vec2(Math.floor(worldX/2), Math.floor(worldY/2)), vec2(0.9, 0.9));
    }
    world.createPrison(Math.floor(worldX/2), Math.floor(worldY/2), 20);
    if (!arrival) {
        let exitPosition = world.addExit();
        arrival = new EvoTile(vec2(exitPosition.x, exitPosition.y > 240 ? 240 : exitPosition.y), vec2(1.01, 1.01), false, true) ;
    }
    let visible = world.visibleWorld(Math.floor(worldX/2), Math.floor(worldY/2), LOS);
    for (let y = 0; y < visible.length; y++) { 
        for (let x = 0; x < visible[0].length; x++) {
            if(visible[y][x] === 1){
                mapArray.push(new EvoTile(vec2((player.pos.x - LOS + x), (player.pos.y - LOS + y)), vec2(1.01, 1.01), false));
            }
            if(visible[y][x] === 9){
                mapArray.push(new EvoTile(vec2((player.pos.x - LOS + x), (player.pos.y - LOS + y)), vec2(1.01, 1.01), true));
            }
        }
    }
}
// the camera is centered on the player
function activePlayerCamera(){
    cameraScale = 5 * 11;
    cameraPos = getCameraTarget();
    cameraPos = cameraPos.lerp(getCameraTarget(), clamp(player.getAliveTime() / 2));
}

function getCameraTarget() {
    if (player  && prisonMade) {
        const offset = 3 * percent(mainCanvasSize.y, 300, 600);
        return player.pos.add(vec2(0, offset));
    }
}

function gameUpdatePost() {

}

// in the gameRender, the supertime counter is observed to update the ui for the incoming world collapse and reset to an evolved state
// at 13 seconds the world is destroyed and reformed semi-randomly via the Conway's Game Of Life Algorithm. the rule used is the 3-4 life ruleset;
// a new game world is generated by the conway matrix array. New enemies distance from the player is checked to avoid automatic gameover;
// redraw of the pointer take it back at the top of the z-axis;
// on game over event. The world is emptied and destroyed;
function gameRender() {
    supertime++;
    if (!isGameOver) {
        if (prisonMade) {
            worldCollapse();
            if (supertime > (13 * 60)) {
                if (worldCD === 13) {
                    zzfx(...[15,,26,.02,.01,.03,4,.3,,,,.2,,,1800,,,.67,.03]);
                    evolveWorld();
                }
                setEvolvedWorldValues();
                buildNewWorld();
                resetPlayerPointer();
                supertime = 0;
            }
        }
    } else {
        onGameOverDestroy();
    }
}

function worldCollapse(){
    if (supertime % 60 === 0) {
        if (worldCD >= 7) {
            frequency += 50;
        }
        if (worldCD <12) {
            zzfx(...[15,,26,.02,.01,.03,4,.3,,,,.2,,,frequency,,,.67,.03]);
        }
        worldCD++
        baseTextDim = worldCD >= 8 ? 70: 50;
    }
    if (worldCD >= 2) {
        sky.recolor();
    }
}

function evolveWorld(){
    LOS = 30;
    player.points += 5;
    world.evolve(parseInt(player.pos.y), parseInt(player.pos.x), true, enemies);
}

function setEvolvedWorldValues(){
    worldCD = 0;
    frequency = 500;
    baseTextDim = 50;

    sky.resetColor();

    mapArray.forEach(tile => {
        tile.destroy();
    });
}

function buildNewWorld(){
    let visible = world.visibleWorld(parseInt(player.pos.x), parseInt(player.pos.y), LOS);
    for (let y = 0; y < visible.length; y++) {
        for (let x = 0; x < visible[0].length; x++) {
            if(visible[y][x] === 1){
                mapArray.push(new EvoTile(vec2((player.pos.x - LOS + x), (player.pos.y - LOS + y)), vec2(1.02, 1.02), false));
            }
            if(visible[y][x] === 3){
                mapArray.push(new EvoTile(vec2((player.pos.x - LOS + x), (player.pos.y - LOS + y - .1)), vec2(.8, .8), false, false, true));
            }
            if(visible[y][x] === 9){
                mapArray.push(new EvoTile(vec2((player.pos.x - LOS + x), (player.pos.y - LOS + y)), vec2(1.02, 1.02), true));
            }
            if(visible[y][x] === 2){
                if (calcDistance((player.pos.x - LOS + x), (player.pos.y - LOS + y), player.pos.x, player.pos.y) > 7) {
                    let newEnemy = new Enemy(vec2((player.pos.x - LOS + x), (player.pos.y - LOS + y)), vec2(0.9, 0.9), player);
                    enemies.push(newEnemy);
                } else {
                    visible[y][x] = 0;
                }
            }
        }
    }
}

function calcDistance(x1, y1, x2, y2) {
    const X = x2 - x1;
    const Y = y2 - y1;
    return Math.sqrt(X * X + Y * Y );
}

function onGameOverDestroy(){
    if (enemies.length > 0) {
        enemies.forEach(e => {
            e.destroy();
        })
        enemies = [];
    }
    if (arrival) arrival.destroy(); arrival = undefined;
    if (player) resetPlayer();
}

// in the gameRenderPost is observed the state of the game. if the game is not in the main menu or in the game over menu, the player ui for active play is added and updated;
// when in main menu and game over, the right ui is added and the use of the enter button is observed;
function gameRenderPost() {
    if (!isGameOver) {
        if (prisonMade) {
            if (worldCD >= 8) {
                baseTextDim -= (20 / 60);
            }
            drawTextScreen(worldCD, vec2(mainCanvasSize.scale(.5).x, mainCanvasSize.scale(.1).y), baseTextDim, new Color( r + (addR*worldCD), g - (remG * worldCD),b - (remB * worldCD)));
            const drawText = (text, x, y, size=40) =>
                {
                    overlayContext.textAlign = 'center';
                    overlayContext.textBaseline = 'top';
                    overlayContext.font = size + 'px monospace';
                    overlayContext.fillStyle = '#fff';
                    overlayContext.lineWidth = 3;
                    overlayContext.strokeText(text, x, y);
                    overlayContext.fillText(text, x, y);
                }
            if (remA * supertime < 1) {
                if (newStage) {
                    drawTextScreen("Stage " + stage, vec2(mainCanvasSize.scale(.5).x, mainCanvasSize.scale(.5).y), 60, new Color(1,1,1, 1 - (remA * supertime)));
                }
            }else {
                newStage = false;
            }  
            drawText('LIFE: ' + health,   overlayCanvas.width*1/4, 20);
            drawText('SCORE: ' + score, overlayCanvas.width*3/4, 20);
        } else {
            setMainMenuUI();
        }
    } else {
        setGameOverUI();
    }
}

function setMainMenuUI(){
    let textFSize = 12;
    drawTextScreen("Help Juicy, the algae from Antarctica, escaping his dissolving endless iceberg", vec2(mainCanvasSize.scale(.72).x, mainCanvasSize.scale(.23).y), textFSize, new Color(1, 1, 1));
    drawTextScreen("as hostile organisms and flamable gasses are freed from their frozen tomb. ", vec2(mainCanvasSize.scale(.72).x, mainCanvasSize.scale(.26).y), textFSize, new Color(1, 1, 1));
    drawTextScreen("WASD/Arrows to move - SPACE to attack - E to pickup power-ups - Q to use the dash power-up (lightning)", vec2(mainCanvasSize.scale(.72).x, mainCanvasSize.scale(.29).y), textFSize, new Color(1, 1, 1));
    drawTextScreen("Push Juicy against an ice block to latch him onto it. When Juicy is latched onto an ice block, press Space to slide upwards!", vec2(mainCanvasSize.scale(.72).x, mainCanvasSize.scale(.32).y), textFSize, new Color(1, 1, 1));
    drawTextScreen("Red ice blocks will dissapear after 13 seconds. An enemy or a new ice block MAY appear in its place.", vec2(mainCanvasSize.scale(.72).x, mainCanvasSize.scale(.35).y), textFSize, new Color(1, 1, 1));
    drawTextScreen("Reach the golden wind rose to escape the stage. If there is no way to reach it, wait for the ", vec2(mainCanvasSize.scale(.72).x, mainCanvasSize.scale(.38).y), textFSize, new Color(1, 1, 1));
    drawTextScreen("map to change, but who knows what else might appear.", vec2(mainCanvasSize.scale(.72).x, mainCanvasSize.scale(.41).y), textFSize, new Color(1, 1, 1));
    if (supertime % 60 === 0) {
        worldCD++
    }
    if (worldCD % 2 === 0 && isStarting >= 2) {
        drawTextScreen("Press ENTER", vec2(mainCanvasSize.scale(.5).x, mainCanvasSize.scale(.9).y), 60, new Color(1, 1, 1));
    }
}

function setGameOverUI(){
    player = undefined;
    if (supertime % 1 === 0) {
        getFinalScore();
    }
    drawTextScreen("GAME OVER", vec2(mainCanvasSize.scale(.5).x, mainCanvasSize.scale(.2).y), 60, new Color(1, 1, 1));
    drawTextScreen(finalScore, vec2(mainCanvasSize.scale(.5).x, mainCanvasSize.scale(.4).y), 60, new Color(1, 1, 1));
    if (finalScore === score) {
        if (localStorage.getItem('score') === null || localStorage.getItem('score') < score) {
            scoreChange = true;
            localStorage.setItem('score', score);
        }
        if (scoreChange) {
            drawTextScreen("NEW BEST SCORE!", vec2(mainCanvasSize.scale(.5).x, mainCanvasSize.scale(.6).y), 60, new Color(1, 1, 1));
        }
        if (supertime % 60 === 0) {
            worldCD++
        }
        if (worldCD % 2 === 0) {
            drawTextScreen("Press ENTER to restart", vec2(mainCanvasSize.scale(.5).x, mainCanvasSize.scale(.9).y), 60, new Color(1, 1, 1));
        }
        if (isGameOver && keyIsDown("Enter")) {
            toMainMenu();
        }
    }
}

function getFinalScore(){
    if (finalScore < score) {
        finalScore += 13;
        finalScore = finalScore > score ? score : finalScore;
    }
}

function toMainMenu(){
    isStarting = 0;
    stage = 0;
    finalScore = 0;
    gameStarted = false;
    prisonMade = false;
    setGame();
    isGameOver = false;
}

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['13C_tileset.png']);