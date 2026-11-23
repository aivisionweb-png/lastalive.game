"use strict";

/*
 LAST//ALIVE
 Simple stable third-person browser shooter.
 No external assets.
*/

let scene;
let camera;
let renderer;
let clock;

let player;
let playerGun;

let running = false;
let playerName = "";

let yaw = 0;
let pitch = -0.18;

let cameraDistance = 7;
let cameraHeight = 4.8;

let health = 100;
let armor = 100;
let kills = 0;

const keys = {};
const enemies = [];
const bullets = [];
const effects = [];

let lastShot = 0;
let reloadBusy = false;

const weapons = {
    ar: {
        name: "AR-01",
        damage: 34,
        fireRate: 120,
        mag: 30,
        ammo: 30,
        reserve: 150
    }
};

let weapon = weapons.ar;

const mobile = {
    x: 0,
    y: 0,
    sprint: false,
    aim: false,
    shooting: false
};

let touchLook = {
    active: false,
    x: 0,
    y: 0
};


/* =========================
   SAFE START
========================= */

function startGame() {

    if (running) return;

    const input = document.getElementById("name");

    playerName = input
        ? input.value.trim()
        : "PLAYER";

    if (!playerName) {
        playerName = "PLAYER";
    }

    const start = document.getElementById("start");
    const loading = document.getElementById("loading");
    const button = document.getElementById("enter");

    if (button) {
        button.disabled = true;
        button.textContent = "LOADING...";
    }

    if (loading) {
        loading.style.display = "block";
        loading.textContent = "BUILDING COMBAT ZONE...";
    }

    if (typeof THREE === "undefined") {
        if (loading) {
            loading.textContent = "THREE.JS FAILED TO LOAD";
        }

        if (button) {
            button.disabled = false;
            button.textContent = "TRY AGAIN";
        }

        return;
    }

    try {

        if (start) {
            start.style.display = "none";
        }

        document.getElementById("hud").style.display = "block";

        init();

        running = true;

        clock.start();

        updateHUD();

        requestAnimationFrame(loop);

        setTimeout(() => {

            if (
                renderer &&
                renderer.domElement &&
                window.innerWidth > 800
            ) {
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


/* =========================
   INIT
========================= */

function init() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x091719);

    scene.fog =
        new THREE.Fog(
            0x091719,
            80,
            420
        );

    camera =
        new THREE.PerspectiveCamera(
            65,
            innerWidth / innerHeight,
            0.1,
            700
        );

    renderer =
        new THREE.WebGLRenderer({
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

    renderer.toneMappingExposure = 1.1;

    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    createLighting();
    createWorld();
    createPlayer();
    createEnemies();
    setupInput();
}


/* =========================
   LIGHTING
========================= */

function createLighting() {

    const hemi =
        new THREE.HemisphereLight(
            0x9bd8e5,
            0x172219,
            2.2
        );

    scene.add(hemi);

    const sun =
        new THREE.DirectionalLight(
            0xffe7b0,
            3.5
        );

    sun.position.set(
        -100,
        180,
        80
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;

    sun.shadow.camera.left = -220;
    sun.shadow.camera.right = 220;
    sun.shadow.camera.top = 220;
    sun.shadow.camera.bottom = -220;

    scene.add(sun);
}


/* =========================
   WORLD
========================= */

function createWorld() {

    const groundMat =
        new THREE.MeshStandardMaterial({
            color: 0x263c35,
            roughness: 1
        });

    const ground =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                600,
                600
            ),
            groundMat
        );

    ground.rotation.x =
        -Math.PI / 2;

    ground.receiveShadow = true;

    scene.add(ground);

    createRoad(
        0,
        0,
        600,
        18,
        0
    );

    createRoad(
        0,
        0,
        600,
        18,
        Math.PI / 2
    );

    createRoad(
        -100,
        -100,
        280,
        14,
        Math.PI / 4
    );

    createRoad(
        110,
        90,
        250,
        14,
        -Math.PI / 4
    );

    createCityBlock(
        -90,
        -80
    );

    createCityBlock(
        100,
        -70
    );

    createCityBlock(
        -90,
        90
    );

    createCityBlock(
        100,
        100
    );

    createWarehouse(
        0,
        -130
    );

    createWarehouse(
        135,
        15
    );

    createTower(
        -145,
        120
    );

    createTrees();

    createCrates();

    createStreetLights();
}


/* =========================
   ROADS
========================= */

function createRoad(
    x,
    z,
    length,
    width,
    rotation
) {

    const road =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                length,
                0.3,
                width
            ),
            new THREE.MeshStandardMaterial({
                color: 0x182326,
                roughness: .9
            })
        );

    road.position.set(
        x,
        .15,
        z
    );

    road.rotation.y =
        rotation;

    road.receiveShadow = true;

    scene.add(road);

    const dashMat =
        new THREE.MeshBasicMaterial({
            color: 0xd3b85e
        });

    for (
        let i = -length / 2;
        i < length / 2;
        i += 25
    ) {

        const dash =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    10,
                    .06,
                    0.5
                ),
                dashMat
            );

        dash.position.set(
            x +
            Math.cos(rotation) * i,
            .34,
            z +
            Math.sin(rotation) * i
        );

        dash.rotation.y =
            rotation;

        scene.add(dash);
    }
}


