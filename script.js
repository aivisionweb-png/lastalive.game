(() => {

"use strict";

/* =========================================================
   LAST//ALIVE
   ORIGINAL BATTLE ROYALE PROTOTYPE
   ========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

let scene;
let camera;
let renderer;

let clock;

let gameStarted = false;
let gameOver = false;

let player;
let playerModel;
let weaponModel;

let velocityY = 0;

let yaw = 0;
let pitch = -0.12;

let cameraMode = "third";

let mouseLocked = false;

let shooting = false;

let lastShot = 0;

let health = 100;
let armor = 65;

let crouching = false;
let sprinting = false;

let mag = 30;
let reserveAmmo = 120;

let currentWeapon = 1;

let bots = [];

let bullets = [];

let buildings = [];
let trees = [];

let keys = {};

let worldSize = 260;

let safeZoneRadius = 115;

let safeZoneTarget = 115;

let zoneShrinkTimer = 0;

let damageTimer = 0;


/* =========================================================
   WEAPONS
========================================================= */

const weapons = {

  1: {
    name: "ASSAULT RIFLE",
    damage: 22,
    fireRate: 105,
    magazine: 30,
    spread: 0.018
  },

  2: {
    name: "SMG",
    damage: 14,
    fireRate: 65,
    magazine: 40,
    spread: 0.035
  },

  3: {
    name: "SHOTGUN",
    damage: 12,
    fireRate: 650,
    magazine: 8,
    spread: 0.11
  }

};


/* =========================================================
   DOM
========================================================= */

const menu =
  document.getElementById("menu");

const playButton =
  document.getElementById("play");

const aliveEl =
  document.getElementById("alive");

const zoneEl =
  document.getElementById("zone");

const hpEl =
  document.getElementById("hp");

const armorEl =
  document.getElementById("armor");

const hpbar =
  document.getElementById("hpbar");

const armorbar =
  document.getElementById("armorbar");

const weaponName =
  document.getElementById("weaponName");

const magEl =
  document.getElementById("mag");

const reserveEl =
  document.getElementById("reserve");

const modeEl =
  document.getElementById("mode");

const zoneWarning =
  document.getElementById("zoneWarning");

const damageEl =
  document.getElementById("damage");

const toast =
  document.getElementById("toast");

const killfeed =
  document.getElementById("killfeed");

const death =
  document.getElementById("death");

const restartButton =
  document.getElementById("restart");


/* =========================================================
   BASIC HELPERS
========================================================= */

function clamp(value, min, max) {

  return Math.max(
    min,
    Math.min(max, value)
  );

}


function random(min, max) {

  return (
    min +
    Math.random() *
    (max - min)
  );

}


/* =========================================================
   START GAME
========================================================= */

window.startGame =
function startGame() {

  if (gameStarted) return;

  gameStarted = true;
  gameOver = false;

  health = 100;
  armor = 65;

  mag = 30;
  reserveAmmo = 120;

  yaw = 0;
  pitch = -0.12;

  cameraMode = "third";

  safeZoneRadius = 115;
  safeZoneTarget = 115;

  menu.style.display = "none";
  death.style.display = "none";

  if (!scene) {

    init();

  }

  resetGame();

  const canvas =
    renderer.domElement;

  if (
    canvas &&
    canvas.requestPointerLock
  ) {

    canvas.requestPointerLock();

  }

  showToast(
    "DROP COMPLETE"
  );

};


/* =========================================================
   INITIALIZE
========================================================= */

function init() {

  scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(
      0x07100c
    );


  /* CAMERA */

  camera =
    new THREE.PerspectiveCamera(
      70,
      window.innerWidth /
      window.innerHeight,
      0.1,
      1000
    );


  /* RENDERER */

  renderer =
    new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  document
    .getElementById("game")
    .appendChild(
      renderer.domElement
    );


  /* CLOCK */

  clock =
    new THREE.Clock();


  /* LIGHTS */

  createLights();


  /* WORLD */

  createWorld();

  createRoads();

  createBuildings();

  createTrees();

  createStreetLights();

  createZone();


  /* PLAYER */

  createPlayer();


  /* BOTS */

  createBots(11);


  /* EVENTS */

  setupInput();


  window.addEventListener(
    "resize",
    onResize
  );


  /* LOOP */

  animate();

}


/* =========================================================
   LIGHTING
========================================================= */

function createLights() {

  const hemi =
    new THREE.HemisphereLight(
      0xbdebd2,
      0x142018,
      1.7
    );

  scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xffffff,
      2.2
    );

  sun.position.set(
    70,
    120,
    40
  );

  sun.castShadow = true;

  sun.shadow.mapSize.width =
    2048;

  sun.shadow.mapSize.height =
    2048;

  sun.shadow.camera.left =
    -180;

  sun.shadow.camera.right =
    180;

  sun.shadow.camera.top =
    180;

  sun.shadow.camera.bottom =
    -180;

  scene.add(sun);


  const moon =
    new THREE.DirectionalLight(
      0x66aaff,
      0.45
    );

  moon.position.set(
    -80,
    80,
    -80
  );

  scene.add(moon);

}


/* =========================================================
   WORLD
========================================================= */

function createWorld() {

  const groundGeometry =
    new THREE.PlaneGeometry(
      worldSize,
      worldSize
    );

  const groundMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x17231d,
      roughness: 0.92,
      metalness: 0.02
    });

  const ground =
    new THREE.Mesh(
      groundGeometry,
      groundMaterial
    );

  ground.rotation.x =
    -Math.PI / 2;

  ground.receiveShadow = true;

  scene.add(ground);


  /* Grass patches */

  for (
    let i = 0;
    i < 140;
    i++
  ) {

    const x =
      random(
        -worldSize / 2,
        worldSize / 2
      );

    const z =
      random(
        -worldSize / 2,
        worldSize / 2
      );

    const geo =
      new THREE.BoxGeometry(
        random(.3, 1),
        random(.15, .5),
        random(.3, 1)
      );

    const mat =
      new THREE.MeshStandardMaterial({
        color:
          Math.random() > .5
            ? 0x254a32
            : 0x1d3928
      });

    const grass =
      new THREE.Mesh(
        geo,
        mat
      );

    grass.position.set(
      x,
      .1,
      z
    );

    scene.add(grass);

  }

}


