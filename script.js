"use strict";

const $ = id => document.getElementById(id);

let scene;
let camera;
let renderer;
let clock;

let player;
let playerGun;

let running = false;

let yaw = 0;
let pitch = -0.12;

let grounded = true;
let jumpVelocity = 0;

let crouched = false;
let sprinting = false;

let health = 100;
let armor = 65;

let kills = 0;

let ammo = 30;
let reserve = 120;

let lastShot = 0;
let reloading = false;

let zoneRadius = 360;
let zoneTimer = 0;

const keys = {};

const enemies = [];
const props = [];

const raycaster =
  new THREE.Raycaster();

const clockSpeed = 1;

const worldSize = 850;


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    init();

  }
);


/* =========================================================
   INIT
========================================================= */

function init() {

  scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(
      0x607d80
    );

  scene.fog =
    new THREE.FogExp2(
      0x607d80,
      0.0019
    );


  camera =
    new THREE.PerspectiveCamera(
      68,
      innerWidth / innerHeight,
      0.1,
      1800
    );


  renderer =
    new THREE.WebGLRenderer({
      canvas: $("game"),
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
      1.5
    )
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


  renderer.toneMappingExposure =
    1.15;


  renderer.shadowMap.enabled =
    true;


  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  clock =
    new THREE.Clock();


  setupLighting();

  createSky();

  createWorld();

  createPlayer();

  createEnemies();

  createZone();

  setupKeyboard();

  setupMouse();

  setupMobile();

  updateHUD();

  resize();


  $("playButton")
    .addEventListener(
      "click",
      startGame
    );


  $("restartButton")
    .addEventListener(
      "click",
      () => location.reload()
    );


  requestAnimationFrame(
    loop
  );
}


/* =========================================================
   LIGHTING
========================================================= */

function setupLighting() {

  const ambient =
    new THREE.HemisphereLight(
      0xcce9e5,
      0x17231e,
      2.1
    );

  scene.add(
    ambient
  );


  const sun =
    new THREE.DirectionalLight(
      0xffe3b2,
      3.4
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
    -500;

  sun.shadow.camera.right =
    500;

  sun.shadow.camera.top =
    500;

  sun.shadow.camera.bottom =
    -500;

  sun.shadow.camera.far =
    900;


  scene.add(
    sun
  );


  const blue =
    new THREE.DirectionalLight(
      0x70a8ff,
      .45
    );


  blue.position.set(
    200,
    130,
    -250
  );


  scene.add(
    blue
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
        color: 0x5c7e85,
        side:
          THREE.BackSide
      })
    );


  scene.add(
    sky
  );


  for (
    let i = 0;
    i < 18;
    i++
  ) {

    const cloud =
      new THREE.Group();


    for (
      let j = 0;
      j < 5;
      j++
    ) {

      const puff =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            7 +
            Math.random() * 8,
            10,
            8
          ),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: .22
          })
        );


      puff.position.set(
        j * 9,
        Math.random() * 5,
        Math.random() * 5
      );


      cloud.add(
        puff
      );
    }


    cloud.position.set(
      -400 +
      Math.random() * 800,

      120 +
      Math.random() * 90,

      -400 +
      Math.random() * 800
    );


    scene.add(
      cloud
    );
  }
}


/* =========================================================
   WORLD
========================================================= */

function createWorld() {

  /* WATER */

  const water =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        1500,
        1500
      ),
      new THREE.MeshStandardMaterial({
        color: 0x1c5964,
        roughness: .2,
        metalness: .2
      })
    );


  water.rotation.x =
    -Math.PI / 2;


  water.position.y =
    -3;


  scene.add(
    water
  );


  /* TERRAIN */

  const terrain =
    new THREE.Mesh(
      createTerrainGeometry(),
      new THREE.MeshStandardMaterial({
        color: 0x344a34,
        roughness: 1
      })
    );


  terrain.position.y =
    0;


  terrain.receiveShadow =
    true;


  terrain.castShadow =
    false;


  scene.add(
    terrain
  );


  /* CITY */

  createCity(
    0,
    0
  );


  /* HARBOR */

  createHarbor(
    -300,
    -190
  );


  /* MILITARY */

  createMilitary(
    290,
    -210
  );


  /* VILLAGE */

  createVillage(
    -280,
    240
  );


  /* INDUSTRIAL */

  createIndustrial(
    280,
    230
  );


  /* FOREST */

  createForest();


  /* ROADS */

  createRoads();


  /* LANDMARKS */

  createLandmarks();
}


