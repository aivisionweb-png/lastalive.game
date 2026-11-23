import * as THREE from "three";

import {
  GLTFLoader
} from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";


/* =========================================================
   DOM
========================================================= */

const $ = id =>
  document.getElementById(id);


/* =========================================================
   CORE
========================================================= */

let scene;
let camera;
let renderer;
let clock;

let mapRoot;
let mapReady = false;

let player;
let playerGun;

let running = false;

let yaw = 0;
let pitch = -0.12;

let cameraMode = 3;

let lastFrameTime = 0;


/* =========================================================
   INPUT
========================================================= */

const keys = {};


/* =========================================================
   GAME OBJECTS
========================================================= */

const enemies = [];
const pickups = [];
const tracers = [];


/* =========================================================
   PLAYER STATS
========================================================= */

let health = 100;
let armor = 100;

let kills = 0;

let aliveCount = 12;

let medkits = 2;


/* =========================================================
   MOVEMENT
========================================================= */

let onGround = true;

let jumpVelocity = 0;

let crouching = false;


/* =========================================================
   COMBAT
========================================================= */

let lastShot = 0;

let reloading = false;


/* =========================================================
   MAP
========================================================= */

const MAP_FILE =
  "./free_fire_ful_map.glb";

let mapSize =
  new THREE.Vector3(
    142,
    40,
    142
  );

let mapHalfSize = 68;


/* =========================================================
   ZONE
========================================================= */

let zoneRadius = 62;

let zoneDamageTimer = 0;

let zoneRing;


/* =========================================================
   WEAPONS
========================================================= */

const weapons = [

  {
    name: "AR-01",

    damage: 32,

    fireRate: 110,

    mag: 30,

    ammo: 30,

    reserve: 150,

    spread: 0.018,

    pellets: 1
  },


  {
    name: "SMG-9",

    damage: 19,

    fireRate: 65,

    mag: 40,

    ammo: 40,

    reserve: 200,

    spread: 0.035,

    pellets: 1
  },


  {
    name: "M12",

    damage: 15,

    fireRate: 650,

    mag: 6,

    ammo: 6,

    reserve: 48,

    spread: 0.12,

    pellets: 8
  }

];

let currentWeapon = 0;


/* =========================================================
   START GAME
========================================================= */

function startGame() {

  const name =
    $("name").value.trim();


  if (!name) {

    $("name").focus();

    $("name").placeholder =
      "ENTER PLAYER NAME";

    return;

  }


  $("start").style.display =
    "none";


  $("loading").style.display =
    "flex";


  initGame();

}


/* =========================================================
   INIT
========================================================= */

function initGame() {

  scene =
    new THREE.Scene();


  scene.background =
    new THREE.Color(
      0x8daeb7
    );


  scene.fog =
    new THREE.FogExp2(
      0x8daeb7,
      0.003
    );


  camera =
    new THREE.PerspectiveCamera(

      68,

      innerWidth /
      innerHeight,

      0.1,

      2000

    );


  renderer =
    new THREE.WebGLRenderer({

      antialias: true,

      powerPreference:
        "high-performance"

    });


  renderer.setSize(
    innerWidth,
    innerHeight
  );


  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      1.7
    )
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


  renderer.toneMappingExposure =
    1.1;


  renderer.shadowMap.enabled =
    true;


  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  renderer.setClearColor(
    0x8daeb7,
    1
  );


  document.body.appendChild(
    renderer.domElement
  );


  clock =
    new THREE.Clock();


  setupLighting();

  createSky();

  createPlayer();

  createZone();

  createEnemies();

  createPickups();

  setupControls();

  loadMap();

}


/* =========================================================
   LIGHTING
========================================================= */

function setupLighting() {

  const hemisphere =
    new THREE.HemisphereLight(

      0xdaf4ff,

      0x29362c,

      2.3

    );


  scene.add(
    hemisphere
  );


  const sun =
    new THREE.DirectionalLight(

      0xffefd0,

      4.0

    );


  sun.position.set(
    -180,
    300,
    160
  );


  sun.castShadow =
    true;


  sun.shadow.mapSize.width =
    2048;


  sun.shadow.mapSize.height =
    2048;


  sun.shadow.camera.left =
    -150;


  sun.shadow.camera.right =
    150;


  sun.shadow.camera.top =
    150;


  sun.shadow.camera.bottom =
    -150;


  sun.shadow.camera.near =
    1;


  sun.shadow.camera.far =
    700;


  scene.add(
    sun
  );


  const fill =
    new THREE.DirectionalLight(

      0x8dbdff,

      .7

    );


  fill.position.set(
    150,
    100,
    -200
  );


  scene.add(
    fill
  );

}


