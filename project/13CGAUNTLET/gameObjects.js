'use strict';
// a game object class is extended form littlejs base object. the object for the distribution of the sprites is added and is also added a tag that is used as flag during interactions
// and collisions
class GameObject extends EngineObject {
    constructor(pos, size) {
        super(pos, size);
        this.tag = "";
        this.spriteAtlas = {
            player: tile(0),
            dead: tile(4),
            pointer: tile(14),
            unarmed: tile(3),
            armed: tile(1),
            dead: tile(4),
            bolt: tile(5),
            rifle: tile(6),
            shotgun: tile(7),
            health: tile(8),
            dash: tile(9),
            points: tile(10),
            tile: tile(2),
            arrival: tile(12),
            fire: tile(13),
            bullet: tile(11)
        };
    }
}

// another class is extended from the new gameobject to separate the objects that need gravity;
class GravObject extends GameObject {
    constructor(pos, size) {
        super(pos, size);
        this.gravityScale = 0;
        this.setCollision();
    }
}

// one more generic class is extended for moving characters: the player and the enemies;
class CharObject extends GravObject {
    constructor(pos, size) {
        super(pos, size);
        this.weapon;
        this.mirror = false;
        this.isDashing = false;
        this.dashDuration = 10;
        this.isJumping = false;
        this.canJump = true;
        this.shotCD = 0;
        this.dashCD = 0;
        this.isDead = false;
    }

    update() {
        super.update();
        this.gravityScale = 1;
        this.shotCD++;
        this.dashCD++;
        this.shieldCD++;
        if (this.pos.y < -15 && gameStarted) {
            this.isDead = true;
        }
    }
    // the base attack command;
    shot() {
        this.weapon.fireBullet();
    }
    // the modular slot is the inventory manager. The character reads what his inventory is filled with and equip the right powerup as a weapon;
    // the weapon object decide the behaviour of the bullets;
    swapActiveWeapon(isEnemy){
        if (this.modularSlots.pp.main.bolt && (!this.weapon || this.weapon.tag !== "bolt")) {
            if (this.weapon) {
                this.weapon.destroy();
            }
            this.weapon = new Weapon(this.pos, this, "bolt", vec2(.6), isEnemy);

        }
        if (this.modularSlots.pp.main.rifle && (!this.weapon || this.weapon.tag !== "rifle")) {
            if (this.weapon) {
                this.weapon.destroy();
            }
            this.weapon = new Weapon(this.pos, this, "rifle", vec2(.6), isEnemy);

        }
        if (this.modularSlots.pp.main.shotgun && (!this.weapon || this.weapon.tag !== "shotgun")) {
            if (this.weapon) {
                this.weapon.destroy();
            }
            this.weapon = new Weapon(this.pos, this, "shotgun", vec2(.6), isEnemy);

        }
    }
}

class Player extends CharObject {

    constructor(pos, size) {
        super(pos, size);
        this.tag = "player";
        this.modularSlots = new ModularSlots(this.tag, this);
        this.isGrounded = true;
        this.bounceTime = new Timer(rand(1e3));
        this.modularSlots.pp.main.bolt = true;
        this.weapon = new Weapon(this.pos, this, "bolt", vec2(.6), false);
        this.health = 3;
        this.points = 0;
        this.isDead = false;
        this.explosion = 60;
        this.pointer;
    }

    // update controls the player inputs, the rotation of the pointer for the windrose and checks the inventory. Will observe the state "isDead" to trigger the death animation
    // and reset the player to replay the level if enough lifepoints remains. otherwise, it will trigger the gameover event.
    update() {
        super.update();
        this.characterController();
        this.pointerController();
        this.swapActiveWeapon(false);
        if (this.isDead) {
            this.explosion--;
            if (this.explosion <= 0) {
                this.deathEvent();
            }
        }
    }

