/* =========================================================
   LAST//ALIVE
   DISTRICT 09
   CLEAN STANDALONE THREE.JS VERSION
   NO GLB / NO EXTERNAL MAP REQUIRED
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   DOM
--------------------------------------------------------- */

const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------
   THREE
--------------------------------------------------------- */

let scene = null;
let camera = null;
let renderer = null;
let clock = null;

/* ---------------------------------------------------------
   GAME STATE
--------------------------------------------------------- */

let running = false;
let gameEnded = false;

let player = null;
let playerGun = null;

let yaw = 0;
let pitch = -0.12;

let cameraMode = 3;

let health = 100;
let armor = 100;
let kills = 0;
let aliveCount = 12;
let medkits = 2;

let jumpVelocity = 0;
let onGround = true;
let crouching = false;

let lastShot = 0;
let reloading = false;

let zoneRadius = 175;
let zoneTimer = 0;

let muzzleTimer = 0;

/* ---------------------------------------------------------
   INPUT
--------------------------------------------------------- */

const keys = {};

const mobile = {
    moveX: 0,
    moveY: 0,
    aiming: false,
    fire: false,
    sprint: false
};

let touchLookActive = false;
let touchLookX = 0;
let touchLookY = 0;

/* ---------------------------------------------------------
   OBJECTS
--------------------------------------------------------- */

const enemies = [];
const bullets = [];
const pickups = [];
const buildings = [];
const trees = [];
const streetLights = [];

let zoneMesh = null;
let zoneWall = null;

/* ---------------------------------------------------------
   WEAPONS
--------------------------------------------------------- */

const weapons = [
    {
        name: "AR-01",
        damage: 28,
        fireRate: 120,
        mag: 30,
        ammo: 30,
        reserve: 150,
        spread: 0.018,
        pellets: 1
    },

    {
        name: "SMG-9",
        damage: 17,
        fireRate: 65,
        mag: 40,
        ammo: 40,
        reserve: 200,
        spread: 0.035,
        pellets: 1
    },

    {
        name: "M12",
        damage: 14,
        fireRate: 620,
        mag: 6,
        ammo: 6,
        reserve: 48,
        spread: 0.105,
        pellets: 8
    }
];

let currentWeapon = 0;

/* ---------------------------------------------------------
   START GAME
--------------------------------------------------------- */

window.startGame = function startGame() {

    const input = $("name");
    const name = input ? input.value.trim() : "PLAYER";

    if (!name) {
        if (input) {
            input.focus();
            input.placeholder = "ENTER PLAYER NAME";
        }
        return;
    }

    if (typeof THREE === "undefined") {
        showGameError("THREE.JS LOAD NAHI HUA.");
        return;
    }

    try {

        if ($("start")) {
            $("start").style.display = "none";
        }

        if ($("hud")) {
            $("hud").style.display = "block";
        }

        createGame();

        running = true;
        gameEnded = false;

        if (clock) {
            clock.start();
        }

        updateHUD();

        requestAnimationFrame(gameLoop);

        setTimeout(() => {
            if (
                renderer &&
                renderer.domElement &&
                window.innerWidth > 700
            ) {
                renderer.domElement.requestPointerLock?.();
            }
        }, 250);

    } catch (error) {

        console.error(error);

        showGameError(
            "GAME ERROR: " + error.message
        );
    }
};

/* ---------------------------------------------------------
   ERROR
--------------------------------------------------------- */

function showGameError(message) {

    console.error(message);

    if ($("loading")) {
        $("loading").style.display = "none";
    }

    if ($("error")) {
        $("error").style.display = "block";
        $("error").textContent = message;
    }

    if ($("enter")) {
        $("enter").disabled = false;
        $("enter").textContent = "TRY AGAIN →";
    }
}

/* ---------------------------------------------------------
   CREATE GAME
--------------------------------------------------------- */

function createGame() {

    /* Remove previous renderer */

    if (renderer && renderer.domElement) {
        renderer.domElement.remove();
    }

    /* Scene */

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x91aeb4);

    scene.fog = new THREE.Fog(
        0x91aeb4,
        90,
        650
    );

    /* Camera */

    camera = new THREE.PerspectiveCamera(
        68,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    /* Renderer */

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 1.5)
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.1;

    renderer.domElement.id = "gameCanvas";

    document.body.appendChild(
        renderer.domElement
    );

    clock = new THREE.Clock();

    /* World */

    createLighting();
    createSky();
    createGround();
    createRoads();
    createCity();
    createIndustrialArea();
    createPark();
    createHarbor();
    createProps();
    createZone();
    createPickups();

    /* Player */

    createPlayer();

    /* Enemies */

    createEnemies();

    /* Controls */

    setupKeyboard();
    setupMouse();
    setupMobile();

    /* Resize */

    window.addEventListener(
        "resize",
        resizeGame
    );

    updateHUD();
}

/* ---------------------------------------------------------
   LIGHTING
--------------------------------------------------------- */

function createLighting() {

    const hemi =
        new THREE.HemisphereLight(
            0xccefff,
            0x25382c,
            2.4
        );

    scene.add(hemi);

    const sun =
        new THREE.DirectionalLight(
            0xfff2d0,
            4
        );

    sun.position.set(
        -160,
        250,
        120
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -300;
    sun.shadow.camera.right = 300;
    sun.shadow.camera.top = 300;
    sun.shadow.camera.bottom = -300;

    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 700;

    scene.add(sun);

    const fill =
        new THREE.DirectionalLight(
            0x7bb9ff,
            0.6
        );

    fill.position.set(
        160,
        100,
        -100
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
                600,
                32,
                16
            ),
            new THREE.MeshBasicMaterial({
                color: 0x8faeb8,
                side: THREE.BackSide
            })
        );

    scene.add(sky);

    /* Sun */

    const sun =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                18,
                24,
                16
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffe7a0
            })
        );

    sun.position.set(
        -250,
        240,
        -300
    );

    scene.add(sun);
}

