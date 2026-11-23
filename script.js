"use strict";

/* =========================================================
   LAST//ALIVE — DISTRICT 09
   CLEAN SINGLE PLAYER BUILD
   ========================================================= */

const $ = id => document.getElementById(id);

let scene;
let camera;
let renderer;
let clock;

let player;
let playerGun;

let running = false;
let gameEnded = false;

let yaw = 0;
let pitch = -0.15;

let cameraMode = 3;

const keys = {};
const bullets = [];
const enemies = [];
const buildings = [];
const trees = [];
const particles = [];

let mobileMoveX = 0;
let mobileMoveY = 0;
let mobileSprint = false;
let mobileFire = false;

let health = 100;
let armor = 100;
let kills = 0;
let medkits = 2;

let zoneRadius = 170;
let zoneShrinkTimer = 0;

let onGround = true;
let jumpVelocity = 0;

let crouching = false;

let currentWeapon = 0;
let lastShot = 0;
let reloading = false;

const weapons = [

    {
        name: "AR-01",
        damage: 30,
        fireRate: 120,
        mag: 30,
        ammo: 30,
        reserve: 150,
        spread: 0.018
    },

    {
        name: "SMG-9",
        damage: 17,
        fireRate: 65,
        mag: 40,
        ammo: 40,
        reserve: 200,
        spread: 0.035
    },

    {
        name: "M12",
        damage: 16,
        fireRate: 600,
        mag: 6,
        ammo: 6,
        reserve: 48,
        spread: 0.11,
        pellets: 8
    }
];

/* =========================================================
   START
   ========================================================= */

window.startGame = function(){

    const nameInput = $("name");

    if(!nameInput){
        return;
    }

    const name = nameInput.value.trim();

    if(!name){

        nameInput.focus();
        nameInput.placeholder = "ENTER PLAYER NAME";
        return;
    }

    if(typeof THREE === "undefined"){

        alert(
            "Three.js load nahi hua.\n\n" +
            "Internet connection check karo."
        );

        return;
    }

    $("start").style.display = "none";
    $("hud").style.display = "block";

    try{

        initGame();

        running = true;
        gameEnded = false;

        clock.start();

        updateHUD();

        requestAnimationFrame(gameLoop);

        setTimeout(() => {

            if(renderer){

                renderer.domElement
                    .requestPointerLock?.();

            }

        },300);

    }catch(error){

        console.error(error);

        alert(
            "GAME ERROR:\n\n" +
            error.message
        );

        location.reload();
    }
};

/* =========================================================
   INIT
   ========================================================= */

function initGame(){

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x8ba6ad);

    scene.fog =
        new THREE.Fog(
            0x8ba6ad,
            160,
            650
        );

    camera =
        new THREE.PerspectiveCamera(
            67,
            innerWidth / innerHeight,
            0.1,
            900
        );

    renderer =
        new THREE.WebGLRenderer({
            antialias:true,
            powerPreference:"high-performance"
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

    clock =
        new THREE.Clock();

    setupLighting();
    createSky();
    createWorld();
    createRoads();
    createCity();
    createSuburbs();
    createForest();
    createWater();
    createZone();

    createPlayer();

    createEnemies();

    createLoot();

    setupKeyboard();
    setupMouse();
    setupMobile();

    resizeGame();
}

/* =========================================================
   LIGHTING
   ========================================================= */

function setupLighting(){

    const hemi =
        new THREE.HemisphereLight(
            0xd8f3ff,
            0x29372b,
            2.2
        );

    scene.add(hemi);

    const sun =
        new THREE.DirectionalLight(
            0xffedc5,
            3.5
        );

    sun.position.set(
        -150,
        240,
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

    const rim =
        new THREE.DirectionalLight(
            0x76bfff,
            0.65
        );

    rim.position.set(
        180,
        100,
        -180
    );

    scene.add(rim);
}

/* =========================================================
   SKY
   ========================================================= */

function createSky(){

    const sky =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                500,
                32,
                20
            ),
            new THREE.MeshBasicMaterial({
                color:0x86aeb9,
                side:THREE.BackSide
            })
        );

    scene.add(sky);

    for(let i=0;i<12;i++){

        const cloud =
            new THREE.Group();

        for(let j=0;j<5;j++){

            const puff =
                new THREE.Mesh(
                    new THREE.SphereGeometry(
                        8 + Math.random()*7,
                        10,
                        8
                    ),
                    new THREE.MeshStandardMaterial({
                        color:0xffffff,
                        transparent:true,
                        opacity:.28
                    })
                );

            puff.position.set(
                j*10,
                Math.random()*4,
                Math.random()*5
            );

            cloud.add(puff);
        }

        cloud.position.set(
            -250 + Math.random()*500,
            100 + Math.random()*60,
            -250 + Math.random()*500
        );

        scene.add(cloud);
    }
}

