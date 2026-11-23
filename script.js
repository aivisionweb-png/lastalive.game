/* =========================================================
   LAST//ALIVE — DISTRICT 09
   FULL STABLE CLIENT
   - Static map
   - Third person camera
   - WASD + ARROWS
   - Sprint
   - Mouse aim
   - Shoot
   - Jump
   - Crouch
   - Mobile controls
   - Enemies spawn far away
   ========================================================= */

const $ = id => document.getElementById(id);

/* ---------------------------------------------------------
   GLOBALS
--------------------------------------------------------- */

let scene = null;
let camera = null;
let renderer = null;
let clock = null;

let player = null;
let playerGun = null;

let running = false;
let initialized = false;

let yaw = 0;
let pitch = -0.12;

const keys = {};
const enemies = [];
const bullets = [];
const pickups = [];

let health = 100;
let armor = 100;
let kills = 0;
let medkits = 2;

let currentWeapon = 0;
let lastShot = 0;
let reloading = false;

let verticalVelocity = 0;
let grounded = true;
let crouching = false;

let zoneRadius = 150;
let zoneTimer = 0;

let pointerLocked = false;

const weapons = [
    {
        name: "AR-01",
        damage: 30,
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
        fireRate: 70,
        mag: 40,
        ammo: 40,
        reserve: 200,
        spread: 0.035,
        pellets: 1
    },
    {
        name: "M12",
        damage: 13,
        fireRate: 650,
        mag: 6,
        ammo: 6,
        reserve: 48,
        spread: 0.11,
        pellets: 8
    }
];

/* ---------------------------------------------------------
   SAFE START
--------------------------------------------------------- */

function startGame() {

    const input = $("name");

    if (input && !input.value.trim()) {
        input.focus();
        return;
    }

    if (typeof THREE === "undefined") {
        alert(
            "Three.js load nahi hua.\n\n" +
            "index.html me Three.js CDN script check karo."
        );
        return;
    }

    if (initialized) {
        running = true;

        const start = $("start");
        const hud = $("hud");

        if (start) start.style.display = "none";
        if (hud) hud.style.display = "block";

        requestPointer();
        return;
    }

    const start = $("start");
    const hud = $("hud");

    if (start) start.style.display = "none";
    if (hud) hud.style.display = "block";

    try {

        initGame();

        initialized = true;
        running = true;

        clock.start();

        updateHUD();

        requestPointer();

        requestAnimationFrame(gameLoop);

    } catch (err) {

        console.error(err);

        alert(
            "GAME ERROR:\n" +
            err.message
        );

        if (start) start.style.display = "flex";
        if (hud) hud.style.display = "none";
    }
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */

function initGame() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x87a8ad);

    scene.fog =
        new THREE.Fog(
            0x87a8ad,
            120,
            650
        );

    camera =
        new THREE.PerspectiveCamera(
            65,
            window.innerWidth /
            window.innerHeight,
            0.1,
            1000
        );

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.5)
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.15;

    renderer.domElement.id =
        "gameCanvas";

    document.body.appendChild(
        renderer.domElement
    );

    clock =
        new THREE.Clock();

    createLighting();

    createWorld();

    createPlayer();

    createEnemies();

    createPickups();

    createSafeZone();

    createMobileControls();

    setupControls();

    window.addEventListener(
        "resize",
        resizeGame
    );
}

/* ---------------------------------------------------------
   LIGHTING
--------------------------------------------------------- */