/* =========================================================
   SKY
========================================================= */

function createSky() {

  const sky =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        900,
        32,
        16
      ),

      new THREE.MeshBasicMaterial({

        color:
          0x9abcc5,

        side:
          THREE.BackSide

      })

    );


  scene.add(
    sky
  );

}


/* =========================================================
   LOAD ACTUAL GLB
========================================================= */

function loadMap() {

  const loader =
    new GLTFLoader();


  loader.load(

    MAP_FILE,


    gltf => {

      mapRoot =
        gltf.scene;


      mapRoot.traverse(
        object => {

          if (
            object.isMesh
          ) {

            object.castShadow =
              true;

            object.receiveShadow =
              true;


            if (
              object.material
            ) {

              object.material
                .needsUpdate =
                true;

            }

          }

        }
      );


      scene.add(
        mapRoot
      );


      /*
       * Calculate actual GLB bounds.
       */

      const box =
        new THREE.Box3()
          .setFromObject(
            mapRoot
          );


      const center =
        box.getCenter(
          new THREE.Vector3()
        );


      mapSize =
        box.getSize(
          new THREE.Vector3()
        );


      console.log(
        "GLB SIZE:",
        mapSize
      );


      /*
       * Center map around
       * world origin.
       */

      mapRoot.position.x -=
        center.x;


      mapRoot.position.z -=
        center.z;


      /*
       * Slightly lift map
       * to avoid clipping.
       */

      mapRoot.position.y +=
        0.0;


      /*
       * Calculate playable
       * boundary from GLB.
       */

      mapHalfSize =
        Math.max(

          20,

          Math.min(

            mapSize.x,

            mapSize.z

          ) / 2 -
          4

        );


      /*
       * Spawn player in
       * center of map.
       */

      player.position.set(
        0,
        3,
        0
      );


      /*
       * Put enemies into
       * map area.
       */

      repositionEnemies();


      /*
       * Zone based on map.
       */

      zoneRadius =
        Math.min(
          62,
          mapHalfSize - 5
        );


      /*
       * Ready.
       */

      mapReady =
        true;


      $("loading-text")
        .textContent =
        "DISTRICT READY";


      $("loading-progress")
        .style.width =
        "100%";


      setTimeout(
        enterDistrict,
        350
      );

    },


    progress => {

      if (
        progress.total
      ) {

        const percent =
          Math.round(

            progress.loaded /
            progress.total *
            100

          );


        $("loading-progress")
          .style.width =
          percent + "%";


        $("loading-text")
          .textContent =
          `LOADING DISTRICT ${percent}%`;

      } else {

        $("loading-text")
          .textContent =
          "LOADING DISTRICT...";

      }

    },


    error => {

      console.error(
        "GLB ERROR:",
        error
      );


      $("loading-text")
        .textContent =
        "MAP LOAD FAILED";


      setTimeout(
        () => {

          alert(

            "free_fire_ful_map.glb load nahi hua.\n\n" +

            "Check:\n" +

            "1. GLB root folder mein hai\n" +

            "2. Naam exactly free_fire_ful_map.glb hai\n" +

            "3. Vercel deployment mein file included hai"

          );

        },
        100
      );

    }

  );

}


/* =========================================================
   ENTER DISTRICT
========================================================= */

function enterDistrict() {

  if (
    !mapReady
  ) {

    return;

  }


  $("loading").style.display =
    "none";


  $("hud").style.display =
    "block";


  running =
    true;


  clock.start();


  updateHUD();


  /*
   * Put player on actual
   * map surface.
   */

  snapPlayerToMap();


  requestAnimationFrame(
    gameLoop
  );


  setTimeout(
    () => {

      renderer.domElement
        .requestPointerLock?.();

    },
    250
  );

}


/* =========================================================
   PLAYER
========================================================= */