/* =========================================================
   TERRAIN
========================================================= */

function createTerrainGeometry() {

  const segments =
    90;

  const size =
    850;

  const geometry =
    new THREE.PlaneGeometry(
      size,
      size,
      segments,
      segments
    );


  const positions =
    geometry.attributes.position;


  for (
    let i = 0;
    i < positions.count;
    i++
  ) {

    const x =
      positions.getX(i);

    const y =
      positions.getY(i);


    const distance =
      Math.sqrt(
        x * x +
        y * y
      );


    let height =
      Math.sin(
        x * .018
      ) *
      5;


    height +=
      Math.cos(
        y * .021
      ) *
      5;


    height +=
      Math.sin(
        (x + y) *
        .035
      ) *
      3;


    /* mountains around edges */

    const mountain =
      Math.max(
        0,
        distance - 230
      );


    height +=
      mountain *
      .12;


    /* city flatten */

    if (
      Math.abs(x) < 150 &&
      Math.abs(y) < 150
    ) {

      height *= .12;
    }


    positions.setZ(
      i,
      height
    );
  }


  positions.needsUpdate =
    true;


  geometry.computeVertexNormals();


  geometry.rotateX(
    -Math.PI / 2
  );


  return geometry;
}


/* =========================================================
   ROAD
========================================================= */

function road(
  x,
  z,
  width,
  length,
  rotation = 0
) {

  const mesh =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        .25,
        length
      ),
      new THREE.MeshStandardMaterial({
        color: 0x252b2b,
        roughness: .95
      })
    );


  mesh.position.set(
    x,
    3,
    z
  );


  mesh.rotation.y =
    rotation;


  mesh.receiveShadow =
    true;


  scene.add(
    mesh
  );


  return mesh;
}


function createRoads() {

  road(
    0,
    0,
    18,
    800
  );


  road(
    0,
    0,
    18,
    800,
    Math.PI / 2
  );


  road(
    0,
    -190,
    14,
    600,
    Math.PI / 2
  );


  road(
    -250,
    0,
    14,
    500
  );


  road(
    250,
    0,
    14,
    500
  );


  road(
    -210,
    210,
    12,
    330,
    -.7
  );


  road(
    230,
    210,
    12,
    330,
    .7
  );
}


/* =========================================================
   BUILDING
========================================================= */

function building(
  x,
  z,
  w,
  h,
  d,
  color
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
        roughness: .75
      })
    );


  body.position.y =
    h / 2 + 3;


  body.castShadow =
    true;


  body.receiveShadow =
    true;


  group.add(
    body
  );


  /* roof */

  const roof =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        w + 1,
        .7,
        d + 1
      ),
      new THREE.MeshStandardMaterial({
        color: 0x242a2a
      })
    );


  roof.position.y =
    h + 3.3;


  group.add(
    roof
  );


  /* windows */

  for (
    let row = 0;
    row < Math.max(
      1,
      Math.floor(
        h / 6
      )
    );
    row++
  ) {

    for (
      let col = 0;
      col < Math.max(
        2,
        Math.floor(
          w / 7
        )
      );
      col++
    ) {

      const win =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            2.2,
            2,
            .08
          ),
          new THREE.MeshBasicMaterial({
            color: 0xa7d9d7
          })
        );


      win.position.set(
        -w / 2 +
          3 +
          col * 7,

        7 +
          row * 6,

        d / 2 +
          .05
      );


      body.add(
        win
      );
    }
  }


  group.position.set(
    x,
    0,
    z
  );


  scene.add(
    group
  );


  props.push(
    group
  );
}


/* =========================================================
   CITY
========================================================= */