/* =========================================================
   WORLD
   ========================================================= */

function createWorld(){

    const ground =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                560,
                480,
                1,
                1
            ),
            new THREE.MeshStandardMaterial({
                color:0x536c43,
                roughness:1
            })
        );

    ground.rotation.x =
        -Math.PI/2;

    ground.receiveShadow = true;

    scene.add(ground);

    /*
      Large central plaza
    */

    const plaza =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                78,
                64
            ),
            new THREE.MeshStandardMaterial({
                color:0x606665,
                roughness:.95
            })
        );

    plaza.rotation.x =
        -Math.PI/2;

    plaza.position.y = .05;

    scene.add(plaza);

    /*
      District patches
    */

    const patches = [
        [-180,-110,80,0x69734e],
        [180,-100,90,0x68794f],
        [-180,110,90,0x4e6844],
        [180,120,100,0x5b7146]
    ];

    for(const p of patches){

        const mesh =
            new THREE.Mesh(
                new THREE.CircleGeometry(
                    p[2],
                    32
                ),
                new THREE.MeshStandardMaterial({
                    color:p[3],
                    roughness:1
                })
            );

        mesh.rotation.x =
            -Math.PI/2;

        mesh.position.set(
            p[0],
            .06,
            p[1]
        );

        scene.add(mesh);
    }
}

/* =========================================================
   WATER
   ========================================================= */

function createWater(){

    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                1000,
                1000
            ),
            new THREE.MeshStandardMaterial({
                color:0x1e6977,
                roughness:.25,
                metalness:.25
            })
        );

    water.rotation.x =
        -Math.PI/2;

    water.position.y = -1.5;

    scene.add(water);
}

/* =========================================================
   ROADS
   ========================================================= */

function road(
    x,
    z,
    width,
    length,
    rotation=0
){

    const mesh =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                .18,
                length
            ),
            new THREE.MeshStandardMaterial({
                color:0x252b2c,
                roughness:.9
            })
        );

    mesh.position.set(
        x,
        .12,
        z
    );

    mesh.rotation.y =
        rotation;

    mesh.receiveShadow = true;

    scene.add(mesh);

    /*
      road markings
    */

    const marks =
        Math.floor(length/15);

    for(let i=0;i<marks;i++){

        const mark =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    .55,
                    .04,
                    7
                ),
                new THREE.MeshBasicMaterial({
                    color:0xe0bd50
                })
            );

        mark.position.set(
            x,
            .24,
            z-length/2+8+i*15
        );

        mark.rotation.y =
            rotation;

        scene.add(mark);
    }
}

function createRoads(){

    road(0,0,18,430,0);

    road(0,0,18,430,Math.PI/2);

    road(-115,0,14,280,0);

    road(115,0,14,280,0);

    road(0,-100,14,250,Math.PI/2);

    road(0,100,14,250,Math.PI/2);

    road(
        -120,
        -105,
        12,
        190,
        -.55
    );

    road(
        120,
        105,
        12,
        190,
        -.55
    );
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
    color
){

    const group =
        new THREE.Group();

    const material =
        new THREE.MeshStandardMaterial({
            color,
            roughness:.78,
            metalness:.08
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
        h/2;

    body.castShadow = true;
    body.receiveShadow = true;

    group.add(body);

    /*
      Roof
    */

    const roof =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                Math.max(w,d)*.72,
                4,
                4
            ),
            new THREE.MeshStandardMaterial({
                color:0x303638,
                roughness:.8
            })
        );

    roof.scale.z = .8;

    roof.rotation.y =
        Math.PI/4;

    roof.position.y =
        h+.9;

    roof.castShadow = true;

    group.add(roof);

    /*
      Windows
    */

    const windowMat =
        new THREE.MeshBasicMaterial({
            color:0xb8e9e7
        });

    const cols =
        Math.max(
            2,
            Math.floor(w/6)
        );

    const rows =
        Math.max(
            2,
            Math.floor(h/7)
        );

    for(let r=0;r<rows;r++){

        for(let c=0;c<cols;c++){

            const win =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        2.2,
                        2.2,
                        .08
                    ),
                    windowMat
                );

            win.position.set(
                -w/2+3+c*6,
                4+r*7,
                d/2+.05
            );

            group.add(win);
        }
    }

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    buildings.push({
        mesh:group,
        x,
        z,
        w,
        d,
        h
    });
}