    characterController(){
        if (keyIsDown('ArrowUp') && !this.isJumping && this.canJump) {
            this.velocity.y = .15;
            this.velocity.y += .060;
            this.jumpCount++;
            zzfx(...[2,,216,.02,.04,,1,1.9,50,,,,,,,,,.56,.04,,-300]);
            this.isJumping = true;
        }
        if (!keyIsDown('ArrowUp')) {
            this.isJumping = false;
        }
        if (this.jumpCount >= 2) {
            this.canJump = false;
        } else {
            this.canJump = true;
        }
        if (keyIsDown('ArrowRight')) {
            this.velocity.x = .15;
            this.mirror = false;
            if (this.weapon) {
                this.weapon.mirror = false;
            }
        }

        if (keyIsDown('ArrowLeft')) {
            this.velocity.x = -.15;
            this.mirror = true;
            if (this.weapon) {
                this.weapon.mirror = true;
            }
        }
        if (keyIsDown("Space") && this.shotCD >= 30) {
            this.shot();
            this.shotCD = 0;
        }
        if (this.modularSlots.pp.secondary.dash) {
            if (keyIsDown("KeyQ") && this.dashCD >= 60) {
                this.dash();
                this.dashCD = 0;
            }
        }
    }

    pointerController(){
        if (arrival && !this.pointer) {
            this.pointer = new EngineObject(vec2(this.pos.x, this.pos.y + 1), this.size);
            this.pointer.gravityScale = 0;
        }
        if (arrival && this.pointer) {
            this.pointer.pos = vec2(this.pos.x, this.pos.y + 1);
            let pAngle = Math.PI + Math.atan2(-arrival.pos.x + this.pointer.pos.x, -arrival.pos.y + this.pointer.pos.y);
            this.pointer.angle = pAngle
        }
    }

    deathEvent(){
        new ParticleEmitter(
            this.pos, 0,
            .2, .10, 80, PI,
            0,
            new Color(1, 1, 1), new Color(1, 1, 1),
            new Color(1, 1, 1).scale(1, 0), new Color(1, 1, 1).scale(1, 0),
            10, 0.2, 1, 0.09, 0,
            1, 1, 2, 0,
            0, 0.06, 0, 0, 1);
        this.health--;
        if (this.health >= 1) {
            this.onDeathResetWorldState();
        } else {
            this.pointer.destroy();
            this.destroy();
        }
        this.explosion = 60;
    }

    onDeathResetWorldState(){
        if (enemies.length > 0) {
            enemies.forEach(e => {
                e.destroy();
            })
            enemies = [];
        }
        prisonMade = false;
        stage--;
        this.pos = vec2(Math.floor(worldX/2), Math.floor(worldY/2));
        this.pointer.destroy(); this.pointer = undefined;
        this.isDead = false;
    }

    dash() {
        if (this.dashDuration > 0) {
            this.weapon.isActive = true;
            this.velocity.x = this.mirror ? -.40 : .40;
            this.dashDuration--;
        } else {
            this.dashDuration = 10;
            this.weapon.isActive = false;
            this.isDashing = false;
        }
    }
    render() {
        let additiveColor = hsl(0, 0, 0, 0);
        const bounceTime = this.bounceTime * 6;
        let drawSize = vec2(1 - .1 * Math.sin(bounceTime), 1 + .1 * Math.sin(bounceTime));
        let bodyPos = this.pos;
        bodyPos = bodyPos.add(vec2(0, (drawSize.y - this.size.y) / 2));
        if (arrival && this.pointer) {
            this.pointer.tileInfo = this.spriteAtlas.pointer.frame(0);
        }
        this.tileInfo = this.isDead ? this.spriteAtlas.dead.frame(0) : this.spriteAtlas.player.frame(0);
        drawTile(bodyPos, drawSize, this.tileInfo, this.color, this.angle, this.mirror, additiveColor);
    }

