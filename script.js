(() => {
"use strict";

/* =========================================================
   LAST//ALIVE
   DISTRICT 07 — BATTLE ROYALE
   ========================================================= */

let scene;
let camera;
let renderer;
let clock;

let player;
let playerCharacter;
let playerGun;

let zoneRing;
let zoneWall;

let running = false;
let firstPerson = false;
let crouching = false;
let grounded = true;

let yaw = 0;
let pitch = -0.08;
let verticalVelocity = 0;

let health = 100;
let armor = 65;

let zoneRadius = 115;

let weaponIndex = 0;
let lastShot = 0;
let fireHeld = false;
let reloading = false;
let cameraShake = 0;

const keys = {};
const bots = [];
const buildings = [];
const effects = [];

const raycaster = new THREE.Raycaster();

const $ = id => document.getElementById(id);


/* =========================================================
   WEAPONS
   ========================================================= */

const weapons = [
    {
        name: "ASSAULT RIFLE",
        mag: 30,
        ammo: 30,
        reserve: 120,
        damage: 30,
        rate: 105,
        pellets: 1,
        recoil: 0.018
    },

    {
        name: "SMG",
        mag: 40,
        ammo: 40,
        reserve: 160,
        damage: 18,
        rate: 62,
        pellets: 1,
        recoil: 0.012
    },

    {
        name: "SHOTGUN",
        mag: 6,
        ammo: 6,
        reserve: 42,
        damage: 17,
        rate: 620,
        pellets: 8,
        recoil: 0.045
    }
];


/* =========================================================
   TEXTURES
   ========================================================= */

const textureLoader = new THREE.TextureLoader();

let playerTexture = null;
let enemyTexture = null;

playerTexture = textureLoader.load(
    "./assets/player_character.png"
);

enemyTexture = textureLoader.load(
    "./assets/enemy_character.png"
);

playerTexture.colorSpace = THREE.SRGBColorSpace;
enemyTexture.colorSpace = THREE.SRGBColorSpace;


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    const name = $("name").value.trim();

    if (!name) {

        $("name").focus();

        $("name").placeholder =
            "ENTER YOUR NAME FIRST";

        return;
    }

    if (typeof THREE === "undefined") {

        alert(
            "Three.js did not load.\nRefresh the page once."
        );

        return;
    }

    $("start").style.display = "none";
    $("hud").style.display = "block";

    try {

        init();

        running = true;

        clock.start();

        updateHUD();

        setTimeout(() => {

            renderer.domElement.requestPointerLock?.();

        }, 250);

        requestAnimationFrame(loop);

    } catch (error) {

        console.error(error);

        running = false;

        $("start").style.display = "flex";
        $("hud").style.display = "none";

        alert(
            "GAME ERROR:\n\n" +
            error.message
        );
    }
}


/* =========================================================
   BUTTONS
   ========================================================= */

$("enter").addEventListener(
    "click",
    startGame
);

$("name").addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            startGame();

        }

    }
);

$("again").addEventListener(
    "click",
    () => {

        location.reload();

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

function init() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x07121a);

    scene.fog =
        new THREE.Fog(
            0x07121a,
            70,
            320
        );


    /* CAMERA */

    camera =
        new THREE.PerspectiveCamera(
            70,
            innerWidth / innerHeight,
            0.05,
            700
        );


    /* RENDERER */

    renderer =
        new THREE.WebGLRenderer({

            antialias: true,

            powerPreference:
                "high-performance"

        });

    renderer.setPixelRatio(
        Math.min(devicePixelRatio, 1.8)
    );

    renderer.setSize(
        innerWidth,
        innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.2;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    document.body.appendChild(
        renderer.domElement
    );


    clock = new THREE.Clock();


    /* LIGHTING */

    const skyLight =
        new THREE.HemisphereLight(
            0x9bc7ff,
            0x10151b,
            1.25
        );

    scene.add(skyLight);


    const sun =
        new THREE.DirectionalLight(
            0xffe8c7,
            3.2
        );

    sun.position.set(
        -90,
        150,
        70
    );

    sun.castShadow = true;

    sun.shadow.mapSize.set(
        2048,
        2048
    );

    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;

    sun.shadow.bias = -0.00025;

    scene.add(sun);


    const blueLight =
        new THREE.DirectionalLight(
            0x66b7ff,
            1.2
        );

    blueLight.position.set(
        120,
        50,
        -110
    );

    scene.add(blueLight);


    /* WORLD */

    createSky();

    createGround();

    createRoads();

    createCity();

    createProps();

    createTrees();


    /* PLAYER */

    player =
        new THREE.Group();

    player.position.set(
        0,
        0,
        58
    );

    scene.add(player);


    createPlayerCharacter();

    createPlayerGun();


    /* ENEMIES */

    for (
        let i = 0;
        i < 13;
        i++
    ) {

        spawnBot(i);

    }


    /* ZONE */

    createZone();

}


/* =========================================================
   SKY
   ========================================================= */

function createSky() {

    const sky =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                500,
                32,
                16
            ),

            new THREE.MeshBasicMaterial({

                color: 0x0a1822,

                side:
                    THREE.BackSide

            })

        );

    scene.add(sky);


    /* MOON */

    const moon =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                10,
                24,
                16
            ),

            new THREE.MeshBasicMaterial({

                color: 0xcde7ff

            })

        );

    moon.position.set(
        -150,
        135,
        -210
    );

    scene.add(moon);


    /* STARS */

    for (
        let i = 0;
        i < 180;
        i++
    ) {

        const star =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.12 +
                    Math.random() * 0.18,
                    5,
                    5
                ),

                new THREE.MeshBasicMaterial({

                    color: 0xd8f0ff

                })

            );

        star.position.set(

            (Math.random() - 0.5) *
                460,

            80 +
            Math.random() *
                220,

            (Math.random() - 0.5) *
                460

        );

        scene.add(star);
    }

}