/* =========================================================
   CITY
   ========================================================= */

function createCity(){

    const blocks = [

        [-62,-62,18,24,18],
        [-25,-62,25,34,20],
        [22,-62,20,26,20],
        [65,-62,28,42,22],

        [-62,-20,25,30,18],
        [65,-20,22,34,20],

        [-65,28,25,38,22],
        [-25,32,20,26,20],
        [25,30,28,48,22],
        [70,30,20,32,18],

        [-62,70,25,30,20],
        [-20,72,22,44,20],
        [28,72,30,36,22],
        [75,75,20,28,18]
    ];

    for(const b of blocks){

        const colors=[
            0x555d60,
            0x60686b,
            0x4d585c,
            0x6b6860,
            0x596265
        ];

        createBuilding(
            b[0],
            b[1],
            b[2],
            b[3],
            b[4],
            colors[
                Math.floor(
                    Math.random()*colors.length
                )
            ]
        );
    }

    /*
      Central landmark
    */

    createBuilding(
        0,
        0,
        34,
        65,
        34,
        0x354348
    );
}

/* =========================================================
   SUBURBS
   ========================================================= */

function createSuburbs(){

    const areas=[
        [-190,-80],
        [190,-80],
        [-190,80],
        [190,80]
    ];

    for(const area of areas){

        for(let i=0;i<10;i++){

            const x =
                area[0] +
                (Math.random()-.5)*75;

            const z =
                area[1] +
                (Math.random()-.5)*65;

            createBuilding(
                x,
                z,
                10+Math.random()*7,
                6+Math.random()*8,
                10+Math.random()*7,
                0x817b68
            );
        }
    }
}

/* =========================================================
   TREES
   ========================================================= */

function createTree(
    x,
    z,
    scale=1
){

    const tree =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .6,
                .9,
                5,
                8
            ),
            new THREE.MeshStandardMaterial({
                color:0x5d422d
            })
        );

    trunk.position.y=2.5;

    tree.add(trunk);

    for(let i=0;i<3;i++){

        const crown =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    4-i*.7,
                    6,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        i===0
                        ?0x244f32
                        :0x326a3d
                })
            );

        crown.position.y =
            6+i*3.5;

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

function createForest(){

    for(let i=0;i<100;i++){

        let x;
        let z;

        do{

            x =
                -245+
                Math.random()*490;

            z =
                -195+
                Math.random()*390;

        }while(
            Math.abs(x)<115 &&
            Math.abs(z)<110
        );

        createTree(
            x,
            z,
            .7+Math.random()*.8
        );
    }
}

/* =========================================================
   ZONE
   ========================================================= */

let zoneMesh;

function createZone(){

    zoneMesh =
        new THREE.Mesh(
            new THREE.RingGeometry(
                zoneRadius-1,
                zoneRadius,
                100
            ),
            new THREE.MeshBasicMaterial({
                color:0x59ffc0,
                transparent:true,
                opacity:.9,
                side:THREE.DoubleSide
            })
        );

    zoneMesh.rotation.x =
        -Math.PI/2;

    zoneMesh.position.y=.5;

    scene.add(zoneMesh);
}

/* =========================================================
   PLAYER
   ========================================================= */

