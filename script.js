/* =========================================================
   LAST//ALIVE — DISTRICT 07
   ORIGINAL BATTLE ROYALE ISLAND
   Three.js procedural 3D game
   ========================================================= */

const $ = id => document.getElementById(id);

let scene, camera, renderer, clock;
let player;
let running = false;
let yaw = 0;
let pitch = -0.12;
let cameraMode = 3;

const keys = {};
const bullets = [];
const enemies = [];
const pickups = [];
const buildings = [];
const trees = [];
const clouds = [];

let health = 100;
let armor = 100;
let kills = 0;
let aliveCount = 12;
let medkits = 2;

let currentWeapon = 0;
let lastShot = 0;
let reloading = false;
let reloadTimer = 0;
let jumpVelocity = 0;
let onGround = true;
let crouching = false;

let zoneRadius = 105;
let zoneTimer = 0;

const weapons = [
    {
        name: "AR-01",
        damage: 30,
        fireRate: 115,
        mag: 30,
        ammo: 30,
        reserve: 150,
        spread: 0.018,
        pellets: 1
    },
    {
        name: "SMG-9",
        damage: 18,
        fireRate: 65,
        mag: 40,
        ammo: 40,
        reserve: 200,
        spread: 0.035,
        pellets: 1
    },
    {
        name: "M12 SHOTGUN",
        damage: 15,
        fireRate: 650,
        mag: 6,
        ammo: 6,
        reserve: 48,
        spread: 0.12,
        pellets: 8
    }
];

/* =========================================================
   START
   ========================================================= */

function startGame() {

    const name = $("name")?.value.trim();

    if (!name) {
        if ($("name")) {
            $("name").focus();
            $("name").placeholder = "ENTER YOUR NAME";
        }
        return;
    }

    if (typeof THREE === "undefined") {
        alert(
            "Three.js load nahi hua.\n\n" +
            "index.html me ye line use karo:\n" +
            "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.min.js"
        );
        return;
    }

    $("start").style.display = "none";

    if ($("hud")) {
        $("hud").style.display = "block";
    }

    try {
        initGame();
        running = true;
        clock.start();

        updateHUD();

        setTimeout(() => {
            renderer.domElement.requestPointerLock?.();
        }, 300);

        requestAnimationFrame(gameLoop);

    } catch (error) {

        console.error(error);

        alert("GAME ERROR: " + error.message);

        $("start").style.display = "flex";

        if ($("hud")) {
            $("hud").style.display = "none";
        }
    }
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initGame() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x8ba6ad);

    scene.fog = new THREE.FogExp2(
        0x8ba6ad,
        0.004
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

    renderer.setSize(innerWidth, innerHeight);

    renderer.setPixelRatio(
        Math.min(devicePixelRatio, 1.7)
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

    setupLighting();
    createSky();
    createIsland();
    createRoadNetwork();
    createCity();
    createMilitaryBase();
    createHarbor();
    createForest();
    createLandmarks();
    createLoot();
    createZone();
    createPlayer();
    createEnemies();

    setupControls();
}


/* =========================================================
   LIGHTING
   ========================================================= */

function setupLighting() {

    const hemi = new THREE.HemisphereLight(
        0xcce9ff,
        0x34422e,
        2.2
    );

    scene.add(hemi);

    const sun = new THREE.DirectionalLight(
        0xfff0cf,
        4.2
    );

    sun.position.set(
        -160,
        240,
        100
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

    const fill = new THREE.DirectionalLight(
        0x78b8ff,
        0.65
    );

    fill.position.set(
        160,
        80,
        -120
    );

    scene.add(fill);
}


/* =========================================================
   SKY
   ========================================================= */

function createSky() {

    const skyGeo =
        new THREE.SphereGeometry(
            600,
            32,
            16
        );

    const skyMat =
        new THREE.MeshBasicMaterial({
            color: 0x8fb8c5,
            side: THREE.BackSide
        });

    const sky =
        new THREE.Mesh(
            skyGeo,
            skyMat
        );

    scene.add(sky);

    // clouds

    for (let i = 0; i < 20; i++) {

        const cloud =
            new THREE.Group();

        for (let j = 0; j < 5; j++) {

            const geo =
                new THREE.SphereGeometry(
                    8 + Math.random() * 8,
                    12,
                    8
                );

            const mat =
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.32
                });

            const puff =
                new THREE.Mesh(
                    geo,
                    mat
                );

            puff.position.set(
                j * 10,
                Math.random() * 5,
                Math.random() * 7
            );

            cloud.add(puff);
        }

        cloud.position.set(
            -250 + Math.random() * 500,
            100 + Math.random() * 70,
            -250 + Math.random() * 500
        );

        scene.add(cloud);
        clouds.push(cloud);
    }
}