function createPlayer() {

  player =
    new THREE.Group();


  /*
   * LEGS
   */

  const pants =
    new THREE.MeshStandardMaterial({

      color:
        0x171c20,

      roughness:
        .75

    });


  const leftLeg =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.05,
        4,
        1.05
      ),

      pants

    );


  leftLeg.position.set(
    -.62,
    2,
    0
  );


  leftLeg.castShadow =
    true;


  player.add(
    leftLeg
  );


  const rightLeg =
    leftLeg.clone();


  rightLeg.position.x =
    .62;


  player.add(
    rightLeg
  );


  /*
   * BODY
   */

  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        1.55,
        2.8,
        6,
        12
      ),

      new THREE.MeshStandardMaterial({

        color:
          0x26363b,

        roughness:
          .65

      })

    );


  body.position.y =
    5.7;


  body.castShadow =
    true;


  player.add(
    body
  );


  /*
   * VEST
   */

  const vest =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        3.1,
        2.6,
        2.0
      ),

      new THREE.MeshStandardMaterial({

        color:
          0x3a4a4f,

        roughness:
          .6

      })

    );


  vest.position.y =
    5.8;


  vest.castShadow =
    true;


  player.add(
    vest
  );


  /*
   * HEAD
   */

  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1.28,
        24,
        16
      ),

      new THREE.MeshStandardMaterial({

        color:
          0xd49a72,

        roughness:
          .8

      })

    );


  head.position.y =
    9.25;


  head.castShadow =
    true;


  player.add(
    head
  );


  /*
   * HAIR
   */

  const hair =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1.34,
        20,
        12
      ),

      new THREE.MeshStandardMaterial({

        color:
          0x17191b

      })

    );


  hair.scale.y =
    .55;


  hair.position.y =
    10.1;


  player.add(
    hair
  );


  /*
   * GUN
   */

  playerGun =
    createGun();


  playerGun.position.set(
    1.4,
    6,
    -1.4
  );


  playerGun.rotation.y =
    Math.PI;


  player.add(
    playerGun
  );


  player.userData.gun =
    playerGun;


  /*
   * SPAWN
   */

  player.position.set(
    0,
    3,
    0
  );


  scene.add(
    player
  );

}


/* =========================================================
   GUN MODEL
========================================================= */

function createGun() {

  const gun =
    new THREE.Group();


  const dark =
    new THREE.MeshStandardMaterial({

      color:
        0x111517,

      metalness:
        .8,

      roughness:
        .25

    });


  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        .65,
        .6,
        3.5
      ),

      dark

    );


  gun.add(
    body
  );


  const barrel =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        .11,
        .11,
        2.3,
        10
      ),

      dark

    );


  barrel.rotation.x =
    Math.PI / 2;


  barrel.position.z =
    -2.55;


  gun.add(
    barrel
  );


  const stock =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        .65,
        .72,
        1.2
      ),

      dark

    );


  stock.position.z =
    1.8;


  gun.add(
    stock
  );


  return gun;

}


/* =========================================================
   ENEMIES
========================================================= */

function createEnemies() {

  const spawnPoints = [

    [-48, 3, -48],

    [-20, 3, -52],

    [15, 3, -50],

    [45, 3, -35],

    [50, 3, 5],

    [42, 3, 35],

    [15, 3, 48],

    [-18, 3, 50],

    [-48, 3, 35],

    [-52, 3, 5],

    [-35, 3, -25]

  ];


  spawnPoints.forEach(
    (point, index) => {

      createEnemy(
        point[0],
        point[1],
        point[2],
        index
      );

    }
  );

}


/* =========================================================
   ENEMY MODEL
========================================================= */