/* =========================
   BUILDINGS
========================= */

function createBuilding(
    x,
    z,
    w,
    h,
    d
) {

    const colors = [
        0x3b484d,
        0x46535a,
        0x303b40,
        0x56615f
    ];

    const mat =
        new THREE.MeshStandardMaterial({
            color:
                colors[
                    Math.floor(
                        Math.random() *
                        colors.length
                    )
                ],
            roughness: .75
        });

    const building =
        new THREE.Group();

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                w,
                h,
                d
            ),
            mat
        );

    body.position.y =
        h / 2;

    body.castShadow = true;
    body.receiveShadow = true;

    building.add(body);

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                w + 1,
                .8,
                d + 1
            ),
            new THREE.MeshStandardMaterial({
                color: 0x20292b
            })
        );

    roof.position.y =
        h + .4;

    roof.castShadow = true;

    building.add(roof);

    const windowMat =
        new THREE.MeshBasicMaterial({
            color: 0x8edce3
        });

    for (
        let yy = 5;
        yy < h - 2;
        yy += 6
    ) {

        for (
            let xx = -w / 2 + 3;
            xx < w / 2 - 2;
            xx += 6
        ) {

            const win =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        2.5,
                        2,
                        .12
                    ),
                    windowMat
                );

            win.position.set(
                xx,
                yy,
                d / 2 + .08
            );

            building.add(win);
        }
    }

    building.position.set(
        x,
        0,
        z
    );

    scene.add(building);
}


function createCityBlock(x,z) {

    createBuilding(
        x - 25,
        z,
        24,
        35 + Math.random()*25,
        24
    );

    createBuilding(
        x + 20,
        z - 18,
        20,
        20 + Math.random()*25,
        22
    );

    createBuilding(
        x + 5,
        z + 25,
        30,
        15 + Math.random()*20,
        18
    );
}


function createWarehouse(x,z) {

    const group =
        new THREE.Group();

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                48,
                12,
                30
            ),
            new THREE.MeshStandardMaterial({
                color:0x49534e
            })
        );

    body.position.y=6;
    body.castShadow=true;
    body.receiveShadow=true;

    group.add(body);

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                50,
                1,
                32
            ),
            new THREE.MeshStandardMaterial({
                color:0x252b2d
            })
        );

    roof.position.y=12.5;

    group.add(roof);

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);
}


/* =========================
   TOWER
========================= */

function createTower(x,z) {

    const tower =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                4,
                5,
                50,
                10
            ),
            new THREE.MeshStandardMaterial({
                color:0x353d3f,
                metalness:.7
            })
        );

    tower.position.set(
        x,
        25,
        z
    );

    tower.castShadow=true;

    scene.add(tower);

    const dish =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                10,
                .7,
                8,
                24
            ),
            new THREE.MeshStandardMaterial({
                color:0x4c5b5d
            })
        );

    dish.rotation.x =
        Math.PI/2;

    dish.position.set(
        x,
        49,
        z
    );

    scene.add(dish);
}


/* =========================
   TREES
========================= */

function createTree(x,z) {

    const group =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .7,
                1,
                6,
                8
            ),
            new THREE.MeshStandardMaterial({
                color:0x5a3c28
            })
        );

    trunk.position.y=3;

    group.add(trunk);

    const crown =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                4,
                9,
                8
            ),
            new THREE.MeshStandardMaterial({
                color:0x245436
            })
        );

    crown.position.y=9;

    crown.castShadow=true;

    group.add(crown);

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);
}