/* ---------------------------------------------------------
   GROUND
--------------------------------------------------------- */

function createGround() {

    /* Water */

    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                900,
                900
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1d6872,
                roughness: 0.22,
                metalness: 0.18
            })
        );

    water.rotation.x =
        -Math.PI / 2;

    water.position.y = -1;

    scene.add(water);

    /* Main terrain */

    const terrain =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                280,
                96
            ),
            new THREE.MeshStandardMaterial({
                color: 0x526c46,
                roughness: 1
            })
        );

    terrain.rotation.x =
        -Math.PI / 2;

    terrain.position.y = 0;

    terrain.scale.set(
        1,
        0.82,
        1
    );

    terrain.receiveShadow = true;

    scene.add(terrain);

    /* Sand ring */

    const sand =
        new THREE.Mesh(
            new THREE.RingGeometry(
                240,
                280,
                96
            ),
            new THREE.MeshStandardMaterial({
                color: 0xcdb982,
                roughness: 1
            })
        );

    sand.rotation.x =
        -Math.PI / 2;

    sand.position.y = 0.15;

    scene.add(sand);

    /* Grass patches */

    for (let i = 0; i < 100; i++) {

        const a =
            Math.random() *
            Math.PI * 2;

        const r =
            20 +
            Math.random() *
            210;

        const x =
            Math.cos(a) * r;

        const z =
            Math.sin(a) * r * 0.82;

        const patch =
            new THREE.Mesh(
                new THREE.CircleGeometry(
                    4 +
                    Math.random() * 12,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        Math.random() > 0.5
                            ? 0x5c7949
                            : 0x46643b
                })
            );

        patch.rotation.x =
            -Math.PI / 2;

        patch.position.set(
            x,
            0.22,
            z
        );

        scene.add(patch);
    }
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
                0.3,
                length
            ),
            new THREE.MeshStandardMaterial({
                color: 0x252a2b,
                roughness: 0.95
            })
        );

    road.position.set(
        x,
        0.45,
        z
    );

    road.rotation.y =
        rotation;

    road.receiveShadow = true;

    scene.add(road);

    /* road lines */

    for (
        let i = -length / 2 + 8;
        i < length / 2;
        i += 18
    ) {

        const line =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.5,
                    0.08,
                    7
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xd8bd57
                })
            );

        line.position.set(
            x,
            0.65,
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
        470
    );

    makeRoad(
        0,
        0,
        14,
        470,
        Math.PI / 2
    );

    makeRoad(
        -105,
        20,
        11,
        280,
        Math.PI / 2
    );

    makeRoad(
        105,
        -20,
        11,
        280,
        Math.PI / 2
    );

    makeRoad(
        0,
        -95,
        11,
        280
    );

    makeRoad(
        0,
        95,
        11,
        280
    );
}

/* ---------------------------------------------------------
   BUILDINGS
--------------------------------------------------------- */

function createBuilding(
    x,
    z,
    w,
    h,
    d,
    color
) {

    const group =
        new THREE.Group();

    const material =
        new THREE.MeshStandardMaterial({
            color:
                color ||
                0x596268,
            roughness: 0.72
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                w,
                h,
                d
            ),
            material
        );

    body.position.y =
        h / 2 + 0.5;

    body.castShadow = true;
    body.receiveShadow = true;

    group.add(body);

    /* roof */

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                w + 1,
                0.7,
                d + 1
            ),
            new THREE.MeshStandardMaterial({
                color: 0x303638
            })
        );

    roof.position.y =
        h + 0.85;

    roof.castShadow = true;

    group.add(roof);

    /* windows */

    const windowMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x9bdce1,
            emissive: 0x214e54,
            emissiveIntensity: 0.7
        });

    const cols =
        Math.max(
            2,
            Math.floor(w / 6)
        );

    const rows =
        Math.max(
            2,
            Math.floor(h / 6)
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

            const win =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        2.2,
                        2,
                        0.12
                    ),
                    windowMaterial
                );

            win.position.set(
                -w / 2 +
                    3.5 +
                    col * 6,
                5 +
                    row * 6,
                d / 2 + 0.08
            );

            group.add(win);

            const back =
                win.clone();

            back.position.z =
                -d / 2 - 0.08;

            group.add(back);
        }
    }

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    buildings.push(group);

    return group;
}

/* ---------------------------------------------------------
   CITY
--------------------------------------------------------- */

function createCity() {

    const positions = [

        [-80, -55],
        [-45, -55],
        [0, -55],
        [45, -55],
        [80, -55],

        [-80, -15],
        [-45, -15],
        [45, -15],
        [80, -15],

        [-80, 30],
        [-45, 30],
        [45, 30],
        [80, 30],

        [-80, 70],
        [-40, 70],
        [0, 70],
        [45, 70],
        [85, 70]
    ];

    for (
        let i = 0;
        i < positions.length;
        i++
    ) {

        const p =
            positions[i];

        const colors = [
            0x596167,
            0x485257,
            0x68706f,
            0x514e4a,
            0x5d6264
        ];

        createBuilding(
            p[0],
            p[1],
            16 + Math.random() * 10,
            10 + Math.random() * 25,
            15 + Math.random() * 10,
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ]
        );
    }

    /* Tall landmark */

    createBuilding(
        15,
        -5,
        28,
        62,
        28,
        0x343e45
    );

    /* City plaza */

    const plaza =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                30,
                30,
                0.4,
                32
            ),
            new THREE.MeshStandardMaterial({
                color: 0x727979
            })
        );

    plaza.position.set(
        0,
        0.55,
        0
    );

    scene.add(plaza);

    /* Center monument */

    const monument =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                4,
                5,
                20,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x303638,
                metalness: 0.7
            })
        );

    monument.position.set(
        0,
        10,
        0
    );

    monument.castShadow = true;

    scene.add(monument);
}