function createPlayer(){

    player =
        new THREE.Group();

    /*
      smaller proportions
    */

    const pants =
        new THREE.MeshStandardMaterial({
            color:0x1d2428
        });

    const shirt =
        new THREE.MeshStandardMaterial({
            color:0x33474a
        });

    const skin =
        new THREE.MeshStandardMaterial({
            color:0xc88d69
        });

    const leg1 =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .75,
                3,
                .8
            ),
            pants
        );

    leg1.position.set(
        -.45,
        1.5,
        0
    );

    player.add(leg1);

    const leg2 =
        leg1.clone();

    leg2.position.x=.45;

    player.add(leg2);

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.25,
                2,
                5,
                10
            ),
            shirt
        );

    body.position.y=4.4;

    body.castShadow=true;

    player.add(body);

    const vest =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.4,
                2,
                1.7
            ),
            new THREE.MeshStandardMaterial({
                color:0x253035
            })
        );

    vest.position.y=4.5;

    player.add(vest);

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1,
                18,
                14
            ),
            skin
        );

    head.position.y=6.7;

    head.castShadow=true;

    player.add(head);

    const hair =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.04,
                16,
                10
            ),
            new THREE.MeshStandardMaterial({
                color:0x202326
            })
        );

    hair.scale.y=.5;

    hair.position.y=7.3;

    player.add(hair);

    playerGun =
        createGun();

    playerGun.position.set(
        1.05,
        4.4,
        -1
    );

    player.add(playerGun);

    player.userData.gun =
        playerGun;

    /*
      Spawn central but safe
    */

    player.position.set(
        0,
        0,
        125
    );

    scene.add(player);
}

/* =========================================================
   GUN
   ========================================================= */

function createGun(){

    const gun =
        new THREE.Group();

    const mat =
        new THREE.MeshStandardMaterial({
            color:0x111518,
            metalness:.8,
            roughness:.25
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .5,
                .45,
                2.7
            ),
            mat
        );

    gun.add(body);

    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .09,
                .09,
                1.8,
                8
            ),
            mat
        );

    barrel.rotation.x =
        Math.PI/2;

    barrel.position.z=-2;

    gun.add(barrel);

    const stock =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .5,
                .55,
                .9
            ),
            mat
        );

    stock.position.z=1.5;

    gun.add(stock);

    return gun;
}

/* =========================================================
   ENEMIES
   ========================================================= */

function createEnemies(){

    /*
      FAR spawn positions
    */

    const positions=[

        [-190,-155],
        [-80,-175],
        [70,-170],
        [190,-145],

        [-215,-20],
        [215,15],

        [-200,130],
        [-80,170],
        [65,175],
        [205,135]

    ];

    positions.forEach(
        (pos,index)=>{
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
){

    const enemy =
        new THREE.Group();

    const dark =
        new THREE.MeshStandardMaterial({
            color:0x171b1e
        });

    const red =
        new THREE.MeshStandardMaterial({
            color:0x702d2d
        });

    const leg =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .7,
                3,
                .75
            ),
            dark
        );

    leg.position.set(
        -.43,
        1.5,
        0
    );

    enemy.add(leg);

    const leg2 =
        leg.clone();

    leg2.position.x=.43;

    enemy.add(leg2);

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.2,
                2,
                5,
                10
            ),
            red
        );

    body.position.y=4.3;

    enemy.add(body);

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .95,
                16,
                12
            ),
            new THREE.MeshStandardMaterial({
                color:0xbf8766
            })
        );

    head.position.y=6.5;

    enemy.add(head);

    const weapon =
        createGun();

    weapon.scale.setScalar(.7);

    weapon.position.set(
        1,
        4.3,
        -1
    );

    enemy.add(weapon);

    enemy.position.set(
        x,
        0,
        z
    );

    enemy.userData={
        alive:true,
        health:100,
        speed:2.1+Math.random()*1.2,
        attackTimer:1+Math.random()*2,
        seed:Math.random()*10,
        index
    };

    enemy.traverse(
        object=>{
            if(object.isMesh){
                object.castShadow=true;
            }
        }
    );

    scene.add(enemy);

    enemies.push(enemy);
}

/* =========================================================
   LOOT
   ========================================================= */