    collideWithObject(o) {
        if (o && o.tag === "powerup") {
            if (o.selected === "points") {
                this.modularSlots.gainPower(o.selected);
                zzfx(...[,0,2589.07,,.1,.3,1,,,,,,,,,,,.1,.24]);
                o.destroy();
            } else {
                if (keyIsDown("KeyE") && o.creationCD <= 0) {
                    zzfx(...[.6,0,432,.04,.1,1.19,,,5,,100,,,,-4,,,.2,.1,,20]);
                    this.modularSlots.gainPower(o.selected);
                    o.destroy();
                }
            }
            return 0;
        }
        if (o && o.tag === "enemy" && !this.isDead && !o.isDead) {
            if (!(this.pos.y > o.pos.y + .1) && !o.isDead) {
                return this.onDeath();
            }
        }
        if (o && o.tag === "bullet") {
            if (!o.isEnemy) {
                return 0
            } else {
                return this.onDeath();
            }
        }
        if (o.tag === "tile") {
            if (!o.isTrap) {
                if (!o.isArrival) {
                    if (o.pos.y > this.pos.y) {
                        return 1;
                    } else {
                        this.isGrounded = true;
                        this.jumpCount = 0;
                        this.canJump = true;
        
                        return this.isDead ? 0 : 1;
                    }
                }else {
                    this.setStageEndEvent(o);
                    return 0
                }
            } else {
                return this.onDeath();
            }
        }
        return this.isDead ? 0 : 1;;
    }

    onDeath(){
        this.isDead = true;
        zzfx(...[.9,,436,.03,.21,,1,1.9,4,,,,.06,,-18,,,.3,.1,,-800]);
        this.deathAnimation();
        return this.isDead ? 0 : 1;
    }

    // setStageEndEvent will comunicate to the game code to rebuild a standard gameworld for the next stage, once the wind rose is triggered
    setStageEndEvent(o){
        arrival = undefined
        prisonMade = false;
        this.points += 1300;
        this.pos = vec2(Math.floor(worldX/2), Math.floor(worldY/2));
        if (enemies.length > 0) {
            enemies.forEach(e => {
                e.destroy();
            })
            enemies = [];
        }
        zzfx(...[.6,0,864,.02,.1,.7,1,.9,,,160,.06,.01,,,,,.2,.1,,500]);
        o.destroy();
    }

    deathAnimation() {
        this.velocity.y = .3;
    }

    collideWithTile(o) {
        this.isGrounded = true;
        this.jumpCount = 0;
        this.canJump = true;

        return 1;
    }
}

class Enemy extends CharObject {
    constructor(pos, size, player) {
        super(pos, size);
        this.tag = "enemy";
        this.modularSlots = new ModularSlots(this.tag, this);
        this.player = player;
        this.aggro = false;
        this.bounceTime = new Timer(rand(1e3));
        this.explosion = 60;
        this.isReposition = false;
        this.lockedPos = this.pos;
        this.newDir = undefined;
        this.hasDropped = false;
        this.canJump = 60;
    }

    update() {
        super.update();
        if (this.isDead) {
            this.explosion--;
            this.enemyDeathEvent();
        }
        this.swapActiveWeapon(true);
        if (!this.aggro) {
            this.checkAggro();
        } else {
            if (!this.isDead) {

                this.enemyController();
            }
            if (this.weapon && !this.isDead) {
                if (this.shotCD >= 60) {
                    this.shot();
                    this.shotCD = 0;
                }
            }
        }
        this.canJump--;
    }

    enemyDeathEvent(){
        if (this.explosion <= 0) {
            new ParticleEmitter(
                this.pos, 0,
                .2, .10, 80, PI,
                0,
                new Color(1, 0, 0), new Color(1, 0, 0),
                new Color(1, 0, 0).scale(1, 0), new Color(1, 0, 0).scale(1, 0),
                10, 0.2, 1, 0.09, 0,
                1, 1, 2, 0,
                0, 0.06, 0, 0, 1);
            this.destroy();
        }
    }
    // the enemy checks the distance with the player to start the chase
    checkAggro() {
        if (Math.abs(this.pos.x - this.player.pos.x) <= 8 && Math.abs(this.pos.y - this.player.pos.y) <= 6) {
            this.aggro = true;
        }
    }

