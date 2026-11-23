"use strict";

/* =========================================================
   LAST//ALIVE
   Stable browser version
   ========================================================= */

let scene;
let camera;
let renderer;
let clock;

let player = null;
let running = false;

let yaw = 0;
let pitch = -0.18;

const keys = {};
const bullets = [];
const enemies = [];
const pickups = [];

let health = 100;
let armor = 100;
let kills = 0;
let aliveCount = 12;
let medkits = 2;

let zoneRadius = 260;
let zoneTimer = 0;

let currentWeapon = 0;
let lastShot = 0;
let jumpVelocity = 0;
let onGround = true;

let sprinting = false;

const weapons = [
  {
    name: "AR-01",
    damage: 28,
    fireRate: 120,
    mag: 30,
    ammo: 30,
    reserve: 150,
    spread: 0.025
  },
  {
    name: "SMG-9",
    damage: 18,
    fireRate: 70,
    mag: 40,
    ammo: 40,
    reserve: 200,
    spread: 0.045
  },
  {
    name: "M12",
    damage: 12,
    fireRate: 600,
    mag: 6,
    ammo: 6,
    reserve: 48,
    spread: 0.15
  }
];

const $ = id => document.getElementById(id);


/* =========================================================
   START
   ========================================================= */

function startGame() {

  const input = $("playerName");

  if (!input) {
    console.error("playerName missing");
    return;
  }

  const name = input.value.trim();

  if (!name) {
    input.focus();
    input.placeholder = "ENTER YOUR NAME FIRST";
    return;
  }

  if (typeof THREE === "undefined") {

    $("status").textContent =
      "THREE.JS NOT LOADED — CHECK INTERNET";

    return;
  }

  $("status").textContent = "LOADING GAME...";

  setTimeout(() => {

    try {

      initGame();

      $("startScreen").style.display = "none";
      $("hud").style.display = "block";

      running = true;

      clock.start();

      requestAnimationFrame(gameLoop);

      console.log("GAME STARTED");

    } catch (error) {

      console.error(error);

      $("status").textContent =
        "GAME ERROR: " + error.message;

    }

  }, 100);

}


/* =========================================================
   INIT
   ========================================================= */

function initGame() {

  scene = new THREE.Scene();

  scene.background =
    new THREE.Color(0x7d9ba1);

  scene.fog =
    new THREE.Fog(
      0x7d9ba1,
      180,
      850
    );


  camera =
    new THREE.PerspectiveCamera(
      70,
      window.innerWidth /
      window.innerHeight,
      0.1,
      1200
    );


  renderer =
    new THREE.WebGLRenderer({
      canvas: $("gameCanvas"),
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

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.15;


  clock = new THREE.Clock();


  setupLighting();

  createWorld();

  createPlayer();

  createEnemies();

  createPickups();

  setupKeyboard();

  setupMouse();

  setupMobile();

  window.addEventListener(
    "resize",
    resizeGame
  );

  updateHUD();
}


/* =========================================================
   LIGHTING
   ========================================================= */

function setupLighting() {

  const hemi =
    new THREE.HemisphereLight(
      0xbfe9ff,
      0x28351f,
      2
    );

  scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xffefd0,
      3
    );

  sun.position.set(
    -150,
    250,
    120
  );

  sun.castShadow = true;

  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;

  scene.add(sun);
}


/* =========================================================
   WORLD
   ========================================================= */

function createWorld() {

  /* ground */

  const ground =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        900,
        900
      ),
      new THREE.MeshStandardMaterial({
        color: 0x536e47,
        roughness: 1
      })
    );

  ground.rotation.x =
    -Math.PI / 2;

  ground.receiveShadow = true;

  scene.add(ground);


  /* roads */

  createRoad(
    0,
    0,
    600,
    18
  );

  createRoad(
    0,
    0,
    18,
    600
  );

  createRoad(
    -170,
    100,
    300,
    14
  );

  createRoad(
    160,
    -100,
    300,
    14
  );


  /* city */

  for (
    let i = 0;
    i < 28;
    i++
  ) {

    const x =
      -190 +
      Math.random() * 380;

    const z =
      -170 +
      Math.random() * 340;

    if (
      Math.abs(x) < 30 &&
      Math.abs(z) < 30
    ) continue;

    createBuilding(
      x,
      z
    );
  }


  /* trees */

  for (
    let i = 0;
    i < 90;
    i++
  ) {

    const x =
      -400 +
      Math.random() * 800;

    const z =
      -400 +
      Math.random() * 800;

    if (
      Math.abs(x) < 220 &&
      Math.abs(z) < 220
    ) continue;

    createTree(
      x,
      z
    );
  }


  /* water */

  const water =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        1400,
        1400
      ),
      new THREE.MeshStandardMaterial({
        color: 0x185b70,
        roughness: .25,
        metalness: .15
      })
    );

  water.rotation.x =
    -Math.PI / 2;

  water.position.y = -2;

  scene.add(water);
}