function createCity(
  cx,
  cz
) {

  const colors = [
    0x515c60,
    0x626a6d,
    0x454e52,
    0x596164
  ];


  for (
    let i = 0;
    i < 25;
    i++
  ) {

    const x =
      cx +
      (Math.random() - .5) *
      260;


    const z =
      cz +
      (Math.random() - .5) *
      260;


    const w =
      14 +
      Math.random() *
      20;


    const d =
      14 +
      Math.random() *
      20;


    const h =
      10 +
      Math.random() *
      42;


    building(
      x,
      z,
      w,
      h,
      d,
      colors[
        Math.floor(
          Math.random() *
          colors.length
        )
      ]
    );
  }


  /* tall tower */

  building(
    55,
    -35,
    30,
    80,
    30,
    0x343d42
  );


  building(
    -65,
    35,
    24,
    65,
    24,
    0x3d484c
  );
}


/* =========================================================
   HARBOR
========================================================= */

function createHarbor(
  x,
  z
) {

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const dock =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          15,
          1,
          60
        ),
        new THREE.MeshStandardMaterial({
          color: 0x68513d
        })
      );


    dock.position.set(
      x +
        i * 20,

      4,

      z
    );


    scene.add(
      dock
    );
  }


  for (
    let i = 0;
    i < 18;
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
            [
              0x8d3d32,
              0x315c78,
              0x697333,
              0x76532e
            ][
              i % 4
            ]
        })
      );


    container.position.set(
      x +
        (Math.random() -
          .5) *
        100,

      6 +
        Math.floor(
          Math.random() * 2
        ) *
        4,

      z +
        (Math.random() -
          .5) *
        90
    );


    container.rotation.y =
      Math.random() >
      .5
        ? 0
        : Math.PI / 2;


    container.castShadow =
      true;


    scene.add(
      container
    );
  }
}


/* =========================================================
   MILITARY
========================================================= */

function createMilitary(
  x,
  z
) {

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    building(
      x +
        (i % 3) *
        50,

      z +
        Math.floor(i / 3) *
        45,

      32,
      10 +
        Math.random() *
        8,

      25,

      0x414c48
    );
  }


  /* towers */

  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const tower =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          2,
          3,
          22,
          8
        ),
        new THREE.MeshStandardMaterial({
          color: 0x303837
        })
      );


    tower.position.set(
      x +
        (i % 2) *
        170,

      14,

      z +
        Math.floor(i / 2) *
        120
    );


    tower.castShadow =
      true;


    scene.add(
      tower
    );
  }
}


/* =========================================================
   VILLAGE
========================================================= */

function createVillage(
  x,
  z
) {

  for (
    let i = 0;
    i < 16;
    i++
  ) {

    building(
      x +
        (Math.random() -
          .5) *
        150,

      z +
        (Math.random() -
          .5) *
        130,

      13 +
        Math.random() *
        10,

      5 +
        Math.random() *
        5,

      13 +
        Math.random() *
        10,

      0x75654e
    );
  }
}


/* =========================================================
   INDUSTRIAL
========================================================= */

function createIndustrial(
  x,
  z
) {

  for (
    let i = 0;
    i < 9;
    i++
  ) {

    building(
      x +
        (Math.random() -
          .5) *
        150,

      z +
        (Math.random() -
          .5) *
        130,

      35 +
        Math.random() *
        25,

      8 +
        Math.random() *
        10,

      25 +
        Math.random() *
        20,

      0x575149
    );
  }
}


/* =========================================================
   FOREST
========================================================= */

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
        .5,
        .8,
        5,
        7
      ),
      new THREE.MeshStandardMaterial({
        color: 0x5d422c
      })
    );


  trunk.position.y =
    5.5;


  group.add(
    trunk
  );


  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const crown =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          4.5 -
            i *
            .8,

          7,

          8
        ),
        new THREE.MeshStandardMaterial({
          color:
            i === 0
              ? 0x1e4b2e
              : 0x2d6338
        })
      );


    crown.position.y =
      8 +
      i *
      4;


    crown.castShadow =
      true;


    group.add(
      crown
    );
  }


  group.position.set(
    x,
    0,
    z
  );


  group.scale.setScalar(
    scale
  );


  scene.add(
    group
  );
}


function createForest() {

  for (
    let i = 0;
    i < 180;
    i++
  ) {

    const angle =
      Math.random() *
      Math.PI *
      2;


    const radius =
      220 +
      Math.random() *
      200;


    const x =
      Math.cos(angle) *
      radius;


    const z =
      Math.sin(angle) *
      radius;


    if (
      Math.abs(x) < 170 &&
      Math.abs(z) < 170
    ) {
      continue;
    }


    createTree(
      x,
      z,
      .65 +
        Math.random() *
        .8
    );
  }
}