/* =========================================================
   GROUND
   ========================================================= */

function createGround() {

    const ground =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                420,
                420
            ),

            new THREE.MeshStandardMaterial({

                color: 0x182329,

                roughness: 0.92

            })

        );

    ground.rotation.x =
        -Math.PI / 2;

    ground.receiveShadow = true;

    scene.add(ground);


    const inner =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                230,
                230
            ),

            new THREE.MeshStandardMaterial({

                color: 0x202b2f,

                roughness: 0.9

            })

        );

    inner.rotation.x =
        -Math.PI / 2;

    inner.position.y = 0.012;

    inner.receiveShadow = true;

    scene.add(inner);

}


/* =========================================================
   ROADS
   ========================================================= */

function createRoads() {

    road(
        0,
        0,
        420,
        20
    );

    road(
        0,
        0,
        20,
        420
    );

    road(
        95,
        -70,
        130,
        13
    );

    road(
        -95,
        65,
        130,
        13
    );

    road(
        -65,
        -95,
        13,
        125
    );

}


function road(
    x,
    z,
    width,
    depth
) {

    const asphalt =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                0.08,
                depth
            ),

            new THREE.MeshStandardMaterial({

                color: 0x171b1e,

                roughness: 0.98

            })

        );

    asphalt.position.set(
        x,
        0.04,
        z
    );

    asphalt.receiveShadow = true;

    scene.add(asphalt);


    const curbMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x4a5152,

            roughness: 0.8

        });


    if (width > depth) {

        for (
            const side of [-1, 1]
        ) {

            const curb =
                new THREE.Mesh(

                    new THREE.BoxGeometry(
                        width,
                        0.28,
                        0.45
                    ),

                    curbMaterial

                );

            curb.position.set(
                x,
                0.14,
                z +
                side *
                (depth / 2 + 0.25)
            );

            scene.add(curb);

        }


        for (
            let i = -width / 2 + 9;
            i < width / 2;
            i += 18
        ) {

            const stripe =
                new THREE.Mesh(

                    new THREE.BoxGeometry(
                        8,
                        0.035,
                        0.18
                    ),

                    new THREE.MeshBasicMaterial({

                        color: 0xf2df8a

                    })

                );

            stripe.position.set(
                x + i,
                0.09,
                z
            );

            scene.add(stripe);

        }

    } else {

        for (
            const side of [-1, 1]
        ) {

            const curb =
                new THREE.Mesh(

                    new THREE.BoxGeometry(
                        0.45,
                        0.28,
                        depth
                    ),

                    curbMaterial

                );

            curb.position.set(
                x +
                side *
                (width / 2 + 0.25),

                0.14,

                z
            );

            scene.add(curb);

        }


        for (
            let i = -depth / 2 + 9;
            i < depth / 2;
            i += 18
        ) {

            const stripe =
                new THREE.Mesh(

                    new THREE.BoxGeometry(
                        0.18,
                        0.035,
                        8
                    ),

                    new THREE.MeshBasicMaterial({

                        color: 0xf2df8a

                    })

                );

            stripe.position.set(
                x,
                0.09,
                z + i
            );

            scene.add(stripe);

        }

    }

}


/* =========================================================
   CITY
   ========================================================= */

function createCity() {

    const layout = [

        [-72,-72,28,23,24],
        [-30,-72,24,29,34],
        [30,-72,31,25,42],
        [76,-68,25,34,30],

        [-78,-25,24,32,37],
        [-38,-25,31,21,23],
        [36,-25,28,31,38],
        [78,-20,30,23,26],

        [-78,30,31,24,29],
        [-35,35,22,30,44],
        [35,35,34,25,28],
        [80,36,26,31,39],

        [-72,80,30,25,31],
        [-26,80,25,29,40],
        [35,80,32,23,33],
        [79,78,26,29,45]

    ];


    layout.forEach(
        buildingData => {

            building(
                ...buildingData
            );

        }
    );

}


/* =========================================================
   BUILDINGS
   ========================================================= */