/* =========================================================
   ROADS
========================================================= */

function createRoads() {

  const roadMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x202624,
      roughness: .9
    });


  const road1 =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        22,
        .15,
        worldSize
      ),
      roadMaterial
    );

  road1.position.y = .05;

  scene.add(road1);


  const road2 =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        worldSize,
        .15,
        22
      ),
      roadMaterial
    );

  road2.position.y = .055;

  scene.add(road2);


  /* Road markings */

  const markingMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xd8d18d
    });


  for (
    let i = -120;
    i <= 120;
    i += 12
  ) {

    const line =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          4,
          .17,
          .35
        ),
        markingMaterial
      );

    line.position.set(
      i,
      .15,
      0
    );

    scene.add(line);


    const line2 =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          .35,
          .17,
          4
        ),
        markingMaterial
      );

    line2.position.set(
      0,
      .16,
      i
    );

    scene.add(line2);

  }

}


/* =========================================================
   BUILDINGS
========================================================= */

function createBuildings() {

  const buildingColors = [
    0x26312c,
    0x303c37,
    0x202c27,
    0x37423d,
    0x293833
  ];


  for (
    let i = 0;
    i < 45;
    i++
  ) {

    let x =
      random(
        -worldSize / 2 + 12,
        worldSize / 2 - 12
      );

    let z =
      random(
        -worldSize / 2 + 12,
        worldSize / 2 - 12
      );


    /* Keep central roads clear */

    if (
      Math.abs(x) < 17 ||
      Math.abs(z) < 17
    ) {

      i--;

      continue;

    }


    const width =
      random(7, 17);

    const depth =
      random(7, 17);

    const height =
      random(5, 20);


    const geometry =
      new THREE.BoxGeometry(
        width,
        height,
        depth
      );


    const material =
      new THREE.MeshStandardMaterial({
        color:
          buildingColors[
            Math.floor(
              Math.random() *
              buildingColors.length
            )
          ],

        roughness: .75
      });


    const building =
      new THREE.Mesh(
        geometry,
        material
      );


    building.position.set(
      x,
      height / 2,
      z
    );


    building.castShadow = true;

    building.receiveShadow = true;


    scene.add(building);

    buildings.push({
      mesh: building,
      x,
      z,
      width,
      depth,
      height
    });


    /* Roof */

    const roof =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width + .5,
          .35,
          depth + .5
        ),
        new THREE.MeshStandardMaterial({
          color: 0x111715
        })
      );

    roof.position.set(
      x,
      height + .17,
      z
    );

    roof.castShadow = true;

    scene.add(roof);


    /* Windows */

    for (
      let w = -1;
      w <= 1;
      w++
    ) {

      const window =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            1.2,
            1.3,
            .08
          ),
          new THREE.MeshStandardMaterial({
            color: 0x71d6b1,
            emissive: 0x174d3b,
            emissiveIntensity: .7
          })
        );

      window.position.set(
        x +
        w *
        Math.min(
          width / 3,
          3
        ),

        height *
        .55,

        z -
        depth / 2 -
        .05
      );

      scene.add(window);

    }

  }

}