/* =========================================================
   LANDMARKS
========================================================= */

function createLandmarks() {

  /* RADIO TOWER */

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
          .5,
          .9,
          70,
          8
        ),
        new THREE.MeshStandardMaterial({
          color: 0x293536,
          metalness: .7
        })
      );


    const a =
      i *
      Math.PI /
      2;


    leg.position.set(
      Math.cos(a) *
        5,

      35,

      Math.sin(a) *
        5
    );


    tower.add(
      leg
    );
  }


  tower.position.set(
    -150,
    0,
    -170
  );


  scene.add(
    tower
  );


  /* WATER TANK */

  const tank =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        9,
        9,
        10,
        24
      ),
      new THREE.MeshStandardMaterial({
        color: 0x66706d,
        metalness: .3
      })
    );


  tank.position.set(
    150,
    35,
    160
  );


  scene.add(
    tank
  );
}


/* =========================================================
   PLAYER
========================================================= */

function createPlayer() {

  player =
    new THREE.Group();


  /*
    SMALLER PLAYER
  */

  player.scale.setScalar(
    .68
  );


  /* legs */

  for (
    const x of [-.22, .22]
  ) {

    const leg =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          .14,
          .75,
          5,
          8
        ),
        new THREE.MeshStandardMaterial({
          color: 0x141919
        })
      );


    leg.position.set(
      x,
      .55,
      0
    );


    leg.castShadow =
      true;


    player.add(
      leg
    );
  }


  /* body */

  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        .42,
        1,
        6,
        12
      ),
      new THREE.MeshStandardMaterial({
        color: 0x263633,
        roughness: .65
      })
    );


  body.position.y =
    1.25;


  body.castShadow =
    true;


  player.add(
    body
  );


  /* vest */

  const vest =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .9,
        .82,
        .52
      ),
      new THREE.MeshStandardMaterial({
        color: 0x394b45,
        roughness: .7
      })
    );


  vest.position.y =
    1.3;


  player.add(
    vest
  );


  /* head */

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .32,
        20,
        14
      ),
      new THREE.MeshStandardMaterial({
        color: 0xc78f6e,
        roughness: .8
      })
    );


  head.position.y =
    2.15;


  player.add(
    head
  );


  /* helmet */

  const helmet =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .36,
        16,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      new THREE.MeshStandardMaterial({
        color: 0x111717,
        roughness: .4,
        metalness: .25
      })
    );


  helmet.position.y =
    2.3;


  player.add(
    helmet
  );


  /* gun */

  playerGun =
    new THREE.Group();


  const gunBody =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .18,
        .18,
        1.3
      ),
      new THREE.MeshStandardMaterial({
        color: 0x111414,
        roughness: .3,
        metalness: .7
      })
    );


  gunBody.position.z =
    -.65;


  playerGun.add(
    gunBody
  );


  playerGun.position.set(
    .45,
    1.3,
    -.55
  );


  player.add(
    playerGun
  );


  player.position.set(
    0,
    0,
    110
  );


  scene.add(
    player
  );
}


/* =========================================================
   ENEMIES
========================================================= */

function createEnemies() {

  const count =
    14;


  for (
    let i = 0;
    i < count;
    i++
  ) {

    const enemy =
      createEnemy(
        i
      );


    const angle =
      Math.random() *
      Math.PI *
      2;


    /*
      FARTHER SPAWN
      No enemy directly beside player
    */

    const radius =
      190 +
      Math.random() *
      250;


    enemy.position.set(
      Math.cos(angle) *
        radius,

      0,

      Math.sin(angle) *
        radius
    );


    enemies.push(
      enemy
    );


    scene.add(
      enemy
    );
  }
}