function building(
    x,
    z,
    width,
    depth,
    height
) {

    const group =
        new THREE.Group();


    const colors = [

        0x344047,
        0x3e474c,
        0x2d383d,
        0x485057,
        0x29343a

    ];


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            new THREE.MeshStandardMaterial({

                color:
                    colors[
                        Math.floor(
                            Math.random() *
                            colors.length
                        )
                    ],

                roughness: 0.72,

                metalness: 0.08

            })

        );


    body.position.y =
        height / 2;

    body.castShadow = true;

    body.receiveShadow = true;

    group.add(body);


    /* ROOF */

    const roof =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width + 0.9,
                0.65,
                depth + 0.9
            ),

            new THREE.MeshStandardMaterial({

                color: 0x11181d,

                roughness: 0.55,

                metalness: 0.25

            })

        );

    roof.position.y =
        height + 0.32;

    roof.castShadow = true;

    group.add(roof);


    /* NEON TRIM */

    const trim =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width + 0.05,
                0.14,
                depth + 0.05
            ),

            new THREE.MeshStandardMaterial({

                color: 0x61d9c0,

                emissive: 0x143d37,

                emissiveIntensity: 0.55

            })

        );

    trim.position.y =
        height * 0.55;

    group.add(trim);


    /* WINDOWS */

    const glassMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x8bd8e9,

            emissive: 0x24586a,

            emissiveIntensity: 0.75,

            roughness: 0.25,

            metalness: 0.3

        });


    for (
        let y = 3;
        y < height - 1;
        y += 4
    ) {

        for (
            let xx = -width / 2 + 2;
            xx < width / 2 - 1;
            xx += 4
        ) {

            if (
                Math.random() < 0.12
            ) continue;


            const front =
                new THREE.Mesh(

                    new THREE.BoxGeometry(
                        1.45,
                        0.85,
                        0.055
                    ),

                    glassMaterial

                );

            front.position.set(
                xx,
                y,
                depth / 2 + 0.04
            );

            group.add(front);


            const back =
                front.clone();

            back.position.z =
                -depth / 2 - 0.04;

            group.add(back);

        }

    }


    /* DOOR */

    const door =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.3,
                3,
                0.12
            ),

            new THREE.MeshStandardMaterial({

                color: 0x11171b,

                metalness: 0.4,

                roughness: 0.35

            })

        );

    door.position.set(
        0,
        1.5,
        depth / 2 + 0.08
    );

    group.add(door);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);


    buildings.push({

        x,
        z,
        width,
        depth,
        height

    });

}


/* =========================================================
   PROPS
   ========================================================= */

function createProps() {

    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const x =
            (Math.random() - 0.5) *
            340;

        const z =
            (Math.random() - 0.5) *
            340;


        if (
            Math.abs(x) < 110 &&
            Math.abs(z) < 110
        ) {

            continue;

        }


        const type =
            i % 3;


        if (type === 0) {

            createCrate(
                x,
                z
            );

        } else if (
            type === 1
        ) {

            createStreetLight(
                x,
                z
            );

        } else {

            createVehicle(
                x,
                z
            );

        }

    }

}


/* =========================================================
   CRATE
   ========================================================= */

function createCrate(
    x,
    z
) {

    const group =
        new THREE.Group();


    const box =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.5,
                2,
                2.5
            ),

            new THREE.MeshStandardMaterial({

                color: 0x6a4a2c,

                roughness: 0.82

            })

        );


    box.position.y = 1;

    box.castShadow = true;

    group.add(box);


    for (
        const side of [-1, 1]
    ) {

        const strap =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.18,
                    2.05,
                    2.55
                ),

                new THREE.MeshStandardMaterial({

                    color: 0x22262a,

                    metalness: 0.5

                })

            );

        strap.position.set(
            side * 0.58,
            1,
            0
        );

        group.add(strap);

    }


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

}


/* =========================================================
   STREET LIGHT
   ========================================================= */

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
                6,
                8
            ),

            new THREE.MeshStandardMaterial({

                color: 0x20272b,

                metalness: 0.75,

                roughness: 0.28

            })

        );


    pole.position.y = 3;

    pole.castShadow = true;

    group.add(pole);


    const lamp =
        new THREE.PointLight(
            0x9cecff,
            7,
            18,
            2
        );


    lamp.position.y = 6;

    group.add(lamp);


    const glow =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.22,
                12,
                8
            ),

            new THREE.MeshBasicMaterial({

                color: 0xcfffff

            })

        );


    glow.position.y = 6;

    group.add(glow);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

}


/* =========================================================
   VEHICLES
   ========================================================= */