/* =========================================================
   ISLAND
   ========================================================= */

function createIsland() {

    const waterGeo =
        new THREE.PlaneGeometry(
            900,
            900
        );

    const waterMat =
        new THREE.MeshStandardMaterial({
            color: 0x236b78,
            roughness: 0.25,
            metalness: 0.15
        });

    const water =
        new THREE.Mesh(
            waterGeo,
            waterMat
        );

    water.rotation.x = -Math.PI / 2;
    water.position.y = -4;

    scene.add(water);

    // main island

    const islandGeo =
        new THREE.CylinderGeometry(
            250,
            275,
            9,
            64
        );

    const islandMat =
        new THREE.MeshStandardMaterial({
            color: 0x516b3d,
            roughness: 1
        });

    const island =
        new THREE.Mesh(
            islandGeo,
            islandMat
        );

    island.position.y = -1;

    island.scale.z = 0.82;

    island.receiveShadow = true;

    scene.add(island);

    // beaches

    const beachGeo =
        new THREE.CylinderGeometry(
            258,
            282,
            3,
            64
        );

    const beachMat =
        new THREE.MeshStandardMaterial({
            color: 0xd1bd88,
            roughness: 1
        });

    const beach =
        new THREE.Mesh(
            beachGeo,
            beachMat
        );

    beach.position.y = 2;

    beach.scale.z = 0.82;

    scene.add(beach);

    // terrain patches

    for (let i = 0; i < 70; i++) {

        const r = 20 + Math.random() * 225;
        const a = Math.random() * Math.PI * 2;

        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r * 0.82;

        const patch =
            new THREE.Mesh(
                new THREE.CircleGeometry(
                    5 + Math.random() * 18,
                    16
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        Math.random() > 0.5
                            ? 0x5c7844
                            : 0x486437
                })
            );

        patch.rotation.x = -Math.PI / 2;

        patch.position.set(
            x,
            3.7,
            z
        );

        scene.add(patch);
    }
}


/* =========================================================
   ROADS
   ========================================================= */

function createRoadNetwork() {

    const roadMat =
        new THREE.MeshStandardMaterial({
            color: 0x252b2c,
            roughness: 0.9
        });

    const lineMat =
        new THREE.MeshBasicMaterial({
            color: 0xd8bd55
        });

    const roads = [
        [0, 0, 480, 15],
        [0, 0, 15, 410],
        [80, -10, 300, 12],
        [-90, 55, 300, 13],
        [20, -80, 250, 12],
        [-130, -65, 180, 12]
    ];

    for (const r of roads) {

        const [x, z, length, width] = r;

        const geo =
            new THREE.BoxGeometry(
                length,
                0.4,
                width
            );

        const road =
            new THREE.Mesh(
                geo,
                roadMat
            );

        road.position.set(
            x,
            4.25,
            z
        );

        road.receiveShadow = true;

        scene.add(road);

        // center markings

        const segments =
            Math.floor(length / 18);

        for (let i = 0; i < segments; i++) {

            const mark =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        8,
                        0.08,
                        0.7
                    ),
                    lineMat
                );

            mark.position.set(
                x - length / 2 + i * 18 + 5,
                4.48,
                z
            );

            scene.add(mark);
        }
    }
}


/* =========================================================
   BUILDINGS
   ========================================================= */