function createEnemy(
  index
) {

  const enemy =
    new THREE.Group();


  enemy.userData = {
    alive: true,
    hp: 100,
    cooldown:
      700 +
      Math.random() *
      1000,
    strafe:
      Math.random() >
      .5
        ? 1
        : -1
  };


  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        .4,
        1,
        6,
        10
      ),
      new THREE.MeshStandardMaterial({
        color:
          index % 2
            ? 0x6b3135
            : 0x31506a
      })
    );


  body.position.y =
    1.2;


  enemy.add(
    body
  );


  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .3,
        16,
        10
      ),
      new THREE.MeshStandardMaterial({
        color: 0xc28c6d
      })
    );


  head.position.y =
    2.08;


  enemy.add(
    head
  );


  const weapon =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .13,
        .13,
        1.1
      ),
      new THREE.MeshStandardMaterial({
        color: 0x101313,
        metalness: .6
      })
    );


  weapon.position.set(
    .42,
    1.25,
    -.5
  );


  enemy.add(
    weapon
  );


  return enemy;
}


/* =========================================================
   ZONE
========================================================= */

function createZone() {

  const ring =
    new THREE.Mesh(
      new THREE.RingGeometry(
        359,
        361,
        96
      ),
      new THREE.MeshBasicMaterial({
        color: 0x57ffb0,
        transparent: true,
        opacity: .8,
        side:
          THREE.DoubleSide
      })
    );


  ring.rotation.x =
    -Math.PI / 2;


  ring.name =
    "zone";


  ring.position.y =
    4;


  scene.add(
    ring
  );
}


/* =========================================================
   KEYBOARD
========================================================= */

function setupKeyboard() {

  addEventListener(
    "keydown",
    e => {

      keys[e.code] =
        true;


      if (
        e.code === "Space"
      ) {

        if (
          grounded &&
          !crouched
        ) {

          jumpVelocity =
            8.5;

          grounded =
            false;
        }
      }


      if (
        e.code === "KeyC"
      ) {

        crouched =
          !crouched;
      }


      if (
        e.code === "KeyR"
      ) {

        reload();
      }


      if (
        e.code === "KeyV"
      ) {

        firstPerson =
          !firstPerson;
      }
    }
  );


  addEventListener(
    "keyup",
    e => {

      keys[e.code] =
        false;
    }
  );
}


/* =========================================================
   MOUSE
========================================================= */

let firstPerson = false;