function createVehicle(
    x,
    z
) {

    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                4.8,
                1.25,
                2.1
            ),

            new THREE.MeshStandardMaterial({

                color:
                    [
                        0x26343a,
                        0x5a3130,
                        0x334e4c
                    ][
                        Math.floor(
                            Math.random() * 3
                        )
                    ],

                metalness: 0.45,

                roughness: 0.35

            })

        );


    body.position.y = 1;

    body.castShadow = true;

    group.add(body);


    const cabin =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.4,
                1,
                1.8
            ),

            new THREE.MeshStandardMaterial({

                color: 0x17232a,

                metalness: 0.7,

                roughness: 0.2

            })

        );


    cabin.position.set(
        -0.15,
        1.95,
        0
    );

    group.add(cabin);


    for (
        const sx of [-1, 1]
    ) {

        for (
            const sz of [-1, 1]
        ) {

            const wheel =
                new THREE.Mesh(

                    new THREE.CylinderGeometry(
                        0.48,
                        0.48,
                        0.32,
                        12
                    ),

                    new THREE.MeshStandardMaterial({

                        color: 0x090b0c,

                        roughness: 1

                    })

                );


            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                sx * 1.55,
                0.55,
                sz * 0.98
            );

            group.add(wheel);

        }

    }


    group.position.set(
        x,
        0,
        z
    );

    group.rotation.y =
        Math.random() *
        Math.PI *
        2;

    scene.add(group);

}


/* =========================================================
   TREES
   ========================================================= */

function createTrees() {

    for (
        let i = 0;
        i < 75;
        i++
    ) {

        const x =
            (Math.random() - 0.5) *
            380;

        const z =
            (Math.random() - 0.5) *
            380;


        if (
            Math.abs(x) < 120 &&
            Math.abs(z) < 120
        ) {

            continue;

        }


        createTree(
            x,
            z,
            0.8 +
            Math.random() * 0.65
        );

    }

}


function createTree(
    x,
    z,
    scale
) {

    const group =
        new THREE.Group();


    const trunk =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.35 * scale,
                0.55 * scale,
                4.5 * scale,
                8
            ),

            new THREE.MeshStandardMaterial({

                color: 0x4b3528,

                roughness: 1

            })

        );


    trunk.position.y =
        2.25 * scale;

    trunk.castShadow = true;

    group.add(trunk);


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const crown =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    (2.4 - i * 0.3) *
                    scale,
                    12,
                    8
                ),

                new THREE.MeshStandardMaterial({

                    color:
                        [
                            0x163b2a,
                            0x1c4b32,
                            0x245b3a
                        ][i],

                    roughness: 0.95

                })

            );


        crown.position.set(

            (i - 1) *
                0.5 *
                scale,

            5 *
                scale +
                i *
                0.8 *
                scale,

            0

        );


        crown.castShadow = true;

        group.add(crown);

    }


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

}


/* =========================================================
   PLAYER CHARACTER IMAGE
   ========================================================= */

function createPlayerCharacter() {

    playerCharacter =
        new THREE.Group();


    const material =
        new THREE.SpriteMaterial({

            map: playerTexture,

            transparent: true,

            alphaTest: 0.05,

            depthWrite: true

        });


    const sprite =
        new THREE.Sprite(
            material
        );


    /*
       Image ratio approximately 367x708.
       We keep the character tall.
    */

    sprite.scale.set(
        3.4,
        6.55,
        1
    );


    sprite.position.y =
        3.25;


    playerCharacter.add(
        sprite
    );


    player.add(
        playerCharacter
    );

}


/* =========================================================
   PLAYER GUN
   ========================================================= */

function createPlayerGun() {

    playerGun =
        new THREE.Group();


    const metal =
        new THREE.MeshStandardMaterial({

            color: 0x15191b,

            metalness: 0.9,

            roughness: 0.2

        });


    const dark =
        new THREE.MeshStandardMaterial({

            color: 0x080a0b,

            metalness: 0.55,

            roughness: 0.28

        });


    const green =
        new THREE.MeshStandardMaterial({

            color: 0x1dd6b4,

            emissive: 0x063e35,

            emissiveIntensity: 1.2,

            metalness: 0.45

        });


    const receiver =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.28,
                0.28,
                1.2
            ),

            metal

        );


    receiver.rotation.x =
        Math.PI / 2;

    playerGun.add(receiver);


    const upper =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.2,
                0.18,
                0.95
            ),

            dark

        );


    upper.rotation.x =
        Math.PI / 2;

    upper.position.y = 0.1;

    playerGun.add(upper);


    const barrel =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.055,
                0.055,
                0.65,
                12
            ),

            metal

        );


    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.z =
        -0.85;

    playerGun.add(barrel);


    const stock =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.25,
                0.28,
                0.55
            ),

            dark

        );


    stock.rotation.x =
        Math.PI / 2;

    stock.position.z =
        0.65;

    playerGun.add(stock);


    const magazine =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.16,
                0.4,
                0.3
            ),

            dark

        );


    magazine.position.set(
        0,
        -0.25,
        0.05
    );

    magazine.rotation.x =
        -0.18;

    playerGun.add(magazine);


    const sight =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.08,
                0.1,
                0.22
            ),

            green

        );


    sight.position.set(
        0,
        0.24,
        -0.15
    );

    playerGun.add(sight);


    const muzzle =
        new THREE.PointLight(
            0xffb14d,
            0,
            8,
            2
        );


    muzzle.position.set(
        0,
        0,
        -1.2
    );


    playerGun.add(muzzle);


    playerGun.userData.muzzle =
        muzzle;


    playerGun.position.set(
        0.8,
        1.7,
        -0.75
    );


    player.add(
        playerGun
    );

}