function createBuilding(
    x,
    z,
    w,
    h,
    d,
    color = 0x62666a
) {

    const group =
        new THREE.Group();

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                w,
                h,
                d
            ),
            new THREE.MeshStandardMaterial({
                color,
                roughness: 0.75,
                metalness: 0.05
            })
        );

    body.position.y =
        h / 2 + 4.5;

    body.castShadow = true;
    body.receiveShadow = true;

    group.add(body);

    // roof

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                w + 1,
                0.8,
                d + 1
            ),
            new THREE.MeshStandardMaterial({
                color: 0x34383a
            })
        );

    roof.position.y =
        h + 4.9;

    roof.castShadow = true;

    group.add(roof);

    // windows

    const windowMat =
        new THREE.MeshBasicMaterial({
            color: 0xb5e6ed
        });

    const cols =
        Math.max(
            2,
            Math.floor(w / 7)
        );

    const rows =
        Math.max(
            2,
            Math.floor(h / 6)
        );

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            const win =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        2.5,
                        2.2,
                        0.12
                    ),
                    windowMat
                );

            win.position.set(
                -w / 2 + 4 + col * 7,
                7 + row * 6,
                d / 2 + 0.08
            );

            group.add(win);

            const win2 = win.clone();

            win2.position.z =
                -d / 2 - 0.08;

            group.add(win2);
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


/* =========================================================
   CITY
   ========================================================= */

function createCity() {

    // central city

    const cityBlocks = [
        [-85, -35],
        [-40, -35],
        [10, -35],
        [60, -35],

        [-85, 20],
        [-35, 20],
        [20, 20],
        [70, 20],

        [-75, 72],
        [-20, 72],
        [40, 72]
    ];

    for (const [x, z] of cityBlocks) {

        const w =
            15 + Math.random() * 16;

        const d =
            15 + Math.random() * 15;

        const h =
            14 + Math.random() * 34;

        const colors = [
            0x666d72,
            0x515b60,
            0x72716a,
            0x4c5559,
            0x77716a
        ];

        createBuilding(
            x,
            z,
            w,
            h,
            d,
            colors[
                Math.floor(
                    Math.random() * colors.length
                )
            ]
        );
    }

    // high rise

    createBuilding(
        18,
        -4,
        24,
        70,
        24,
        0x39434a
    );

    createBuilding(
        58,
        42,
        20,
        54,
        20,
        0x4a5157
    );

    createBuilding(
        -100,
        40,
        22,
        48,
        22,
        0x565d60
    );

    // houses outskirts

    for (let i = 0; i < 18; i++) {

        const a =
            Math.random() * Math.PI * 2;

        const r =
            120 + Math.random() * 65;

        createBuilding(
            Math.cos(a) * r,
            Math.sin(a) * r * 0.8,
            12,
            8 + Math.random() * 8,
            12,
            0x8a7762
        );
    }
}


/* =========================================================
   MILITARY BASE
   ========================================================= */

function createMilitaryBase() {

    const baseX = 145;
    const baseZ = -125;

    // perimeter

    const wallMat =
        new THREE.MeshStandardMaterial({
            color: 0x5a5d5a,
            roughness: 0.9
        });

    const walls = [
        [120, 0, 220, 4],
        [120, 180, 220, 4],
        [12, 90, 4, 180],
        [228, 90, 4, 180]
    ];

    for (const [x, z, w, d] of walls) {

        const wall =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    w,
                    6,
                    d
                ),
                wallMat
            );

        wall.position.set(
            x,
            7,
            z
        );

        wall.castShadow = true;

        scene.add(wall);
    }

    // hangars

    for (let i = 0; i < 4; i++) {

        createBuilding(
            85 + i * 42,
            -80,
            34,
            14,
            28,
            0x4b5151
        );
    }

    // control tower

    createBuilding(
        205,
        -95,
        18,
        50,
        18,
        0x39454b
    );

    // watch towers

    for (const [x, z] of [
        [25, -35],
        [235, -35],
        [25, -175],
        [235, -175]
    ]) {

        const tower =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    2.5,
                    3.5,
                    16,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x3b4140
                })
            );

        tower.position.set(
            x,
            12,
            z
        );

        tower.castShadow = true;

        scene.add(tower);

        const top =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    10,
                    2,
                    10
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x282d2e
                })
            );

        top.position.set(
            x,
            21,
            z
        );

        scene.add(top);
    }
}