/* =========================================================
   TREES
========================================================= */

function createTrees() {

  for (
    let i = 0;
    i < 65;
    i++
  ) {

    let x =
      random(
        -worldSize / 2 + 5,
        worldSize / 2 - 5
      );

    let z =
      random(
        -worldSize / 2 + 5,
        worldSize / 2 - 5
      );


    if (
      Math.abs(x) < 20 ||
      Math.abs(z) < 20
    ) {

      i--;

      continue;

    }


    const group =
      new THREE.Group();


    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          .25,
          .4,
          3,
          8
        ),
        new THREE.MeshStandardMaterial({
          color: 0x493a2a
        })
      );

    trunk.position.y = 1.5;

    trunk.castShadow = true;

    group.add(trunk);


    const crown =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          2.4,
          5.5,
          9
        ),
        new THREE.MeshStandardMaterial({
          color: 0x17472d
        })
      );

    crown.position.y = 5;

    crown.castShadow = true;

    group.add(crown);


    group.position.set(
      x,
      0,
      z
    );

    scene.add(group);

    trees.push(group);

  }

}


/* =========================================================
   STREET LIGHTS
========================================================= */

function createStreetLights() {

  for (
    let i = -100;
    i <= 100;
    i += 25
  ) {

    createLamp(
      i,
      8
    );

    createLamp(
      8,
      i
    );

  }

}


function createLamp(x, z) {

  const pole =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .12,
        .16,
        7,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: 0x202624
      })
    );

  pole.position.set(
    x,
    3.5,
    z
  );

  scene.add(pole);


  const light =
    new THREE.PointLight(
      0xffd98a,
      4,
      18
    );

  light.position.set(
    x,
    7,
    z
  );

  scene.add(light);


  const bulb =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .25,
        8,
        8
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffdf9b
      })
    );

  bulb.position.set(
    x,
    7,
    z
  );

  scene.add(bulb);

}


/* =========================================================
   PLAYER
========================================================= */

function createPlayer() {

  player =
    new THREE.Group();


  /* Body */

  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        .45,
        1.15,
        5,
        10
      ),
      new THREE.MeshStandardMaterial({
        color: 0x1f6f4d,
        roughness: .7
      })
    );

  body.position.y = 1.15;

  body.castShadow = true;

  player.add(body);


  /* Vest */

  const vest =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .85,
        .75,
        .48
      ),
      new THREE.MeshStandardMaterial({
        color: 0x17221d
      })
    );

  vest.position.y = 1.2;

  vest.castShadow = true;

  player.add(vest);


  /* Head */

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .34,
        16,
        16
      ),
      new THREE.MeshStandardMaterial({
        color: 0xb87855
      })
    );

  head.position.y = 2.15;

  head.castShadow = true;

  player.add(head);


  /* Helmet */

  const helmet =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .37,
        16,
        10
      ),
      new THREE.MeshStandardMaterial({
        color: 0x17231d
      })
    );

  helmet.scale.y = .55;

  helmet.position.y = 2.31;

  helmet.castShadow = true;

  player.add(helmet);


  /* Weapon */

  weaponModel =
    new THREE.Group();

  const gunBody =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .18,
        .22,
        1.15
      ),
      new THREE.MeshStandardMaterial({
        color: 0x171b1a,
        metalness: .65,
        roughness: .35
      })
    );

  gunBody.position.z = -.45;

  weaponModel.add(gunBody);


  const barrel =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .055,
        .055,
        .55,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: 0x090b0b,
        metalness: .8
      })
    );

  barrel.rotation.x =
    Math.PI / 2;

  barrel.position.z = -1.1;

  weaponModel.add(barrel);


  weaponModel.position.set(
    .52,
    1.4,
    -.35
  );

  player.add(
    weaponModel
  );


  scene.add(player);

}