    enemyController() {
        if (this.pos.x < this.player.pos.x) {
            this.velocity.x = .10;
            this.mirror = false;
            if (this.weapon) {
                this.weapon.mirror = false;
            }
        }
        if (this.pos.x > (this.player.pos.x + this.player.size.x)) {
            this.velocity.x = -.10;
            this.mirror = true;
            if (this.weapon) {
                this.weapon.mirror = true;
            }
        }

        if (this.pos.y < this.player.pos.y) {
            if (Math.abs(this.pos.x - this.player.pos.x) <= 5 && !this.isJumping && this.canJump <= 0) {
                this.velocity.y = .25;
                this.velocity.y += .060;
                this.isJumping = true;
                zzfx(...[.9,,432,.04,.08,,1,1.9,50,,,,,,,,,.56,.1,,-555]);
            }
        }
    }

    render() {
        if (this.modularSlots) {
            let additiveColor = hsl(0, 0, 0, 0);
            const bounceTime = this.bounceTime * 6;
            let drawSize = vec2(1 - .1 * Math.sin(bounceTime), 1 + .1 * Math.sin(bounceTime));
            let bodyPos = this.pos;
            bodyPos = bodyPos.add(vec2(0, (drawSize.y - this.size.y) / 2));
            this.tileInfo = this.isDead ? this.spriteAtlas.dead.frame(0) : this.modularSlots.armed ? this.spriteAtlas.armed.frame(0) : this.spriteAtlas.unarmed.frame(0);
            drawTile(bodyPos, drawSize, this.tileInfo, this.color, this.angle, this.mirror, additiveColor);
        }
    }

    collideWithObject(o) {
        if (o && o.tag === "enemy") {
            return 0
        }

        if (o && o.tag === "player" && !this.player.isDead) {

            if (this.player.pos.y > (this.pos.y) && (this.player.pos.x) < (this.pos.x + this.size.x - .1) && (this.player.pos.x + this.player.size.x) > this.pos.x + .1) {
                this.player.velocity.y = .10;
                this.player.velocity.y += .060;
                return this.onEnemyDeath();
            }
        }

        if (o && o.tag === "bullet") {
            if (o.isEnemy) {
                return 0;
            } else {
                return this.onEnemyDeath();
            }
        }
        if (o.tag === "tile") {
            if (!(o.pos.y > this.pos.y)) {
                if (this.isJumping) {
                    this.isJumping = false;
                    this.canJump = rand(30, 60);
                }
            }
            return this.isDead ? 0 : 1;
        }
        return this.isDead ? 0 : 1;
    }

    onEnemyDeath(){
        if (!this.isDead) {
            zzfx(...[.9,,436,.03,.21,,1,1.9,4,,,,.06,,-18,,,.3,.1,,-800]);
            this.isDead = true;
        }
        this.spawnLoot();
        this.deathAnimation();
        return this.isDead ? 0 : 1;
    }

    deathAnimation() {
        this.velocity.y = .3;
    }

    // a loot is spawned, the loot is scaled with the difficulty of the enemy. Stronger the weapon, greater the result.
    // armed enemies will always leave their weapons on the ground
    spawnLoot(){
        if (!this.hasDropped) {
            let powerUp = new PowerUp(this.pos, this.size, "points");
            powerUp.velocity.y = .10;
            powerUp.velocity.y += .060;
            powerUp.velocity.x += this.mirror ? .010 : -.010;
            let mod = rand();
            if (mod <= 0.2){
                let powerUP = mod <= 0.03 ? new PowerUp(this.pos, this.size, "dash") : new PowerUp(this.pos, this.size, "health");
            }
            if (this.weapon) {
                new PowerUp(this.pos, this.size, this.weapon.tag);
                let moneyCounter = this.weapon.tag === "bolt" ? 1 : this.weapon.tag === "rifle" ? 2 : 3;
                for (let i = 0; i < moneyCounter.length; i++) {
                    new PowerUp(this.pos, this.size, "points");
                }
            }
            this.hasDropped = true;
        }
    }
}