/* =========================================================
   HARBOR
   ========================================================= */

function createHarbor() {

    const dockMat =
        new THREE.MeshStandardMaterial({
            color: 0x6b5138
        });

    for (let i = 0; i < 6; i++) {

        const dock =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    12,
                    1,
                    55
                ),
                dockMat
            );

        dock.position.set(
            -185 + i * 18,
            4,
            -15
        );

        scene.add(dock);
    }

    // containers

    const containerColors = [
        0x9d3c32,
        0x315d78,
        0x6c7132,
        0x7d4f2b
    ];

    for (let i = 0; i < 20; i++) {

        const container =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    8,
                    4,
                    3
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        containerColors[
                            i %
                            containerColors.length
                        ]
                })
            );

        container.position.set(
            -205 +
                Math.random() * 45,
            6 + Math.floor(
                Math.random() * 2
            ) * 4,
            -50 +
                Math.random() * 60
        );

        container.rotation.y =
            Math.random() > 0.5
                ? 0
                : Math.PI / 2;

        container.castShadow = true;

        scene.add(container);
    }
}


/* =========================================================
   TREES / FOREST
   ========================================================= */

function createTree(x, z, scale = 1) {

    const tree =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.7,
                1,
                6,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x62462e
            })
        );

    trunk.position.y = 7.5;

    trunk.castShadow = true;

    tree.add(trunk);

    for (let i = 0; i < 3; i++) {

        const crown =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    4.5 - i * 0.8,
                    7,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        i === 0
                            ? 0x244e31
                            : 0x32683a
                })
            );

        crown.position.y =
            11 + i * 4;

        crown.castShadow = true;

        tree.add(crown);
    }

    tree.position.set(
        x,
        0,
        z
    );

    tree.scale.setScalar(scale);

    scene.add(tree);

    trees.push(tree);
}


function createForest() {

    for (let i = 0; i < 120; i++) {

        const a =
            Math.random() *
            Math.PI * 2;

        const r =
            110 +
            Math.random() * 115;

        const x =
            Math.cos(a) * r;

        const z =
            Math.sin(a) * r * 0.82;

        // avoid center city

        if (
            Math.abs(x) < 95 &&
            Math.abs(z) < 100
        ) {
            continue;
        }

        createTree(
            x,
            z,
            0.7 +
            Math.random() * 0.8
        );
    }
}


/* =========================================================
   LANDMARKS
   ========================================================= */

function createLandmarks() {

    // giant radio tower

    const tower =
        new THREE.Group();

    for (let i = 0; i < 4; i++) {

        const leg =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.6,
                    1,
                    55,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x30383a,
                    metalness: 0.8
                })
            );

        const angle =
            i * Math.PI / 2;

        leg.position.set(
            Math.cos(angle) * 5,
            31,
            Math.sin(angle) * 5
        );

        tower.add(leg);
    }

    for (let y = 10; y < 55; y += 10) {

        const ring =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    5 - y * 0.025,
                    0.35,
                    8,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x394346
                })
            );

        ring.rotation.x =
            Math.PI / 2;

        ring.position.y = y;

        tower.add(ring);
    }

    tower.position.set(
        -125,
        0,
        -115
    );

    scene.add(tower);

    // giant billboard

    const sign =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                30,
                12,
                1
            ),
            new THREE.MeshStandardMaterial({
                color: 0x171b1d,
                emissive: 0x071b18,
                emissiveIntensity: 0.5
            })
        );

    sign.position.set(
        -10,
        18,
        105
    );

    scene.add(sign);

    // water tower

    const tank =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                8,
                8,
                10,
                20
            ),
            new THREE.MeshStandardMaterial({
                color: 0x667072,
                metalness: 0.4
            })
        );

    tank.position.set(
        115,
        38,
        105
    );

    scene.add(tank);

    for (let i = 0; i < 4; i++) {

        const leg =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.6,
                    0.6,
                    35,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x40484a
                })
            );

        const a =
            i * Math.PI / 2;

        leg.position.set(
            115 +
            Math.cos(a) * 5,
            20,
            105 +
            Math.sin(a) * 5
        );

        scene.add(leg);
    }
}