/* ---------------------------------------------------------
   INDUSTRIAL
--------------------------------------------------------- */

function createIndustrialArea() {

    const baseX = 155;
    const baseZ = -115;

    /* warehouses */

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        createBuilding(
            baseX +
                (i % 2) * 48,
            baseZ +
                Math.floor(i / 2) * 55,
            38,
            13,
            34,
            0x4b5150
        );
    }

    /* tanks */

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const tank =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    7,
                    7,
                    12,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x626b6b,
                    metalness: 0.55,
                    roughness: 0.35
                })
            );

        tank.position.set(
            130 +
                i * 16,
            6.5,
            -55
        );

        tank.castShadow = true;

        scene.add(tank);
    }

    /* radio tower */

    const tower =
        new THREE.Group();

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const leg =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.45,
                    0.7,
                    55,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x31383a,
                    metalness: 0.7
                })
            );

        const a =
            i *
            Math.PI /
            2;

        leg.position.set(
            120 +
                Math.cos(a) * 5,
            27,
            -40 +
                Math.sin(a) * 5
        );

        tower.add(leg);
    }

    for (
        let y = 10;
        y < 52;
        y += 10
    ) {

        const ring =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    5,
                    0.3,
                    8,
                    20
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x40484a
                })
            );

        ring.rotation.x =
            Math.PI / 2;

        ring.position.set(
            120,
            y,
            -40
        );

        tower.add(ring);
    }

    scene.add(tower);
}

/* ---------------------------------------------------------
   PARK
--------------------------------------------------------- */

function createTree(
    x,
    z,
    scale = 1
) {

    const tree =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.55,
                0.8,
                5,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x62472f
            })
        );

    trunk.position.y = 2.8;

    tree.add(trunk);

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const crown =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    4.4 -
                        i * 0.7,
                    7,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        i === 0
                            ? 0x245033
                            : 0x326b3c
                })
            );

        crown.position.y =
            6 +
            i * 4;

        crown.castShadow = true;

        tree.add(crown);
    }

    tree.position.set(
        x,
        0,
        z
    );

    tree.scale.setScalar(
        scale
    );

    scene.add(tree);

    trees.push(tree);
}

function createPark() {

    for (
        let i = 0;
        i < 75;
        i++
    ) {

        const x =
            -175 +
            Math.random() * 90;

        const z =
            -60 +
            Math.random() * 150;

        createTree(
            x,
            z,
            0.7 +
                Math.random() *
                0.6
        );
    }
}

/* ---------------------------------------------------------
   HARBOR
--------------------------------------------------------- */

function createHarbor() {

    const dockMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x735438
        });

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const dock =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    12,
                    1,
                    60
                ),
                dockMaterial
            );

        dock.position.set(
            -190 +
                i * 20,
            0.8,
            -30
        );

        scene.add(dock);
    }

    const colors = [
        0x9d3d32,
        0x315c78,
        0x6e7133,
        0x7d522f
    ];

    for (
        let i = 0;
        i < 24;
        i++
    ) {

        const container =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    8,
                    4,
                    3
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        colors[
                            i %
                            colors.length
                        ]
                })
            );

        container.position.set(
            -205 +
                Math.random() *
                50,
            3 +
                Math.floor(
                    Math.random() *
                    2
                ) *
                4,
            -70 +
                Math.random() *
                70
        );

        container.rotation.y =
            Math.random() >
            0.5
                ? 0
                : Math.PI / 2;

        container.castShadow = true;

        scene.add(container);
    }
}

/* ---------------------------------------------------------
   PROPS
--------------------------------------------------------- */

function createProps() {

    /* Street lights */

    for (
        let i = -200;
        i <= 200;
        i += 40
    ) {

        createStreetLight(
            i,
            -8
        );

        createStreetLight(
            i,
            8
        );
    }

    /* crates */

    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const crate =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    3,
                    3,
                    3
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x74552f
                })
            );

        crate.position.set(
            -150 +
                Math.random() *
                280,
            1.6,
            -160 +
                Math.random() *
                260
        );

        crate.rotation.y =
            Math.random() *
            Math.PI;

        crate.castShadow = true;

        scene.add(crate);
    }
}

function createStreetLight(
    x,
    z
) {

    const group =
        new THREE.Group();

    const pole =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.12,
                0.16,
                7,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x252b2d,
                metalness: 0.7
            })
        );

    pole.position.y = 3.5;

    group.add(pole);

    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.45,
                10,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffe5a0
            })
        );

    lamp.position.y = 7;

    group.add(lamp);

    const light =
        new THREE.PointLight(
            0xffd98a,
            1.1,
            25
        );

    light.position.y = 7;

    group.add(light);

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    streetLights.push(group);
}

/* ---------------------------------------------------------
   PLAYER
--------------------------------------------------------- */