function createLighting() {

    const hemi =
        new THREE.HemisphereLight(
            0xc8edff,
            0x26332c,
            2.4
        );

    scene.add(hemi);

    const sun =
        new THREE.DirectionalLight(
            0xffefd0,
            3.5
        );

    sun.position.set(
        -120,
        220,
        100
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -250;
    sun.shadow.camera.right = 250;
    sun.shadow.camera.top = 250;
    sun.shadow.camera.bottom = -250;

    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 600;

    scene.add(sun);
}

/* ---------------------------------------------------------
   WORLD
--------------------------------------------------------- */

function createWorld() {

    /*
       IMPORTANT:

       WORLD IS DIRECTLY ATTACHED TO SCENE.

       NEVER:
       player.add(world)
       camera.add(world)
       player.rotation changes world

       Therefore the map stays STATIC.
    */

    createOcean();
    createTerrain();
    createRoads();
    createCity();
    createIndustrialArea();
    createHouses();
    createTrees();
    createProps();
}

/* ---------------------------------------------------------
   OCEAN
--------------------------------------------------------- */

function createOcean() {

    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                1000,
                1000
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1d6470,
                roughness: 0.25,
                metalness: 0.2
            })
        );

    water.rotation.x =
        -Math.PI / 2;

    water.position.y = -3;

    scene.add(water);
}

/* ---------------------------------------------------------
   TERRAIN
--------------------------------------------------------- */

function terrainHeight(x, z) {

    const h1 =
        Math.sin(x * 0.018) * 3;

    const h2 =
        Math.cos(z * 0.021) * 3;

    const h3 =
        Math.sin(
            (x + z) * 0.012
        ) * 4;

    const h4 =
        Math.cos(
            Math.sqrt(
                x * x + z * z
            ) * 0.035
        ) * 2;

    return (
        4 +
        h1 +
        h2 +
        h3 +
        h4
    );
}

function createTerrain() {

    const size = 500;
    const segments = 100;

    const geometry =
        new THREE.PlaneGeometry(
            size,
            size,
            segments,
            segments
        );

    geometry.rotateX(-Math.PI / 2);

    const pos =
        geometry.attributes.position;

    for (
        let i = 0;
        i < pos.count;
        i++
    ) {

        const x = pos.getX(i);
        const z = pos.getZ(i);

        const edge =
            Math.max(
                Math.abs(x),
                Math.abs(z)
            );

        let y =
            terrainHeight(x, z);

        if (edge > 210) {

            const t =
                (edge - 210) / 40;

            y -= t * 8;
        }

        pos.setY(i, y);
    }

    geometry.computeVertexNormals();

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x4d6d42,
            roughness: 1
        });

    const terrain =
        new THREE.Mesh(
            geometry,
            material
        );

    terrain.receiveShadow = true;

    /*
       IMPORTANT:
       static world object
    */
    scene.add(terrain);
}

/* ---------------------------------------------------------
   ROADS
--------------------------------------------------------- */

function createRoads() {

    const roadMat =
        new THREE.MeshStandardMaterial({
            color: 0x242a2c,
            roughness: 0.9
        });

    const lines = [
        [0, 0, 430, 12],
        [0, 0, 12, 430],
        [-90, 70, 260, 10],
        [100, -65, 230, 10]
    ];

    for (const r of lines) {

        const [
            x,
            z,
            width,
            depth
        ] = r;

        const road =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    width,
                    0.3,
                    depth
                ),
                roadMat
            );

        road.position.set(
            x,
            7,
            z
        );

        road.receiveShadow = true;

        scene.add(road);

        for (
            let i = -width / 2 + 10;
            i < width / 2;
            i += 20
        ) {

            if (depth > width) {

                const line =
                    new THREE.Mesh(
                        new THREE.BoxGeometry(
                            0.6,
                            0.08,
                            7
                        ),
                        new THREE.MeshBasicMaterial({
                            color: 0xd7c75d
                        })
                    );

                line.position.set(
                    x,
                    7.2,
                    z + i
                );

                scene.add(line);

            } else {

                const line =
                    new THREE.Mesh(
                        new THREE.BoxGeometry(
                            7,
                            0.08,
                            0.6
                        ),
                        new THREE.MeshBasicMaterial({
                            color: 0xd7c75d
                        })
                    );

                line.position.set(
                    x + i,
                    7.2,
                    z
                );

                scene.add(line);
            }
        }
    }
}