function setupMouse() {

  addEventListener(
    "mousemove",
    e => {

      if (
        !running ||
        document.pointerLockElement !==
        renderer.domElement
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
          -.8,
          .45
        );
    }
  );


  addEventListener(
    "mousedown",
    e => {

      if (!running)
        return;


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


  $("game").addEventListener(
    "click",
    () => {

      if (running) {

        renderer.domElement
          .requestPointerLock?.();
      }
    }
  );
}


/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer(
  dt
) {

  const movement =
    new THREE.Vector3();


  const forward =
    new THREE.Vector3(
      -Math.sin(yaw),
      0,
      -Math.cos(yaw)
    );


  const right =
    new THREE.Vector3(
      Math.cos(yaw),
      0,
      -Math.sin(yaw)
    );


  if (
    keys.KeyW ||
    keys.ArrowUp
  ) {

    movement.add(
      forward
    );
  }


  if (
    keys.KeyS ||
    keys.ArrowDown
  ) {

    movement.sub(
      forward
    );
  }


  if (
    keys.KeyD ||
    keys.ArrowRight
  ) {

    movement.add(
      right
    );
  }


  if (
    keys.KeyA ||
    keys.ArrowLeft
  ) {

    movement.sub(
      right
    );
  }


  if (
    movement.lengthSq() > 0
  ) {

    movement.normalize();
  }


  sprinting =
    (
      keys.ShiftLeft ||
      keys.ShiftRight
    ) &&
    !crouched;


  const speed =
    sprinting
      ? 12
      : crouched
        ? 3
        : 6.5;


  player.position.addScaledVector(
    movement,
    speed * dt
  );


  /* jump */

  if (!grounded) {

    jumpVelocity -=
      22 * dt;


    player.position.y +=
      jumpVelocity * dt;


    if (
      player.position.y <= 0
    ) {

      player.position.y =
        0;

      grounded =
        true;

      jumpVelocity =
        0;
    }
  }


  /* bounds */

  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -420,
      420
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -420,
      420
    );


  player.rotation.y =
    yaw;
}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

  if (!player)
    return;


  if (firstPerson) {

    player.visible =
      false;


    camera.position.copy(
      player.position
    );


    camera.position.y +=
      1.8;


    const direction =
      new THREE.Vector3(
        -Math.sin(yaw) *
          Math.cos(pitch),

        Math.sin(pitch),

        -Math.cos(yaw) *
          Math.cos(pitch)
      );


    camera.lookAt(
      camera.position
        .clone()
        .add(direction)
    );


    return;
  }


  player.visible =
    true;


  const target =
    player.position.clone();


  target.y +=
    crouched
      ? 1.1
      : 1.45;


  const distance =
    sprinting
      ? 6
      : 5.2;


  const offset =
    new THREE.Vector3(
      Math.sin(yaw) *
        distance *
        Math.cos(pitch),

      1.8 -
        Math.sin(pitch) *
        distance,

      Math.cos(yaw) *
        distance *
        Math.cos(pitch)
    );


  const desired =
    target
      .clone()
      .add(offset);


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
  )
    return;


  const now =
    performance.now();


  if (
    now - lastShot <
    105
  )
    return;


  if (
    ammo <= 0
  ) {

    reload();

    return;
  }


  lastShot =
    now;


  ammo--;


  updateHUD();


  raycaster.setFromCamera(
    new THREE.Vector2(
      0,
      0
    ),
    camera
  );


  const targets =
    enemies.filter(
      e =>
        e.userData.alive
    );


  const hits =
    raycaster.intersectObjects(
      targets,
      true
    );


  let end =
    raycaster.ray.origin
      .clone()
      .add(
        raycaster.ray.direction
          .clone()
          .multiplyScalar(
            220
          )
      );


  if (
    hits.length
  ) {

    end =
      hits[0].point;


    let enemy =
      hits[0].object;


    while (
      enemy &&
      !enemy.userData.alive
    ) {

      enemy =
        enemy.parent;
    }


    if (
      enemy?.userData?.alive
    ) {

      enemy.userData.hp -=
        25;


      if (
        enemy.userData.hp <=
        0
      ) {

        killEnemy(
          enemy
        );
      }
    }
  }


  createTracer(
    end
  );
}


/* =========================================================
   TRACER
========================================================= */

function createTracer(
  end
) {

  const start =
    new THREE.Vector3();


  playerGun.getWorldPosition(
    start
  );


  const direction =
    end
      .clone()
      .sub(start);


  const length =
    direction.length();


  if (
    length < .1
  )
    return;


  const line =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .012,
        .012,
        length,
        5
      ),
      new THREE.MeshBasicMaterial({
        color: 0x9affd0
      })
    );


  line.position
    .copy(start)
    .add(end)
    .multiplyScalar(.5);


  line.quaternion.setFromUnitVectors(
    new THREE.Vector3(
      0,
      1,
      0
    ),
    direction.normalize()
  );


  scene.add(
    line
  );


  setTimeout(
    () => {
      scene.remove(
        line
      );
    },
    55
  );
}


/* =========================================================
   KILL ENEMY
========================================================= */

function killEnemy(
  enemy
) {

  enemy.userData.alive =
    false;


  enemy.visible =
    false;


  kills++;


  updateHUD();


  const remaining =
    enemies.filter(
      e =>
        e.userData.alive
    ).length;


  if (
    remaining === 0
  ) {

    endGame(
      true
    );
  }
}


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemies(
  dt
) {

  for (
    const enemy of enemies
  ) {

    if (
      !enemy.userData.alive
    )
      continue;


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
      distance < 210
    ) {

      const direction =
        new THREE.Vector3(
          dx,
          0,
          dz
        ).normalize();


      /* approach */

      if (
        distance > 45
      ) {

        enemy.position.addScaledVector(
          direction,
          dt * 2
        );
      }


      /* strafe */

      const side =
        new THREE.Vector3(
          -direction.z,
          0,
          direction.x
        );


      enemy.position.addScaledVector(
        side,
        dt *
          enemy.userData.strafe *
          .8
      );


      enemy.lookAt(
        player.position.x,
        enemy.position.y +
          1.1,
        player.position.z
      );


      enemy.userData.cooldown -=
        dt *
        1000;


      if (
        distance < 75 &&
        enemy.userData.cooldown <= 0
      ) {

        enemy.userData.cooldown =
          1000 +
          Math.random() *
          1400;


        damagePlayer(
          4 +
          Math.random() *
          6
        );
      }
    }
  }
}