/* =========================================================
   ENEMY CHARACTER
   ========================================================= */

function createEnemyCharacter() {

    const group =
        new THREE.Group();


    const material =
        new THREE.SpriteMaterial({

            map: enemyTexture,

            transparent: true,

            alphaTest: 0.05,

            depthWrite: true

        });


    const sprite =
        new THREE.Sprite(
            material
        );


    /*
       Enemy image is roughly 444x444.
       Scale it as a tall character.
    */

    sprite.scale.set(
        4.6,
        4.6,
        1
    );


    sprite.position.y =
        2.3;


    group.add(
        sprite
    );


    return group;

}


/* =========================================================
   ENEMY GUN
   ========================================================= */

function createEnemyGun(
    bot
) {

    const gun =
        new THREE.Group();


    const material =
        new THREE.MeshStandardMaterial({

            color: 0x101315,

            metalness: 0.8,

            roughness: 0.25

        });


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.18,
                0.18,
                0.85
            ),

            material

        );


    body.rotation.x =
        Math.PI / 2;

    gun.add(body);


    const barrel =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.045,
                0.045,
                0.4,
                8
            ),

            material

        );


    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.z =
        -0.58;

    gun.add(barrel);


    gun.position.set(
        0.6,
        1.6,
        -0.4
    );


    bot.add(gun);

}


/* =========================================================
   SPAWN ENEMY
   ========================================================= */

function spawnBot(
    index
) {

    const bot =
        createEnemyCharacter();


    createEnemyGun(bot);


    let x;
    let z;


    do {

        x =
            (Math.random() - 0.5) *
            190;

        z =
            (Math.random() - 0.5) *
            190;

    } while (
        Math.hypot(x, z) < 42
    );


    bot.position.set(
        x,
        0,
        z
    );


    scene.add(bot);


    bots.push({

        mesh: bot,

        health: 100,

        alive: true,

        speed:
            1.8 +
            Math.random() *
            1.5,

        fire:
            700 +
            Math.random() *
            1800,

        strafe:
            Math.random() < 0.5
                ? -1
                : 1,

        phase:
            Math.random() *
            Math.PI *
            2,

        index

    });


    /* ENEMY MARKER */

    const marker =
        new THREE.Mesh(

            new THREE.RingGeometry(
                0.55,
                0.7,
                24
            ),

            new THREE.MeshBasicMaterial({

                color: 0xff4b5c,

                transparent: true,

                opacity: 0.45,

                side:
                    THREE.DoubleSide

            })

        );


    marker.rotation.x =
        -Math.PI / 2;

    marker.position.y =
        0.04;


    bot.add(marker);

}


/* =========================================================
   ZONE
   ========================================================= */

function createZone() {

    zoneRing =
        new THREE.Mesh(

            new THREE.RingGeometry(
                zoneRadius - 1.5,
                zoneRadius,
                128
            ),

            new THREE.MeshBasicMaterial({

                color: 0x39ffbd,

                side:
                    THREE.DoubleSide,

                transparent: true,

                opacity: 0.9

            })

        );


    zoneRing.rotation.x =
        -Math.PI / 2;

    zoneRing.position.y =
        0.08;

    scene.add(zoneRing);


    zoneWall =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                zoneRadius,
                zoneRadius,
                5,
                96,
                1,
                true
            ),

            new THREE.MeshBasicMaterial({

                color: 0x26ffd0,

                transparent: true,

                opacity: 0.045,

                side:
                    THREE.DoubleSide,

                depthWrite: false

            })

        );


    zoneWall.position.y =
        2.5;


    scene.add(zoneWall);

}


/* =========================================================
   SHOOT
   ========================================================= */