/* =========================================================
   LOOT
   ========================================================= */

function createLoot() {

    const positions = [
        [-70, 0, -20],
        [45, 0, 5],
        [95, 0, 65],
        [-120, 0, 70],
        [160, 0, -70],
        [20, 0, 100],
        [-170, 0, -70],
        [110, 0, -145]
    ];

    for (const [x, y, z] of positions) {

        createPickup(
            x,
            7,
            z,
            Math.random() > 0.5
                ? "ARMOR"
                : "MEDKIT"
        );
    }
}


function createPickup(
    x,
    y,
    z,
    type
) {

    const color =
        type === "ARMOR"
            ? 0x39b9ff
            : 0x50ff8a;

    const box =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.5,
                2.5,
                2.5
            ),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.3
            })
        );

    box.position.set(
        x,
        y,
        z
    );

    box.userData.type = type;

    box.castShadow = true;

    scene.add(box);

    pickups.push(box);
}


/* =========================================================
   SAFE ZONE
   ========================================================= */

let zoneMesh;

function createZone() {

    const geo =
        new THREE.RingGeometry(
            zoneRadius - 1,
            zoneRadius,
            96
        );

    const mat =
        new THREE.MeshBasicMaterial({
            color: 0x4dff94,
            transparent: true,
            opacity: 0.85,
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
        5;

    scene.add(zoneMesh);
}


/* =========================================================
   PLAYER
   ========================================================= */

function createPlayer() {

    player =
        new THREE.Group();

    // legs

    const legMat =
        new THREE.MeshStandardMaterial({
            color: 0x20252a,
            roughness: 0.7
        });

    const leftLeg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.2,
                4,
                1.2
            ),
            legMat
        );

    leftLeg.position.set(
        -0.75,
        6.5,
        0
    );

    player.add(leftLeg);

    const rightLeg =
        leftLeg.clone();

    rightLeg.position.x =
        0.75;

    player.add(rightLeg);

    // body

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                2.0,
                3.5,
                6,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x27343a,
                roughness: 0.65
            })
        );

    body.position.y =
        10;

    body.castShadow = true;

    player.add(body);

    // vest

    const vest =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.6,
                3,
                2.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x3b4650,
                roughness: 0.6
            })
        );

    vest.position.y =
        10.3;

    vest.castShadow = true;

    player.add(vest);

    // head

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.55,
                24,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0xd59a72,
                roughness: 0.75
            })
        );

    head.position.y =
        13.5;

    head.castShadow = true;

    player.add(head);

    // hair

    const hair =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.6,
                16,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x24282d
            })
        );

    hair.scale.y = 0.55;

    hair.position.set(
        0,
        14.5,
        -0.1
    );

    player.add(hair);

    // gun

    const gun =
        createGun();

    gun.position.set(
        1.65,
        10.2,
        -1.5
    );

    gun.rotation.y =
        Math.PI;

    player.add(gun);

    player.userData.gun = gun;

    player.position.set(
        0,
        0,
        150
    );

    scene.add(player);
}


function createGun() {

    const gun =
        new THREE.Group();

    const dark =
        new THREE.MeshStandardMaterial({
            color: 0x171b1e,
            metalness: 0.75,
            roughness: 0.25
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.7,
                0.65,
                3.8
            ),
            dark
        );

    gun.add(body);

    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.12,
                0.12,
                2.4,
                10
            ),
            dark
        );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.z =
        -2.7;

    gun.add(barrel);

    const stock =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.7,
                0.8,
                1.3
            ),
            dark
        );

    stock.position.z =
        2;

    gun.add(stock);

    return gun;
}


/* =========================================================
   ENEMIES
   ========================================================= */