class ModularSlots {
    constructor(parentTag, parent) {
        this.parent = parent;
        this.tag = "modularSlot";
        this.pp = {
            secondary: {
                dash: false,
            },
            main: {
                bolt: false,
                shotgun: false,
                rifle: false,
            }
        }
        this.armed = false;
        this.powerUps = 0;
        this.maxPowerUps = 2;
        if (parentTag !== "player") {

            this.powerSelection();
        }
    }

    powerSelection() {
        let prob = rand();
        let modifier = prob <= .35 && prob > .15 ? (stage <= 2 ? null : "bolt") : prob <= .15 && prob > .01 ? (stage <= 5 ? null : "rifle") :  prob <= .01 ? (stage <= 8 ? null : "shotgun") : null;
        modifier = modifier !== null && modifier !== "bolt" && modifier !== "rifle" && modifier !== "shotgun" ? "bolt" : modifier;
        this.armed = modifier !== null ? true : false;
        if (modifier !== null) {
            this.pp.main[modifier] = true;
        }
    }

    gainPower(ppString) {
        if (ppString === "points") {
            this.parent.points += 10;
        }
        if (ppString === "health") {
            this.parent.health++;
        } else {
            for (const key in this.pp) {
                if (this.pp[key][ppString] !== undefined && !this.pp[key][ppString]) {
                    for (const subkey in this.pp[key]) {
                        if (this.pp[key][subkey]) {
                            let powerUp = new PowerUp(this.parent.pos, this.parent.size, subkey);
                            powerUp.velocity.y = .10;
                            powerUp.velocity.y += .060;
                            powerUp.velocity.x += this.parent.mirror ? .010 : -.010;
                        }
                        this.pp[key][subkey] = false;
                    }
                    this.pp[key][ppString] = true;
                }
            }
        }
    }
}

class PowerUp extends GravObject {
    constructor(pos, size, baseP) {
        super(pos, size);
        this.creationCD = 120;
        this.elasticity = .8;
        this.tag = "powerup";
        this.allPP = ["dash", "bolt", "shotgun", "rifle", "health", "points"];
        this.selected = "";
        this.selected = !baseP ? this.allPP[randInt(0, this.allPP.length)] : this.allPP[this.allPP.indexOf(baseP)];
    }

    update() {
        super.update();
        this.gravityScale = 1;
        if (this.creationCD > 0) {
            this.creationCD--;
        }
    }


    render() {
        if (this.selected !== "") {
            let additiveColor = hsl(0, 0, 0, 0);
            if (this.spriteAtlas[this.selected]) {
                this.tileInfo = this.spriteAtlas[this.selected].frame(0);
                if (this.creationCD <= 0 || (this.creationCD > 100 || this.creationCD <= 80 && this.creationCD > 60 || this.creationCD <= 40 && this.creationCD > 20) || this.selected === "points") {
                    drawTile(this.pos, this.size, this.tileInfo, this.color, this.angle, this.mirror, additiveColor);
                }
            }
        }
    }

    collideWithObject(o) {
        if (o.tag === "tile") {
            return 1;
        } else {
            return 0;
        }
    }

}

class Weapon extends GameObject {
    constructor(pos, parent, tag, size, isEnemy) {
        super(pos, size);
        this.color = new Color(0, 0, 0, 0);
        this.tag = tag;
        this.isEnemy = isEnemy;
        parent.addChild(this, vec2(.6, 0));
    }