function createEnemy(
  x,
  y,
  z,
  index
) {

  const enemy =
    new THREE.Group();


  /*
   * Enemy scale.
   */

  enemy.scale.setScalar(
    .8
  );


  const dark =
    new THREE.MeshStandardMaterial({

      color:
        0x17191c,

      roughness:
        .75

    });


  const jacket =
    new THREE.MeshStandardMaterial({

      color:
        0x70292a,

      roughness:
        .7

    });


  /*
   * Legs
   */

  const leg =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.05,
        4,
        1.05
      ),

      dark

    );


  leg.position.set(
    -.62,
    2,
    0
  );


  enemy.add(
    leg
  );


  const leg2 =
    leg.clone();


  leg2.position.x =
    .62;


  enemy.add(
    leg2
  );


  /*
   * Body
   */

  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        1.5,
        2.7,
        5,
        10
      ),

      jacket

    );


  body.position.y =
    5.6;


  enemy.add(
    body
  );


  /*
   * Head
   */

  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1.25,
        20,
        14
      ),

      new THREE.MeshStandardMaterial({

        color:
          0xc58e6c

      })

    );


  head.position.y =
    9.15;


  enemy.add(
    head
  );


  /*
   * Gun
   */

  const gun =
    createGun();


  gun.scale.setScalar(
    .75
  );


  gun.position.set(
    1.3,
    5.8,
    -1.2
  );


  enemy.add(
    gun
  );


  enemy.position.set(
    x,
    y,
    z
  );


  enemy.userData = {

    health:
      100,

    maxHealth:
      100,

    alive:
      true,

    speed:
      3 +
      Math.random() * 1.5,

    attackTimer:
      Math.random(),

    seed:
      Math.random() * 100,

    index

  };


  enemy.traverse(
    object => {

      if (
        object.isMesh
      ) {

        object.castShadow =
          true;

      }

    }
  );


  scene.add(
    enemy
  );


  enemies.push(
    enemy
  );

}


/* =========================================================
   REPOSITION ENEMIES
========================================================= */

function repositionEnemies() {

  const radius =
    Math.max(
      15,
      mapHalfSize - 10
    );


  enemies.forEach(
    (enemy, index) => {

      const angle =
        index /
        enemies.length *
        Math.PI *
        2;


      const r =
        radius *
        (.55 +
        Math.random() *
        .25);


      enemy.position.x =
        Math.cos(angle) *
        r;


      enemy.position.z =
        Math.sin(angle) *
        r;


      enemy.position.y =
        3;

    }
  );

}


/* =========================================================
   PICKUPS
========================================================= */

function createPickups() {

  const locations = [

    [-38, 4, -25],

    [35, 4, -28],

    [42, 4, 25],

    [-40, 4, 30],

    [0, 4, 42],

    [0, 4, -42]

  ];


  locations.forEach(
    (location, index) => {

      createPickup(

        location[0],

        location[1],

        location[2],

        index % 2 === 0
          ? "ARMOR"
          : "MEDKIT"

      );

    }
  );

}


/* =========================================================
   PICKUP
========================================================= */

function createPickup(
  x,
  y,
  z,
  type
) {

  const color =
    type === "ARMOR"
      ? 0x2dbaff
      : 0x43ff8a;


  const pickup =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.8,
        1.8,
        1.8
      ),

      new THREE.MeshStandardMaterial({

        color,

        emissive:
          color,

        emissiveIntensity:
          .45

      })

    );


  pickup.position.set(
    x,
    y,
    z
  );


  pickup.userData.type =
    type;


  pickup.castShadow =
    true;


  scene.add(
    pickup
  );


  pickups.push(
    pickup
  );

}


/* =========================================================
   SAFE ZONE
========================================================= */

function createZone() {

  const geometry =
    new THREE.RingGeometry(
      1,
      1.4,
      96
    );


  const material =
    new THREE.MeshBasicMaterial({

      color:
        0x42ff9b,

      transparent:
        true,

      opacity:
        .85,

      side:
        THREE.DoubleSide

    });


  zoneRing =
    new THREE.Mesh(
      geometry,
      material
    );


  zoneRing.rotation.x =
    -Math.PI / 2;


  zoneRing.position.y =
    .15;


  zoneRing.scale.set(
    zoneRadius,
    zoneRadius,
    zoneRadius
  );


  scene.add(
    zoneRing
  );

}


/* =========================================================
   CONTROLS
========================================================= */