function createEnemies() {

    const spots = [
        [-95, 0, -105],
        [-35, 0, -115],
        [45, 0, -105],
        [105, 0, -90],
        [160, 0, -40],
        [145, 0, 45],
        [90, 0, 115],
        [-10, 0, 130],
        [-90, 0, 110],
        [-155, 0, 65],
        [-165, 0, -30]
    ];

    spots.forEach(
        ([x, y, z], index) => {
            createEnemy(
                x,
                y,
                z,
                index
            );
        }
    );
}


function createEnemy(
    x,
    y,
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
            color: 0x6f2525,
            roughness: 0.7
        });

    // legs

    const leg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.15,
                4,
                1.15
            ),
            dark
        );

    leg.position.set(
        -0.7,
        6.4,
        0
    );

    enemy.add(leg);

    const leg2 =
        leg.clone();

    leg2.position.x =
        0.7;

    enemy.add(leg2);

    // body

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.8,
                3.2,
                5,
                10
            ),
            red
        );

    body.position.y =
        10;

    enemy.add(body);

    // head

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.45,
                20,
                14
            ),
            new THREE.MeshStandardMaterial({
                color: 0xc88f6e
            })
        );

    head.position.y =
        13.4;

    enemy.add(head);

    // mask

    const mask =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.48,
                20,
                14,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            ),
            dark
        );

    mask.position.y =
        13.5;

    enemy.add(mask);

    // weapon

    const weapon =
        createGun();

    weapon.scale.setScalar(
        0.8
    );

    weapon.position.set(
        1.5,
        10,
        -1.3
    );

    enemy.add(weapon);

    enemy.position.set(
        x,
        y,
        z
    );

    enemy.userData = {
        health: 100,
        maxHealth: 100,
        alive: true,
        speed:
            3.5 +
            Math.random() * 1.4,
        attackTimer: 0,
        seed: Math.random() * 10,
        index
    };

    enemy.traverse(
        obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
            }
        }
    );

    scene.add(enemy);

    enemies.push(enemy);
}


/* =========================================================
   CONTROLS
   ========================================================= */

function setupControls() {

    window.addEventListener(
        "keydown",
        e => {

            keys[e.code] = true;

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

                jumpVelocity = 10;
                onGround = false;
            }
        }
    );

    window.addEventListener(
        "keyup",
        e => {
            keys[e.code] = false;
        }
    );

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
                0.0023;

            pitch -=
                e.movementY *
                0.002;

            pitch =
                Math.max(
                    -1.0,
                    Math.min(
                        0.65,
                        pitch
                    )
                );
        }
    );

    document.addEventListener(
        "mousedown",
        e => {

            if (!renderer) return;

            if (
                document.pointerLockElement !==
                renderer.domElement
            ) {

                renderer.domElement
                    .requestPointerLock?.();

                return;
            }

            if (e.button === 0) {
                shoot();
            }
        }
    );

    window.addEventListener(
        "resize",
        resizeGame
    );

    renderer.domElement.addEventListener(
        "click",
        () => {
            renderer.domElement
                .requestPointerLock?.();
        }
    );
}


/* =========================================================
   MOVEMENT
   ========================================================= */

function updatePlayer(dt) {

    if (!player) return;

    let forward = 0;
    let side = 0;

    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    ) forward += 1;

    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    ) forward -= 1;

    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) side -= 1;

    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) side += 1;

    const length =
        Math.hypot(
            forward,
            side
        );

    if (length > 0) {

        forward /= length;
        side /= length;

        const speed =
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
                ? 15
                : 9;

        if (
            keys["KeyC"] ||
            keys["ControlLeft"]
        ) {
            crouching = true;
        } else {
            crouching = false;
        }

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

        // walking animation

        const bob =
            Math.sin(
                performance.now() *
                0.012
            ) *
            0.08;

        player.position.y =
            Math.max(
                0,
                player.position.y +
                bob * dt
            );
    }

    // jump

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

    // island boundaries

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -225,
            225
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -185,
            185
        );

    // water / island edge

    const dist =
        Math.sqrt(
            player.position.x ** 2 +
            player.position.z ** 2
        );

    if (dist > 245) {

        player.position.x *=
            0.995;

        player.position.z *=
            0.995;
    }
}