function shoot() {

    if (
        !running ||
        reloading
    ) return;


    const weapon =
        weapons[weaponIndex];


    const now =
        performance.now();


    if (
        now - lastShot <
        weapon.rate
    ) return;


    if (
        weapon.ammo <= 0
    ) {

        reload();

        return;

    }


    lastShot = now;

    weapon.ammo--;


    cameraShake =
        Math.min(
            0.11,
            cameraShake +
            weapon.recoil * 2.2
        );


    /* MUZZLE FLASH */

    if (
        playerGun?.userData?.muzzle
    ) {

        const muzzle =
            playerGun.userData.muzzle;

        muzzle.intensity = 12;

        setTimeout(
            () => {

                muzzle.intensity = 0;

            },
            45
        );

    }


    const origin =
        camera.getWorldPosition(
            new THREE.Vector3()
        );


    const direction =
        camera.getWorldDirection(
            new THREE.Vector3()
        );


    for (
        let pellet = 0;
        pellet < weapon.pellets;
        pellet++
    ) {

        const dir =
            direction.clone();


        if (
            weapon.pellets > 1
        ) {

            dir.x +=
                (Math.random() - 0.5) *
                0.095;

            dir.y +=
                (Math.random() - 0.5) *
                0.095;

            dir.z +=
                (Math.random() - 0.5) *
                0.095;

            dir.normalize();

        }


        raycaster.set(
            origin,
            dir
        );


        const targets =
            bots
                .filter(
                    bot =>
                        bot.alive
                )
                .map(
                    bot =>
                        bot.mesh
                );


        const hits =
            raycaster.intersectObjects(
                targets,
                true
            );


        const end =
            origin.clone().add(
                dir.clone()
                    .multiplyScalar(120)
            );


        if (
            hits.length
        ) {

            end.copy(
                hits[0].point
            );


            let root =
                hits[0].object;


            while (
                root.parent &&
                !bots.some(
                    bot =>
                        bot.mesh === root
                )
            ) {

                root =
                    root.parent;

            }


            const bot =
                bots.find(
                    b =>
                        b.mesh === root
                );


            if (bot) {

                bot.health -=
                    weapon.damage;


                hitSpark(
                    hits[0].point
                );


                if (
                    bot.health <= 0
                ) {

                    bot.alive = false;


                    deathEffect(
                        bot.mesh.position
                            .clone()
                            .add(
                                new THREE.Vector3(
                                    0,
                                    1.5,
                                    0
                                )
                            )
                    );


                    scene.remove(
                        bot.mesh
                    );

                }

            }

        }


        tracer(
            origin,
            end
        );

    }


    updateHUD();

}


/* =========================================================
   BULLET TRACER
   ========================================================= */

function tracer(
    start,
    end
) {

    const length =
        start.distanceTo(end);


    const beam =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.018,
                0.018,
                length
            ),

            new THREE.MeshBasicMaterial({

                color: 0xffd27a,

                transparent: true,

                opacity: 0.9

            })

        );


    beam.position.copy(
        start
    ).lerp(
        end,
        0.5
    );


    beam.lookAt(end);


    scene.add(
        beam
    );


    effects.push({

        obj: beam,

        life: 0.055

    });

}


/* =========================================================
   HIT SPARK
   ========================================================= */

function hitSpark(
    position
) {

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const spark =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.035,
                    5,
                    4
                ),

                new THREE.MeshBasicMaterial({

                    color: 0xffdf7a

                })

            );


        spark.position.copy(
            position
        );


        scene.add(
            spark
        );


        effects.push({

            obj: spark,

            life: 0.22,

            velocity:
                new THREE.Vector3(

                    (Math.random() - 0.5) *
                        4,

                    Math.random() * 3,

                    (Math.random() - 0.5) *
                        4

                )

        });

    }

}


/* =========================================================
   DEATH EFFECT
   ========================================================= */

function deathEffect(
    position
) {

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        const particle =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.06,
                    0.06,
                    0.06
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        i % 2
                            ? 0xff4354
                            : 0xffb45b

                })

            );


        particle.position.copy(
            position
        );


        scene.add(
            particle
        );


        effects.push({

            obj: particle,

            life:
                0.65 +
                Math.random() *
                0.45,

            velocity:
                new THREE.Vector3(

                    (Math.random() - 0.5) *
                        7,

                    Math.random() *
                        7,

                    (Math.random() - 0.5) *
                        7

                )

        });

    }

}


/* =========================================================
   EFFECT UPDATE
   ========================================================= */

function updateEffects(
    delta
) {

    for (
        let i =
            effects.length - 1;
        i >= 0;
        i--
    ) {

        const effect =
            effects[i];


        effect.life -=
            delta;


        if (
            effect.velocity
        ) {

            effect.velocity.y -=
                12 * delta;


            effect.obj.position
                .addScaledVector(
                    effect.velocity,
                    delta
                );


            effect.obj.rotation.x +=
                delta * 5;

            effect.obj.rotation.z +=
                delta * 4;

        }


        if (
            effect.obj.material
        ) {

            effect.obj.material.opacity =
                Math.max(
                    0,
                    effect.life * 2
                );

        }


        if (
            effect.life <= 0
        ) {

            scene.remove(
                effect.obj
            );


            effect.obj.geometry?.dispose();

            effect.obj.material?.dispose();


            effects.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   RELOAD
   ========================================================= */

function reload() {

    if (reloading)
        return;


    const weapon =
        weapons[weaponIndex];


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

            const amount =
                Math.min(

                    weapon.mag -
                    weapon.ammo,

                    weapon.reserve

                );


            weapon.ammo +=
                amount;


            weapon.reserve -=
                amount;


            reloading = false;


            updateHUD();

        },
        850
    );

}


/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function updatePlayer(
    delta
) {

    const forward =
        new THREE.Vector3(
            Math.sin(yaw),
            0,
            Math.cos(yaw)
        );


    const right =
        new THREE.Vector3(
            Math.cos(yaw),
            0,
            -Math.sin(yaw)
        );


    const movement =
        new THREE.Vector3();


    if (
        keys.KeyW
    )
        movement.add(
            forward
        );


    if (
        keys.KeyS
    )
        movement.sub(
            forward
        );


    if (
        keys.KeyD
    )
        movement.add(
            right
        );


    if (
        keys.KeyA
    )
        movement.sub(
            right
        );


    if (
        movement.lengthSq() > 0
    )
        movement.normalize();


    let speed = 7;


    if (
        keys.ShiftLeft ||
        keys.ShiftRight
    ) {

        speed = 12;

    }


    if (
        crouching
    ) {

        speed = 3.4;

    }


    player.position.addScaledVector(
        movement,
        speed * delta
    );


    /* JUMP PHYSICS */

    verticalVelocity -=
        20 * delta;


    player.position.y +=
        verticalVelocity * delta;


    if (
        player.position.y <= 0
    ) {

        player.position.y = 0;

        verticalVelocity = 0;

        grounded = true;

    }


    /* MAP LIMIT */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -190,
            190
        );


    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -190,
            190
        );


    player.rotation.y =
        yaw;


    /* PLAYER SPRITE SCALE */

    if (
        playerCharacter
    ) {

        playerCharacter.scale.y =
            crouching
                ? 0.82
                : 1;

    }

}