/* ---------------------------------------------------------
   BUILDING
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
                roughness: 0.8
            })
        );

    body.position.y =
        height / 2 + 7;

    body.castShadow = true;
    body.receiveShadow = true;

    group.add(body);

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width + 1,
                0.8,
                depth + 1
            ),
            new THREE.MeshStandardMaterial({
                color: 0x303537
            })
        );

    roof.position.y =
        height + 7.4;

    roof.castShadow = true;

    group.add(roof);

    const windowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xbce8e9
        });

    const cols =
        Math.max(
            2,
            Math.floor(width / 6)
        );

    const rows =
        Math.max(
            2,
            Math.floor(height / 6)
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
                        2,
                        2.4,
                        0.08
                    ),
                    windowMaterial
                );

            win.position.set(
                -width / 2 +
                4 +
                col * 6,
                10 +
                row * 6,
                depth / 2 + 0.06
            );

            group.add(win);
        }
    }

    group.position.set(
        x,
        0,
        z
    );

    /*
       STATIC MAP OBJECT.
    */
    scene.add(group);
}

/* ---------------------------------------------------------
   CITY
--------------------------------------------------------- */

function createCity() {

    const buildings = [
        [-70, -60, 20, 34, 20],
        [-30, -60, 25, 48, 24],
        [20, -60, 22, 38, 20],
        [65, -60, 28, 55, 25],

        [-70, -15, 26, 52, 25],
        [-30, -15, 20, 30, 20],
        [25, -10, 30, 65, 28],
        [75, -15, 20, 42, 20],

        [-70, 35, 25, 40, 25],
        [-25, 35, 20, 50, 20],
        [30, 35, 25, 36, 24],
        [75, 35, 30, 58, 26]
    ];

    for (const b of buildings) {

        createBuilding(
            b[0],
            b[1],
            b[2],
            b[3],
            b[4],
            0x596267
        );
    }
}

/* ---------------------------------------------------------
   INDUSTRIAL
--------------------------------------------------------- */

function createIndustrialArea() {

    const positions = [
        [125, 80],
        [165, 80],
        [125, 125],
        [165, 125]
    ];

    for (const [x, z] of positions) {

        createBuilding(
            x,
            z,
            30,
            12,
            24,
            0x4b5352
        );
    }

    for (let i = 0; i < 12; i++) {

        const box =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    7,
                    4,
                    3
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        i % 2
                            ? 0x345c70
                            : 0x8b4537
                })
            );

        box.position.set(
            110 +
            Math.random() * 70,
            9,
            55 +
            Math.random() * 90
        );

        box.castShadow = true;

        scene.add(box);
    }
}

/* ---------------------------------------------------------
   HOUSES
--------------------------------------------------------- */

function createHouses() {

    for (let i = 0; i < 25; i++) {

        const x =
            -170 +
            Math.random() * 130;

        const z =
            70 +
            Math.random() * 110;

        createBuilding(
            x,
            z,
            12 + Math.random() * 6,
            8 + Math.random() * 5,
            12 + Math.random() * 6,
            0x796d5c
        );
    }
}

/* ---------------------------------------------------------
   TREES
--------------------------------------------------------- */

function createTrees() {

    for (let i = 0; i < 100; i++) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const radius =
            120 +
            Math.random() * 95;

        const x =
            Math.cos(angle) *
            radius;

        const z =
            Math.sin(angle) *
            radius;

        createTree(
            x,
            z,
            0.7 +
            Math.random() *
            0.7
        );
    }
}

function createTree(
    x,
    z,
    scale
) {

    const tree =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.6,
                0.9,
                6,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x5a3d27
            })
        );

    trunk.position.y = 9;

    tree.add(trunk);

    const crown =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                4.5,
                10,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x285235
            })
        );

    crown.position.y = 15;

    tree.add(crown);

    tree.position.set(
        x,
        0,
        z
    );

    tree.scale.setScalar(scale);

    tree.traverse(o => {

        if (o.isMesh)
            o.castShadow = true;

    });

    /*
       STATIC.
    */
    scene.add(tree);
}

/* ---------------------------------------------------------
   PROPS
--------------------------------------------------------- */

function createProps() {

    for (let i = 0; i < 20; i++) {

        const pole =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.12,
                    0.18,
                    8,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x272d2f
                })
            );

        pole.position.set(
            -180 +
            Math.random() * 360,
            11,
            -180 +
            Math.random() * 360
        );

        scene.add(pole);

        const lamp =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.4,
                    8,
                    8
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xffe6a0
                })
            );

        lamp.position.y = 15;

        pole.add(lamp);
    }
}