/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera() {

    if (!player) return;

    if (cameraMode === 1) {

        const head =
            new THREE.Vector3(
                0,
                12.8,
                0
            );

        player.localToWorld(head);

        camera.position.copy(
            head
        );

        camera.rotation.order =
            "YXZ";

        camera.rotation.y =
            yaw;

        camera.rotation.x =
            pitch;

        return;
    }

    const distance =
        crouching
            ? 6
            : 7.5;

    const height =
        crouching
            ? 8
            : 9.5;

    const target =
        new THREE.Vector3(
            0,
            height,
            0
        );

    player.localToWorld(
        target
    );

    const offset =
        new THREE.Vector3(
            0,
            0,
            distance
        );

    offset.applyAxisAngle(
        new THREE.Vector3(
            1,
            0,
            0
        ),
        pitch
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
        target.clone()
            .add(offset);

    camera.position.lerp(
        desired,
        0.16
    );

    camera.lookAt(
        target
    );
}


/* =========================================================
   SHOOTING
   ========================================================= */

function shoot() {

    if (
        !running ||
        reloading
    ) return;

    const weapon =
        weapons[currentWeapon];

    const now =
        performance.now();

    if (
        now - lastShot <
        weapon.fireRate
    ) {
        return;
    }

    if (weapon.ammo <= 0) {

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


function fireRay(weapon) {

    const raycaster =
        new THREE.Raycaster();

    const origin =
        new THREE.Vector3();

    camera.getWorldPosition(
        origin
    );

    const direction =
        new THREE.Vector3(
            0,
            0,
            -1
        );

    camera.getWorldDirection(
        direction
    );

    direction.x +=
        (Math.random() - 0.5) *
        weapon.spread;

    direction.y +=
        (Math.random() - 0.5) *
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
                enemy.userData.alive
            ) {
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
        }
    );

    const hits =
        raycaster.intersectObjects(
            targets,
            false
        );

    if (hits.length) {

        let obj =
            hits[0].object;

        let enemy = null;

        while (
            obj &&
            obj !== scene
        ) {

            if (
                obj.userData &&
                obj.userData.alive !==
                undefined
            ) {

                enemy = obj;
                break;
            }

            obj =
                obj.parent;
        }

        if (enemy) {

            damageEnemy(
                enemy,
                weapon.damage
            );
        }
    }
}


/* =========================================================
   MUZZLE FLASH
   ========================================================= */

function createMuzzleFlash() {

    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.35,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffc44d
            })
        );

    const gun =
        player.userData.gun;

    const pos =
        new THREE.Vector3(
            0,
            0,
            -4
        );

    gun.localToWorld(pos);

    flash.position.copy(
        pos
    );

    scene.add(flash);

    setTimeout(
        () => {
            scene.remove(flash);
        },
        45
    );
}


/* =========================================================
   ENEMY DAMAGE
   ========================================================= */

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
        enemy.userData.health <= 0
    ) {

        enemy.userData.alive =
            false;

        enemy.visible = false;

        kills++;

        aliveCount--;

        updateHUD();

        if (
            aliveCount <= 1
        ) {
            finishGame(true);
        }
    }
}


/* =========================================================
   ENEMY AI
   ========================================================= */

function updateEnemies(dt) {

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
                Math.sqrt(
                    dx * dx +
                    dz * dz
                );

            if (
                distance < 90
            ) {

                const angle =
                    Math.atan2(
                        dx,
                        -dz
                    );

                enemy.rotation.y =
                    angle;

                if (
                    distance > 13
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

                enemy.userData.attackTimer -=
                    dt;

                if (
                    distance < 28 &&
                    enemy.userData.attackTimer <= 0
                ) {

                    enemy.userData.attackTimer =
                        0.65 +
                        Math.random() *
                        0.7;

                    enemyShoot(
                        enemy
                    );
                }
            }
            else {

                const t =
                    performance.now() *
                    0.00025 +
                    enemy.userData.seed;

                enemy.position.x +=
                    Math.sin(t) *
                    dt *
                    0.8;

                enemy.position.z +=
                    Math.cos(t) *
                    dt *
                    0.8;
            }
        }
    );
}


/* =========================================================
   ENEMY SHOOT
   ========================================================= */

