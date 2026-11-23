/* =========================================================
   LAST//ALIVE
   DISTRICT 09
   THIRD PERSON BATTLE ROYALE
   ========================================================= */

"use strict";

const $ = id => document.getElementById(id);

/* ---------------------------------------------------------
   GLOBALS
--------------------------------------------------------- */

let scene;
let camera;
let renderer;
let clock;

let player;
let playerGun;

let running = false;
let gameStarted = false;

let yaw = 0;
let pitch = -0.08;

let health = 100;
let armor = 100;
let kills = 0;
let aliveCount = 12;
let medkits = 2;

let zoneRadius = 180;
let zoneTimer = 0;

let jumpVelocity = 0;
let grounded = true;

let sprinting = false;
let crouching = false;

let lastShot = 0;
let reloadTimer = null;

const keys = {};
const enemies = [];
const bullets = [];
const pickups = [];
const worldObjects = [];

const raycaster = new THREE.Raycaster();

const moveInput = {
    x: 0,
    y: 0
};

let mobileAiming = false;
let fireHeld = false;

const weapons = [
    {
        name: "AR-01",
        damage: 34,
        fireRate: 130,
        magazine: 30,
        ammo: 30,
        reserve: 150,
        spread: 0.018
    },
    {
        name: "SMG-09",
        damage: 19,
        fireRate: 75,
        magazine: 40,
        ammo: 40,
        reserve: 200,
        spread: 0.035
    },
    {
        name: "M12",
        damage: 18,
        fireRate: 700,
        magazine: 6,
        ammo: 6,
        reserve: 48,
        spread: 0.09,
        pellets: 7
    }
];

let weaponIndex = 0;


/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

function startGame() {

    const input = $("name");

    if (!input || !input.value.trim()) {
        if (input) {
            input.focus();
            input.placeholder = "ENTER YOUR NAME FIRST";
        }
        return;
    }

    if (typeof THREE === "undefined") {
        alert(
            "Three.js load nahi hua.\n\n" +
            "Internet connection check karo."
        );
        return;
    }

    $("start").style.display = "none";
    $("hud").style.display = "block";
    $("loading").style.display = "block";

    try {

        initGame();

        running = true;
        gameStarted = true;

        clock.start();

        updateHUD();

        requestAnimationFrame(gameLoop);

        setTimeout(() => {
            if (renderer && renderer.domElement) {
                renderer.domElement.requestPointerLock?.();
            }
        }, 300);

    } catch (error) {

        console.error(error);

        alert(
            "GAME ERROR:\n\n" +
            error.message
        );

        location.reload();
    }
}


/* ---------------------------------------------------------
   INITIALIZE
--------------------------------------------------------- */

function initGame() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x8ea8a8);

    scene.fog = new THREE.Fog(
        0x8ea8a8,
        100,
        700
    );

    camera = new THREE.PerspectiveCamera(
        68,
        innerWidth / innerHeight,
        0.1,
        1200
    );

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(
        innerWidth,
        innerHeight
    );

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            1.5
        )
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.15;

    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    createLighting();
    createSky();
    createTerrain();
    createRoads();
    createCity();
    createIndustrialZone();
    createVillage();
    createForest();
    createProps();
    createZone();
    createPlayer();
    createEnemies();
    createPickups();
    setupControls();
    setupMobileControls();

    updateCamera();

    $("loading").style.display = "none";
}


/* ---------------------------------------------------------
   LIGHTING
--------------------------------------------------------- */

function createLighting() {

    const hemi =
        new THREE.HemisphereLight(
            0xcdeeff,
            0x243c2e,
            2.4
        );

    scene.add(hemi);

    const sun =
        new THREE.DirectionalLight(
            0xffe8bd,
            4
        );

    sun.position.set(
        -180,
        250,
        130
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -350;
    sun.shadow.camera.right = 350;
    sun.shadow.camera.top = 350;
    sun.shadow.camera.bottom = -350;

    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 700;

    scene.add(sun);

    const fill =
        new THREE.DirectionalLight(
            0x6ca5ff,
            0.6
        );

    fill.position.set(
        200,
        100,
        -180
    );

    scene.add(fill);
}


/* ---------------------------------------------------------
   SKY
--------------------------------------------------------- */

function createSky() {

    const sky =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                700,
                32,
                16
            ),
            new THREE.MeshBasicMaterial({
                color: 0x9ab7bd,
                side: THREE.BackSide
            })
        );

    scene.add(sky);

    for (let i = 0; i < 18; i++) {

        const cloud =
            new THREE.Group();

        for (let j = 0; j < 5; j++) {

            const puff =
                new THREE.Mesh(
                    new THREE.SphereGeometry(
                        9 + Math.random() * 8,
                        10,
                        8
                    ),
                    new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.22
                    })
                );

            puff.position.set(
                j * 10,
                Math.random() * 5,
                Math.random() * 7
            );

            cloud.add(puff);
        }

        cloud.position.set(
            -350 + Math.random() * 700,
            130 + Math.random() * 80,
            -300 + Math.random() * 600
        );

        scene.add(cloud);
    }
}