/* ---------------------------------------------------------
   PLAYER
--------------------------------------------------------- */

function createPlayer() {

    player =
        new THREE.Group();

    /*
       SMALLER CHARACTER.
    */

    const bodyMat =
        new THREE.MeshStandardMaterial({
            color: 0x26333a,
            roughness: 0.7
        });

    const skinMat =
        new THREE.MeshStandardMaterial({
            color: 0xd39a74,
            roughness: 0.8
        });

    const legs =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.1,
                3.4,
                1.1
            ),
            bodyMat
        );

    legs.position.y = 4.2;

    player.add(legs);

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.5,
                2.6,
                5,
                10
            ),
            bodyMat
        );

    body.position.y = 7.1;

    body.castShadow = true;

    player.add(body);

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.15,
                18,
                14
            ),
            skinMat
        );

    head.position.y = 10.2;

    player.add(head);

    playerGun =
        createGun();

    playerGun.position.set(
        1.1,
        7,
        -1.2
    );

    player.add(playerGun);

    player.position.set(
        0,
        0,
        145
    );

    /*
       PLAYER ONLY rotates.
       MAP NEVER rotates.
    */

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
            color: 0x15191c,
            metalness: 0.75,
            roughness: 0.25
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.55,
                0.55,
                2.6
            ),
            material
        );

    gun.add(body);

    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.08,
                0.08,
                1.8,
                8
            ),
            material
        );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.z = -2;

    gun.add(barrel);

    return gun;
}

/* ---------------------------------------------------------
   ENEMIES
--------------------------------------------------------- */

function createEnemies() {

    /*
       FAR SPAWN.
       No enemy directly near player.
    */

    const positions = [
        [-160, -150],
        [-90, -170],
        [0, -175],
        [100, -165],
        [170, -120],
        [175, 20],
        [150, 145],
        [40, 170],
        [-70, 165],
        [-165, 130],
        [-175, 20]
    ];

    positions.forEach(
        ([x, z], index) => {

            createEnemy(
                x,
                z,
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

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.35,
                2.5,
                5,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x672f31
            })
        );

    body.position.y = 7;

    enemy.add(body);

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.05,
                16,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xb98265
            })
        );

    head.position.y = 10;

    enemy.add(head);

    const gun =
        createGun();

    gun.scale.setScalar(0.8);

    gun.position.set(
        1,
        7,
        -1
    );

    enemy.add(gun);

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
            Math.random() * 1.3,

        attack:
            Math.random() * 2,

        seed:
            Math.random() * 100,

        index
    };

    enemy.traverse(
        obj => {

            if (obj.isMesh)
                obj.castShadow = true;

        }
    );

    scene.add(enemy);

    enemies.push(enemy);
}

/* ---------------------------------------------------------
   PICKUPS
--------------------------------------------------------- */

function createPickups() {

    const locations = [
        [-50, 30],
        [50, 30],
        [110, -20],
        [-120, -40],
        [150, 120],
        [-150, 100]
    ];

    locations.forEach(
        ([x, z], i) => {

            const type =
                i % 2 === 0
                    ? "ARMOR"
                    : "MEDKIT";

            const color =
                type === "ARMOR"
                    ? 0x32b9ff
                    : 0x48ff88;

            const item =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        2.2,
                        2.2,
                        2.2
                    ),
                    new THREE.MeshStandardMaterial({
                        color,
                        emissive: color,
                        emissiveIntensity: 0.25
                    })
                );

            item.position.set(
                x,
                9,
                z
            );

            item.userData.type =
                type;

            scene.add(item);

            pickups.push(item);
        }
    );
}

/* ---------------------------------------------------------
   SAFE ZONE
--------------------------------------------------------- */

let zoneMesh = null;