function enemyShoot(enemy) {

    const hitChance =
        0.42;

    if (
        Math.random() >
        hitChance
    ) {
        return;
    }

    const distance =
        player.position.distanceTo(
            enemy.position
        );

    let damage =
        7 +
        Math.random() * 8;

    if (
        distance < 12
    ) {
        damage *= 1.5;
    }

    damagePlayer(
        damage
    );
}


/* =========================================================
   PLAYER DAMAGE
   ========================================================= */

function damagePlayer(
    damage
) {

    if (!running) return;

    const armorDamage =
        Math.min(
            armor,
            damage * 0.6
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

        finishGame(false);
    }
}


/* =========================================================
   WEAPONS
   ========================================================= */

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


function reload() {

    if (
        reloading
    ) return;

    const weapon =
        weapons[currentWeapon];

    if (
        weapon.ammo >=
        weapon.mag
    ) return;

    if (
        weapon.reserve <= 0
    ) return;

    reloading = true;

    reloadTimer = 1.5;

    setTimeout(
        () => {

            const needed =
                weapon.mag -
                weapon.ammo;

            const take =
                Math.min(
                    needed,
                    weapon.reserve
                );

            weapon.ammo +=
                take;

            weapon.reserve -=
                take;

            reloading = false;

            updateHUD();

        },
        1500
    );
}


/* =========================================================
   MEDKIT
   ========================================================= */

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


/* =========================================================
   PICKUPS
   ========================================================= */

function updatePickups(dt) {

    pickups.forEach(
        item => {

            if (!item.visible)
                return;

            item.rotation.y +=
                dt * 1.5;

            item.position.y =
                7 +
                Math.sin(
                    performance.now() *
                    0.003
                ) *
                0.5;

            const distance =
                item.position.distanceTo(
                    player.position
                );

            if (
                distance < 4
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

                item.visible = false;

                updateHUD();
            }
        }
    );
}


/* =========================================================
   ZONE
   ========================================================= */

function updateZone(dt) {

    zoneTimer += dt;

    if (
        zoneTimer > 3
    ) {

        zoneTimer = 0;

        zoneRadius =
            Math.max(
                35,
                zoneRadius - 0.45
            );

        zoneMesh.scale.set(
            zoneRadius / 105,
            zoneRadius / 105,
            zoneRadius / 105
        );
    }

    const dist =
        Math.sqrt(
            player.position.x ** 2 +
            player.position.z ** 2
        );

    if (
        dist >
        zoneRadius
    ) {

        damagePlayer(
            3 * dt
        );
    }
}


/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

    const weapon =
        weapons[currentWeapon];

    if ($("health")) {
        $("health").textContent =
            Math.ceil(health);
    }

    if ($("armor")) {
        $("armor").textContent =
            Math.ceil(armor);
    }

    if ($("ammo")) {
        $("ammo").textContent =
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
            ) + "m";
    }
}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop() {

    if (!running) return;

    requestAnimationFrame(
        gameLoop
    );

    const dt =
        Math.min(
            clock.getDelta(),
            0.05
        );

    updatePlayer(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateZone(dt);
    updateCamera();

    clouds.forEach(
        cloud => {
            cloud.position.x +=
                dt * 1.5;

            if (
                cloud.position.x >
                300
            ) {
                cloud.position.x =
                    -300;
            }
        }
    );

    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   END GAME
   ========================================================= */

function finishGame(
    won
) {

    if (!running)
        return;

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


/* =========================================================
   RESTART
   ========================================================= */

function restartGame() {

    location.reload();
}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeGame() {

    if (!camera || !renderer)
        return;

    camera.aspect =
        innerWidth /
        innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        innerWidth,
        innerHeight
    );
}


/* =========================================================
   BUTTONS
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const enter =
            $("enter") ||
            $("playButton");

        if (enter) {
            enter.addEventListener(
                "click",
                startGame
            );
        }

        const again =
            $("again");

        if (again) {
            again.addEventListener(
                "click",
                restartGame
            );
        }

        if ($("name")) {

            $("name")
                .addEventListener(
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
    }
);