    fireBullet() {
        if (this.tag !== "shotgun") {
            if (this.tag === "bolt") {
                zzfx(...[.2,,900,.03,.05,.03,3,0,,8.2,-110,,,2.9,,,,.2,.01,.18,146]);
            } else {
                zzfx(...[1.5,0,900,,.06,,2,6,4,-15,15,,,,4,.3,,.1,.07,,2810]);
            }
            new Bullet(this.pos, this, this.isEnemy);
        } else {
            zzfx(...[2,0,0,,.06,.16,4,1.9,30,,,-0.16,.11,,,.5,,.1,.1]);
            new Bullet(this.pos, this, this.isEnemy, .15);
            new Bullet(this.pos, this, this.isEnemy, 0);
            new Bullet(this.pos, this, this.isEnemy, -.15);
        }
    }

}

class Bullet extends GravObject {
    constructor(pos, weapon, isEnemy, sgY) {
        super(pos, vec2(.38, .38));
        this.tag = "bullet";
        this.weapon = weapon;
        this.isEnemy = isEnemy;
        if (weapon.tag === "bolt") {
            this.velocity.x = weapon.mirror ? -.25 : .25;
            this.velocity.y = .10;
        }
        if (weapon.tag === "rifle") {
            this.velocity.x = weapon.mirror ? -.25 : .25;
        }
        if (weapon.tag === "shotgun") {
            this.velocity.x = weapon.mirror ? -.25 : .25;
            this.velocity.y = sgY;
        }
        this.life = 120;
    }

    update() {
        super.update();
        this.life--;
        if (this.weapon.tag === "bolt") {
            this.gravityScale = 1;
        }
        if (this.life <= 0) {
            this.destroy()
        }
    }
    render() {
        let additiveColor = hsl(0, 0, 0, 0);
        this.tileInfo = this.spriteAtlas.bullet.frame(0);
        drawTile(this.pos, vec2(1, 1), this.tileInfo, this.color, this.angle, this.mirror, additiveColor);
    }

    collideWithObject(o) {
        if (o && (o.tag === "player" || o.tag === "powerup" || o.tag === "bullet")) {
            return 0;
        } else {
            this.destroy();
            return 1;
        }
    }

    collideWithTile(o) {
        this.destroy();
        return 1;
    }
}

class EvoTile extends GravObject {
    constructor(pos, size, isEvolving, isArrival, isTrap) {
        super(pos, size);
        this.tag = "tile"
        this.mass = 0;
        this.isEvolving = isEvolving;
        this.color = new Color(1, 1, 1);
        this.isArrival = isArrival;
        this.isTrap = isTrap;
        this.bounceTime = new Timer(rand(1e3));
    }

    collideWithObject(o) {
        // base enemies lack interactions with the world tile. Was also noticed a bug that caused the enemies to move between evolving tiles before finishing their generation
        // locking the enemies under new tiles. This code provide a way for unarmed enemies to rarely destroy tiles while in chase and free themselves if they get stuck
        if (o.tag === "enemy" && !this.isArrival && !this.isTrap && !o.isDead) {
            const x_overlap = Math.max(0, Math.min(o.pos.x + o.size.x, this.pos.x + this.size.x) - Math.max(o.pos.x, this.pos.x));
            const y_overlap = Math.max(0, Math.min(o.pos.y + o.size.y, this.pos.y + this.size.y) - Math.max(o.pos.y, this.pos.y));
            const overlapArea = x_overlap * y_overlap;
            const oneThirdArea = (o.size.x * o.size.y) / 3;
            if (overlapArea >= oneThirdArea) {
                this.destroy();
            }
        }
        if (o.tag === "bullet" && !this.isArrival && !this.isTrap) {
            new ParticleEmitter(
                this.pos, 0,
                .2, .10, 50, PI,
                0,
                new Color(1, 1, 1), new Color(1, 1, 1),
                new Color(1, 1, 1).scale(1, 0), new Color(1, 1, 1).scale(1, 0),
                10, 0.2, 1, 0.09, 0,
                1, 1, 2, 0,
                0, 0.06, 0, 0, 1);
                zzfx(...[.6,.4,475,.01,.02,.01,2,,,,,,.05,1.6,8.3,,.17,.44,.03,.48]);
            this.destroy();

            return 1;
        }

        return (this.isArrival || this.isTrap) ? 0 : 1;
    }