/* ---------------------------------------------------------
   TERRAIN
--------------------------------------------------------- */

function terrainHeight(x, z) {

    const hill1 =
        Math.sin(x * 0.015) *
        Math.cos(z * 0.018) *
        5;

    const hill2 =
        Math.sin(x * 0.035 + 2) *
        Math.sin(z * 0.027) *
        3;

    const hill3 =
        Math.cos(
            Math.sqrt(x * x + z * z) *
            0.025
        ) * 3;

    return hill1 + hill2 + hill3;
}


function createTerrain() {

    const size = 600;
    const segments = 120;

    const geometry =
        new THREE.PlaneGeometry(
            size,
            size,
            segments,
            segments
        );

    const pos =
        geometry.attributes.position;

    for (
        let i = 0;
        i < pos.count;
        i++
    ) {

        const x = pos.getX(i);
        const z = pos.getY(i);

        const edge =
            Math.max(
                Math.abs(x),
                Math.abs(z)
            );

        let h =
            terrainHeight(x, z);

        if (edge > 245) {
            h -=
                (edge - 245) * 0.22;
        }

        pos.setZ(i, h);
    }

    geometry.computeVertexNormals();

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x4c713f,
            roughness: 1
        });

    const ground =
        new THREE.Mesh(
            geometry,
            material
        );

    ground.rotation.x = -Math.PI / 2;

    ground.receiveShadow = true;

    scene.add(ground);

    worldObjects.push(ground);

    /* water */

    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                1000,
                1000
            ),
            new THREE.MeshStandardMaterial({
                color: 0x236878,
                roughness: 0.25,
                metalness: 0.2
            })
        );

    water.rotation.x = -Math.PI / 2;

    water.position.y = -5;

    scene.add(water);
}


/* ---------------------------------------------------------
   ROAD
--------------------------------------------------------- */

function makeRoad(
    x,
    z,
    width,
    length,
    rotation = 0
) {

    const road =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                0.25,
                length
            ),
            new THREE.MeshStandardMaterial({
                color: 0x252d30,
                roughness: 0.95
            })
        );

    road.position.set(
        x,
        terrainHeight(x, z) + 0.2,
        z
    );

    road.rotation.y =
        rotation;

    road.receiveShadow = true;

    scene.add(road);

    /* road markings */

    for (
        let i = -length / 2 + 12;
        i < length / 2;
        i += 22
    ) {

        const line =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.45,
                    0.05,
                    8
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xd5b953
                })
            );

        line.position.set(
            x,
            terrainHeight(x, z) + 0.38,
            z + i
        );

        line.rotation.y =
            rotation;

        scene.add(line);
    }
}


function createRoads() {

    makeRoad(
        0,
        0,
        14,
        500,
        0
    );

    makeRoad(
        0,
        0,
        14,
        500,
        Math.PI / 2
    );

    makeRoad(
        -105,
        0,
        12,
        300,
        Math.PI / 4
    );

    makeRoad(
        100,
        20,
        12,
        280,
        -Math.PI / 4
    );
}


/* ---------------------------------------------------------
   BUILDINGS
--------------------------------------------------------- */

function createBuilding(
    x,
    z,
    width,
    height,
    depth,
    color
) {

    const group =
        new THREE.Group();

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color,
                roughness: 0.78
            })
        );

    body.position.y =
        height / 2;

    body.castShadow = true;
    body.receiveShadow = true;

    group.add(body);

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width + 1,
                0.7,
                depth + 1
            ),
            new THREE.MeshStandardMaterial({
                color: 0x2c3335
            })
        );

    roof.position.y =
        height + 0.35;

    group.add(roof);

    const windowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x8ed4dd
        });

    const cols =
        Math.max(
            2,
            Math.floor(width / 5)
        );

    const rows =
        Math.max(
            2,
            Math.floor(height / 5)
        );

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let col = 0;
            col < cols;
            col++
        ) {

            const window =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        1.5,
                        1.8,
                        0.08
                    ),
                    windowMaterial
                );

            window.position.set(
                -width / 2 +
                    3 +
                    col * 5,
                3 +
                    row * 5,
                depth / 2 + 0.05
            );

            group.add(window);
        }
    }

    group.position.set(
        x,
        terrainHeight(x, z),
        z
    );

    scene.add(group);

    worldObjects.push(group);

    return group;
}


/* ---------------------------------------------------------
   CITY
--------------------------------------------------------- */

function createCity() {

    const positions = [
        [-70,-55],
        [-35,-55],
        [5,-55],
        [45,-55],

        [-70,-15],
        [-35,-15],
        [5,-15],
        [45,-15],

        [-70,30],
        [-30,30],
        [15,30],
        [55,30],

        [-60,75],
        [-15,75],
        [35,75]
    ];

    const colors = [
        0x596269,
        0x667176,
        0x4d585e,
        0x73726a,
        0x4a5358
    ];

    positions.forEach(
        ([x,z],i) => {

            createBuilding(
                x,
                z,
                15 + Math.random()*12,
                10 + Math.random()*30,
                15 + Math.random()*10,
                colors[
                    i % colors.length
                ]
            );
        }
    );
}