/* =========================================================
   BOTS
========================================================= */

function createBots(count) {

  bots = [];

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const bot =
      createBot();

    let x;
    let z;

    do {

      x =
        random(
          -95,
          95
        );

      z =
        random(
          -95,
          95
        );

    } while (
      Math.abs(x) < 20 &&
      Math.abs(z) < 20
    );


    bot.group.position.set(
      x,
      0,
      z
    );


    bot.targetTimer =
      random(
        0,
        2
      );


    bot.alive = true;

    bot.health = 100;

    bot.speed =
      random(
        2.2,
        3.5
      );


    scene.add(
      bot.group
    );

    bots.push(bot);

  }

}


function createBot() {

  const group =
    new THREE.Group();


  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        .42,
        1.05,
        5,
        10
      ),
      new THREE.MeshStandardMaterial({
        color: 0x943f3f
      })
    );

  body.position.y = 1.05;

  body.castShadow = true;

  group.add(body);


  const vest =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .82,
        .72,
        .46
      ),
      new THREE.MeshStandardMaterial({
        color: 0x241616
      })
    );

  vest.position.y = 1.1;

  group.add(vest);


  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .32,
        12,
        12
      ),
      new THREE.MeshStandardMaterial({
        color: 0x9d654d
      })
    );

  head.position.y = 2;

  group.add(head);


  const gun =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .14,
        .16,
        .95
      ),
      new THREE.MeshStandardMaterial({
        color: 0x0d0f0e
      })
    );

  gun.position.set(
    .48,
    1.35,
    -.4
  );

  group.add(gun);


  return {

    group,

    alive: true,

    health: 100,

    speed: 2.8,

    targetTimer: 0,

    fireTimer: random(
      .5,
      2
    ),

    direction:
      new THREE.Vector3(
        1,
        0,
        0
      )

  };

}


/* =========================================================
   ZONE
========================================================= */

let zoneMesh;

function createZone() {

  const geometry =
    new THREE.RingGeometry(
      safeZoneRadius - .7,
      safeZoneRadius,
      96
    );

  const material =
    new THREE.MeshBasicMaterial({
      color: 0x4dff99,
      transparent: true,
      opacity: .45,
      side: THREE.DoubleSide
    });

  zoneMesh =
    new THREE.Mesh(
      geometry,
      material
    );

  zoneMesh.rotation.x =
    -Math.PI / 2;

  zoneMesh.position.y =
    .2;

  scene.add(
    zoneMesh
  );

}


/* =========================================================
   INPUT
========================================================= */