function createTrees() {

    for(let i=0;i<70;i++){

        const x =
            -260 +
            Math.random()*520;

        const z =
            -260 +
            Math.random()*520;

        if(
            Math.abs(x)<155 &&
            Math.abs(z)<155
        ){
            continue;
        }

        createTree(x,z);
    }
}


/* =========================
   CRATES
========================= */

function createCrates(){

    for(let i=0;i<35;i++){

        const box =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    4,
                    4,
                    4
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        i%2
                        ? 0x765337
                        : 0x4e673c
                })
            );

        box.position.set(
            -220+
            Math.random()*440,
            2,
            -220+
            Math.random()*440
        );

        box.rotation.y =
            Math.random()*Math.PI;

        box.castShadow=true;

        scene.add(box);
    }
}


/* =========================
   STREET LIGHTS
========================= */

function createStreetLights(){

    for(
        let i=-240;
        i<=240;
        i+=40
    ){

        createLamp(
            i,
            12
        );

        createLamp(
            12,
            i
        );
    }
}


function createLamp(x,z){

    const pole =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .18,
                .25,
                7,
                8
            ),
            new THREE.MeshStandardMaterial({
                color:0x242b2d
            })
        );

    pole.position.set(
        x,
        3.5,
        z
    );

    scene.add(pole);

    const light =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .45,
                10,
                10
            ),
            new THREE.MeshBasicMaterial({
                color:0xffd47a
            })
        );

    light.position.set(
        x,
        7,
        z
    );

    scene.add(light);
}


/* =========================
   PLAYER
========================= */

function createPlayer(){

    player =
        new THREE.Group();

    const bodyMat =
        new THREE.MeshStandardMaterial({
            color:0x263b42,
            roughness:.65
        });

    const skinMat =
        new THREE.MeshStandardMaterial({
            color:0xc98d6d
        });

    const legs =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.7,
                3.4,
                1.4
            ),
            bodyMat
        );

    legs.position.y=2.3;

    player.add(legs);

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.25,
                2.1,
                6,
                12
            ),
            bodyMat
        );

    body.position.y=5.2;

    player.add(body);

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.05,
                18,
                14
            ),
            skinMat
        );

    head.position.y=7.7;

    player.add(head);

    const helmet =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.12,
                18,
                12,
                0,
                Math.PI*2,
                0,
                Math.PI*.55
            ),
            new THREE.MeshStandardMaterial({
                color:0x151b1d
            })
        );

    helmet.position.y=8;

    player.add(helmet);

    playerGun =
        createGun();

    playerGun.position.set(
        1.2,
        5.2,
        -1.2
    );

    player.add(playerGun);

    player.position.set(
        0,
        0,
        120
    );

    scene.add(player);
}


/* =========================
   GUN
========================= */

function createGun(){

    const gun =
        new THREE.Group();

    const mat =
        new THREE.MeshStandardMaterial({
            color:0x15191b,
            metalness:.7,
            roughness:.3
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .6,
                .55,
                2.8
            ),
            mat
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
            mat
        );

    barrel.rotation.x =
        Math.PI/2;

    barrel.position.z=-2;

    gun.add(barrel);

    return gun;
}


/* =========================
   ENEMIES
========================= */

function createEnemies(){

    const positions = [
        [-190,-170],
        [180,-160],
        [-185,175],
        [190,170],
        [-220,40],
        [220,-20],
        [-40,-220],
        [70,220],
        [-130,-210],
        [150,215],
        [-220,-100]
    ];

    positions.forEach(
        ([x,z],i)=>{
            createEnemy(
                x,
                z,
                i
            );
        }
    );
}


function createEnemy(x,z,index){

    const enemy =
        new THREE.Group();

    const mat =
        new THREE.MeshStandardMaterial({
            color:
                index%2
                ? 0x722f32
                : 0x304b55
        });

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                1.25,
                2,
                6,
                10
            ),
            mat
        );

    body.position.y=5;

    enemy.add(body);

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1,
                16,
                12
            ),
            new THREE.MeshStandardMaterial({
                color:0xb8795e
            })
        );

    head.position.y=7.4;

    enemy.add(head);

    const gun =
        createGun();

    gun.scale.setScalar(.8);

    gun.position.set(
        1.2,
        5,
        -1
    );

    enemy.add(gun);

    enemy.position.set(
        x,
        0,
        z
    );

    enemy.userData = {
        hp:100,
        alive:true,
        speed:2+
            Math.random()*1.2,
        timer:Math.random()*2,
        index
    };

    scene.add(enemy);

    enemies.push(enemy);
}