function createLoot(){

    const items=[
        [-75,100,"ARMOR"],
        [80,95,"MEDKIT"],
        [-135,-40,"ARMOR"],
        [135,-40,"MEDKIT"],
        [-180,10,"ARMOR"],
        [175,80,"MEDKIT"]
    ];

    for(const item of items){

        const color =
            item[2]==="ARMOR"
            ?0x35baff
            :0x54ff9a;

        const mesh =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2,
                    2,
                    2
                ),
                new THREE.MeshStandardMaterial({
                    color,
                    emissive:color,
                    emissiveIntensity:.3
                })
            );

        mesh.position.set(
            item[0],
            1.5,
            item[1]
        );

        mesh.userData.type =
            item[2];

        scene.add(mesh);
    }
}

/* =========================================================
   KEYBOARD
   ========================================================= */

function setupKeyboard(){

    window.addEventListener(
        "keydown",
        event=>{

            keys[event.code]=true;

            if(
                [
                    "ArrowUp",
                    "ArrowDown",
                    "ArrowLeft",
                    "ArrowRight",
                    "Space"
                ].includes(event.code)
            ){
                event.preventDefault();
            }

            if(event.code==="Digit1")
                switchWeapon(0);

            if(event.code==="Digit2")
                switchWeapon(1);

            if(event.code==="Digit3")
                switchWeapon(2);

            if(event.code==="KeyR")
                reload();

            if(event.code==="KeyV"){

                cameraMode =
                    cameraMode===3
                    ?1
                    :3;
            }

            if(event.code==="KeyG")
                useMedkit();

            if(
                event.code==="Space" &&
                onGround
            ){

                jumpVelocity=9;
                onGround=false;
            }
        }
    );

    window.addEventListener(
        "keyup",
        event=>{
            keys[event.code]=false;
        }
    );
}

/* =========================================================
   MOUSE
   ========================================================= */

function setupMouse(){

    document.addEventListener(
        "mousemove",
        event=>{

            if(
                document.pointerLockElement !==
                renderer?.domElement
            ){
                return;
            }

            yaw -=
                event.movementX*.0025;

            pitch -=
                event.movementY*.002;

            pitch =
                THREE.MathUtils.clamp(
                    pitch,
                    -0.9,
                    .5
                );
        }
    );

    document.addEventListener(
        "mousedown",
        event=>{

            if(!renderer)
                return;

            if(
                document.pointerLockElement !==
                renderer.domElement
            ){

                renderer.domElement
                    .requestPointerLock?.();

                return;
            }

            if(event.button===0){
                shoot();
            }
        }
    );

    renderer.domElement.addEventListener(
        "click",
        ()=>{
            renderer.domElement
                .requestPointerLock?.();
        }
    );
}

/* =========================================================
   MOBILE
   ========================================================= */

function setupMobile(){

    const joystick =
        $("joystick");

    const stick =
        $("stick");

    let joystickActive=false;

    function updateJoystick(
        clientX,
        clientY
    ){

        const rect =
            joystick.getBoundingClientRect();

        const centerX =
            rect.left+rect.width/2;

        const centerY =
            rect.top+rect.height/2;

        let dx =
            clientX-centerX;

        let dy =
            clientY-centerY;

        const max =
            rect.width*.35;

        const distance =
            Math.hypot(dx,dy);

        if(distance>max){

            dx =
                dx/distance*max;

            dy =
                dy/distance*max;
        }

        mobileMoveX =
            dx/max;

        mobileMoveY =
            -dy/max;

        stick.style.transform =
            `translate(${dx}px,${dy}px)`;
    }

    function resetJoystick(){

        joystickActive=false;

        mobileMoveX=0;
        mobileMoveY=0;

        stick.style.transform =
            "translate(0,0)";
    }

    joystick.addEventListener(
        "touchstart",
        event=>{

            joystickActive=true;

            const touch =
                event.touches[0];

            updateJoystick(
                touch.clientX,
                touch.clientY
            );
        },
        {passive:false}
    );

    joystick.addEventListener(
        "touchmove",
        event=>{

            if(!joystickActive)
                return;

            const touch =
                event.touches[0];

            updateJoystick(
                touch.clientX,
                touch.clientY
            );

            event.preventDefault();
        },
        {passive:false}
    );

    joystick.addEventListener(
        "touchend",
        resetJoystick
    );

    const fire =
        $("fireBtn");

    fire.addEventListener(
        "touchstart",
        event=>{

            event.preventDefault();

            mobileFire=true;

            shoot();
        },
        {passive:false}
    );

    fire.addEventListener(
        "touchend",
        ()=>{
            mobileFire=false;
        }
    );

    const sprint =
        $("sprintBtn");

    sprint.addEventListener(
        "touchstart",
        event=>{
            event.preventDefault();
            mobileSprint=true;
        },
        {passive:false}
    );

    sprint.addEventListener(
        "touchend",
        ()=>{
            mobileSprint=false;
        }
    );

    const jump =
        $("jumpBtn");

    jump.addEventListener(
        "touchstart",
        event=>{

            event.preventDefault();

            if(onGround){

                jumpVelocity=9;
                onGround=false;
            }
        },
        {passive:false}
    );

    const reloadButton =
        $("reloadBtn");

    reloadButton.addEventListener(
        "touchstart",
        event=>{

            event.preventDefault();

            reload();
        },
        {passive:false}
    );

    const aim =
        $("aimZone");

    let lastX=0;
    let lastY=0;
    let aiming=false;

    aim.addEventListener(
        "touchstart",
        event=>{

            const touch =
                event.touches[0];

            lastX=touch.clientX;
            lastY=touch.clientY;

            aiming=true;
        },
        {passive:true}
    );

    aim.addEventListener(
        "touchmove",
        event=>{

            if(!aiming)
                return;

            const touch =
                event.touches[0];

            const dx =
                touch.clientX-lastX;

            const dy =
                touch.clientY-lastY;

            yaw -= dx*.008;

            pitch -= dy*.006;

            pitch =
                THREE.MathUtils.clamp(
                    pitch,
                    -.9,
                    .5
                );

            lastX=touch.clientX;
            lastY=touch.clientY;
        },
        {passive:true}
    );

    aim.addEventListener(
        "touchend",
        ()=>{
            aiming=false;
        }
    );
}