/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera() {

    camera.rotation.order =
        "YXZ";


    if (
        firstPerson
    ) {

        camera.position.set(

            player.position.x,

            player.position.y +
            (
                crouching
                    ? 1.3
                    : 1.72
            ),

            player.position.z

        );


        camera.rotation.y =
            yaw;


        camera.rotation.x =
            pitch;


    } else {

        const target =
            new THREE.Vector3(

                player.position.x,

                player.position.y +
                (
                    crouching
                        ? 1.15
                        : 1.55
                ),

                player.position.z

            );


        const desired =
            new THREE.Vector3(

                target.x -
                    Math.sin(yaw) *
                    7,

                target.y +
                    2.7,

                target.z -
                    Math.cos(yaw) *
                    7

            );


        camera.position.lerp(
            desired,
            0.18
        );


        camera.lookAt(
            target
        );

    }


    /* CAMERA SHAKE */

    if (
        cameraShake > 0
    ) {

        camera.position.x +=
            (Math.random() - 0.5) *
            cameraShake;


        camera.position.y +=
            (Math.random() - 0.5) *
            cameraShake;


        cameraShake *= 0.78;

    }

}


/* =========================================================
   BOT AI
   ========================================================= */

function updateBots(
    delta
) {

    const alive =
        bots.filter(
            bot =>
                bot.alive
        );


    alive.forEach(
        bot => {

            const toPlayer =
                player.position
                    .clone()
                    .sub(
                        bot.mesh.position
                    );


            const distance =
                toPlayer.length();


            bot.phase +=
                delta * 2;


            if (
                distance < 90
            ) {

                const direction =
                    toPlayer.clone();


                direction.y = 0;


                if (
                    distance > 11
                ) {

                    direction.normalize();


                    const side =
                        new THREE.Vector3(
                            -direction.z,
                            0,
                            direction.x
                        );


                    side.multiplyScalar(
                        Math.sin(
                            bot.phase
                        ) * 0.35
                    );


                    direction
                        .add(side)
                        .normalize();


                    bot.mesh
                        .position
                        .addScaledVector(
                            direction,
                            bot.speed *
                            delta
                        );

                } else {

                    const side =
                        new THREE.Vector3(
                            -direction.z,
                            0,
                            direction.x
                        ).normalize();


                    bot.mesh
                        .position
                        .addScaledVector(

                            side,

                            bot.speed *
                            0.35 *
                            bot.strafe *
                            delta

                        );

                }


                bot.mesh.lookAt(

                    player.position.x,

                    bot.mesh.position.y,

                    player.position.z

                );


                bot.fire -=
                    delta * 1000;


                if (
                    distance < 48 &&
                    bot.fire <= 0
                ) {

                    bot.fire =
                        900 +
                        Math.random() *
                        1500;


                    if (
                        Math.random() < 0.5
                    ) {

                        damagePlayer(
                            5 +
                            Math.random() *
                            8
                        );

                    }

                }

            }

        }
    );


    $("alive").textContent =
        alive.length + 1;

}


/* =========================================================
   PLAYER DAMAGE
   ========================================================= */

function damagePlayer(
    amount
) {

    if (!running)
        return;


    if (
        armor > 0
    ) {

        const absorbed =
            Math.min(
                armor,
                amount * 0.68
            );


        armor -=
            absorbed;


        amount -=
            absorbed;

    }


    health -=
        amount;


    $("damage").style.opacity =
        0.65;


    setTimeout(
        () => {

            $("damage").style.opacity =
                0;

        },
        100
    );


    cameraShake =
        Math.min(
            0.15,
            cameraShake + 0.04
        );


    if (
        health <= 0
    ) {

        finish(false);

    }


    updateHUD();

}


/* =========================================================
   ZONE
   ========================================================= */