/* ---------------------------------------------------------
   INDUSTRIAL
--------------------------------------------------------- */

function createIndustrialZone() {

    for (let i = 0; i < 8; i++) {

        const x =
            135 +
            (i % 4) * 28;

        const z =
            -90 +
            Math.floor(i / 4) * 35;

        createBuilding(
            x,
            z,
            24,
            10,
            26,
            0x535653
        );
    }

    for (let i = 0; i < 6; i++) {

        const tank =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    4,
                    4,
                    8,
                    16
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x687375,
                    metalness: .45
                })
            );

        const x =
            120 + Math.random()*100;

        const z =
            -40 + Math.random()*80;

        tank.position.set(
            x,
            terrainHeight(x,z)+4,
            z
        );

        tank.castShadow = true;

        scene.add(tank);
    }
}


/* ---------------------------------------------------------
   VILLAGE
--------------------------------------------------------- */

function createVillage() {

    for (let i = 0; i < 14; i++) {

        const x =
            -165 +
            Math.random()*80;

        const z =
            90 +
            Math.random()*90;

        createBuilding(
            x,
            z,
            10 + Math.random()*6,
            5 + Math.random()*4,
            10 + Math.random()*6,
            0x876f58
        );
    }
}


/* ---------------------------------------------------------
   TREES
--------------------------------------------------------- */

function createTree(x,z,scale) {

    const group =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .55,
                .8,
                5,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x5d402a
            })
        );

    trunk.position.y = 3;

    group.add(trunk);

    const leaves =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                4.5,
                10,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x2d6637
            })
        );

    leaves.position.y = 9;

    group.add(leaves);

    group.position.set(
        x,
        terrainHeight(x,z),
        z
    );

    group.scale.setScalar(scale);

    group.traverse(
        o => {
            if (o.isMesh) {
                o.castShadow = true;
            }
        }
    );

    scene.add(group);
}


function createForest() {

    for (let i = 0; i < 150; i++) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const radius =
            150 +
            Math.random()*100;

        const x =
            Math.cos(angle) *
            radius;

        const z =
            Math.sin(angle) *
            radius;

        /* Keep city clear */

        if (
            Math.abs(x) < 110 &&
            Math.abs(z) < 115
        ) continue;

        createTree(
            x,
            z,
            .65 +
            Math.random()*.7
        );
    }
}


/* ---------------------------------------------------------
   PROPS
--------------------------------------------------------- */

function createProps() {

    for (let i = 0; i < 35; i++) {

        const x =
            -220 +
            Math.random()*440;

        const z =
            -200 +
            Math.random()*400;

        const rock =
            new THREE.Mesh(
                new THREE.DodecahedronGeometry(
                    1 +
                    Math.random()*2.5
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x606a67,
                    roughness: 1
                })
            );

        rock.position.set(
            x,
            terrainHeight(x,z)+1,
            z
        );

        rock.rotation.set(
            Math.random(),
            Math.random(),
            Math.random()
        );

        rock.castShadow = true;

        scene.add(rock);
    }
}


/* ---------------------------------------------------------
   PLAYER
--------------------------------------------------------- */

function createPlayer() {

    player =
        new THREE.Group();

    player.scale.setScalar(.68);

    /* legs */

    const legMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x1e2529,
            roughness: .75
        });

    const leftLeg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.05,
                3.8,
                1.05
            ),
            legMaterial
        );

    leftLeg.position.set(
        -.65,
        2,
        0
    );

    player.add(leftLeg);

    const rightLeg =
        leftLeg.clone();

    rightLeg.position.x =
        .65;

    player.add(rightLeg);

    /* body */

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.55,
                2.7,
                6,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x29363a,
                roughness: .7
            })
        );

    body.position.y = 5;

    body.castShadow = true;

    player.add(body);

    /* vest */

    const vest =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.9,
                2.4,
                2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x35474a,
                roughness: .65
            })
        );

    vest.position.y = 5.2;

    vest.castShadow = true;

    player.add(vest);

    /* head */

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.25,
                20,
                14
            ),
            new THREE.MeshStandardMaterial({
                color: 0xc88d68,
                roughness: .75
            })
        );

    head.position.y = 8.3;

    head.castShadow = true;

    player.add(head);

    /* hair */

    const hair =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.3,
                16,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x181d20
            })
        );

    hair.scale.y = .5;

    hair.position.set(
        0,
        9.05,
        -.05
    );

    player.add(hair);

    playerGun =
        createGun();

    playerGun.position.set(
        1.25,
        5.2,
        -1.25
    );

    playerGun.rotation.y =
        Math.PI;

    player.add(playerGun);

    player.position.set(
        0,
        terrainHeight(0,160),
        160
    );

    scene.add(player);
}