function createSafeZone() {

    zoneMesh =
        new THREE.Mesh(
            new THREE.RingGeometry(
                149,
                150,
                96
            ),
            new THREE.MeshBasicMaterial({
                color: 0x42ff98,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            })
        );

    zoneMesh.rotation.x =
        -Math.PI / 2;

    zoneMesh.position.y = 8;

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
                e.code === "KeyG"
            ) {
                useMedkit();
            }

            if (
                e.code === "Space" &&
                grounded
            ) {

                verticalVelocity = 10;

                grounded = false;
            }

            if (
                e.code === "KeyC" ||
                e.code === "ControlLeft"
            ) {

                crouching = true;
            }

        }
    );

    window.addEventListener(
        "keyup",
        e => {

            keys[e.code] = false;

            if (
                e.code === "KeyC" ||
                e.code === "ControlLeft"
            ) {

                crouching = false;
            }

        }
    );

    document.addEventListener(
        "mousemove",
        e => {

            if (!pointerLocked)
                return;

            yaw -=
                e.movementX *
                0.0025;

            pitch -=
                e.movementY *
                0.002;

            pitch =
                THREE.MathUtils.clamp(
                    pitch,
                    -0.65,
                    0.45
                );
        }
    );

    document.addEventListener(
        "mousedown",
        e => {

            if (
                e.button !== 0
            ) return;

            if (!pointerLocked) {

                requestPointer();

                return;
            }

            shoot();
        }
    );

    renderer.domElement.addEventListener(
        "click",
        requestPointer
    );
}

/* ---------------------------------------------------------
   POINTER
--------------------------------------------------------- */

function requestPointer() {

    if (!renderer)
        return;

    renderer.domElement
        .requestPointerLock?.();
}

document.addEventListener(
    "pointerlockchange",
    () => {

        pointerLocked =
            document.pointerLockElement ===
            renderer?.domElement;

    }
);

/* ---------------------------------------------------------
   PLAYER MOVEMENT
--------------------------------------------------------- */

function updatePlayer(dt) {

    if (!player)
        return;

    let forward = 0;
    let side = 0;

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

    const length =
        Math.hypot(
            forward,
            side
        );

    if (length > 0) {

        forward /= length;
        side /= length;

        const sprint =
            keys["ShiftLeft"] ||
            keys["ShiftRight"];

        const speed =
            crouching
                ? 4.5
                : sprint
                    ? 15
                    : 8;

        const sin =
            Math.sin(yaw);

        const cos =
            Math.cos(yaw);

        const moveX =
            side * cos +
            forward * sin;

        const moveZ =
            side * sin -
            forward * cos;

        player.position.x +=
            moveX *
            speed *
            dt;

        player.position.z +=
            moveZ *
            speed *
            dt;

        /*
           ONLY PLAYER rotates.
        */

        player.rotation.y =
            yaw;
    }

    /* Jump */

    if (!grounded) {

        verticalVelocity -=
            25 * dt;

        player.position.y +=
            verticalVelocity *
            dt;

        if (
            player.position.y <= 0
        ) {

            player.position.y = 0;

            verticalVelocity = 0;

            grounded = true;
        }
    }

    /*
       Map boundary.
       Player stays inside world.
    */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -205,
            205
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -205,
            205
        );
}

/* ---------------------------------------------------------
   THIRD PERSON CAMERA
--------------------------------------------------------- */