    render() {
        let additiveColor = hsl(0, 0, 0, 0);
        const bounceTime = this.bounceTime * 6;
        let drawSize = vec2(1 - .1 * Math.sin(bounceTime), 1 + .1 * Math.sin(bounceTime));
        let bodyPos = this.pos;
        bodyPos = bodyPos.add(vec2(0, (drawSize.y - this.size.y) / 2));
        this.tileInfo = this.isTrap ? this.spriteAtlas.fire.frame(0) : this.isArrival?this.spriteAtlas.arrival.frame(0):  this.spriteAtlas.tile.frame(0);
        if (this.color.g > 0 && this.color.b > 0 && this.isEvolving) {
            this.color = new Color(this.color.r, this.color.g - (1 / (13 * 60)), this.color.b - (1 / (13 * 60)));
        }
        drawTile(this.isTrap ? bodyPos: this.pos,this.isTrap ? drawSize: this.size, this.tileInfo, this.isTrap ? undefined : this.color, this.angle, this.mirror, additiveColor);
    }
}

class Sky extends EngineObject
{
    constructor() 
    {
        super();

        this.renderOrder = -1e4;
        this.seed = randInt(1e9);
        this.baseSky = new Color(0.66, 0.44, 0.83,1);
        this.baseHorizon = new Color(0.21, 0.25, 0.45, 1);
        this.endSky = new Color(0.6731, 0.50, 0.75, 1);
        this.endHorizon = new Color(0.87,0.61, 0.42, 1);
        this.skyColor = new Color(0.67, 0.44, 0.83,1);
        this.horizonColor = new Color(0.21, 0.25, 0.45, 1);
    }

    render()
    {
        const gradient = mainContext.createLinearGradient(0, 0, 0, mainCanvas.height);
        gradient.addColorStop(0, this.skyColor);
        gradient.addColorStop(1, this.horizonColor);
        mainContext.save();
        mainContext.fillStyle = gradient;
        mainContext.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        mainContext.globalCompositeOperation = 'lighter';
        const random = new RandomGenerator(this.seed);
        for (let i=50; i--;)
        {
            const size = random.float(.5,2)**2;
            const speed = random.float(9,99);
            const color = hsl(random.float(-.3,.2), random.float(), random.float());
            const extraSpace = 50;
            const w = mainCanvas.width+2*extraSpace, h = mainCanvas.height+2*extraSpace;
            const screenPos = vec2(
                (random.float(w)+time*speed)%w-extraSpace,
                (random.float(h)+time*speed*random.float())%h-extraSpace);
            mainContext.fillStyle = color;
            mainContext.fillRect(screenPos.x, screenPos.y, size, size);
        }
        mainContext.restore();
    }

    recolor(){
        let msR = Math.abs(this.baseSky.r - this.endSky.r) / 660;
        let msG = Math.abs(this.baseSky.g - this.endSky.g) / 660;
        let msB = Math.abs(this.baseSky.b - this.endSky.b) / 660;
        let mhR = Math.abs(this.baseHorizon.r - this.endHorizon.r) / 660;
        let mhG = Math.abs(this.baseHorizon.g - this.endHorizon.g) / 660;
        let mhB = Math.abs(this.baseHorizon.b - this.baseHorizon.b) / 660;
        let newSky = new Color(this.skyColor.r + msR, this.skyColor.g + msG, this.skyColor.b - msB);
        let newHorizon = new Color(this.horizonColor.r + mhR, this.horizonColor.g + mhG, this.horizonColor.b - mhB);
        this.skyColor = newSky;
        this.horizonColor = newHorizon;
    }

    resetColor(){
        this.skyColor = this.baseSky;
        this.horizonColor = this.baseHorizon;
    }
}