function createPlayer() {

    player =
        new THREE.Group();

    /* smaller character */

    const dark =
        new THREE.MeshStandardMaterial({
            color: 0x20282d,
            roughness: 0.7
        });

    const skin =
        new THREE.MeshStandardMaterial({
            color: 0xc9906c,
            roughness: 0.8
        });

    /* legs */

    const leftLeg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.7,
                2.8,
                0.7
            ),
            dark
        );

    leftLeg.position.set(
        -0.42,
        1.6,
        0
    );

    player.add(leftLeg);

    const rightLeg =
        leftLeg.clone();

    rightLeg.position.x =
        0.42;

    player.add(rightLeg);

    /* torso */

    const torso =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.05,
                1.8,
                5,
                10
            ),
            dark
        );

    torso.position.y = 4.1;

    torso.castShadow = true;

    player.add(torso);

    /* vest */

    const vest =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.1,
                1.7,
                1.45
            ),
            new THREE.MeshStandardMaterial({
                color: 0x36434b,
                roughness: 0.6
            })
        );

    vest.position.y = 4.25;

    player.add(vest);

    /* head */

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.9,
                20,
                14
            ),
            skin
        );

    head.position.y = 6.2;

    head.castShadow = true;

    player.add(head);

    /* hair */

    const hair =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.94,
                16,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x202326
            })
        );

    hair.scale.y = 0.5;

    hair.position.set(
        0,
        6.65,
        -0.03
    );

    player.add(hair);

    /* gun */

    playerGun =
        createGun();

    playerGun.scale.setScalar(
        0.65
    );

    playerGun.position.set(
        0.95,
        4.1,
        -0.8
    );

    playerGun.rotation.y =
        Math.PI;

    player.add(
        playerGun
    );

    player.position.set(
        0,
        0,
        145
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
            color: 0x14181b,
            metalness: 0.75,
            roughness: 0.25
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.45,
                0.45,
                2.5
            ),
            material
        );

    gun.add(body);

    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.07,
                0.07,
                1.8,
                8
            ),
            material
        );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.z =
        -1.9;

    gun.add(barrel);

    const stock =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.48,
                0.5,
                0.8
            ),
            material
        );

    stock.position.z =
        1.35;

    gun.add(stock);

    return gun;
}

/* ---------------------------------------------------------
   ENEMIES
--------------------------------------------------------- */

function createEnemies() {

    /*
      IMPORTANT:
      Enemies are now far away.
      No instant face-to-face spawning.
    */

    const positions = [
        [-175, -140],
        [-100, -165],
        [-20, -185],
        [75, -165],
        [170, -130],
        [190, -40],
        [175, 70],
        [110, 155],
        [0, 175],
        [-100, 150],
        [-175, 80]
    ];

    positions.forEach(
        (pos, index) => {

            createEnemy(
                pos[0],
                pos[1],
                index
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

    const dark =
        new THREE.MeshStandardMaterial({
            color: 0x171b1e,
            roughness: 0.75
        });

    const red =
        new THREE.MeshStandardMaterial({
            color: 0x6c2727,
            roughness: 0.7
        });

    /* legs */

    const leg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.68,
                2.8,
                0.68
            ),
            dark
        );

    leg.position.set(
        -0.4,
        1.55,
        0
    );

    enemy.add(leg);

    const leg2 =
        leg.clone();

    leg2.position.x =
        0.4;

    enemy.add(leg2);

    /* body */

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.98,
                1.7,
                5,
                10
            ),
            red
        );

    body.position.y =
        4.05;

    body.castShadow = true;

    enemy.add(body);

    /* head */

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.85,
                18,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xc48a68
            })
        );

    head.position.y =
        6.15;

    enemy.add(head);

    /* mask */

    const mask =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.88,
                18,
                12,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            ),
            dark
        );

    mask.position.y =
        6.2;

    enemy.add(mask);

    /* weapon */

    const weapon =
        createGun();

    weapon.scale.setScalar(
        0.55
    );

    weapon.position.set(
        0.9,
        4,
        -0.8
    );

    enemy.add(weapon);

    enemy.position.set(
        x,
        0,
        z
    );

    enemy.userData = {

        health: 100,

        alive: true,

        speed:
            2.5 +
            Math.random() * 1.5,

        attackTimer:
            Math.random() * 2,

        seed:
            Math.random() * 100,

        index
    };

    enemy.traverse(
        (obj) => {

            if (obj.isMesh) {
                obj.castShadow = true;
            }

        }
    );

    scene.add(enemy);

    enemies.push(enemy);
}

/* ---------------------------------------------------------
   ZONE
--------------------------------------------------------- */

function createZone() {

    const geo =
        new THREE.RingGeometry(
            zoneRadius - 1,
            zoneRadius,
            96
        );

    const mat =
        new THREE.MeshBasicMaterial({
            color: 0x52ff9a,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

    zoneMesh =
        new THREE.Mesh(
            geo,
            mat
        );

    zoneMesh.rotation.x =
        -Math.PI / 2;

    zoneMesh.position.y =
        0.9;

    scene.add(
        zoneMesh
    );

    /* vertical wall */

    zoneWall =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                1,
                1,
                20,
                96,
                1,
                true
            ),
            new THREE.MeshBasicMaterial({
                color: 0x44ff99,
                transparent: true,
                opacity: 0.025,
                side: THREE.DoubleSide
            })
        );

    zoneWall.position.y =
        10;

    zoneWall.scale.set(
        zoneRadius,
        1,
        zoneRadius
    );

    scene.add(
        zoneWall
    );
}

/* ---------------------------------------------------------
   PICKUPS
--------------------------------------------------------- */

function createPickups() {

    const locations = [
        [-70, -20],
        [65, 15],
        [120, 90],
        [-130, 80],
        [150, -70],
        [10, 110],
        [-165, -50],
        [90, -145]
    ];

    locations.forEach(
        ([x, z], index) => {

            createPickup(
                x,
                z,
                index % 2 === 0
                    ? "ARMOR"
                    : "MEDKIT"
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
        type === "ARMOR"
            ? 0x3caeff
            : 0x50ff8a;

    const item =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2,
                2,
                2
            ),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.35
            })
        );

    item.position.set(
        x,
        1.5,
        z
    );

    item.userData.type =
        type;

    scene.add(item);

    pickups.push(item);
}

/* ---------------------------------------------------------
   KEYBOARD
--------------------------------------------------------- */