/* =========================================================
   ROAD
   ========================================================= */

function createRoad(
  x,
  z,
  width,
  depth
) {

  const road =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        .25,
        depth
      ),
      new THREE.MeshStandardMaterial({
        color: 0x242b2d,
        roughness: .9
      })
    );

  road.position.set(
    x,
    .12,
    z
  );

  scene.add(road);
}


/* =========================================================
   BUILDINGS
   ========================================================= */

function createBuilding(
  x,
  z
) {

  const width =
    12 +
    Math.random() * 22;

  const depth =
    12 +
    Math.random() * 22;

  const height =
    8 +
    Math.random() * 35;


  const colors = [
    0x465258,
    0x596268,
    0x3d484e,
    0x6a6760,
    0x4c5558
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
        roughness: .75
      })
    );


  body.position.set(
    x,
    height / 2,
    z
  );

  body.castShadow = true;
  body.receiveShadow = true;

  scene.add(body);


  /* windows */

  const windowMat =
    new THREE.MeshBasicMaterial({
      color: 0x9edce2
    });


  const count =
    Math.max(
      2,
      Math.floor(width / 6)
    );


  for (
    let i = 0;
    i < count;
    i++
  ) {

    const win =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          2,
          2,
          .15
        ),
        windowMat
      );

    win.position.set(
      x -
        width / 2 +
        3 +
        i * 6,
      Math.min(
        height - 3,
        6
      ),
      z -
        depth / 2 -
        .1
    );

    scene.add(win);
  }
}


/* =========================================================
   TREES
   ========================================================= */

function createTree(
  x,
  z
) {

  const group =
    new THREE.Group();


  const trunk =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .7,
        1,
        5,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: 0x60452e
      })
    );

  trunk.position.y = 2.5;

  group.add(trunk);


  const crown =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        4.5,
        10,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: 0x245334
      })
    );

  crown.position.y = 8;

  crown.castShadow = true;

  group.add(crown);


  group.position.set(
    x,
    0,
    z
  );

  scene.add(group);
}


/* =========================================================
   PLAYER
   ========================================================= */

function createPlayer() {

  player =
    new THREE.Group();


  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        1.05,
        2.1,
        5,
        10
      ),
      new THREE.MeshStandardMaterial({
        color: 0x26343a
      })
    );

  body.position.y = 3.2;

  player.add(body);


  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .85,
        16,
        12
      ),
      new THREE.MeshStandardMaterial({
        color: 0xc98f6d
      })
    );

  head.position.y = 5.4;

  player.add(head);


  const gun =
    createGun();

  gun.position.set(
    .95,
    3.3,
    -1.2
  );

  player.add(gun);

  player.userData.gun = gun;


  /*
    IMPORTANT:
    player is deliberately smaller now.
  */

  player.scale.setScalar(.7);


  player.position.set(
    0,
    0,
    40
  );


  scene.add(player);
}


/* =========================================================
   GUN
   ========================================================= */

function createGun() {

  const group =
    new THREE.Group();


  const material =
    new THREE.MeshStandardMaterial({
      color: 0x111518,
      metalness: .75,
      roughness: .25
    });


  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .45,
        .4,
        2.5
      ),
      material
    );

  group.add(body);


  const barrel =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .07,
        .07,
        1.6,
        8
      ),
      material
    );

  barrel.rotation.x =
    Math.PI / 2;

  barrel.position.z = -1.9;

  group.add(barrel);


  return group;
}


/* =========================================================
   ENEMIES
   ========================================================= */

function createEnemies() {

  /*
    enemies are now FAR from player.
  */

  const positions = [
    [-250, -220],
    [230, -220],
    [280, 180],
    [-280, 220],
    [180, 280],
    [-190, 300],
    [330, -40],
    [-330, 30],
    [100, -320],
    [-100, 340],
    [360, 260]
  ];


  positions.forEach(
    ([x, z], index) => {

      const enemy =
        new THREE.Group();


      const body =
        new THREE.Mesh(
          new THREE.CapsuleGeometry(
            1,
            2,
            5,
            10
          ),
          new THREE.MeshStandardMaterial({
            color: 0x772f2f
          })
        );

      body.position.y = 3.1;

      enemy.add(body);


      const head =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            .8,
            16,
            12
          ),
          new THREE.MeshStandardMaterial({
            color: 0xc98f6d
          })
        );

      head.position.y = 5.2;

      enemy.add(head);


      const gun =
        createGun();

      gun.position.set(
        .9,
        3.1,
        -1
      );

      enemy.add(gun);


      enemy.position.set(
        x,
        0,
        z
      );


      enemy.scale.setScalar(.7);


      enemy.userData = {
        health: 100,
        alive: true,
        speed:
          2 +
          Math.random() * 1.5,
        timer: 0,
        index
      };


      scene.add(enemy);

      enemies.push(enemy);
    }
  );
}