/* =========================================================
   PLAYER UPDATE
   ========================================================= */

function updatePlayer(dt){

    if(!player)
        return;

    let forward=0;
    let side=0;

    if(
        keys["KeyW"] ||
        keys["ArrowUp"]
    ){
        forward+=1;
    }

    if(
        keys["KeyS"] ||
        keys["ArrowDown"]
    ){
        forward-=1;
    }

    if(
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ){
        side-=1;
    }

    if(
        keys["KeyD"] ||
        keys["ArrowRight"]
    ){
        side+=1;
    }

    forward += mobileMoveY;
    side += mobileMoveX;

    const len =
        Math.hypot(
            forward,
            side
        );

    if(len>1){

        forward/=len;
        side/=len;
    }

    crouching =
        keys["KeyC"] ||
        keys["ControlLeft"];

    const sprinting =
        keys["ShiftLeft"] ||
        keys["ShiftRight"] ||
        mobileSprint;

    let speed =
        sprinting
        ?17
        :10;

    if(crouching)
        speed=5;

    if(len>.05){

        const sin =
            Math.sin(yaw);

        const cos =
            Math.cos(yaw);

        player.position.x +=
            (
                side*cos +
                forward*sin
            ) *
            speed *
            dt;

        player.position.z +=
            (
                side*sin -
                forward*cos
            ) *
            speed *
            dt;

        player.rotation.y =
            yaw;
    }

    /*
      Jump
    */

    if(!onGround){

        jumpVelocity -=
            24*dt;

        player.position.y +=
            jumpVelocity*dt;

        if(
            player.position.y<=0
        ){

            player.position.y=0;
            jumpVelocity=0;
            onGround=true;
        }
    }

    /*
      map bounds
    */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -245,
            245
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -190,
            190
        );
}

/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera(){

    if(!player)
        return;

    if(cameraMode===1){

        const head =
            new THREE.Vector3(
                0,
                6.2,
                0
            );

        player.localToWorld(head);

        camera.position.copy(head);

        camera.rotation.order =
            "YXZ";

        camera.rotation.y =
            yaw;

        camera.rotation.x =
            pitch;

        return;
    }

    const target =
        new THREE.Vector3(
            0,
            crouching?4.5:5.2,
            0
        );

    player.localToWorld(target);

    const distance =
        crouching
        ?5.5
        :6.5;

    const height =
        crouching
        ?3.8
        :4.8;

    const offset =
        new THREE.Vector3(
            0,
            height,
            distance
        );

    offset.applyAxisAngle(
        new THREE.Vector3(1,0,0),
        pitch
    );

    offset.applyAxisAngle(
        new THREE.Vector3(0,1,0),
        yaw
    );

    const desired =
        target.clone().add(offset);

    camera.position.lerp(
        desired,
        .16
    );

    camera.lookAt(target);
}