function updateCamera() {

    if (!player)
        return;

    /*
       Camera follows player.

       CAMERA DOES NOT CONTAIN MAP.
    */

    const target =
        new THREE.Vector3(
            player.position.x,
            player.position.y +
                (
                    crouching
                        ? 4.7
                        : 5.8
                ),
            player.position.z
        );

    const distance =
        crouching
            ? 6.5
            : 7.5;

    const height =
        crouching
            ? 1.8
            : 2.3;

    const offset =
        new THREE.Vector3(
            0,
            height,
            distance
        );

    offset.applyAxisAngle(
        new THREE.Vector3(1, 0, 0),
        pitch
    );

    offset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw
    );

    const desired =
        target
            .clone()
            .add(offset);

    camera.position.lerp(
        desired,
        0.14
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

    if (reloading)
        return;

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
   RAY SHOOTING
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
        enemy => {

            if (
                !enemy.userData.alive
            ) return;

            enemy.traverse(
                obj => {

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

            enemy = object;

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

function createMuzzleFlash() {

    if (!playerGun)
        return;

    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.25,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffd05a
            })
        );

    const position =
        new THREE.Vector3(
            0,
            0,
            -3
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

            if (flash.parent)
                flash.parent.remove(
                    flash
                );

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
        enemy.userData.health <= 0
    ) {

        enemy.userData.alive =
            false;

        enemy.visible = false;

        kills++;

        updateHUD();

        checkWin();
    }
}

/* ---------------------------------------------------------
   ENEMY AI
--------------------------------------------------------- */

function updateEnemies(dt) {

    if (!player)
        return;

    let living = 0;

    enemies.forEach(
        enemy => {

            if (
                !enemy.userData.alive
            ) return;

            living++;

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
               Enemy only chases when
               reasonably close.
            */

            if (
                distance < 110
            ) {

                const angle =
                    Math.atan2(
                        dx,
                        -dz
                    );

                enemy.rotation.y =
                    angle;

                if (
                    distance > 22
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

                enemy.userData.attack -=
                    dt;

                if (
                    distance < 32 &&
                    enemy.userData.attack <=
                        0
                ) {

                    enemy.userData.attack =
                        0.8 +
                        Math.random() *
                        0.8;

                    enemyShoot(
                        enemy
                    );
                }

            } else {

                const t =
                    performance.now() *
                    0.0002 +
                    enemy.userData.seed;

                enemy.position.x +=
                    Math.sin(t) *
                    dt;

                enemy.position.z +=
                    Math.cos(t) *
                    dt;
            }
        }
    );

    const alive =
        living + 1;

    updateAlive(
        alive
    );
}

function enemyShoot(
    enemy
) {

    if (
        Math.random() >
        0.35
    ) return;

    const damage =
        5 +
        Math.random() *
        8;

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
            damage * 0.6
        );

    armor -=
        armorDamage;

    health -=
        damage -
        armorDamage;

    armor =
        Math.max(
            0,
            armor
        );

    health =
        Math.max(
            0,
            health
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
   WEAPONS
--------------------------------------------------------- */

function switchWeapon(
    index
) {

    if (
        index < 0 ||
        index >= weapons.length
    ) return;

    currentWeapon =
        index;

    reloading = false;

    updateHUD();
}

function reload() {

    if (reloading)
        return;

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
                9 +
                Math.sin(
                    performance.now() *
                    0.003
                ) *
                0.4;

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

                item.visible =
                    false;

                updateHUD();
            }
        }
    );
}

/* ---------------------------------------------------------
   SAFE ZONE
--------------------------------------------------------- */

function updateZone(dt) {

    zoneTimer += dt;

    if (
        zoneTimer > 3
    ) {

        zoneTimer = 0;

        zoneRadius =
            Math.max(
                40,
                zoneRadius - 1
            );

        const scale =
            zoneRadius / 150;

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
        distance > zoneRadius
    ) {

        damagePlayer(
            3 * dt
        );
    }
}

/* ---------------------------------------------------------
   HUD
--------------------------------------------------------- */

function updateHUD() {

    const weapon =
        weapons[currentWeapon];

    if ($("health"))
        $("health").textContent =
            Math.ceil(health);

    if ($("armor"))
        $("armor").textContent =
            Math.ceil(armor);

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

    if ($("medkits"))
        $("medkits").textContent =
            medkits;

    if ($("zone"))
        $("zone").textContent =
            Math.round(
                zoneRadius
            ) + "m";
}

function updateAlive(
    count
) {

    if ($("alive"))
        $("alive").textContent =
            count;
}

/* ---------------------------------------------------------
   WIN
--------------------------------------------------------- */

function checkWin() {

    const remaining =
        enemies.filter(
            e =>
                e.userData.alive
        ).length;

    if (
        remaining <= 0
    ) {

        finishGame(
            true
        );
    }
}