function setupKeyboard() {

    window.addEventListener(
        "keydown",
        (e) => {

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
                switchWeapon(0);
            }

            if (
                e.code === "Digit2"
            ) {
                switchWeapon(1);
            }

            if (
                e.code === "Digit3"
            ) {
                switchWeapon(2);
            }

            if (
                e.code === "KeyR"
            ) {
                reload();
            }

            if (
                e.code === "KeyV"
            ) {
                cameraMode =
                    cameraMode === 3
                        ? 1
                        : 3;
            }

            if (
                e.code === "KeyG"
            ) {
                useMedkit();
            }

            if (
                e.code === "Space" &&
                onGround
            ) {

                jumpVelocity =
                    9.5;

                onGround = false;
            }

        },
        {
            passive: false
        }
    );

    window.addEventListener(
        "keyup",
        (e) => {
            keys[e.code] = false;
        }
    );
}

/* ---------------------------------------------------------
   MOUSE
--------------------------------------------------------- */

function setupMouse() {

    document.addEventListener(
        "mousemove",
        (e) => {

            if (!running) {
                return;
            }

            /* Desktop pointer lock */

            if (
                document.pointerLockElement ===
                renderer?.domElement
            ) {

                yaw -=
                    e.movementX *
                    0.0024;

                pitch -=
                    e.movementY *
                    0.002;

                pitch =
                    THREE.MathUtils.clamp(
                        pitch,
                        -0.95,
                        0.55
                    );
            }

        }
    );

    document.addEventListener(
        "mousedown",
        (e) => {

            if (!running) {
                return;
            }

            if (
                document.pointerLockElement !==
                renderer.domElement
            ) {

                renderer.domElement
                    .requestPointerLock?.();

                return;
            }

            if (
                e.button === 0
            ) {
                shoot();
            }
        }
    );

    renderer.domElement.addEventListener(
        "click",
        () => {

            if (
                window.innerWidth > 700
            ) {

                renderer.domElement
                    .requestPointerLock?.();

            }

        }
    );
}

/* ---------------------------------------------------------
   MOBILE CONTROLS
--------------------------------------------------------- */

function setupMobile() {

    if (
        document.getElementById(
            "mobileControls"
        )
    ) {
        return;
    }

    const controls =
        document.createElement(
            "div"
        );

    controls.id =
        "mobileControls";

    controls.innerHTML = `
        <div id="mobileJoystick">
            <div id="joystickKnob"></div>
        </div>

        <div id="mobileAim">
            AIM
        </div>

        <button id="mobileFire">
            FIRE
        </button>

        <button id="mobileJump">
            JUMP
        </button>

        <button id="mobileSprint">
            RUN
        </button>

        <button id="mobileReload">
            R
        </button>
    `;

    document.body.appendChild(
        controls
    );

    const style =
        document.createElement(
            "style"
        );

    style.textContent = `

        #mobileControls {
            display:none;
            position:fixed;
            inset:0;
            z-index:9999;
            pointer-events:none;
            user-select:none;
            touch-action:none;
        }

        #mobileJoystick {
            position:absolute;
            left:24px;
            bottom:35px;
            width:120px;
            height:120px;
            border-radius:50%;
            border:2px solid rgba(255,255,255,.25);
            background:rgba(0,0,0,.22);
            pointer-events:auto;
        }

        #joystickKnob {
            position:absolute;
            width:52px;
            height:52px;
            left:34px;
            top:34px;
            border-radius:50%;
            background:rgba(82,225,191,.65);
            box-shadow:0 0 20px rgba(82,225,191,.25);
        }

        #mobileAim {
            position:absolute;
            right:24px;
            bottom:32px;
            width:150px;
            height:150px;
            border-radius:50%;
            border:1px dashed rgba(255,255,255,.14);
            color:rgba(255,255,255,.25);
            display:flex;
            justify-content:center;
            align-items:center;
            pointer-events:auto;
            font-size:11px;
            letter-spacing:2px;
        }

        #mobileFire,
        #mobileJump,
        #mobileSprint,
        #mobileReload {
            position:absolute;
            border:0;
            color:white;
            font-weight:900;
            pointer-events:auto;
            touch-action:none;
        }

        #mobileFire {
            right:35px;
            bottom:200px;
            width:82px;
            height:82px;
            border-radius:50%;
            background:rgba(255,65,65,.65);
        }

        #mobileJump {
            right:145px;
            bottom:185px;
            width:58px;
            height:58px;
            border-radius:50%;
            background:rgba(80,160,255,.6);
        }

        #mobileSprint {
            left:160px;
            bottom:48px;
            width:72px;
            height:45px;
            border-radius:12px;
            background:rgba(82,225,191,.45);
        }

        #mobileReload {
            right:155px;
            bottom:255px;
            width:48px;
            height:48px;
            border-radius:50%;
            background:rgba(255,255,255,.18);
        }

        @media (max-width: 700px) {
            #mobileControls {
                display:block;
            }

            #help {
                display:none !important;
            }

            #bottomHud {
                transform:scale(.75);
                transform-origin:left bottom;
            }

            #weaponBox {
                transform:scale(.8);
                transform-origin:right top;
            }
        }
    `;

    document.head.appendChild(
        style
    );

    /* Joystick */

    const joystick =
        document.getElementById(
            "mobileJoystick"
        );

    const knob =
        document.getElementById(
            "joystickKnob"
        );

    let joystickTouch = null;

    joystick.addEventListener(
        "touchstart",
        (e) => {

            e.preventDefault();

            joystickTouch =
                e.changedTouches[0];

        },
        {
            passive: false
        }
    );

    joystick.addEventListener(
        "touchmove",
        (e) => {

            e.preventDefault();

            if (!joystickTouch) {
                return;
            }

            const touch =
                [...e.touches].find(
                    t =>
                        t.identifier ===
                        joystickTouch.identifier
                );

            if (!touch) {
                return;
            }

            const rect =
                joystick.getBoundingClientRect();

            const cx =
                rect.left +
                rect.width / 2;

            const cy =
                rect.top +
                rect.height / 2;

            let dx =
                touch.clientX -
                cx;

            let dy =
                touch.clientY -
                cy;

            const max = 40;

            const len =
                Math.hypot(
                    dx,
                    dy
                );

            if (len > max) {

                dx =
                    dx / len *
                    max;

                dy =
                    dy / len *
                    max;
            }

            knob.style.transform =
                `translate(${dx}px, ${dy}px)`;

            mobile.moveX =
                dx / max;

            mobile.moveY =
                dy / max;
        },
        {
            passive: false
        }
    );

    joystick.addEventListener(
        "touchend",
        (e) => {

            e.preventDefault();

            joystickTouch =
                null;

            mobile.moveX = 0;
            mobile.moveY = 0;

            knob.style.transform =
                "translate(0,0)";
        },
        {
            passive: false
        }
    );

    /* Aim */

    const aim =
        document.getElementById(
            "mobileAim"
        );

    let aimTouch = null;

    aim.addEventListener(
        "touchstart",
        (e) => {

            e.preventDefault();

            aimTouch =
                e.changedTouches[0];

            touchLookX =
                aimTouch.clientX;

            touchLookY =
                aimTouch.clientY;

        },
        {
            passive: false
        }
    );

    aim.addEventListener(
        "touchmove",
        (e) => {

            e.preventDefault();

            if (!aimTouch) {
                return;
            }

            const touch =
                [...e.touches].find(
                    t =>
                        t.identifier ===
                        aimTouch.identifier
                );

            if (!touch) {
                return;
            }

            const dx =
                touch.clientX -
                touchLookX;

            const dy =
                touch.clientY -
                touchLookY;

            yaw -=
                dx * 0.006;

            pitch -=
                dy * 0.004;

            pitch =
                THREE.MathUtils.clamp(
                    pitch,
                    -0.95,
                    0.55
                );

            touchLookX =
                touch.clientX;

            touchLookY =
                touch.clientY;

        },
        {
            passive: false
        }
    );

    aim.addEventListener(
        "touchend",
        () => {
            aimTouch = null;
        }
    );

    /* Fire */

    const fire =
        document.getElementById(
            "mobileFire"
        );

    fire.addEventListener(
        "touchstart",
        (e) => {

            e.preventDefault();

            mobile.fire = true;

            shoot();

        },
        {
            passive: false
        }
    );

    fire.addEventListener(
        "touchend",
        () => {
            mobile.fire = false;
        }
    );

    /* Jump */

    const jump =
        document.getElementById(
            "mobileJump"
        );

    jump.addEventListener(
        "touchstart",
        (e) => {

            e.preventDefault();

            if (onGround) {

                jumpVelocity =
                    9.5;

                onGround = false;
            }

        },
        {
            passive: false
        }
    );

    /* Sprint */

    const sprint =
        document.getElementById(
            "mobileSprint"
        );

    sprint.addEventListener(
        "touchstart",
        (e) => {

            e.preventDefault();

            mobile.sprint =
                true;

        },
        {
            passive: false
        }
    );

    sprint.addEventListener(
        "touchend",
        () => {
            mobile.sprint = false;
        }
    );

    /* Reload */

    const reloadButton =
        document.getElementById(
            "mobileReload"
        );

    reloadButton.addEventListener(
        "touchstart",
        (e) => {

            e.preventDefault();

            reload();

        },
        {
            passive: false
        }
    );
}