function updateZone(
    delta
) {

    zoneRadius =
        Math.max(
            30,
            zoneRadius -
            delta * 0.48
        );


    zoneRing.geometry.dispose();


    zoneRing.geometry =
        new THREE.RingGeometry(

            zoneRadius - 1.5,

            zoneRadius,

            128

        );


    const zoneScale =
        zoneRadius / 115;


    zoneWall.scale.set(
        zoneScale,
        1,
        zoneScale
    );


    $("zone").textContent =
        "ZONE " +
        Math.round(
            zoneScale * 100
        ) +
        "%";


    const distance =
        Math.hypot(
            player.position.x,
            player.position.z
        );


    if (
        distance > zoneRadius
    ) {

        damagePlayer(
            delta * 3.8
        );

    }

}


/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

    const weapon =
        weapons[weaponIndex];


    $("hpText").textContent =
        Math.max(
            0,
            Math.round(health)
        );


    $("armorText").textContent =
        Math.max(
            0,
            Math.round(armor)
        );


    $("hp").style.width =
        Math.max(
            0,
            health
        ) + "%";


    $("armor").style.width =
        Math.max(
            0,
            armor
        ) + "%";


    $("weaponName").textContent =
        weapon.name;


    $("mag").textContent =
        weapon.ammo;


    $("reserve").textContent =
        weapon.reserve;

}


/* =========================================================
   KEYBOARD
   ========================================================= */

addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;


        /* CROUCH */

        if (
            event.code === "KeyC"
        ) {

            crouching =
                !crouching;

        }


        /* JUMP */

        if (
            event.code === "Space" &&
            grounded
        ) {

            verticalVelocity = 8;

            grounded = false;

        }


        /* CAMERA */

        if (
            event.code === "KeyV"
        ) {

            firstPerson =
                !firstPerson;


            $("mode").textContent =
                firstPerson
                    ? "FIRST PERSON"
                    : "THIRD PERSON";

        }


        /* WEAPONS */

        if (
            event.code === "Digit1"
        ) {

            weaponIndex = 0;

            updateHUD();

        }


        if (
            event.code === "Digit2"
        ) {

            weaponIndex = 1;

            updateHUD();

        }


        if (
            event.code === "Digit3"
        ) {

            weaponIndex = 2;

            updateHUD();

        }


        /* RELOAD */

        if (
            event.code === "KeyR"
        ) {

            reload();

        }


        /* MEDKIT */

        if (
            event.code === "KeyG"
        ) {

            if (
                health < 100
            ) {

                health =
                    Math.min(
                        100,
                        health + 30
                    );

                updateHUD();

            }

        }

    }
);


/* =========================================================
   KEY UP
   ========================================================= */

addEventListener(
    "keyup",
    event => {

        keys[event.code] =
            false;

    }
);


/* =========================================================
   MOUSE LOOK
   ========================================================= */

document.addEventListener(
    "mousemove",
    event => {

        if (
            !running
        ) return;


        if (
            document.pointerLockElement !==
            renderer.domElement
        ) return;


        yaw -=
            event.movementX *
            0.0025;


        pitch -=
            event.movementY *
            0.0025;


        pitch =
            THREE.MathUtils.clamp(
                pitch,
                -1.25,
                1.25
            );

    }
);


/* =========================================================
   MOUSE DOWN
   ========================================================= */

document.addEventListener(
    "mousedown",
    event => {

        if (
            !running
        ) return;


        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {

            renderer
                .domElement
                .requestPointerLock?.();


            return;

        }


        if (
            event.button === 0
        ) {

            fireHeld = true;

            shoot();

        }

    }
);


/* =========================================================
   MOUSE UP
   ========================================================= */

document.addEventListener(
    "mouseup",
    event => {

        if (
            event.button === 0
        ) {

            fireHeld = false;

        }

    }
);


/* =========================================================
   RESIZE
   ========================================================= */

addEventListener(
    "resize",
    () => {

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
);


/* =========================================================
   GAME LOOP
   ========================================================= */

function loop() {

    if (
        !running
    ) {

        if (
            renderer &&
            scene &&
            camera
        ) {

            renderer.render(
                scene,
                camera
            );

        }

        return;

    }


    requestAnimationFrame(
        loop
    );


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    if (
        fireHeld
    ) {

        shoot();

    }


    updatePlayer(
        delta
    );


    updateBots(
        delta
    );


    updateZone(
        delta
    );


    updateEffects(
        delta
    );


    updateCamera();


    /* WIN */

    if (
        bots.every(
            bot =>
                !bot.alive
        )
    ) {

        finish(true);

    }


    renderer.render(
        scene,
        camera
    );

}


/* =========================================================
   GAME END
   ========================================================= */

function finish(
    win
) {

    if (
        !running
    ) return;


    running = false;

    fireHeld = false;


    document.exitPointerLock?.();


    $("result").style.display =
        "flex";


    $("resultTitle").textContent =
        win
            ? "BOOYAH!"
            : "ELIMINATED";


    $("resultText").textContent =
        win
            ? "YOU ARE THE LAST//ALIVE."
            : "You were eliminated in District 07.";

}

})();