/* ---------------------------------------------------------
   GUN
--------------------------------------------------------- */

function createGun() {

    const gun =
        new THREE.Group();

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x161b1e,
            metalness: .75,
            roughness: .25
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .6,
                .55,
                3
            ),
            material
        );

    gun.add(body);

    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .1,
                .1,
                2,
                8
            ),
            material
        );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.z =
        -2.2;

    gun.add(barrel);

    const stock =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .6,
                .65,
                1
            ),
            material
        );

    stock.position.z = 1.5;

    gun.add(stock);

    return gun;
}


/* ---------------------------------------------------------
   ENEMIES
--------------------------------------------------------- */

function createEnemies() {

    const spawnPoints = [

        [-170, 0, -150],
        [-110, 0, -185],
        [-20, 0, -210],
        [80, 0, -185],

        [175, 0, -140],
        [205, 0, -35],

        [190, 0, 90],
        [120, 0, 170],

        [0, 0, 205],
        [-100, 0, 180],
        [-190, 0, 115]

    ];

    spawnPoints.forEach(
        (p,i) => {

            createEnemy(
                p[0],
                p[2],
                i
            );
        }
    );
}


function createEnemy(
    x,
    z,
    index
) {

    const enemy =
        new THREE.Group();

    enemy.scale.setScalar(.66);

    const dark =
        new THREE.MeshStandardMaterial({
            color: 0x202428,
            roughness: .8
        });

    const jacket =
        new THREE.MeshStandardMaterial({
            color:
                index % 2
                    ? 0x762f31
                    : 0x34485a,
            roughness: .7
        });

    const leg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.05,
                3.7,
                1.05
            ),
            dark
        );

    leg.position.set(
        -.65,
        2,
        0
    );

    enemy.add(leg);

    const leg2 =
        leg.clone();

    leg2.position.x =
        .65;

    enemy.add(leg2);

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.5,
                2.6,
                6,
                10
            ),
            jacket
        );

    body.position.y = 5;

    enemy.add(body);

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.2,
                18,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xb8795c
            })
        );

    head.position.y = 8.2;

    enemy.add(head);

    const gun =
        createGun();

    gun.scale.setScalar(.75);

    gun.position.set(
        1.2,
        5.1,
        -1.2
    );

    enemy.add(gun);

    enemy.position.set(
        x,
        terrainHeight(x,z),
        z
    );

    enemy.userData = {

        health: 100,

        alive: true,

        speed:
            2.5 +
            Math.random()*1.4,

        attackTimer:
            1 +
            Math.random()*2,

        seed:
            Math.random()*20,

        index

    };

    enemy.traverse(
        o => {
            if (o.isMesh) {
                o.castShadow = true;
            }
        }
    );

    scene.add(enemy);

    enemies.push(enemy);
}


/* ---------------------------------------------------------
   PICKUPS
--------------------------------------------------------- */

function createPickups() {

    const positions = [

        [-75, -25],
        [60, -15],
        [95, 70],
        [-130, 65],
        [140, -70],
        [10, 105],
        [-165, -60],
        [120, 120]

    ];

    positions.forEach(
        ([x,z],i) => {

            const type =
                i % 2 === 0
                    ? "MEDKIT"
                    : "ARMOR";

            createPickup(
                x,
                z,
                type
            );
        }
    );
}


function createPickup(
    x,
    z,
    type
) {

    const color =
        type === "MEDKIT"
            ? 0x4dff91
            : 0x36aaff;

    const box =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2,
                2,
                2
            ),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: .25
            })
        );

    box.position.set(
        x,
        terrainHeight(x,z)+2,
        z
    );

    box.userData.type =
        type;

    scene.add(box);

    pickups.push(box);
}


/* ---------------------------------------------------------
   ZONE
--------------------------------------------------------- */

let zoneMesh;

function createZone() {

    zoneMesh =
        new THREE.Mesh(
            new THREE.RingGeometry(
                zoneRadius - 1,
                zoneRadius,
                96
            ),
            new THREE.MeshBasicMaterial({
                color: 0x50ffc0,
                transparent: true,
                opacity: .85,
                side: THREE.DoubleSide
            })
        );

    zoneMesh.rotation.x =
        -Math.PI / 2;

    zoneMesh.position.y =
        8;

    scene.add(zoneMesh);
}


/* ---------------------------------------------------------
   CONTROLS
--------------------------------------------------------- */