function setupControls() {

  window.addEventListener(
    "keydown",
    event => {

      keys[event.code] =
        true;


      if (
        event.code ===
        "Digit1"
      ) {

        switchWeapon(
          0
        );

      }


      if (
        event.code ===
        "Digit2"
      ) {

        switchWeapon(
          1
        );

      }


      if (
        event.code ===
        "Digit3"
      ) {

        switchWeapon(
          2
        );

      }


      if (
        event.code ===
        "KeyR"
      ) {

        reload();

      }


      if (
        event.code ===
        "KeyV"
      ) {

        cameraMode =
          cameraMode === 3
            ? 1
            : 3;

      }


      if (
        event.code ===
        "KeyG"
      ) {

        useMedkit();

      }


      if (
        event.code ===
        "Space" &&
        onGround
      ) {

        jumpVelocity =
          10.5;

        onGround =
          false;

      }

    }
  );


  window.addEventListener(
    "keyup",
    event => {

      keys[event.code] =
        false;

    }
  );


  document.addEventListener(
    "mousemove",
    event => {

      if (
        document.pointerLockElement !==
        renderer.domElement
      ) {

        return;

      }


      yaw -=
        event.movementX *
        .0023;


      pitch -=
        event.movementY *
        .002;


      pitch =
        THREE.MathUtils.clamp(
          pitch,
          -1.0,
          .6
        );

    }
  );


  document.addEventListener(
    "mousedown",
    event => {

      if (
        document.pointerLockElement !==
        renderer.domElement
      ) {

        renderer.domElement
          .requestPointerLock?.();

        return;

      }


      if (
        event.button === 0
      ) {

        shoot();

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


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(
  dt
) {

  if (
    !player
  ) {

    return;

  }


  let forward = 0;

  let side = 0;


  if (
    keys["KeyW"] ||
    keys["ArrowUp"]
  ) {

    forward++;

  }


  if (
    keys["KeyS"] ||
    keys["ArrowDown"]
  ) {

    forward--;

  }


  if (
    keys["KeyA"] ||
    keys["ArrowLeft"]
  ) {

    side--;

  }


  if (
    keys["KeyD"] ||
    keys["ArrowRight"]
  ) {

    side++;

  }


  const length =
    Math.hypot(
      forward,
      side
    );


  crouching =
    keys["KeyC"] ||
    keys["ControlLeft"];


  if (
    length > 0
  ) {

    forward /=
      length;

    side /=
      length;


    let speed =
      keys["ShiftLeft"] ||
      keys["ShiftRight"]
        ? 15
        : 8.5;


    if (
      crouching
    ) {

      speed *=
        .55;

    }


    const sin =
      Math.sin(
        yaw
      );


    const cos =
      Math.cos(
        yaw
      );


    player.position.x +=

      (
        side * cos +
        forward * sin
      )
      *
      speed
      *
      dt;


    player.position.z +=

      (
        side * sin -
        forward * cos
      )
      *
      speed
      *
      dt;


    player.rotation.y =
      yaw;

  }


  /*
   * Jump physics.
   */

  if (
    !onGround
  ) {

    jumpVelocity -=
      25 * dt;


    player.position.y +=
      jumpVelocity * dt;


    if (
      player.position.y <= 0
    ) {

      player.position.y =
        0;


      jumpVelocity =
        0;


      onGround =
        true;

    }

  }


  /*
   * Keep inside actual map.
   */

  const limit =
    Math.max(
      10,
      mapHalfSize - 3
    );


  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -limit,
      limit
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -limit,
      limit
    );


  /*
   * Follow map surface.
   */

  if (
    onGround &&
    mapReady
  ) {

    snapPlayerToMap();

  }

}


/* =========================================================
   SNAP PLAYER TO GLB
========================================================= */

function snapPlayerToMap() {

  if (
    !mapRoot ||
    !player
  ) {

    return;

  }


  const raycaster =
    new THREE.Raycaster();


  const origin =
    new THREE.Vector3(

      player.position.x,

      100,

      player.position.z

    );


  const direction =
    new THREE.Vector3(
      0,
      -1,
      0
    );


  raycaster.set(
    origin,
    direction
  );


  const hits =
    raycaster.intersectObject(
      mapRoot,
      true
    );


  if (
    hits.length
  ) {

    const groundY =
      hits[0].point.y;


    /*
     * Player origin is at feet.
     */

    player.position.y =
      groundY;

  } else {

    /*
     * Fallback.
     */

    player.position.y =
      0;

  }

}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

  if (
    !player
  ) {

    return;

  }


  /*
   * FIRST PERSON
   */

  if (
    cameraMode === 1
  ) {

    const head =
      new THREE.Vector3(
        0,
        8.8,
        0
      );


    player.localToWorld(
      head
    );


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


  /*
   * THIRD PERSON
   */

  const distance =
    crouching
      ? 5.5
      : 7;


  const height =
    crouching
      ? 6.8
      : 8;


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
    target
      .clone()
      .add(offset);


  /*
   * Camera collision with map.
   */

  const cameraRay =
    new THREE.Raycaster();


  const cameraDirection =
    desired
      .clone()
      .sub(target)
      .normalize();


  cameraRay.set(
    target,
    cameraDirection
  );


  if (
    mapRoot
  ) {

    const hits =
      cameraRay.intersectObject(
        mapRoot,
        true
      );


    if (
      hits.length &&
      hits[0].distance <
      distance
    ) {

      desired.copy(
        hits[0].point
      );

      desired.addScaledVector(
        cameraDirection,
        -.35
      );

    }

  }


  camera.position.lerp(
    desired,
    .16
  );


  camera.lookAt(
    target
  );

}


/* =========================================================
   SHOOT
========================================================= */

function shoot() {

  if (
    !running ||
    reloading
  ) {

    return;

  }


  const weapon =
    weapons[
      currentWeapon
    ];


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


  lastShot =
    now;


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


  muzzleFlash();


  updateHUD();

}


/* =========================================================
   FIRE RAY
========================================================= */

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
      .5
    )
    *
    weapon.spread;


  direction.y +=

    (
      Math.random() -
      .5
    )
    *
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
      ) {

        return;

      }


      enemy.traverse(
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
  );


  const hits =
    raycaster.intersectObjects(
      targets,
      false
    );


  if (
    !hits.length
  ) {

    return;

  }


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


  if (
    enemy
  ) {

    damageEnemy(
      enemy,
      weapon.damage
    );

  }

}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function muzzleFlash() {

  if (
    !playerGun
  ) {

    return;

  }


  const flash =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        .25,
        8,
        8
      ),

      new THREE.MeshBasicMaterial({

        color:
          0xffc34a

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


  scene.add(
    flash
  );


  setTimeout(
    () => {

      scene.remove(
        flash
      );

    },
    45
  );

}


/* =========================================================
   DAMAGE ENEMY
========================================================= */

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
    enemy.userData.health <= 0
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


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemies(
  dt
) {

  if (
    !player
  ) {

    return;

  }


  enemies.forEach(
    enemy => {

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


      if (
        distance <
        70
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

            Math.sin(
              angle
            )
            *
            enemy.userData.speed
            *
            dt;


          enemy.position.z +=

            -Math.cos(
              angle
            )
            *
            enemy.userData.speed
            *
            dt;

        }


        enemy.userData.attackTimer -=
          dt;


        if (
          distance < 28 &&
          enemy.userData.attackTimer <= 0
        ) {

          enemy.userData.attackTimer =

            .65 +
            Math.random() *
            .8;


          enemyShoot(
            enemy
          );

        }

      } else {

        /*
         * Idle patrol.
         */

        const time =
          performance.now() *
          .0003 +
          enemy.userData.seed;


        enemy.position.x +=

          Math.sin(
            time
          )
          *
          dt
          *
          .4;


        enemy.position.z +=

          Math.cos(
            time
          )
          *
          dt
          *
          .4;

      }


      /*
       * Stay in map.
       */

      const limit =
        mapHalfSize - 3;


      enemy.position.x =
        THREE.MathUtils.clamp(
          enemy.position.x,
          -limit,
          limit
        );


      enemy.position.z =
        THREE.MathUtils.clamp(
          enemy.position.z,
          -limit,
          limit
        );


      /*
       * Ground enemy.
       */

      if (
        mapReady
      ) {

        snapEnemyToMap(
          enemy
        );

      }

    }
  );

}