/* =========================
   INPUT
========================= */

function setupInput(){

    window.addEventListener(
        "keydown",
        e=>{

            keys[e.code]=true;

            if(
                e.code==="KeyR"
            ){
                reload();
            }

            if(
                e.code==="KeyV"
            ){
                cameraDistance =
                    cameraDistance===7
                    ? 3
                    : 7;
            }

            if(
                e.code==="Space"
            ){
                jump();
            }
        }
    );

    window.addEventListener(
        "keyup",
        e=>{
            keys[e.code]=false;
        }
    );

    document.addEventListener(
        "mousemove",
        e=>{

            if(
                document.pointerLockElement !==
                renderer?.domElement
            ){
                return;
            }

            yaw -=
                e.movementX*
                .0024;

            pitch -=
                e.movementY*
                .0018;

            pitch =
                THREE.MathUtils.clamp(
                    pitch,
                    -0.8,
                    .5
                );
        }
    );

    renderer.domElement.addEventListener(
        "mousedown",
        e=>{

            if(
                document.pointerLockElement !==
                renderer.domElement
            ){

                renderer.domElement
                    .requestPointerLock?.();

                return;
            }

            if(e.button===0){
                shoot();
            }
        }
    );

    setupMobile();

    window.addEventListener(
        "resize",
        resize
    );
}


/* =========================
   MOVEMENT
========================= */

function updatePlayer(dt){

    if(!player) return;

    let forward=0;
    let side=0;

    if(
        keys.KeyW ||
        keys.ArrowUp
    ){
        forward++;
    }

    if(
        keys.KeyS ||
        keys.ArrowDown
    ){
        forward--;
    }

    if(
        keys.KeyA ||
        keys.ArrowLeft
    ){
        side--;
    }

    if(
        keys.KeyD ||
        keys.ArrowRight
    ){
        side++;
    }

    forward +=
        -mobile.y;

    side +=
        mobile.x;

    const len =
        Math.hypot(
            forward,
            side
        );

    if(len>0){

        forward/=len;
        side/=len;

        const sprint =
            keys.ShiftLeft ||
            keys.ShiftRight ||
            mobile.sprint;

        const speed =
            sprint
            ? 19
            : 10;

        const sin =
            Math.sin(yaw);

        const cos =
            Math.cos(yaw);

        player.position.x +=
            (
                side*cos +
                forward*sin
            )*
            speed*
            dt;

        player.position.z +=
            (
                side*sin -
                forward*cos
            )*
            speed*
            dt;

        player.rotation.y =
            yaw;
    }

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -270,
            270
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -270,
            270
        );
}


/* =========================
   CAMERA
========================= */