/* ---------------------------------------------------------
   GAME OVER
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

    if (result)
        result.style.display =
            "flex";

    const title =
        $("resultTitle");

    const text =
        $("resultText");

    if (title) {

        title.textContent =
            won
                ? "BOOYAH!"
                : "ELIMINATED";
    }

    if (text) {

        text.textContent =
            won
                ? `WINNER • ${kills} ELIMINATIONS`
                : `ELIMINATED • ${kills} ELIMINATIONS`;
    }
}

/* ---------------------------------------------------------
   MOBILE CONTROLS
--------------------------------------------------------- */

function createMobileControls() {

    if (
        document.getElementById(
            "mobileControls"
        )
    ) return;

    const wrap =
        document.createElement(
            "div"
        );

    wrap.id =
        "mobileControls";

    wrap.innerHTML = `
        <div id="mobileStick">
            <button data-key="ArrowUp">▲</button>
            <div>
                <button data-key="ArrowLeft">◀</button>
                <button data-key="ArrowDown">▼</button>
                <button data-key="ArrowRight">▶</button>
            </div>
        </div>

        <div id="mobileActions">
            <button data-key="Space">JUMP</button>
            <button data-key="ShiftLeft">SPRINT</button>
            <button id="mobileFire">FIRE</button>
            <button id="mobileReload">R</button>
        </div>
    `;

    document.body.appendChild(
        wrap
    );

    const style =
        document.createElement(
            "style"
        );

    style.textContent = `
        #mobileControls{
            position:fixed;
            inset:0;
            pointer-events:none;
            z-index:9999;
            font-family:Arial,sans-serif;
        }

        #mobileStick{
            position:absolute;
            left:20px;
            bottom:25px;
            pointer-events:auto;
            text-align:center;
        }

        #mobileStick button,
        #mobileActions button{
            width:58px;
            height:58px;
            margin:4px;
            border:1px solid rgba(255,255,255,.25);
            border-radius:50%;
            background:rgba(10,15,18,.65);
            color:white;
            font-weight:800;
            backdrop-filter:blur(8px);
            touch-action:none;
        }

        #mobileActions{
            position:absolute;
            right:20px;
            bottom:25px;
            display:flex;
            flex-direction:column;
            align-items:center;
            pointer-events:auto;
        }

        #mobileFire{
            width:78px!important;
            height:78px!important;
            background:rgba(220,55,55,.75)!important;
        }

        @media (min-width:800px){
            #mobileControls{
                display:none;
            }
        }
    `;

    document.head.appendChild(
        style
    );

    wrap
        .querySelectorAll(
            "[data-key]"
        )
        .forEach(
            button => {

                const key =
                    button.dataset.key;

                const down = e => {

                    e.preventDefault();

                    keys[key] = true;
                };

                const up = e => {

                    e.preventDefault();

                    keys[key] = false;
                };

                button.addEventListener(
                    "pointerdown",
                    down
                );

                button.addEventListener(
                    "pointerup",
                    up
                );

                button.addEventListener(
                    "pointercancel",
                    up
                );

                button.addEventListener(
                    "pointerleave",
                    up
                );
            }
        );

    const fire =
        document.getElementById(
            "mobileFire"
        );

    if (fire) {

        fire.addEventListener(
            "pointerdown",
            e => {

                e.preventDefault();

                shoot();
            }
        );
    }

    const reloadButton =
        document.getElementById(
            "mobileReload"
        );

    if (reloadButton) {

        reloadButton.addEventListener(
            "pointerdown",
            e => {

                e.preventDefault();

                reload();
            }
        );
    }
}

/* ---------------------------------------------------------
   LOOP
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
            0.05
        );

    updatePlayer(dt);

    updateEnemies(dt);

    updatePickups(dt);

    updateZone(dt);

    updateCamera();

    renderer.render(
        scene,
        camera
    );
}

/* ---------------------------------------------------------
   RESIZE
--------------------------------------------------------- */

function resizeGame() {

    if (
        !camera ||
        !renderer
    ) return;

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
   BUTTONS
--------------------------------------------------------- */

function restartGame() {

    location.reload();
}

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

        const again =
            $("again");

        if (again) {

            again.addEventListener(
                "click",
                restartGame
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

    }
);