/* =========================================================
   SHOOTING
   ========================================================= */

function shoot(){

    if(
        !running ||
        reloading
    ){
        return;
    }

    const weapon =
        weapons[currentWeapon];

    const now =
        performance.now();

    if(
        now-lastShot <
        weapon.fireRate
    ){
        return;
    }

    if(weapon.ammo<=0){

        reload();
        return;
    }

    lastShot=now;

    weapon.ammo--;

    const pellets =
        weapon.pellets || 1;

    for(
        let i=0;
        i<pellets;
        i++
    ){

        fireRay(
            weapon
        );
    }

    muzzleFlash();

    updateHUD();
}

function fireRay(weapon){

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
        (Math.random()-.5)*
        weapon.spread;

    direction.y +=
        (Math.random()-.5)*
        weapon.spread;

    direction.normalize();

    raycaster.set(
        origin,
        direction
    );

    const targets=[];

    enemies.forEach(
        enemy=>{

            if(
                enemy.userData.alive
            ){

                enemy.traverse(
                    child=>{

                        if(
                            child.isMesh
                        ){
                            targets.push(child);
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

    if(!hits.length)
        return;

    let object =
        hits[0].object;

    let enemy=null;

    while(
        object &&
        object!==scene
    ){

        if(
            object.userData &&
            object.userData.alive
            !==undefined
        ){

            enemy=object;
            break;
        }

        object =
            object.parent;
    }

    if(enemy){

        damageEnemy(
            enemy,
            weapon.damage
        );
    }
}

/* =========================================================
   MUZZLE
   ========================================================= */

function muzzleFlash(){

    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .22,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color:0xffc34a
            })
        );

    const pos =
        new THREE.Vector3(
            0,
            0,
            -3
        );

    playerGun.localToWorld(
        pos
    );

    flash.position.copy(pos);

    scene.add(flash);

    setTimeout(
        ()=>{
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
){

    if(
        !enemy.userData.alive
    ){
        return;
    }

    enemy.userData.health -=
        damage;

    if(
        enemy.userData.health<=0
    ){

        enemy.userData.alive=false;

        enemy.visible=false;

        kills++;

        updateHUD();

        if(
            aliveEnemies()<=1
        ){

            finishGame(true);
        }
    }
}

/* =========================================================
   ENEMY AI
   ========================================================= */

function updateEnemies(dt){

    enemies.forEach(
        enemy=>{

            if(
                !enemy.userData.alive
            ){
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
              Enemy only becomes aggressive
              when reasonably close.
            */

            if(
                distance<110
            ){

                const angle =
                    Math.atan2(
                        dx,
                        -dz
                    );

                enemy.rotation.y =
                    angle;

                if(
                    distance>22
                ){

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

                if(
                    distance<65 &&
                    enemy.userData.attackTimer<=0
                ){

                    enemy.userData.attackTimer =
                        1.2+
                        Math.random()*1.3;

                    enemyShoot(
                        enemy,
                        distance
                    );
                }

            }else{

                const t =
                    performance.now()*.0002+
                    enemy.userData.seed;

                enemy.position.x +=
                    Math.sin(t)*
                    .4*
                    dt;

                enemy.position.z +=
                    Math.cos(t)*
                    .4*
                    dt;
            }
        }
    );
}

function enemyShoot(
    enemy,
    distance
){

    /*
      AI accuracy
    */

    const chance =
        distance<35
        ? .48
        : .22;

    if(
        Math.random()>chance
    ){
        return;
    }

    const damage =
        5+
        Math.random()*6;

    damagePlayer(
        damage
    );
}

/* =========================================================
   PLAYER DAMAGE
   ========================================================= */

function damagePlayer(
    damage
){

    if(!running)
        return;

    const armorHit =
        Math.min(
            armor,
            damage*.65
        );

    armor -= armorHit;

    health -=
        damage-armorHit;

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

    if(health<=0){

        finishGame(false);
    }
}

/* =========================================================
   WEAPONS
   ========================================================= */

function switchWeapon(
    index
){

    if(
        index<0 ||
        index>=weapons.length
    ){
        return;
    }

    currentWeapon=index;

    reloading=false;

    updateHUD();
}

function reload(){

    if(
        reloading
    ){
        return;
    }

    const weapon =
        weapons[currentWeapon];

    if(
        weapon.ammo>=weapon.mag ||
        weapon.reserve<=0
    ){
        return;
    }

    reloading=true;

    setTimeout(
        ()=>{

            const need =
                weapon.mag-
                weapon.ammo;

            const amount =
                Math.min(
                    need,
                    weapon.reserve
                );

            weapon.ammo += amount;

            weapon.reserve -= amount;

            reloading=false;

            updateHUD();

        },
        1100
    );
}

/* =========================================================
   MEDKIT
   ========================================================= */

function useMedkit(){

    if(
        medkits<=0 ||
        health>=100
    ){
        return;
    }

    medkits--;

    health =
        Math.min(
            100,
            health+45
        );

    updateHUD();
}

/* =========================================================
   ZONE
   ========================================================= */

function updateZone(dt){

    zoneShrinkTimer += dt;

    if(
        zoneShrinkTimer>4
    ){

        zoneShrinkTimer=0;

        zoneRadius =
            Math.max(
                45,
                zoneRadius-.7
            );

        zoneMesh.scale.set(
            zoneRadius/170,
            zoneRadius/170,
            zoneRadius/170
        );
    }

    const distance =
        Math.hypot(
            player.position.x,
            player.position.z
        );

    const warning =
        $("zoneWarning");

    if(
        distance>zoneRadius
    ){

        damagePlayer(
            2.7*dt
        );

        if(warning)
            warning.style.opacity=1;

    }else{

        if(warning)
            warning.style.opacity=0;
    }
}

/* =========================================================
   HUD
   ========================================================= */

function updateHUD(){

    const weapon =
        weapons[currentWeapon];

    $("health").textContent =
        Math.ceil(health);

    $("armor").textContent =
        Math.ceil(armor);

    $("ammo").textContent =
        weapon.ammo+
        " / "+
        weapon.reserve;

    $("weapon").textContent =
        reloading
        ? "RELOADING"
        : weapon.name;

    $("kills").textContent =
        kills;

    $("alive").textContent =
        aliveEnemies();

    $("medkits").textContent =
        medkits;

    $("zone").textContent =
        Math.round(zoneRadius)+
        "m";

    $("healthBar").style.width =
        health+"%";
}

function aliveEnemies(){

    let count=1;

    enemies.forEach(
        enemy=>{
            if(
                enemy.userData.alive
            ){
                count++;
            }
        }
    );

    return count;
}

/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop(){

    if(!running)
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

    updateZone(dt);

    updateCamera();

    /*
      Mobile auto fire
    */

    if(
        mobileFire
    ){
        shoot();
    }

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
){

    if(
        !running ||
        gameEnded
    ){
        return;
    }

    running=false;
    gameEnded=true;

    document.exitPointerLock?.();

    $("result").style.display=
        "flex";

    $("resultTitle").textContent=
        won
        ? "BOOYAH!"
        : "ELIMINATED";

    $("resultText").textContent=
        won
        ? `WINNER • ${kills} ELIMINATIONS`
        : `ELIMINATED • ${kills} ELIMINATIONS`;
}

function restartGame(){

    location.reload();
}

/* =========================================================
   RESIZE
   ========================================================= */

function resizeGame(){

    if(
        !camera ||
        !renderer
    ){
        return;
    }

    camera.aspect =
        innerWidth/
        innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        innerWidth,
        innerHeight
    );
}

window.addEventListener(
    "resize",
    resizeGame
);

/* =========================================================
   BUTTONS
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        /*
          Direct listener + inline-safe global
        */

        $("enter").addEventListener(
            "click",
            ()=>{
                window.startGame();
            }
        );

        $("name").addEventListener(
            "keydown",
            event=>{

                if(
                    event.key==="Enter"
                ){
                    window.startGame();
                }
            }
        );

        $("again").addEventListener(
            "click",
            restartGame
        );
    }
);