function setupControls() {

    window.addEventListener(
        "keydown",
        e => {

            keys[e.code] = true;

            if (
                [
                    "ArrowUp",
                    "ArrowDown",
                    "ArrowLeft",
                    "ArrowRight",
                    "Space"
                ].includes(e.code)
            ) {
                e.preventDefault();
            }

            if (
                e.code === "Digit1"
            ) {
                weaponIndex = 0;
                updateHUD();
            }

            if (
                e.code === "Digit2"
            ) {
                weaponIndex = 1;
                updateHUD();
            }

            if (
                e.code === "Digit3"
            ) {
                weaponIndex = 2;
                updateHUD();
            }

            if (
                e.code === "KeyR"
            ) {
                reload();
            }

            if (
                e.code === "KeyG"
            ) {
                useMedkit();
            }

            if (
                e.code === "Space" &&
                grounded
            ) {

                jumpVelocity =
                    10;

                grounded =
                    false;
            }
        }
    );

    window.addEventListener(
        "keyup",
        e => {
            keys[e.code] = false;
        }
    );


    /* mouse aim */

    document.addEventListener(
        "mousemove",
        e => {

            if (
                document.pointerLockElement !==
                renderer?.domElement
            ) {
                return;
            }

            yaw -=
                e.movementX *
                .0022;

            pitch -=
                e.movementY *
                .0018;

            pitch =
                THREE.MathUtils.clamp(
                    pitch,
                    -.75,
                    .55
                );
        }
    );


    document.addEventListener(
        "mousedown",
        e => {

            if (
                e.button !== 0
            ) return;

            if (
                document.pointerLockElement !==
                renderer?.domElement
            ) {

                renderer.domElement
                    .requestPointerLock?.();

                return;
            }

            fireHeld = true;
        }
    );


    document.addEventListener(
        "mouseup",
        e => {

            if (
                e.button === 0
            ) {
                fireHeld = false;
            }
        }
    );


    renderer.domElement.addEventListener(
        "click",
        () => {

            renderer.domElement
                .requestPointerLock?.();
        }
    );


    window.addEventListener(
        "resize",
        resizeGame
    );
}


/* ---------------------------------------------------------
   MOBILE
--------------------------------------------------------- */

function setupMobileControls() {

    const joystick =
        $("joystick");

    const stick =
        $("stick");

    const fire =
        $("fireBtn");

    const jump =
        $("jumpBtn");

    const sprint =
        $("sprintBtn");

    const aim =
        $("aimZone");


    if (!joystick) return;


    let joystickActive =
        false;


    function updateJoystick(
        touch
    ) {

        const rect =
            joystick.getBoundingClientRect();

        const centerX =
            rect.left +
            rect.width / 2;

        const centerY =
            rect.top +
            rect.height / 2;

        let dx =
            touch.clientX -
            centerX;

        let dy =
            touch.clientY -
            centerY;

        const max =
            42;

        const length =
            Math.hypot(dx,dy);

        if (
            length > max
        ) {

            dx =
                dx / length *
                max;

            dy =
                dy / length *
                max;
        }

        stick.style.transform =
            `translate(${dx}px,${dy}px)`;

        moveInput.x =
            dx / max;

        moveInput.y =
            -dy / max;
    }


    joystick.addEventListener(
        "touchstart",
        e => {

            joystickActive =
                true;

            updateJoystick(
                e.touches[0]
            );
        },
        {
            passive: true
        }
    );


    joystick.addEventListener(
        "touchmove",
        e => {

            if (!joystickActive)
                return;

            updateJoystick(
                e.touches[0]
            );
        },
        {
            passive: true
        }
    );


    joystick.addEventListener(
        "touchend",
        () => {

            joystickActive =
                false;

            moveInput.x = 0;
            moveInput.y = 0;

            stick.style.transform =
                "translate(0,0)";
        }
    );


    /* fire */

    fire.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            fireHeld = true;
        },
        {
            passive: false
        }
    );


    fire.addEventListener(
        "touchend",
        e => {

            e.preventDefault();

            fireHeld = false;
        },
        {
            passive: false
        }
    );


    /* jump */

    jump.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            if (grounded) {

                jumpVelocity =
                    10;

                grounded =
                    false;
            }
        },
        {
            passive: false
        }
    );


    /* sprint */

    sprint.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            sprinting = true;
        },
        {
            passive: false
        }
    );


    sprint.addEventListener(
        "touchend",
        e => {

            e.preventDefault();

            sprinting = false;
        },
        {
            passive: false
        }
    );


    /* touch aim */

    let lastX = 0;
    let lastY = 0;

    aim.addEventListener(
        "touchstart",
        e => {

            if (
                !e.touches[0]
            ) return;

            mobileAiming =
                true;

            lastX =
                e.touches[0].clientX;

            lastY =
                e.touches[0].clientY;
        },
        {
            passive: true
        }
    );


    aim.addEventListener(
        "touchmove",
        e => {

            if (
                !mobileAiming
            ) return;

            const touch =
                e.touches[0];

            const dx =
                touch.clientX -
                lastX;

            const dy =
                touch.clientY -
                lastY;

            yaw -=
                dx * .008;

            pitch -=
                dy * .006;

            pitch =
                THREE.MathUtils.clamp(
                    pitch,
                    -.75,
                    .55
                );

            lastX =
                touch.clientX;

            lastY =
                touch.clientY;
        },
        {
            passive: true
        }
    );


    aim.addEventListener(
        "touchend",
        () => {
            mobileAiming =
                false;
        }
    );
}


