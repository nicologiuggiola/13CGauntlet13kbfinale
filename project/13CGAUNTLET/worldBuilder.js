

const createWorld = (width, height, bornArray, surviveArray) => {
    // the world matrix
    let worldInfo = new Int8Array(width * height).map(() => Math.random() > 0.8 ? 1 : 0);
    //isAlive controls the Conway's Game of Life Rules. If an empty tile is surrounded with enough existing tiles, will be filled with a new tile
    // if an existing tile is surrounded by not enough or too many tiles, it will be destroyed.
    // new tiles could instead become new enemies or stage 13+ traps;
    const isAlive = (x, y, state, isEnemy) => {

        const n = (y - 1) * width + x;
        const ne = (y - 1) * width + x + 1;
        const e = y * width + x + 1;
        const se = (y + 1) * width + x + 1;
        const s = (y + 1) * width + x;
        const sw = (y + 1) * width + x - 1;
        const w = y * width + x - 1;
        const nw = (y - 1) * width + x - 1;

        let neighborsCount = (worldInfo[n]? 1 : 0) + (worldInfo[ne]? 1 : 0) + (worldInfo[e]? 1 : 0) + (worldInfo[se]? 1 : 0) + (worldInfo[s]? 1 : 0) + (worldInfo[sw]? 1 : 0) + (worldInfo[w]? 1 : 0) + (worldInfo[nw]? 1 : 0);

        if (state === 1) {
            return surviveArray.includes(neighborsCount)? 1 :  0;
        }
         return bornArray.includes(neighborsCount)? (isEnemy ? (rand() < 0.01 ? 2 : stage >= 13 ? (rand() < .1 ? 3 : 1): 1) : 1) : 0;
    }

    // a base world is built around the player
    const createPrison = (centerX, centerY, size) => {
        for (let y = centerY - size; y < centerY + size + 1; y++) {
            for (let x = centerX - size; x < centerX + size + 1; x++) {
                if (!(y === centerY && x === centerX)) {
                    if (x % 2 === 0 || y % 2 === 0) {
                        worldInfo[y * width + x] = 1;
                    }
                }
            }
        }
        worldInfo = worldInfo.map((cell, index) => {
            if (cell === 1 || cell === 9) {
                const x = index % width;
                const y = Math.floor(index / width);
                return checkSurvival(x, y);
            }
        });
    }
    // add exit localize the next spot for the windrose to spawn. The wind rose spot will always be near or on the limit of the map
    const addExit = () => {
        const isX = rand() < 0.5;
        if (isX) {
            const x = Math.floor(Math.random() * width);
            const y = Math.random() < 0.5 ? 0 : height - 1;
            worldInfo[y * width + x] = 4;
            return  {x: x, y: y};
        }
        else {
            const x = Math.random() < 0.5 ? 0 : width - 1;
            const y = Math.floor(Math.random() * height);
            worldInfo[y * width + x] = 4;
            return  {x: x, y: y};
        }
    }
    // conway's rule are enacted; the game is enforced to avoid to position tiles too close to the player or the enemies to avoid the risk of overlap
    const evolve = (playerX, playerY, isEnemy, livingEnemies) => {
        worldInfo[playerY * width + playerX] = 0;
        if (livingEnemies) {
            livingEnemies.forEach(enemy => {
                worldInfo[enemy.pos.y * width + enemy.pos.x] = 0;
            });
        }
        worldInfo = worldInfo.map((cell, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            return isAlive(x, y, cell, isEnemy);
        });
        worldInfo = worldInfo.map((cell, index) => {
            if (cell === 1 || cell === 9) {
                const x = index % width;
                const y = Math.floor(index / width);
                return checkSurvival(x, y);
            } else {
                return cell
            }
        });
    }
    // the game will revel to the player which tile will for sure be detroyed at the evolution of the map;
    const checkSurvival = (x, y) => {
        const n = (y - 1) * width + x;
        const ne = (y - 1) * width + x + 1;
        const e = y * width + x + 1;
        const se = (y + 1) * width + x + 1;
        const s = (y + 1) * width + x;
        const sw = (y + 1) * width + x - 1;
        const w = y * width + x - 1;
        const nw = (y - 1) * width + x - 1;

        let neighborsCount = (worldInfo[n] && (worldInfo[n]=== 1 || worldInfo[n]=== 9) ? 1 : 0) + (worldInfo[ne] && (worldInfo[ne] === 1 || worldInfo[ne] === 9)? 1 : 0) + (worldInfo[e] && (worldInfo[e] === 1 || worldInfo[e] === 9) ? 1 : 0) + (worldInfo[se] && (worldInfo[se] === 1 || worldInfo[se] === 9)? 1 : 0) + (worldInfo[s] && (worldInfo[s] === 1 || worldInfo[s] === 9)? 1 : 0) + (worldInfo[sw] && (worldInfo[sw] === 1 || worldInfo[sw] === 9)? 1 : 0) + (worldInfo[w] && (worldInfo[w] === 1 || worldInfo[w] === 9) ? 1 : 0) + (worldInfo[nw] && (worldInfo[nw] === 1 ||worldInfo[nw] === 9) ? 1 : 0);
        return surviveArray.includes(neighborsCount)? 1 : 9;
    }

    // for both performance and as survival mechanic, the player will only see a max number of close tiles, hiding how unexplored map is randomized
    const visibleWorld = (playerX, playerY, sightDistance, livingEnemies) => {
        worldInfo[playerY * width + playerX] = 0;
        if (livingEnemies) {
            livingEnemies.forEach(enemy => {
                worldInfo[enemy.pos.y * width + enemy.pos.x] = 0;
            });
        }

        let visibleWorld = [];


        startingX = playerX - sightDistance;
        startingY = playerY - sightDistance;
        endingX = playerX + sightDistance;
        endingY = playerY + sightDistance;



      
        let rows = -1;
        for (let y = startingY; y < endingY; y++) {
            visibleWorld.push([]);
            rows++;
            for (let x = startingX; x < endingX; x++) {
                visibleWorld[rows].push(x < 0 || x > width - 1 ? 0 :( worldInfo[y * width + x] || 0));
            }
        }
        return visibleWorld;
    }



    return {
        evolve,
        visibleWorld,
        createPrison,
        addExit,
        worldInfo,
        width
    }

}