/* =========================================================
   PICKUPS
   ========================================================= */

function createPickups() {

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    const type =
      Math.random() > .5
        ? "ARMOR"
        : "MEDKIT";


    const color =
      type === "ARMOR"
        ? 0x27aaff
        : 0x52ff9a;


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
          emissiveIntensity: .3
        })
      );


    item.position.set(
      -300 +
        Math.random() * 600,
      2,
      -300 +
        Math.random() * 600
    );


    item.userData.type = type;

    scene.add(item);

    pickups.push(item);
  }
}


/* =========================================================
   KEYBOARD
   ========================================================= */

function setupKeyboard() {

  window.addEventListener(
    "keydown",
    event => {

      keys[event.code] = true;

      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space"
        ].includes(event.code)
      ) {
        event.preventDefault();
      }


      if (
        event.code === "KeyR"
      ) {
        reload();
      }


      if (
        event.code === "Digit1"
      ) {
        switchWeapon(0);
      }


      if (
        event.code === "Digit2"
      ) {
        switchWeapon(1);
      }


      if (
        event.code === "Digit3"
      ) {
        switchWeapon(2);
      }


      if (
        event.code === "KeyG"
      ) {
        useMedkit();
      }


      if (
        event.code === "Space" &&
        onGround
      ) {

        jumpVelocity = 9;

        onGround = false;
      }

    }
  );


  window.addEventListener(
    "keyup",
    event => {
      keys[event.code] = false;
    }
  );
}


/* =========================================================
   MOUSE AIM
   ========================================================= */

function setupMouse() {

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
        .0024;


      pitch -=
        event.movementY *
        .002;


      pitch =
        Math.max(
          -0.8,
          Math.min(
            .5,
            pitch
          )
        );
    }
  );


  renderer.domElement.addEventListener(
    "click",
    () => {

      if (
        document.pointerLockElement !==
        renderer.domElement
      ) {

        renderer.domElement.requestPointerLock?.();

      }

    }
  );


  document.addEventListener(
    "mousedown",
    event => {

      if (
        event.button === 0 &&
        running
      ) {

        shoot();

      }

    }
  );
}


/* =========================================================
   MOBILE
   ========================================================= */

function setupMobile() {

  bindMobile(
    "mUp",
    "KeyW"
  );

  bindMobile(
    "mDown",
    "KeyS"
  );

  bindMobile(
    "mLeft",
    "KeyA"
  );

  bindMobile(
    "mRight",
    "KeyD"
  );

  bindMobile(
    "mSprint",
    "ShiftLeft"
  );

  bindMobile(
    "mJump",
    "Space"
  );


  const fire =
    $("mShoot");


  if (fire) {

    fire.addEventListener(
      "pointerdown",
      event => {

        event.preventDefault();

        shoot();

      }
    );

  }
}


function bindMobile(
  id,
  key
) {

  const button =
    $(id);

  if (!button) return;


  button.addEventListener(
    "pointerdown",
    event => {

      event.preventDefault();

      keys[key] = true;

    }
  );


  button.addEventListener(
    "pointerup",
    event => {

      event.preventDefault();

      keys[key] = false;

    }
  );


  button.addEventListener(
    "pointercancel",
    () => {
      keys[key] = false;
    }
  );


  button.addEventListener(
    "pointerleave",
    () => {
      keys[key] = false;
    }
  );
}


/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function updatePlayer(dt) {

  if (!player) return;


  let forward = 0;
  let side = 0;


  /*
    WASD + ARROWS
  */

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


  sprinting =
    keys["ShiftLeft"] ||
    keys["ShiftRight"];


  if (length > 0) {

    forward /= length;
    side /= length;


    /*
      Sprint actually changes movement speed.
    */

    const speed =
      sprinting
        ? 18
        : 9;


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

  }


  /* jump */

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


  /* map limits */

  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -430,
      430
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -430,
      430
    );
}


/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera() {

  if (!player) return;


  /*
    Real third-person camera.
    Camera follows player.
    World does NOT rotate around player.
  */

  const target =
    new THREE.Vector3(
      player.position.x,
      player.position.y + 4.5,
      player.position.z
    );


  const distance = 7;


  const cameraX =
    player.position.x -
    Math.sin(yaw) *
    distance;


  const cameraZ =
    player.position.z +
    Math.cos(yaw) *
    distance;


  const cameraY =
    player.position.y +
    5 -
    pitch * 5;


  camera.position.lerp(
    new THREE.Vector3(
      cameraX,
      cameraY,
      cameraZ
    ),
    .18
  );


  camera.lookAt(
    target
  );
}