/* ---------------------------------------------------------
   PLAYER MOVEMENT
--------------------------------------------------------- */

function updatePlayer(dt) {

    if (!player) return;


    let forward = 0;
    let side = 0;


    /* keyboard */

    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    ) {
        forward += 1;
    }

    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    ) {
        forward -= 1;
    }

    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) {
        side -= 1;
    }

    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) {
        side += 1;
    }


    /* mobile */

    if (
        Math.abs(moveInput.x) >
        .05 ||
        Math.abs(moveInput.y) >
        .05
    ) {

        side =
            moveInput.x;

        forward =
            moveInput.y;
    }


    const length =
        Math.hypot(
            forward,
            side
        );


    if (length > 0) {

        forward /=
            length;

        side /=
            length;


        sprinting =
            sprinting ||
            keys["ShiftLeft"] ||
            keys["ShiftRight"];


        const speed =
            sprinting
                ? 17
                : 9;


        const sin =
            Math.sin(yaw);

        const cos =
            Math.cos(yaw);


        const dx =
            (
                side * cos +
                forward * sin
            ) *
            speed *
            dt;


        const dz =
            (
                side * sin -
                forward * cos
            ) *
            speed *
            dt;


        player.position.x +=
            dx;

        player.position.z +=
            dz;


        /* face movement direction */

        const targetRotation =
            Math.atan2(
                dx,
                dz
            );


        player.rotation.y =
            lerpAngle(
                player.rotation.y,
                targetRotation,
                .16
            );
    }


    /* jump */

    if (!grounded) {

        jumpVelocity -=
            24 * dt;

        player.position.y +=
            jumpVelocity * dt;


        const ground =
            terrainHeight(
                player.position.x,
                player.position.z
            );


        if (
            player.position.y <=
            ground
        ) {

            player.position.y =
                ground;

            jumpVelocity = 0;

            grounded = true;
        }
    }


    if (grounded) {

        player.position.y =
            terrainHeight(
                player.position.x,
                player.position.z
            );
    }


    /* world limits */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -235,
            235
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -235,
            235
        );


    /* walking animation */

    if (length > 0) {

        const bob =
            Math.sin(
                performance.now() *
                (
                    sprinting
                        ? .018
                        : .012
                )
            ) * .035;

        player.position.y +=
            bob;
    }
}


/* ---------------------------------------------------------
   THIRD PERSON CAMERA
--------------------------------------------------------- */

function updateCamera() {

    if (!player) return;


    const target =
        new THREE.Vector3(
            player.position.x,
            player.position.y + 5.2,
            player.position.z
        );


    const distance = 9;

    const vertical =
        3.8;


    const offset =
        new THREE.Vector3(
            0,
            vertical,
            distance
        );


    offset.applyAxisAngle(
        new THREE.Vector3(0,1,0),
        yaw
    );


    const desired =
        target.clone()
            .add(offset);


    camera.position.lerp(
        desired,
        .13
    );


    camera.lookAt(
        target
    );
}


/* ---------------------------------------------------------
   SHOOTING
--------------------------------------------------------- */

function shoot() {

    if (!running)
        return;

    const weapon =
        weapons[weaponIndex];

    const now =
        performance.now();


    if (
        now -
        lastShot <
        weapon.fireRate
    ) {
        return;
    }


    if (
        weapon.ammo <= 0
    ) {

        reload();

        return;
    }


    lastShot =
        now;


    weapon.ammo--;


    const pellets =
        weapon.pellets ||
        1;


    for (
        let i = 0;
        i < pellets;
        i++
    ) {

        fireRay(
            weapon
        );
    }


    muzzleFlash();

    updateHUD();
}


/* ---------------------------------------------------------
   FIRE RAY
--------------------------------------------------------- */

function fireRay(
    weapon
) {

    const origin =
        new THREE.Vector3();

    camera.getWorldPosition(
        origin
    );


    const direction =
        new THREE.Vector3();

    camera.getWorldDirection(
        direction
    );


    direction.x +=
        (
            Math.random() -
            .5
        ) *
        weapon.spread;

    direction.y +=
        (
            Math.random() -
            .5
        ) *
        weapon.spread;


    direction.normalize();


    raycaster.set(
        origin,
        direction
    );


    const targets = [];


    enemies.forEach(
        enemy => {

            if (
                !enemy.userData.alive
            ) return;

            enemy.traverse(
                child => {

                    if (
                        child.isMesh
                    ) {
                        targets.push(
                            child
                        );
                    }
                }
            );
        }
    );


    const hits =
        raycaster.intersectObjects(
            targets,
            false
        );


    if (!hits.length)
        return;


    let object =
        hits[0].object;

    let enemy = null;


    while (
        object &&
        object !== scene
    ) {

        if (
            object.userData &&
            object.userData.alive !==
            undefined
        ) {

            enemy =
                object;

            break;
        }

        object =
            object.parent;
    }


    if (enemy) {

        damageEnemy(
            enemy,
            weapon.damage
        );
    }
}