function setupInput() {

  window.addEventListener(
    "keydown",
    event => {

      keys[
        event.code
      ] = true;


      if (
        event.code ===
        "KeyV"
      ) {

        toggleCamera();

      }


      if (
        event.code ===
        "KeyR"
      ) {

        reload();

      }


      if (
        event.code ===
        "KeyC"
      ) {

        crouching =
          !crouching;

      }


      if (
        event.code ===
        "KeyG"
      ) {

        useMedkit();

      }


      if (
        event.code ===
        "Digit1"
      ) {

        switchWeapon(1);

      }


      if (
        event.code ===
        "Digit2"
      ) {

        switchWeapon(2);

      }


      if (
        event.code ===
        "Digit3"
      ) {

        switchWeapon(3);

      }


      if (
        event.code ===
        "Space" &&
        Math.abs(
          velocityY
        ) < .1
      ) {

        velocityY = 7;

      }

    }
  );


  window.addEventListener(
    "keyup",
    event => {

      keys[
        event.code
      ] = false;

    }
  );


  window.addEventListener(
    "mousedown",
    event => {

      if (
        event.button === 0
      ) {

        shooting = true;

        shoot();

      }


      if (
        !mouseLocked &&
        gameStarted &&
        renderer &&
        renderer.domElement
      ) {

        renderer
          .domElement
          .requestPointerLock();

      }

    }
  );


  window.addEventListener(
    "mouseup",
    event => {

      if (
        event.button === 0
      ) {

        shooting = false;

      }

    }
  );


  document.addEventListener(
    "pointerlockchange",
    () => {

      mouseLocked =
        document.pointerLockElement ===
        renderer.domElement;

    }
  );


  document.addEventListener(
    "mousemove",
    event => {

      if (
        !mouseLocked ||
        !gameStarted
      ) {

        return;

      }


      yaw -=
        event.movementX *
        .0025;

      pitch -=
        event.movementY *
        .002;

      pitch =
        clamp(
          pitch,
          -1.2,
          .65
        );

    }
  );


  playButton.addEventListener(
    "click",
    () => {

      window.startGame();

    }
  );


  restartButton.addEventListener(
    "click",
    () => {

      window.startGame();

    }
  );

}


/* =========================================================
   CAMERA
========================================================= */

function toggleCamera() {

  if (
    cameraMode ===
    "third"
  ) {

    cameraMode =
      "first";

    modeEl.textContent =
      "FIRST PERSON";

    showToast(
      "FIRST PERSON"
    );

  } else {

    cameraMode =
      "third";

    modeEl.textContent =
      "THIRD PERSON";

    showToast(
      "THIRD PERSON"
    );

  }

}


/* =========================================================
   MOVEMENT
========================================================= */

function updatePlayer(dt) {

  if (
    !player ||
    gameOver
  ) {

    return;

  }


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
    keys["KeyW"] ||
    keys["ArrowUp"]
  ) {

    movement.add(
      forward
    );

  }


  if (
    keys["KeyS"] ||
    keys["ArrowDown"]
  ) {

    movement.sub(
      forward
    );

  }


  if (
    keys["KeyD"] ||
    keys["ArrowRight"]
  ) {

    movement.add(
      right
    );

  }


  if (
    keys["KeyA"] ||
    keys["ArrowLeft"]
  ) {

    movement.sub(
      right
    );

  }


  if (
    movement.lengthSq() >
    0
  ) {

    movement.normalize();

    sprinting =
      keys["ShiftLeft"] ||
      keys["ShiftRight"];

    let speed =
      sprinting
        ? 9
        : 5.5;

    if (crouching) {

      speed *= .5;

    }


    player.position.addScaledVector(
      movement,
      speed * dt
    );


    player.rotation.y =
      Math.atan2(
        movement.x,
        movement.z
      );

  }


  /* Gravity */

  velocityY -=
    18 * dt;

  player.position.y +=
    velocityY * dt;


  if (
    player.position.y < 0
  ) {

    player.position.y = 0;

    velocityY = 0;

  }


  /* World boundary */

  player.position.x =
    clamp(
      player.position.x,
      -125,
      125
    );

  player.position.z =
    clamp(
      player.position.z,
      -125,
      125
    );


  /* Camera */

  updateCamera();


  /* Safe zone */

  const distance =
    Math.sqrt(
      player.position.x *
      player.position.x +

      player.position.z *
      player.position.z
    );


  if (
    distance >
    safeZoneRadius
  ) {

    zoneWarning.style.display =
      "block";

    health -=
      5 * dt;

    if (
      health <= 0
    ) {

      eliminatePlayer();

    }

  } else {

    zoneWarning.style.display =
      "none";

  }

}


/* =========================================================
   CAMERA UPDATE
========================================================= */