function updateCamera(){

    if(!player) return;

    const target =
        new THREE.Vector3(
            0,
            6,
            0
        );

    player.localToWorld(target);

    const offset =
        new THREE.Vector3(
            0,
            cameraHeight,
            cameraDistance
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
        target
            .clone()
            .add(offset);

    camera.position.lerp(
        desired,
        .14
    );

    camera.lookAt(
        target
    );
}


/* =========================
   SHOOTING
========================= */

function shoot(){

    if(!running) return;

    const now =
        performance.now();

    if(
        now-lastShot <
        weapon.fireRate
    ){
        return;
    }

    if(reloadBusy){
        return;
    }

    if(weapon.ammo<=0){

        reload();

        return;
    }

    lastShot=now;

    weapon.ammo--;

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

    const ray =
        new THREE.Raycaster(
            origin,
            direction,
            0,
            300
        );

    const objects=[];

    enemies.forEach(
        enemy=>{

            if(
                enemy.userData.alive
            ){

                enemy.traverse(
                    obj=>{

                        if(
                            obj.isMesh
                        ){
                            objects.push(obj);
                        }

                    }
                );
            }
        }
    );

    const hits =
        ray.intersectObjects(
            objects,
            false
        );

    if(hits.length){

        let obj =
            hits[0].object;

        while(
            obj &&
            obj.parent
        ){

            if(
                obj.userData &&
                obj.userData.alive !==
                undefined
            ){
                damageEnemy(
                    obj,
                    weapon.damage
                );

                break;
            }

            obj=obj.parent;
        }
    }

    muzzleFlash();

    updateHUD();
}


function damageEnemy(
    enemy,
    damage
){

    if(
        !enemy.userData.alive
    ){
        return;
    }

    enemy.userData.hp -=
        damage;

    if(
        enemy.userData.hp<=0
    ){

        enemy.userData.alive=false;

        enemy.visible=false;

        kills++;

        updateHUD();

        if(
            enemies.filter(
                e=>e.userData.alive
            ).length===0
        ){

            alert(
                "BOOYAH!\n\n" +
                playerName +
                " WINS!"
            );

            location.reload();
        }
    }
}


/* =========================
   ENEMY AI
========================= */

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
             Enemy stays FAR from spawn.
             */

            if(distance>22){

                const angle =
                    Math.atan2(
                        dx,
                        -dz
                    );

                enemy.rotation.y =
                    angle;

                enemy.position.x +=
                    Math.sin(angle)*
                    enemy.userData.speed*
                    dt;

                enemy.position.z +=
                    -Math.cos(angle)*
                    enemy.userData.speed*
                    dt;
            }

            enemy.userData.timer -=
                dt;

            if(
                distance<70 &&
                enemy.userData.timer<=0
            ){

                enemy.userData.timer =
                    1.2+
                    Math.random()*
                    1.5;

                enemyAttack(
                    enemy,
                    distance
                );
            }
        }
    );
}


function enemyAttack(
    enemy,
    distance
){

    const chance =
        distance<35
        ? .42
        : .18;

    if(
        Math.random()>chance
    ){
        return;
    }

    let damage =
        5+
        Math.random()*7;

    if(distance<20){
        damage*=1.4;
    }

    const armorDamage =
        Math.min(
            armor,
            damage*.55
        );

    armor -=
        armorDamage;

    health -=
        damage-
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

    if(health<=0){

        alert(
            "ELIMINATED\n\n" +
            "Kills: " +
            kills
        );

        location.reload();
    }
}


/* =========================
   MUZZLE
========================= */

function muzzleFlash(){

    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .35,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color:0xffc24b
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

    flash.position.copy(
        pos
    );

    scene.add(flash);

    effects.push({
        object:flash,
        life:.05
    });
}


/* =========================
   JUMP
========================= */

let jumpVelocity=0;
let grounded=true;

function jump(){

    if(!grounded) return;

    grounded=false;

    jumpVelocity=10;
}


function updateJump(dt){

    if(grounded) return;

    jumpVelocity -=
        25*dt;

    player.position.y +=
        jumpVelocity*dt;

    if(
        player.position.y<=0
    ){

        player.position.y=0;

        jumpVelocity=0;

        grounded=true;
    }
}


/* =========================
   RELOAD
========================= */

function reload(){

    if(reloadBusy) return;

    if(
        weapon.ammo>=weapon.mag
    ){
        return;
    }

    if(
        weapon.reserve<=0
    ){
        return;
    }

    reloadBusy=true;

    setTimeout(
        ()=>{

            const needed =
                weapon.mag-
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

            reloadBusy=false;

            updateHUD();

        },
        1000
    );
}


/* =========================
   MOBILE
========================= */