/* ---------------------------------------------------------
   PLAYER MOVEMENT
--------------------------------------------------------- */

function updatePlayer(dt) {

    if (!player) {
        return;
    }

    let forward = 0;
    let side = 0;

    /* Keyboard */

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

    /* Mobile */

    forward +=
        -mobile.moveY;

    side +=
        mobile.moveX;

    const length =
        Math.hypot(
            forward,
            side
        );

    if (length > 1) {

        forward /=
            length;

        side /=
            length;
    }

    crouching =
        keys["KeyC"] ||
        keys["ControlLeft"];

    let speed =
        crouching
            ? 4.5
            : 8.5;

    const sprinting =
        keys["ShiftLeft"] ||
        keys["ShiftRight"] ||
        mobile.sprint;

    if (sprinting) {
        speed =
            crouching
                ? 5
                : 14;
    }

    if (length > 0.05) {

        const sin =
            Math.sin(yaw);

        const cos =
            Math.cos(yaw);

        player.position.x +=
            (
                side * cos +
                forward * sin
            ) *
            speed *
            dt;

        player.position.z +=
            (
                side * sin -
                forward * cos
            ) *
            speed *
            dt;

        player.rotation.y =
            yaw;

        /* walk animation */

        const bob =
            Math.sin(
                performance.now() *
                0.014
            ) *
            0.045;

        player.position.y =
            Math.max(
                0,
                player.position.y +
                    bob * dt
            );
    }

    /* Jump */

    if (!onGround) {

        jumpVelocity -=
            24 * dt;

        player.position.y +=
            jumpVelocity * dt;

        if (
            player.position.y <= 0
        ) {

            player.position.y = 0;

            jumpVelocity = 0;

            onGround = true;
        }
    }

    /* Bounds */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -225,
            225
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -190,
            190
        );
}

/* ---------------------------------------------------------
   CAMERA
--------------------------------------------------------- */