function updateCamera() {

  if (!player) return;


  if (
    cameraMode ===
    "first"
  ) {

    const eye =
      new THREE.Vector3(
        0,
        1.7,
        0
      );

    eye.applyQuaternion(
      player.quaternion
    );

    camera.position.copy(
      player.position
    );

    camera.position.y +=
      crouching
        ? 1.25
        : 1.7;

    camera.rotation.order =
      "YXZ";

    camera.rotation.y =
      yaw;

    camera.rotation.x =
      pitch;

    return;

  }


  /* THIRD PERSON */

  const distance = 6;

  const height =
    crouching
      ? 2.1
      : 2.7;


  const offset =
    new THREE.Vector3(
      Math.sin(yaw) *
      distance,

      height,

      Math.cos(yaw) *
      distance
    );


  camera.position.copy(
    player.position
  );

  camera.position.add(
    offset
  );


  camera.lookAt(
    player.position.x,
    player.position.y +
      1.25,
    player.position.z
  );

}


/* =========================================================
   SHOOTING
========================================================= */

function shoot() {

  if (
    !gameStarted ||
    gameOver
  ) {

    return;

  }


  const now =
    performance.now();


  const weapon =
    weapons[
      currentWeapon
    ];


  if (
    now - lastShot <
    weapon.fireRate
  ) {

    return;

  }


  if (
    mag <= 0
  ) {

    reload();

    return;

  }


  lastShot = now;

  mag--;

  updateHUD();


  /* muzzle flash */

  createMuzzleFlash();


  /* Ray */

  const raycaster =
    new THREE.Raycaster();


  const center =
    new THREE.Vector2(
      0,
      0
    );


  raycaster.setFromCamera(
    center,
    camera
  );


  const targets = [];


  bots.forEach(
    bot => {

      if (
        bot.alive
      ) {

        bot.group.traverse(
          object => {

            if (
              object.isMesh
            ) {

              targets.push(
                object
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


  if (
    hits.length
  ) {

    let object =
      hits[0].object;


    let parent =
      object;


    while (
      parent &&
      !bots.some(
        bot =>
          bot.group ===
          parent
      )
    ) {

      parent =
        parent.parent;

    }


    const bot =
      bots.find(
        b =>
          b.group ===
          parent
      );


    if (bot) {

      let damage =
        weapon.damage;


      if (
        currentWeapon ===
        3
      ) {

        damage *=
          random(
            .8,
            1.4
          );

      }


      bot.health -=
        damage;


      createHitEffect(
        hits[0].point
      );


      if (
        bot.health <= 0
      ) {

        killBot(
          bot
        );

      }

    }

  }


  if (
    shooting
  ) {

    setTimeout(
      () => {

        if (
          shooting
        ) {

          shoot();

        }

      },
      weapon.fireRate
    );

  }

}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function createMuzzleFlash() {

  if (
    !weaponModel
  ) return;


  const flash =
    new THREE.PointLight(
      0xffc96a,
      6,
      5
    );


  flash.position.set(
    0,
    1.4,
    -1.3
  );


  player.add(
    flash
  );


  setTimeout(
    () => {

      player.remove(
        flash
      );

    },
    45
  );

}


/* =========================================================
   HIT EFFECT
========================================================= */

function createHitEffect(
  position
) {

  const geo =
    new THREE.SphereGeometry(
      .12,
      8,
      8
    );


  const mat =
    new THREE.MeshBasicMaterial({
      color: 0xff6b42
    });


  const mesh =
    new THREE.Mesh(
      geo,
      mat
    );


  mesh.position.copy(
    position
  );


  scene.add(
    mesh
  );


  setTimeout(
    () => {

      scene.remove(
        mesh
      );

    },
    150
  );

}


/* =========================================================
   BOT AI
========================================================= */

function updateBots(dt) {

  if (
    gameOver
  ) return;


  bots.forEach(
    bot => {

      if (
        !bot.alive
      ) return;


      const distance =
        bot.group.position.distanceTo(
          player.position
        );


      /* Follow player */

      if (
        distance < 65
      ) {

        const direction =
          new THREE.Vector3()
            .subVectors(
              player.position,
              bot.group.position
            );

        direction.y = 0;

        if (
          direction.lengthSq() >
          1
        ) {

          direction.normalize();

          bot.group.position.addScaledVector(
            direction,
            bot.speed *
            dt
          );

          bot.group.rotation.y =
            Math.atan2(
              direction.x,
              direction.z
            );

        }


        bot.fireTimer -=
          dt;


        if (
          bot.fireTimer <= 0 &&
          distance < 45
        ) {

          bot.fireTimer =
            random(
              .7,
              1.8
            );

          botShoot(
            bot,
            distance
          );

        }

      } else {

        /* Random patrol */

        bot.targetTimer -=
          dt;


        if (
          bot.targetTimer <= 0
        ) {

          bot.targetTimer =
            random(
              1,
              4
            );

          bot.direction.set(
            random(
              -1,
              1
            ),
            0,
            random(
              -1,
              1
            )
          );

          bot.direction.normalize();

        }


        bot.group.position.addScaledVector(
          bot.direction,
          bot.speed *
          .45 *
          dt
        );

      }


      bot.group.position.x =
        clamp(
          bot.group.position.x,
          -120,
          120
        );

      bot.group.position.z =
        clamp(
          bot.group.position.z,
          -120,
          120
        );


      /* Zone damage */

      const dist =
        Math.sqrt(
          bot.group.position.x *
          bot.group.position.x +

          bot.group.position.z *
          bot.group.position.z
        );


      if (
        dist >
        safeZoneRadius
      ) {

        bot.health -=
          3 * dt;

      }


      if (
        bot.health <= 0
      ) {

        killBot(
          bot
        );

      }

    }
  );

}


/* =========================================================
   BOT SHOOT
========================================================= */

function botShoot(
  bot,
  distance
) {

  if (
    Math.random() >
    .72
  ) {

    return;

  }


  const accuracy =
    clamp(
      1 -
      distance /
      70,
      .15,
      .8
    );


  if (
    Math.random() >
    accuracy
  ) {

    return;

  }


  let damage =
    random(
      5,
      12
    );


  if (
    armor > 0
  ) {

    const absorbed =
      Math.min(
        armor,
        damage * .6
      );

    armor -=
      absorbed;

    damage -=
      absorbed;

  }


  health -=
    damage;


  damageEl.style.background =
    "rgba(255,0,0,.22)";


  setTimeout(
    () => {

      damageEl.style.background =
        "rgba(255,0,0,0)";

    },
    80
  );


  updateHUD();


  if (
    health <= 0
  ) {

    eliminatePlayer();

  }

}


/* =========================================================
   BOT DEATH
========================================================= */

function killBot(
  bot
) {

  if (
    !bot.alive
  ) return;


  bot.alive = false;


  showKill(
    "YOU",
    "ELIMINATED",
    "ENEMY"
  );


  bot.group.rotation.x =
    -Math.PI / 2;


  setTimeout(
    () => {

      scene.remove(
        bot.group
      );

    },
    800
  );


  updateAlive();


  checkVictory();

}


/* =========================================================
   VICTORY
========================================================= */

function checkVictory() {

  const aliveBots =
    bots.filter(
      b =>
        b.alive
    ).length;


  if (
    aliveBots === 0 &&
    gameStarted
  ) {

    gameOver = true;

    showToast(
      "YOU ARE THE LAST ALIVE"
    );

    setTimeout(
      () => {

        alert(
          "VICTORY — YOU ARE THE LAST ALIVE"
        );

      },
      100
    );

  }

}


/* =========================================================
   PLAYER DEATH
========================================================= */

function eliminatePlayer() {

  if (
    gameOver
  ) return;


  gameOver = true;

  shooting = false;

  death.style.display =
    "flex";


  if (
    document.pointerLockElement
  ) {

    document.exitPointerLock();

  }

}


/* =========================================================
   RELOAD
========================================================= */

function reload() {

  const weapon =
    weapons[
      currentWeapon
    ];


  if (
    mag >=
    weapon.magazine
  ) {

    return;

  }


  if (
    reserveAmmo <= 0
  ) {

    return;

  }


  const needed =
    weapon.magazine -
    mag;


  const amount =
    Math.min(
      needed,
      reserveAmmo
    );


  mag += amount;

  reserveAmmo -= amount;

  updateHUD();

  showToast(
    "RELOADED"
  );

}


/* =========================================================
   MEDKIT
========================================================= */

function useMedkit() {

  if (
    health >= 100
  ) {

    return;

  }


  health =
    Math.min(
      100,
      health + 35
    );


  updateHUD();

  showToast(
    "MEDKIT USED"
  );

}


/* =========================================================
   WEAPON SWITCH
========================================================= */

function switchWeapon(
  weapon
) {

  currentWeapon =
    weapon;


  const data =
    weapons[
      currentWeapon
    ];


  weaponName.textContent =
    data.name;


  if (
    mag >
    data.magazine
  ) {

    mag =
      data.magazine;

  }


  updateHUD();

  showToast(
    data.name
  );

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  hpEl.textContent =
    Math.max(
      0,
      Math.round(
        health
      )
    );

  armorEl.textContent =
    Math.max(
      0,
      Math.round(
        armor
      )
    );


  hpbar.style.width =
    clamp(
      health,
      0,
      100
    ) + "%";


  armorbar.style.width =
    clamp(
      armor,
      0,
      100
    ) + "%";


  magEl.textContent =
    mag;

  reserveEl.textContent =
    reserveAmmo;

}


/* =========================================================
   ALIVE COUNT
========================================================= */

function updateAlive() {

  const botAlive =
    bots.filter(
      bot =>
        bot.alive
    ).length;


  aliveEl.textContent =
    botAlive + 1;

}


/* =========================================================
   KILL FEED
========================================================= */

function showKill(
  a,
  action,
  b
) {

  const item =
    document.createElement(
      "div"
    );

  item.className =
    "kill";

  item.textContent =
    `${a}  ${action}  ${b}`;


  killfeed.prepend(
    item
  );


  setTimeout(
    () => {

      item.remove();

    },
    3500
  );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {

  toast.textContent =
    message;

  toast.style.opacity =
    "1";


  clearTimeout(
    window.__toastTimer
  );


  window.__toastTimer =
    setTimeout(
      () => {

        toast.style.opacity =
          "0";

      },
      1300
    );

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

  health = 100;

  armor = 65;

  mag = 30;

  reserveAmmo = 120;

  currentWeapon = 1;

  crouching = false;

  sprinting = false;

  velocityY = 0;

  gameOver = false;

  shooting = false;


  player.position.set(
    0,
    0,
    0
  );


  bots.forEach(
    bot => {

      scene.remove(
        bot.group
      );

    }
  );


  createBots(11);


  safeZoneRadius = 115;

  safeZoneTarget = 115;

  zoneShrinkTimer = 0;


  weaponName.textContent =
    weapons[1].name;


  modeEl.textContent =
    "THIRD PERSON";


  updateHUD();

  updateAlive();

}


/* =========================================================
   ZONE UPDATE
========================================================= */

function updateZone(
  dt
) {

  zoneShrinkTimer +=
    dt;


  if (
    zoneShrinkTimer >
    15
  ) {

    zoneShrinkTimer = 0;

    safeZoneTarget =
      Math.max(
        25,
        safeZoneTarget -
        15
      );

  }


  safeZoneRadius +=
    (
      safeZoneTarget -
      safeZoneRadius
    ) *
    dt *
    .08;


  if (
    zoneMesh
  ) {

    zoneMesh.scale.set(
      safeZoneRadius /
      115,

      safeZoneRadius /
      115,

      1
    );

  }


  zoneEl.textContent =
    `ZONE ${Math.round(
      safeZoneRadius /
      115 *
      100
    )}%`;

}


/* =========================================================
   ANIMATION
========================================================= */

function animate() {

  requestAnimationFrame(
    animate
  );


  if (!renderer) {
    return;
  }


  const dt =
    Math.min(
      clock.getDelta(),
      .05
    );


  if (
    gameStarted &&
    !gameOver
  ) {

    updatePlayer(
      dt
    );

    updateBots(
      dt
    );

    updateZone(
      dt
    );

    updateAlive();

  }


  renderer.render(
    scene,
    camera
  );

}


/* =========================================================
   RESIZE
========================================================= */

function onResize() {

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


/* =========================================================
   INITIAL BOOT
========================================================= */

window.addEventListener(
  "load",
  () => {

    /*
      We initialize only after
      Three.js has loaded.
    */

    try {

      init();

    } catch (error) {

      console.error(
        "LAST//ALIVE INIT ERROR:",
        error
      );

      showToast(
        "GAME ENGINE ERROR"
      );

    }

  }
);

})();