/* =========================================================
   ENEMY GROUND
========================================================= */

function snapEnemyToMap(
  enemy
) {

  if (
    !mapRoot
  ) {

    return;

  }


  const raycaster =
    new THREE.Raycaster();


  const origin =
    new THREE.Vector3(

      enemy.position.x,

      100,

      enemy.position.z

    );


  raycaster.set(
    origin,

    new THREE.Vector3(
      0,
      -1,
      0
    )

  );


  const hits =
    raycaster.intersectObject(
      mapRoot,
      true
    );


  if (
    hits.length
  ) {

    enemy.position.y =
      hits[0].point.y;

  }

}


/* =========================================================
   ENEMY SHOOT
========================================================= */

function enemyShoot(
  enemy
) {

  if (
    Math.random() >
    .4
  ) {

    return;

  }


  const distance =
    player.position.distanceTo(
      enemy.position
    );


  let damage =
    6 +
    Math.random() *
    8;


  if (
    distance < 12
  ) {

    damage *=
      1.5;

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

  if (
    !running
  ) {

    return;

  }


  const armorDamage =
    Math.min(
      armor,
      damage * .6
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


  flashDamage();


  updateHUD();


  if (
    health <= 0
  ) {

    finishGame(
      false
    );

  }

}


/* =========================================================
   DAMAGE FLASH
========================================================= */

function flashDamage() {

  $("damage").style.opacity =
    ".8";


  setTimeout(
    () => {

      $("damage").style.opacity =
        "0";

    },
    120
  );

}


/* =========================================================
   WEAPON SWITCH
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


  reloading =
    false;


  updateHUD();

}


/* =========================================================
   RELOAD
========================================================= */

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


  reloading =
    true;


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


      reloading =
        false;


      updateHUD();

    },
    1400
  );

}