function updateCamera() {

    if (!player || !camera) {
        return;
    }

    /* First person */

    if (
        cameraMode === 1
    ) {

        const target =
            new THREE.Vector3(
                0,
                crouching
                    ? 5
                    : 6,
                0
            );

        player.localToWorld(
            target
        );

        camera.position.copy(
            target
        );

        camera.rotation.order =
            "YXZ";

        camera.rotation.y =
            yaw;

        camera.rotation.x =
            pitch;

        return;
    }

    /* Third person */

    const target =
        new THREE.Vector3(
            0,
            crouching
                ? 4.8
                : 5.5,
            0
        );

    player.localToWorld(
        target
    );

    const distance =
        crouching
            ? 5.5
            : 6.5;

    const horizontal =
        Math.cos(pitch) *
        distance;

    const vertical =
        Math.sin(pitch) *
        distance;

    const offset =
        new THREE.Vector3(
            0,
            vertical + 1.5,
            horizontal
        );

    offset.applyAxisAngle(
        new THREE.Vector3(
            0,
            1,
            0
        ),
        yaw
    );

    const desired =
        target
            .clone()
            .add(offset);

    camera.position.lerp(
        desired,
        0.15
    );

    camera.lookAt(
        target
    );
}

/* ---------------------------------------------------------
   SHOOT
--------------------------------------------------------- */

function shoot() {

    if (!running) {
        return;
    }

    if (reloading) {
        return;
    }

    const weapon =
        weapons[
            currentWeapon
        ];

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

    lastShot = now;

    weapon.ammo--;

    for (
        let i = 0;
        i < weapon.pellets;
        i++
    ) {

        fireRay(
            weapon
        );
    }

    createMuzzleFlash();

    updateHUD();
}

/* ---------------------------------------------------------
   RAY SHOOT
--------------------------------------------------------- */