/* =========================================================
   DAMAGE
========================================================= */

function damagePlayer(
  amount
) {

  if (!running)
    return;


  const shield =
    Math.min(
      armor,
      amount * .6
    );


  armor -=
    shield;


  health -=
    amount -
    shield;


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


  $("damage").style.background =
    "rgba(255,20,20,.25)";


  setTimeout(
    () => {

      $("damage").style.background =
        "rgba(255,0,0,0)";

    },
    100
  );


  updateHUD();


  if (
    health <= 0
  ) {

    endGame(
      false
    );
  }
}


/* =========================================================
   ZONE UPDATE
========================================================= */

function updateZone(
  dt
) {

  zoneTimer +=
    dt;


  if (
    zoneTimer > 18
  ) {

    zoneTimer =
      0;


    zoneRadius =
      Math.max(
        100,
        zoneRadius - 25
      );
  }


  const ring =
    scene.getObjectByName(
      "zone"
    );


  if (ring) {

    const scale =
      zoneRadius /
      360;


    ring.scale.set(
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
      4 * dt
    );
  }
}


/* =========================================================
   RELOAD
========================================================= */

function reload() {

  if (
    reloading ||
    ammo >= 30 ||
    reserve <= 0
  )
    return;


  reloading =
    true;


  setTimeout(
    () => {

      const amount =
        Math.min(
          30 - ammo,
          reserve
        );


      ammo +=
        amount;


      reserve -=
        amount;


      reloading =
        false;


      updateHUD();

    },
    800
  );
}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  $("health").textContent =
    Math.round(
      health
    );


  $("armor").textContent =
    Math.round(
      armor
    );


  $("kills").textContent =
    kills;


  $("ammo").textContent =
    ammo +
    " / " +
    reserve;


  $("zone").textContent =
    Math.round(
      zoneRadius
    ) +
    "m";


  $("alive").textContent =
    enemies.filter(
      e =>
        e.userData.alive
    ).length +
    1;


  $("healthBar").style.width =
    health + "%";
}


/* =========================================================
   START
========================================================= */

function startGame() {

  const name =
    $("playerName")
      .value
      .trim();


  if (!name) {

    $("playerName").focus();

    $("playerName")
      .placeholder =
      "ENTER PLAYER NAME";

    return;
  }


  running =
    true;


  $("startScreen").style.display =
    "none";


  $("hud").style.display =
    "block";


  player.position.set(
    0,
    0,
    110
  );


  if (
    innerWidth > 700
  ) {

    renderer.domElement
      .requestPointerLock?.();
  }


  updateHUD();
}


/* =========================================================
   END
========================================================= */

function endGame(
  won
) {

  if (!running)
    return;


  running =
    false;


  document.exitPointerLock?.();


  $("deathScreen").style.display =
    "flex";


  const title =
    $("deathScreen")
      .querySelector("h2");


  const subtitle =
    $("deathScreen")
      .querySelector(".subtitle");


  if (won) {

    title.textContent =
      "BOOYAH!";


    subtitle.textContent =
      "YOU ARE THE LAST ALIVE";
  }

  else {

    title.textContent =
      "ELIMINATED";


    subtitle.textContent =
      "DISTRICT 09 GOT YOU";
  }
}


/* =========================================================
   MOBILE
========================================================= */

let joyActive =
  false;

let joyX =
  0;

let joyY =
  0;

let sprintMobile =
  false;

let aimActive =
  false;

let aimX =
  0;

let aimY =
  0;