/* ---------------------------------------------------------
   MUZZLE FLASH
--------------------------------------------------------- */

function muzzleFlash() {

    if (!playerGun)
        return;


    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .3,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffd45a
            })
        );


    const position =
        new THREE.Vector3(
            0,
            0,
            -3.7
        );


    playerGun.localToWorld(
        position
    );


    flash.position.copy(
        position
    );


    scene.add(flash);


    setTimeout(
        () => {

            if (
                flash.parent
            ) {
                flash.parent.remove(
                    flash
                );
            }

        },
        50
    );
}


/* ---------------------------------------------------------
   ENEMY DAMAGE
--------------------------------------------------------- */

function damageEnemy(
    enemy,
    damage
) {

    if (
        !enemy.userData.alive
    ) return;


    enemy.userData.health -=
        damage;


    if (
        enemy.userData.health <=
        0
    ) {

        enemy.userData.alive =
            false;

        enemy.visible =
            false;

        kills++;

        aliveCount--;

        updateHUD();


        if (
            aliveCount <= 1
        ) {

            finishGame(
                true
            );
        }
    }
}


/* ---------------------------------------------------------
   ENEMY AI
--------------------------------------------------------- */

function updateEnemies(dt) {

    if (!player)
        return;


    enemies.forEach(
        enemy => {

            if (
                !enemy.userData.alive
            ) return;


            const dx =
                player.position.x -
                enemy.position.x;

            const dz =
                player.position.z -
                enemy.position.z;


            const distance =
                Math.hypot(
                    dx,
                    dz
                );


            /* enemies do NOT spawn near player */

            if (
                distance < 14
            ) {

                const push =
                    14 -
                    distance;

                enemy.position.x -=
                    dx /
                    Math.max(distance,.01) *
                    push;

                enemy.position.z -=
                    dz /
                    Math.max(distance,.01) *
                    push;

                return;
            }


            if (
                distance < 100
            ) {

                const angle =
                    Math.atan2(
                        dx,
                        -dz
                    );


                enemy.rotation.y =
                    angle;


                if (
                    distance > 18
                ) {

                    enemy.position.x +=
                        Math.sin(angle) *
                        enemy.userData.speed *
                        dt;

                    enemy.position.z +=
                        -Math.cos(angle) *
                        enemy.userData.speed *
                        dt;
                }


                enemy.position.y =
                    terrainHeight(
                        enemy.position.x,
                        enemy.position.z
                    );


                enemy.userData.attackTimer -=
                    dt;


                if (
                    distance < 42 &&
                    enemy.userData.attackTimer <= 0
                ) {

                    enemy.userData.attackTimer =
                        1.1 +
                        Math.random()*1.4;

                    enemyShoot(
                        enemy,
                        distance
                    );
                }

            } else {

                const time =
                    performance.now() *
                    .0002 +
                    enemy.userData.seed;


                enemy.position.x +=
                    Math.sin(time) *
                    dt *
                    .7;

                enemy.position.z +=
                    Math.cos(time) *
                    dt *
                    .7;


                enemy.position.y =
                    terrainHeight(
                        enemy.position.x,
                        enemy.position.z
                    );
            }
        }
    );
}


/* ---------------------------------------------------------
   ENEMY SHOOT
--------------------------------------------------------- */

function enemyShoot(
    enemy,
    distance
) {

    if (
        Math.random() >
        .36
    ) return;


    let damage =
        5 +
        Math.random()*7;


    if (
        distance < 20
    ) {
        damage *= 1.3;
    }


    damagePlayer(
        damage
    );
}


/* ---------------------------------------------------------
   PLAYER DAMAGE
--------------------------------------------------------- */

function damagePlayer(
    damage
) {

    if (!running)
        return;


    const armorDamage =
        Math.min(
            armor,
            damage * .65
        );


    armor -=
        armorDamage;


    health -=
        damage -
        armorDamage;


    health =
        Math.max(
            0,
            health
        );


    armor =
        Math.max(
            0,
            armor
        );


    updateHUD();


    if (
        health <= 0
    ) {

        finishGame(
            false
        );
    }
}


/* ---------------------------------------------------------
   RELOAD
--------------------------------------------------------- */

function reload() {

    if (
        reloadTimer
    ) return;


    const weapon =
        weapons[weaponIndex];


    if (
        weapon.ammo >=
        weapon.magazine
    ) return;


    if (
        weapon.reserve <= 0
    ) return;


    reloadTimer =
        setTimeout(
            () => {

                const needed =
                    weapon.magazine -
                    weapon.ammo;


                const amount =
                    Math.min(
                        needed,
                        weapon.reserve
                    );


                weapon.ammo +=
                    amount;

                weapon.reserve -=
                    amount;


                reloadTimer =
                    null;


                updateHUD();

            },
            1200
        );
}