/* =========================================================
   MEDKIT
========================================================= */

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


/* =========================================================
   PICKUPS UPDATE
========================================================= */

function updatePickups(
  dt
) {

  pickups.forEach(
    pickup => {

      if (
        !pickup.visible
      ) {

        return;

      }


      pickup.rotation.y +=
        dt * 1.5;


      pickup.position.y +=

        Math.sin(
          performance.now() *
          .003
        )
        *
        dt
        *
        .5;


      const distance =
        pickup.position.distanceTo(
          player.position
        );


      if (
        distance < 4
      ) {

        if (
          pickup.userData.type ===
          "ARMOR"
        ) {

          armor =
            Math.min(
              100,
              armor + 35
            );

        }


        if (
          pickup.userData.type ===
          "MEDKIT"
        ) {

          medkits++;

        }


        pickup.visible =
          false;


        updateHUD();

      }

    }
  );

}


/* =========================================================
   ZONE UPDATE
========================================================= */

function updateZone(
  dt
) {

  if (
    zoneRadius > 12
  ) {

    zoneRadius -=
      .22 * dt;

  }


  if (
    zoneRing
  ) {

    zoneRing.scale.set(
      zoneRadius,
      zoneRadius,
      zoneRadius
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

    zoneDamageTimer +=
      dt;


    if (
      zoneDamageTimer >
      .35
    ) {

      zoneDamageTimer =
        0;


      damagePlayer(
        3
      );

    }

  } else {

    zoneDamageTimer =
      0;

  }


  $("zone").textContent =
    Math.round(
      zoneRadius
    ) + "m";

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  const weapon =
    weapons[
      currentWeapon
    ];


  $("health").textContent =
    Math.ceil(
      health
    );


  $("armor").textContent =
    Math.ceil(
      armor
    );


  $("ammo").textContent =
    weapon.ammo +
    " / " +
    weapon.reserve;


  $("weapon").textContent =
    weapon.name;


  $("kills").textContent =
    kills;


  $("alive").textContent =
    aliveCount;


  $("medkits").textContent =
    medkits;


  $("zone").textContent =
    Math.round(
      zoneRadius
    ) +
    "m";

}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(
  time
) {

  if (
    !running
  ) {

    return;

  }


  requestAnimationFrame(
    gameLoop
  );


  const dt =
    Math.min(
      clock.getDelta(),
      .05
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


  updateCamera();


  renderer.render(
    scene,
    camera
  );

}


/* =========================================================
   GAME OVER
========================================================= */

function finishGame(
  won
) {

  if (
    !running
  ) {

    return;

  }


  running =
    false;


  document.exitPointerLock?.();


  $("result").style.display =
    "flex";


  $("result-title").textContent =
    won
      ? "BOOYAH!"
      : "ELIMINATED";


  $("result-text").textContent =
    won

      ? `${kills} ELIMINATIONS • LAST PLAYER ALIVE`

      : `${kills} ELIMINATIONS • YOU WERE ELIMINATED`;

}


/* =========================================================
   RESIZE
========================================================= */

function resizeGame() {

  if (
    !camera ||
    !renderer
  ) {

    return;

  }


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

    $("enter")
      .addEventListener(
        "click",
        startGame
      );


    $("again")
      .addEventListener(
        "click",
        () => {

          location.reload();

        }
      );


    $("name")
      .addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Enter"
          ) {

            startGame();

          }

        }
      );

  }
);