function setupMobile() {

  const joy =
    $("joystick");


  const stick =
    $("stick");


  joy.addEventListener(
    "pointerdown",
    e => {

      joyActive =
        true;


      joy.setPointerCapture(
        e.pointerId
      );


      moveJoystick(
        e
      );
    }
  );


  joy.addEventListener(
    "pointermove",
    e => {

      if (
        joyActive
      ) {

        moveJoystick(
          e
        );
      }
    }
  );


  function resetJoy() {

    joyActive =
      false;


    joyX =
      0;

    joyY =
      0;


    stick.style.left =
      "36px";


    stick.style.top =
      "36px";
  }


  joy.addEventListener(
    "pointerup",
    resetJoy
  );


  joy.addEventListener(
    "pointercancel",
    resetJoy
  );


  function moveJoystick(
    e
  ) {

    const rect =
      joy.getBoundingClientRect();


    const centerX =
      rect.left +
      rect.width /
      2;


    const centerY =
      rect.top +
      rect.height /
      2;


    let x =
      (
        e.clientX -
        centerX
      ) /
      55;


    let y =
      (
        e.clientY -
        centerY
      ) /
      55;


    const length =
      Math.hypot(
        x,
        y
      );


    if (
      length > 1
    ) {

      x /=
        length;

      y /=
        length;
    }


    joyX =
      x;

    joyY =
      y;


    stick.style.left =
      36 +
      x * 28 +
      "px";


    stick.style.top =
      36 +
      y * 28 +
      "px";
  }


  /* FIRE */

  $("fireButton")
    .addEventListener(
      "pointerdown",
      e => {

        e.preventDefault();

        shoot();
      }
    );


  /* JUMP */

  $("jumpButton")
    .addEventListener(
      "pointerdown",
      e => {

        e.preventDefault();


        if (
          grounded
        ) {

          jumpVelocity =
            8.5;

          grounded =
            false;
        }
      }
    );


  /* SPRINT */

  $("sprintButton")
    .addEventListener(
      "pointerdown",
      () => {

        sprintMobile =
          true;
      }
    );


  $("sprintButton")
    .addEventListener(
      "pointerup",
      () => {

        sprintMobile =
          false;
      }
    );


  $("sprintButton")
    .addEventListener(
      "pointercancel",
      () => {

        sprintMobile =
          false;
      }
    );


  /* CROUCH */

  $("crouchButton")
    .addEventListener(
      "pointerdown",
      () => {

        crouched =
          !crouched;
      }
    );


  /* AIM */

  const aim =
    $("aimButton");


  aim.addEventListener(
    "pointerdown",
    e => {

      e.preventDefault();

      aimActive =
        true;

      aimX =
        e.clientX;

      aimY =
        e.clientY;

      aim.setPointerCapture(
        e.pointerId
      );
    }
  );


  aim.addEventListener(
    "pointermove",
    e => {

      if (!aimActive)
        return;


      yaw -=
        (
          e.clientX -
          aimX
        ) *
        .006;


      pitch -=
        (
          e.clientY -
          aimY
        ) *
        .004;


      pitch =
        THREE.MathUtils.clamp(
          pitch,
          -.8,
          .45
        );


      aimX =
        e.clientX;

      aimY =
        e.clientY;
    }
  );


  function stopAim() {

    aimActive =
      false;
  }


  aim.addEventListener(
    "pointerup",
    stopAim
  );


  aim.addEventListener(
    "pointercancel",
    stopAim
  );
}


/* =========================================================
   MOBILE MOVEMENT
========================================================= */

function updateMobileMovement() {

  if (
    !joyActive
  )
    return;


  const forward =
    -joyY;


  const side =
    joyX;


  keys.KeyW =
    forward > .2;


  keys.KeyS =
    forward < -.2;


  keys.KeyA =
    side < -.2;


  keys.KeyD =
    side > .2;
}


/* =========================================================
   LOOP
========================================================= */

function loop() {

  requestAnimationFrame(
    loop
  );


  const dt =
    Math.min(
      clock.getDelta(),
      .05
    );


  if (running) {

    updateMobileMovement();

    updatePlayer(
      dt
    );

    updateCamera();

    updateEnemies(
      dt
    );

    updateZone(
      dt
    );

    /*
      mobile sprint
    */

    if (
      sprintMobile
    ) {

      sprinting =
        true;
    }


    updateHUD();
  }


  renderer.render(
    scene,
    camera
  );
}


/* =========================================================
   RESIZE
========================================================= */

function resize() {

  camera.aspect =
    innerWidth /
    innerHeight;


  camera.updateProjectionMatrix();


  renderer.setSize(
    innerWidth,
    innerHeight
  );
}


addEventListener(
  "resize",
  resize
);