function fireRay(
    weapon
) {

    const raycaster =
        new THREE.Raycaster();

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
            0.5
        ) *
        weapon.spread;

    direction.y +=
        (
            Math.random() -
            0.5
        ) *
        weapon.spread;

    direction.normalize();

    raycaster.set(
        origin,
        direction
    );

    const targets = [];

    enemies.forEach(
        (enemy) => {

            if (
                !enemy.userData.alive
            ) {
                return;
            }

            enemy.traverse(
                (obj) => {

                    if (
                        obj.isMesh
                    ) {
                        targets.push(
                            obj
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

    if (
        hits.length === 0
    ) {
        createTracer(
            origin,
            origin.clone().add(
                direction.multiplyScalar(
                    80
                )
            )
        );

        return;
    }

    const hit =
        hits[0];

    let object =
        hit.object;

    let enemy = null;

    while (
        object &&
        object !== scene
    ) {

        if (
            object.userData &&
            object.userData.health !==
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

    createTracer(
        origin,
        hit.point
    );
}

/* ---------------------------------------------------------
   BULLET TRACER
--------------------------------------------------------- */

function createTracer(
    from,
    to
) {

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                from,
                to
            ]);

    const material =
        new THREE.LineBasicMaterial({
            color: 0xffe2a0,
            transparent: true,
            opacity: 0.65
        });

    const line =
        new THREE.Line(
            geometry,
            material
        );

    scene.add(line);

    setTimeout(
        () => {

            scene.remove(
                line
            );

            geometry.dispose();
            material.dispose();

        },
        45
    );
}

/* ---------------------------------------------------------
   MUZZLE FLASH
--------------------------------------------------------- */

function createMuzzleFlash() {

    if (!playerGun) {
        return;
    }

    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.3,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffb82e
            })
        );

    const position =
        new THREE.Vector3(
            0,
            0,
            -3.1
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
            scene.remove(flash);
        },
        45
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
    ) {
        return;
    }

    enemy.userData.health -=
        damage;

    if (
        enemy.userData.health <=
        0
    ) {

        enemy.userData.health = 0;

        enemy.userData.alive =
            false;

        enemy.visible = false;

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

    if (!player) {
        return;
    }

    enemies.forEach(
        (enemy) => {

            if (
                !enemy.userData.alive
            ) {
                return;
            }

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

            /*
              Enemies only chase when
              relatively close.
            */

            if (
                distance < 105
            ) {

                const angle =
                    Math.atan2(
                        dx,
                        -dz
                    );

                enemy.rotation.y =
                    angle;

                if (
                    distance > 16
                ) {

                    enemy.position.x +=
                        Math.sin(
                            angle
                        ) *
                        enemy.userData.speed *
                        dt;

                    enemy.position.z +=
                        -Math.cos(
                            angle
                        ) *
                        enemy.userData.speed *
                        dt;
                }

                enemy.userData.attackTimer -=
                    dt;

                if (
                    distance < 42 &&
                    enemy.userData.attackTimer <=
                        0
                ) {

                    enemy.userData.attackTimer =
                        0.75 +
                        Math.random() *
                        0.8;

                    enemyShoot(
                        enemy
                    );
                }

            } else {

                /* patrol */

                const t =
                    performance.now() *
                        0.0002 +
                    enemy.userData.seed;

                enemy.position.x +=
                    Math.sin(t) *
                    dt *
                    0.35;

                enemy.position.z +=
                    Math.cos(t) *
                    dt *
                    0.35;
            }

            /* bounds */

            enemy.position.x =
                THREE.MathUtils.clamp(
                    enemy.position.x,
                    -220,
                    220
                );

            enemy.position.z =
                THREE.MathUtils.clamp(
                    enemy.position.z,
                    -185,
                    185
                );
        }
    );
}

/* ---------------------------------------------------------
   ENEMY SHOOT
--------------------------------------------------------- */

function enemyShoot(
    enemy
) {

    const distance =
        player.position.distanceTo(
            enemy.position
        );

    const hitChance =
        distance < 25
            ? 0.52
            : 0.28;

    if (
        Math.random() >
        hitChance
    ) {
        return;
    }

    const damage =
        6 +
        Math.random() *
        7;

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

    if (!running) {
        return;
    }

    const armorHit =
        Math.min(
            armor,
            damage * 0.6
        );

    armor -=
        armorHit;

    health -=
        damage -
        armorHit;

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
   WEAPON
--------------------------------------------------------- */

function switchWeapon(
    index
) {

    if (
        index < 0 ||
        index >= weapons.length
    ) {
        return;
    }

    currentWeapon =
        index;

    reloading = false;

    updateHUD();
}

/* ---------------------------------------------------------
   RELOAD
--------------------------------------------------------- */

function reload() {

    if (
        reloading
    ) {
        return;
    }

    const weapon =
        weapons[
            currentWeapon
        ];

    if (
        weapon.ammo >=
        weapon.mag
    ) {
        return;
    }

    if (
        weapon.reserve <= 0
    ) {
        return;
    }

    reloading = true;

    updateHUD();

    setTimeout(
        () => {

            const needed =
                weapon.mag -
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

            reloading = false;

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
    ) {
        return;
    }

    medkits--;

    health =
        Math.min(
            100,
            health + 45
        );

    updateHUD();
}

/* ---------------------------------------------------------
   PICKUPS UPDATE
--------------------------------------------------------- */

function updatePickups(
    dt
) {

    pickups.forEach(
        (item) => {

            if (
                !item.visible
            ) {
                return;
            }

            item.rotation.y +=
                dt * 1.8;

            item.position.y =
                1.5 +
                Math.sin(
                    performance.now() *
                    0.003
                ) *
                0.35;

            const distance =
                item.position.distanceTo(
                    player.position
                );

            if (
                distance < 3.5
            ) {

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

                if (
                    item.userData.type ===
                    "MEDKIT"
                ) {

                    medkits++;
                }

                item.visible =
                    false;

                updateHUD();
            }
        }
    );
}

/* ---------------------------------------------------------
   ZONE UPDATE
--------------------------------------------------------- */

function updateZone(
    dt
) {

    zoneTimer += dt;

    if (
        zoneTimer > 4
    ) {

        zoneTimer = 0;

        zoneRadius =
            Math.max(
                45,
                zoneRadius -
                    0.7
            );

        if (zoneMesh) {

            zoneMesh.scale.set(
                zoneRadius /
                    175,
                zoneRadius /
                    175,
                zoneRadius /
                    175
            );
        }

        if (zoneWall) {

            zoneWall.scale.set(
                zoneRadius,
                1,
                zoneRadius
            );
        }
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
            3.2 * dt
        );
    }
}

/* ---------------------------------------------------------
   HUD
--------------------------------------------------------- */

function updateHUD() {

    const weapon =
        weapons[
            currentWeapon
        ];

    if ($("health")) {
        $("health").textContent =
            Math.ceil(
                health
            );
    }

    if ($("armor")) {
        $("armor").textContent =
            Math.ceil(
                armor
            );
    }

    if ($("ammo")) {

        $("ammo").textContent =
            reloading
                ? "RELOADING"
                :
                weapon.ammo +
                " / " +
                weapon.reserve;
    }

    if ($("weapon")) {

        $("weapon").textContent =
            weapon.name;
    }

    if ($("kills")) {

        $("kills").textContent =
            kills;
    }

    if ($("alive")) {

        $("alive").textContent =
            aliveCount;
    }

    if ($("medkits")) {

        $("medkits").textContent =
            medkits;
    }

    if ($("zone")) {

        $("zone").textContent =
            Math.round(
                zoneRadius
            ) +
            "m";
    }
}

/* ---------------------------------------------------------
   CAMERA / WORLD ANIMATION
--------------------------------------------------------- */

function animateWorld(
    dt
) {

    /* street lights */

    streetLights.forEach(
        (light, index) => {

            const pulse =
                1 +
                Math.sin(
                    performance.now() *
                        0.002 +
                    index
                ) *
                0.08;

            light.scale.y =
                pulse;
        }
    );
}

/* ---------------------------------------------------------
   GAME LOOP
--------------------------------------------------------- */

function gameLoop() {

    if (!running) {
        return;
    }

    requestAnimationFrame(
        gameLoop
    );

    const dt =
        Math.min(
            clock.getDelta(),
            0.05
        );

    updatePlayer(
        dt
    );

    updateEnemies(
        dt
    );

    updatePickups(
        dt
    );

    updateZone(
        dt
    );

    animateWorld(
        dt
    );

    updateCamera();

    /* Mobile continuous fire */

    if (
        mobile.fire
    ) {
        shoot();
    }

    renderer.render(
        scene,
        camera
    );
}

/* ---------------------------------------------------------
   FINISH GAME
--------------------------------------------------------- */

function finishGame(
    won
) {

    if (
        gameEnded
    ) {
        return;
    }

    gameEnded = true;
    running = false;

    document.exitPointerLock?.();

    if ($("result")) {

        $("result").style.display =
            "flex";
    }

    if ($("resultTitle")) {

        $("resultTitle").textContent =
            won
                ? "BOOYAH!"
                : "ELIMINATED";
    }

    if ($("resultText")) {

        $("resultText").textContent =
            won
                ? `WINNER • ${kills} ELIMINATIONS`
                : `ELIMINATED • ${kills} ELIMINATIONS`;
    }
}

/* ---------------------------------------------------------
   RESTART
--------------------------------------------------------- */

function restartGame() {
    window.location.reload();
}

/* ---------------------------------------------------------
   RESIZE
--------------------------------------------------------- */

function resizeGame() {

    if (
        !camera ||
        !renderer
    ) {
        return;
    }

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

/* ---------------------------------------------------------
   DOM READY
--------------------------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const enter =
            $("enter");

        const name =
            $("name");

        const again =
            $("again");

        if (enter) {

            enter.addEventListener(
                "click",
                () => {

                    window.startGame();
                }
            );
        }

        if (name) {

            name.addEventListener(
                "keydown",
                (e) => {

                    if (
                        e.key ===
                        "Enter"
                    ) {

                        window.startGame();
                    }
                }
            );
        }

        if (again) {

            again.addEventListener(
                "click",
                restartGame
            );
        }
    }
);