/* ---------------------------------------------------------
   MEDKIT
--------------------------------------------------------- */

function useMedkit() {

    if (
        medkits <= 0 ||
        health >= 100
    ) return;


    medkits--;


    health =
        Math.min(
            100,
            health + 45
        );


    updateHUD();
}


/* ---------------------------------------------------------
   PICKUPS
--------------------------------------------------------- */

function updatePickups(dt) {

    pickups.forEach(
        item => {

            if (
                !item.visible
            ) return;


            item.rotation.y +=
                dt * 1.5;


            item.position.y =
                terrainHeight(
                    item.position.x,
                    item.position.z
                ) +
                2 +
                Math.sin(
                    performance.now() *
                    .003
                ) *
                .3;


            const distance =
                item.position.distanceTo(
                    player.position
                );


            if (
                distance < 3
            ) {

                if (
                    item.userData.type ===
                    "MEDKIT"
                ) {

                    medkits++;
                }


                if (
                    item.userData.type ===
                    "ARMOR"
                ) {

                    armor =
                        Math.min(
                            100,
                            armor + 35
                        );
                }


                item.visible =
                    false;


                updateHUD();
            }
        }
    );
}


/* ---------------------------------------------------------
   ZONE
--------------------------------------------------------- */

function updateZone(dt) {

    zoneTimer +=
        dt;


    if (
        zoneTimer > 2
    ) {

        zoneTimer = 0;


        zoneRadius =
            Math.max(
                45,
                zoneRadius - .35
            );


        const scale =
            zoneRadius / 180;


        zoneMesh.scale.set(
            scale,
            scale,
            scale
        );
    }


    const distance =
        Math.hypot(
            player.position.x,
            player.position.z
        );


    if (
        distance >
        zoneRadius
    ) {

        damagePlayer(
            2.5 * dt
        );
    }
}


/* ---------------------------------------------------------
   HUD
--------------------------------------------------------- */

function updateHUD() {

    const weapon =
        weapons[weaponIndex];


    if ($("health"))
        $("health").textContent =
            Math.ceil(
                health
            );


    if ($("armor"))
        $("armor").textContent =
            Math.ceil(
                armor
            );


    if ($("ammo"))
        $("ammo").textContent =
            weapon.ammo +
            " / " +
            weapon.reserve;


    if ($("weapon"))
        $("weapon").textContent =
            weapon.name;


    if ($("kills"))
        $("kills").textContent =
            kills;


    if ($("alive"))
        $("alive").textContent =
            aliveCount;


    if ($("medkits"))
        $("medkits").textContent =
            medkits;


    if ($("zone"))
        $("zone").textContent =
            Math.round(
                zoneRadius
            ) +
            "m";
}


/* ---------------------------------------------------------
   GAME LOOP
--------------------------------------------------------- */

function gameLoop() {

    if (!running)
        return;


    requestAnimationFrame(
        gameLoop
    );


    const dt =
        Math.min(
            clock.getDelta(),
            .05
        );


    updatePlayer(dt);

    updateEnemies(dt);

    updatePickups(dt);

    updateZone(dt);

    updateCamera();


    /* automatic shooting */

    if (
        fireHeld
    ) {

        shoot();
    }


    renderer.render(
        scene,
        camera
    );
}


/* ---------------------------------------------------------
   FINISH
--------------------------------------------------------- */

function finishGame(
    won
) {

    if (!running)
        return;


    running = false;


    document.exitPointerLock?.();


    const result =
        $("result");


    if (result) {

        result.style.display =
            "flex";
    }


    if ($("resultTitle")) {

        $("resultTitle")
            .textContent =
            won
                ? "BOOYAH!"
                : "ELIMINATED";
    }


    if ($("resultText")) {

        $("resultText")
            .textContent =
            won
                ? `WINNER • ${kills} ELIMINATIONS`
                : `ELIMINATED • ${kills} ELIMINATIONS`;
    }
}


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function lerpAngle(
    a,
    b,
    t
) {

    let difference =
        b - a;


    while (
        difference <
        -Math.PI
    ) {

        difference +=
            Math.PI * 2;
    }


    while (
        difference >
        Math.PI
    ) {

        difference -=
            Math.PI * 2;
    }


    return (
        a +
        difference * t
    );
}


function resizeGame() {

    if (
        !camera ||
        !renderer
    ) return;


    camera.aspect =
        innerWidth /
        innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        innerWidth,
        innerHeight
    );
}


/* ---------------------------------------------------------
   BUTTONS
--------------------------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const enter =
            $("enter");


        if (enter) {

            enter.addEventListener(
                "click",
                startGame
            );
        }


        const name =
            $("name");


        if (name) {

            name.addEventListener(
                "keydown",
                e => {

                    if (
                        e.key ===
                        "Enter"
                    ) {

                        startGame();
                    }
                }
            );
        }


        const again =
            $("again");


        if (again) {

            again.addEventListener(
                "click",
                () => {
                    location.reload();
                }
            );
        }
    }
);