/* =========================================================
   SHOOT
   ========================================================= */

function shoot() {

  if (!running) return;


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


  const raycaster =
    new THREE.Raycaster();


  const origin =
    camera.position.clone();


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
        object => {

          if (
            object.isMesh
          ) {
            targets.push(object);
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
    hits.length
  ) {

    let object =
      hits[0].object;


    while (
      object &&
      object.parent
    ) {

      if (
        object.userData &&
        object.userData.alive !== undefined
      ) {

        damageEnemy(
          object,
          weapon.damage
        );

        break;

      }

      object =
        object.parent;
    }

  }


  updateHUD();
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

    enemy.userData.alive = false;

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
        Math.hypot(
          dx,
          dz
        );


      /*
        Enemies don't spawn close.
        They only approach when inside 220m.
      */

      if (
        distance < 220
      ) {

        const angle =
          Math.atan2(
            dx,
            -dz
          );


        enemy.rotation.y =
          angle;


        if (
          distance > 28
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


        enemy.userData.timer -=
          dt;


        if (
          distance < 75 &&
          enemy.userData.timer <= 0
        ) {

          enemy.userData.timer =
            1 +
            Math.random();


          enemyShoot();

        }

      }

    }
  );
}


function enemyShoot() {

  if (
    Math.random() >
    .32
  ) return;


  damagePlayer(
    4 +
    Math.random() * 6
  );
}


/* =========================================================
   PLAYER DAMAGE
   ========================================================= */

function damagePlayer(
  damage
) {

  if (!running) return;


  const armorHit =
    Math.min(
      armor,
      damage * .6
    );


  armor -= armorHit;


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

    finishGame(false);

  }
}


/* =========================================================
   RELOAD
   ========================================================= */

function reload() {

  const weapon =
    weapons[currentWeapon];


  if (
    weapon.ammo >=
    weapon.mag
  ) return;


  if (
    weapon.reserve <= 0
  ) return;


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


  updateHUD();
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
      health + 40
    );


  updateHUD();
}


/* =========================================================
   PICKUPS
   ========================================================= */

function updatePickups(dt) {

  pickups.forEach(
    item => {

      if (
        !item.visible
      ) return;


      item.rotation.y +=
        dt * 2;


      item.position.y =
        2 +
        Math.sin(
          performance.now() *
          .003
        ) *
        .4;


      if (
        item.position.distanceTo(
          player.position
        ) < 4
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

        } else {

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
    zoneTimer > 5
  ) {

    zoneTimer = 0;


    zoneRadius =
      Math.max(
        80,
        zoneRadius - 2
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
      2 * dt
    );

  }
}


/* =========================================================
   HUD
   ========================================================= */

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


  if ($("alive"))
    $("alive").textContent =
      aliveCount;


  if ($("medkits"))
    $("medkits").textContent =
      medkits;


  if ($("zone"))
    $("zone").textContent =
      Math.round(zoneRadius) +
      "m";
}


/* =========================================================
   LOOP
   ========================================================= */

function gameLoop() {

  if (!running) return;


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


  renderer.render(
    scene,
    camera
  );
}


/* =========================================================
   FINISH
   ========================================================= */

function finishGame(
  won
) {

  if (!running) return;


  running = false;


  document.exitPointerLock?.();


  $("result").style.display =
    "flex";


  $("resultTitle").textContent =
    won
      ? "BOOYAH!"
      : "ELIMINATED";


  $("resultText").textContent =
    `${kills} ELIMINATIONS`;
}


/* =========================================================
   RESTART
   ========================================================= */

function restartGame() {

  location.reload();

}


/* =========================================================
   WEAPON
   ========================================================= */

function switchWeapon(
  index
) {

  if (
    !weapons[index]
  ) return;


  currentWeapon =
    index;


  updateHUD();
}


/* =========================================================
   RESIZE
   ========================================================= */

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


/* =========================================================
   BUTTONS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const button =
      $("dropButton");


    if (button) {

      /*
        THIS IS THE IMPORTANT FIX.
        Direct click listener.
      */

      button.addEventListener(
        "click",
        startGame
      );


      button.addEventListener(
        "touchend",
        event => {

          event.preventDefault();

          startGame();

        },
        {
          passive: false
        }
      );

    }


    const input =
      $("playerName");


    if (input) {

      input.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter"
          ) {

            event.preventDefault();

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
        restartGame
      );

    }

  }
);