function setupMobile(){

    const joy =
        document.getElementById(
            "joy"
        );

    const stick =
        document.getElementById(
            "stick"
        );

    if(!joy) return;

    let pointerId=null;

    function moveJoy(e){

        const rect =
            joy.getBoundingClientRect();

        const cx =
            rect.left+
            rect.width/2;

        const cy =
            rect.top+
            rect.height/2;

        let dx =
            e.clientX-cx;

        let dy =
            e.clientY-cy;

        const max=48;

        const len =
            Math.hypot(
                dx,
                dy
            );

        if(len>max){

            dx =
                dx/len*max;

            dy =
                dy/len*max;
        }

        stick.style.transform =
            `translate(${dx}px,${dy}px)`;

        mobile.x =
            dx/max;

        mobile.y =
            dy/max;
    }

    joy.addEventListener(
        "pointerdown",
        e=>{

            pointerId=e.pointerId;

            joy.setPointerCapture(
                pointerId
            );

            moveJoy(e);
        }
    );

    joy.addEventListener(
        "pointermove",
        e=>{

            if(
                e.pointerId===
                pointerId
            ){
                moveJoy(e);
            }
        }
    );

    function resetJoy(){

        mobile.x=0;
        mobile.y=0;

        stick.style.transform =
            "translate(0,0)";

        pointerId=null;
    }

    joy.addEventListener(
        "pointerup",
        resetJoy
    );

    joy.addEventListener(
        "pointercancel",
        resetJoy
    );


    bindButton(
        "shoot",
        ()=>{
            mobile.shooting=true;
            shoot();
        },
        ()=>{
            mobile.shooting=false;
        }
    );

    bindButton(
        "aim",
        ()=>{
            mobile.aim=true;
            cameraDistance=4;
        },
        ()=>{
            mobile.aim=false;
            cameraDistance=7;
        }
    );

    bindButton(
        "jump",
        jump
    );

    bindButton(
        "sprint",
        ()=>{
            mobile.sprint=true;
        },
        ()=>{
            mobile.sprint=false;
        }
    );

    bindButton(
        "reload",
        reload
    );
}


function bindButton(
    id,
    down,
    up
){

    const button =
        document.getElementById(
            id
        );

    if(!button) return;

    button.addEventListener(
        "pointerdown",
        e=>{
            e.preventDefault();
            down();
        }
    );

    if(up){

        button.addEventListener(
            "pointerup",
            e=>{
                e.preventDefault();
                up();
            }
        );

        button.addEventListener(
            "pointercancel",
            up
        );
    }
}


/* =========================
   HUD
========================= */

function updateHUD(){

    const healthEl =
        document.getElementById(
            "health"
        );

    const armorEl =
        document.getElementById(
            "armor"
        );

    const ammoEl =
        document.getElementById(
            "ammo"
        );

    const killsEl =
        document.getElementById(
            "kills"
        );

    const aliveEl =
        document.getElementById(
            "alive"
        );

    const weaponEl =
        document.getElementById(
            "weapon"
        );

    if(healthEl)
        healthEl.textContent =
            Math.ceil(health);

    if(armorEl)
        armorEl.textContent =
            Math.ceil(armor);

    if(ammoEl)
        ammoEl.textContent =
            weapon.ammo+
            " / "+
            weapon.reserve;

    if(killsEl)
        killsEl.textContent =
            kills;

    if(aliveEl)
        aliveEl.textContent =
            enemies.filter(
                e=>e.userData.alive
            ).length+1;

    if(weaponEl)
        weaponEl.textContent =
            weapon.name;
}


/* =========================
   LOOP
========================= */

function loop(){

    if(!running) return;

    requestAnimationFrame(
        loop
    );

    const dt =
        Math.min(
            clock.getDelta(),
            .05
        );

    updatePlayer(dt);

    updateJump(dt);

    updateEnemies(dt);

    updateCamera();

    updateEffects(dt);

    if(
        mobile.shooting
    ){
        shoot();
    }

    renderer.render(
        scene,
        camera
    );
}


function updateEffects(dt){

    for(
        let i=effects.length-1;
        i>=0;
        i--
    ){

        const fx =
            effects[i];

        fx.life -= dt;

        if(
            fx.life<=0
        ){

            scene.remove(
                fx.object
            );

            effects.splice(
                i,
                1
            );
        }
    }
}


/* =========================
   RESIZE
========================= */

function resize(){

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


/* =========================
   BUTTON BINDING
========================= */

function bindStart(){

    const button =
        document.getElementById(
            "enter"
        );

    if(!button) return;

    button.addEventListener(
        "click",
        startGame
    );

    button.addEventListener(
        "touchend",
        e=>{
            e.preventDefault();
            startGame();
        }
    );

    const input =
        document.getElementById(
            "name"
        );

    if(input){

        input.addEventListener(
            "keydown",
            e=>{

                if(
                    e.key==="Enter"
                ){
                    e.preventDefault();
                    startGame();
                }
            }
        );
    }
}


/*
 IMPORTANT:
 Expose function globally.
 Even if another script/event
 calls startGame(), it works.
*/

window.startGame =
    startGame;


/* =========================
   BOOT
========================= */

if(
    document.readyState===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        bindStart
    );

}else{

    bindStart();
}
