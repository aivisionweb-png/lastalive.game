(() => {
"use strict";

const THREE = window.THREE;

if (!THREE) {
  alert("Three.js load nahi hua!");
  return;
}

const $ = id => document.getElementById(id);

let scene, camera, renderer, clock;
let player, gun, muzzle, mapRoot;

let running = false;
let mapReady = false;
let firstPerson = false;

let yaw = 0;
let pitch = -0.14;
let verticalVelocity = 0;
let grounded = true;

let crouched = false;
let sprinting = false;

let health = 100;
let armor = 65;
let ammo = 30;
let reserve = 120;

let lastShot = 0;
let reloading = false;

let zoneRadius = 360;
let zoneTarget = 360;
let zoneTimer = 0;

let kills = 0;

const keys = Object.create(null);
const bots = [];

const raycaster = new THREE.Raycaster();

const WORLD = 900;
const SPAWN_SAFE_DISTANCE = 150;

const joystick = {
  active: false,
  id: null,
  x: 0,
  y: 0,
  sprint: false
};

let aimTouch = null;

const weapon = {
  name: "ASSAULT RIFLE",
  mag: 30,
  reserve: 120,
  rate: 105,
  damage: 25,
  range: 240
};


/* =========================================================
   MATERIAL
========================================================= */

function material(
  color,
  roughness = 0.8,
  metalness = 0,
  emissive = 0x000000
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive
  });
}


/* =========================================================
   UI HELPERS
========================================================= */

function hide(el) {
  if (el) el.style.display = "none";
}

function show(el, display = "flex") {
  if (el) el.style.display = display;
}


/* =========================================================
   INIT
========================================================= */

function init() {

  const canvas = $("game");

  if (!canvas) {
    alert(
      'Canvas missing!\n\nindex.html me:\n<canvas id="game"></canvas>'
    );
    return;
  }

  scene = new THREE.Scene();

  scene.background =
    new THREE.Color(0x0b1513);

  scene.fog =
    new THREE.FogExp2(
      0x0b1513,
      0.0017
    );


  /* CAMERA */

  camera =
    new THREE.PerspectiveCamera(
      67,
      innerWidth / innerHeight,
      0.1,
      1800
    );


  /* RENDERER */

  renderer =
    new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance"
    });

  renderer.setPixelRatio(
    Math.min(devicePixelRatio, 1.5)
  );

  renderer.setSize(
    innerWidth,
    innerHeight
  );

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.1;

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  clock = new THREE.Clock();


  addLights();

  createAtmosphere();

  createPlayer();

  createFallbackMap();

  createEnemies();

  createZone();

  createMobileControls();

  bindControls();

  updateHUD();

  resize();

  /*
    GLB load optional hai.
    Agar file present hai to actual map load hoga.
    Agar fail hua to fallback map chalega.
  */

  loadGLBMap();

  requestAnimationFrame(loop);
}


/* =========================================================
   LIGHTING
========================================================= */

function addLights() {

  const hemi =
    new THREE.HemisphereLight(
      0xb9d9d0,
      0x18201d,
      2.1
    );

  scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xffe5b8,
      3.1
    );

  sun.position.set(
    180,
    260,
    120
  );

  sun.castShadow = true;

  sun.shadow.mapSize.set(
    2048,
    2048
  );

  sun.shadow.camera.left = -500;
  sun.shadow.camera.right = 500;
  sun.shadow.camera.top = 500;
  sun.shadow.camera.bottom = -500;
  sun.shadow.camera.far = 900;

  scene.add(sun);


  const fill =
    new THREE.DirectionalLight(
      0x78a9ff,
      0.55
    );

  fill.position.set(
    -250,
    120,
    -220
  );

  scene.add(fill);
}


/* =========================================================
   ATMOSPHERE
========================================================= */

function createAtmosphere() {

  const sky =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        800,
        32,
        16
      ),
      new THREE.MeshBasicMaterial({
        color: 0x476d76,
        side: THREE.BackSide
      })
    );

  scene.add(sky);


  for (let i = 0; i < 22; i++) {

    const cloud =
      new THREE.Group();

    for (let j = 0; j < 4; j++) {

      const puff =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            7 + Math.random() * 8,
            10,
            8
          ),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.17
          })
        );

      puff.position.set(
        j * 10,
        Math.random() * 4,
        Math.random() * 6
      );

      cloud.add(puff);
    }

    cloud.position.set(
      -450 + Math.random() * 900,
      120 + Math.random() * 80,
      -450 + Math.random() * 900
    );

    scene.add(cloud);
  }
}


/* =========================================================
   FALLBACK MAP
========================================================= */

function createFallbackMap() {

  const root =
    new THREE.Group();

  root.name =
    "FALLBACK_WORLD";


  /* WATER */

  const water =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        1600,
        1600
      ),
      material(
        0x1d5360,
        0.25,
        0.1
      )
    );

  water.rotation.x =
    -Math.PI / 2;

  water.position.y = -2;

  root.add(water);


  /* LAND */

  const land =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        440,
        500,
        8,
        64
      ),
      material(
        0x24362b,
        1
      )
    );

  land.position.y = -2;

  land.scale.z = 0.9;

  land.receiveShadow = true;

  root.add(land);


  /* ROADS */

  for (let i = -2; i <= 2; i++) {

    addRoad(
      root,
      i * 180,
      0,
      18,
      WORLD,
      true
    );

    addRoad(
      root,
      0,
      i * 180,
      WORLD,
      18,
      false
    );
  }


  /* POIs */

  buildPOI(
    root,
    -250,
    -190,
    "HARBOR",
    0x2e4f5c
  );

  buildPOI(
    root,
    240,
    -190,
    "INDUSTRIAL",
    0x4b4435
  );

  buildPOI(
    root,
    -220,
    220,
    "VILLAGE",
    0x4a5b3b
  );

  buildPOI(
    root,
    250,
    210,
    "MILITARY",
    0x3e4b46
  );

  buildPOI(
    root,
    0,
    0,
    "DOWNTOWN",
    0x39444a
  );


  /* OUTER HILLS */

  for (let i = 0; i < 20; i++) {

    const angle =
      Math.random() *
      Math.PI * 2;

    const radius =
      300 +
      Math.random() * 130;

    const hill =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          35 + Math.random() * 40,
          35 + Math.random() * 70,
          8
        ),
        material(
          0x314b34,
          1
        )
      );

    hill.position.set(
      Math.cos(angle) * radius,
      25,
      Math.sin(angle) * radius
    );

    hill.scale.z = 1.4;

    hill.castShadow = true;

    root.add(hill);
  }


  scene.add(root);

  mapRoot = root;
}


/* =========================================================
   ROAD
========================================================= */

function addRoad(
  parent,
  x,
  z,
  width,
  depth,
  vertical
) {

  const road =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        vertical ? depth : width,
        0.12,
        vertical ? width : depth
      ),
      material(
        0x222a29,
        0.95
      )
    );

  road.position.set(
    x,
    2.1,
    z
  );

  parent.add(road);
}


/* =========================================================
   POI
========================================================= */

function buildPOI(
  parent,
  x,
  z,
  name,
  color
) {

  const base =
    new THREE.Group();

  base.position.set(
    x,
    2,
    z
  );

  base.name = name;


  for (let i = 0; i < 10; i++) {

    const width =
      18 + Math.random() * 28;

    const depth =
      15 + Math.random() * 25;

    const height =
      5 + Math.random() * 22;


    const building =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width,
          height,
          depth
        ),
        material(
          color,
          0.8
        )
      );

    building.position.set(
      (Math.random() - 0.5) * 85,
      height / 2,
      (Math.random() - 0.5) * 85
    );

    building.rotation.y =
      Math.random() * Math.PI;

    building.castShadow = true;
    building.receiveShadow = true;

    base.add(building);


    /* WINDOWS */

    for (
      let row = 0;
      row < Math.floor(height / 5);
      row++
    ) {

      const windowMesh =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            1.2,
            1.4,
            0.08
          ),
          new THREE.MeshBasicMaterial({
            color: 0xb9e8df
          })
        );

      windowMesh.position.set(
        0,
        3 + row * 5,
        depth / 2 + 0.05
      );

      building.add(
        windowMesh
      );
    }
  }

  parent.add(base);
}


/* =========================================================
   GLB MAP
========================================================= */

async function loadGLBMap() {

  try {

    const module =
      await import(
        "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js"
      );

    const loader =
      new module.GLTFLoader();


    loader.load(
      "./free_fire_full_map.glb",

      gltf => {

        if (mapRoot) {
          scene.remove(
            mapRoot
          );
        }


        mapRoot =
          gltf.scene;

        mapRoot.name =
          "GLB_MAP";


        mapRoot.traverse(
          object => {

            if (object.isMesh) {

              object.castShadow = true;

              object.receiveShadow = true;

              if (object.material) {
                object.material.needsUpdate = true;
              }
            }
          }
        );


        /* CENTER MAP */

        const box =
          new THREE.Box3()
            .setFromObject(
              mapRoot
            );

        const size =
          box.getSize(
            new THREE.Vector3()
          );

        const center =
          box.getCenter(
            new THREE.Vector3()
          );


        mapRoot.position.x -=
          center.x;

        mapRoot.position.z -=
          center.z;


        const maxDimension =
          Math.max(
            size.x,
            size.z
          );


        if (maxDimension > 1) {

          const scale =
            Math.min(
              2.5,
              WORLD / maxDimension
            );

          mapRoot.scale.setScalar(
            scale
          );
        }


        mapRoot.position.y -=
          box.min.y;


        scene.add(
          mapRoot
        );

        mapReady = true;

        snapPlayerToMap();

        toast(
          "MAP LOADED — DROP COMPLETE"
        );
      },


      xhr => {

        if (xhr.total) {

          const percent =
            Math.round(
              xhr.loaded /
              xhr.total *
              100
            );

          toast(
            "MAP " +
            percent +
            "%"
          );
        }
      },


      error => {

        console.warn(
          "GLB failed:",
          error
        );

        toast(
          "FALLBACK MAP ACTIVE"
        );
      }
    );

  } catch (error) {

    console.warn(
      "GLTFLoader failed:",
      error
    );

    toast(
      "FALLBACK MAP ACTIVE"
    );
  }
}


/* =========================================================
   PLAYER
========================================================= */

function createPlayer() {

  player =
    new THREE.Group();

  player.name =
    "PLAYER";


  /* SMALLER CHARACTER */

  player.scale.setScalar(
    0.68
  );


  /* SHADOW */

  const shadow =
    new THREE.Mesh(
      new THREE.CircleGeometry(
        1.05,
        20
      ),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3
      })
    );

  shadow.rotation.x =
    -Math.PI / 2;

  shadow.position.y =
    0.03;

  player.add(
    shadow
  );


  /* BODY */

  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.43,
        1,
        6,
        12
      ),
      material(
        0x1e2b2a,
        0.6,
        0.1
      )
    );

  body.position.y =
    1.18;

  body.castShadow = true;

  player.add(
    body
  );


  /* VEST */

  const vest =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.88,
        0.85,
        0.52
      ),
      material(
        0x30413c,
        0.7,
        0.05
      )
    );

  vest.position.y =
    1.25;

  vest.castShadow = true;

  player.add(
    vest
  );


  /* HEAD */

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.32,
        18,
        12
      ),
      material(
        0xc9906e,
        0.75
      )
    );

  head.position.y =
    2.15;

  head.castShadow = true;

  player.add(
    head
  );


  /* HELMET */

  const helmet =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.36,
        16,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      material(
        0x101717,
        0.35,
        0.3
      )
    );

  helmet.position.y =
    2.3;

  player.add(
    helmet
  );


  /* LEGS */

  for (const x of [-0.2, 0.2]) {

    const leg =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.14,
          0.85,
          5,
          8
        ),
        material(
          0x101414,
          0.8
        )
      );

    leg.position.set(
      x,
      0.5,
      0
    );

    player.add(
      leg
    );
  }


  /* GUN */

  gun =
    new THREE.Group();


  const gunBody =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.18,
        0.18,
        1.25
      ),
      material(
        0x111414,
        0.3,
        0.7
      )
    );

  gunBody.position.z =
    -0.62;

  gun.add(
    gunBody
  );


  const stock =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.25,
        0.22,
        0.45
      ),
      material(
        0x252a28,
        0.6
      )
    );

  stock.position.z =
    0.32;

  gun.add(
    stock
  );


  gun.position.set(
    0.46,
    1.28,
    -0.55
  );

  gun.rotation.x =
    -0.08;

  player.add(
    gun
  );


  muzzle =
    new THREE.Object3D();

  muzzle.position.set(
    0,
    0,
    -1.3
  );

  gun.add(
    muzzle
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

  const count = 14;

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const bot =
      createEnemy(
        i + 1
      );

    let position;

    do {

      const angle =
        Math.random() *
        Math.PI * 2;

      const radius =
        SPAWN_SAFE_DISTANCE +
        Math.random() * 260;

      position =
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );

    } while (
      position.length() <
      SPAWN_SAFE_DISTANCE
    );


    bot.position.copy(
      position
    );

    bots.push(
      bot
    );

    scene.add(
      bot
    );
  }
}


/* =========================================================
   CREATE ENEMY
========================================================= */

function createEnemy(number) {

  const enemy =
    new THREE.Group();


  enemy.userData = {

    alive: true,

    hp: 100,

    name:
      "BOT " +
      String(number).padStart(
        2,
        "0"
      ),

    cooldown:
      700 +
      Math.random() * 1200,

    strafe:
      Math.random() > 0.5
        ? 1
        : -1
  };


  /* BODY */

  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.4,
        0.98,
        6,
        10
      ),
      material(
        number % 2
          ? 0x6c2f32
          : 0x31526a,
        0.78
      )
    );

  body.position.y =
    1.15;

  body.castShadow = true;

  enemy.add(
    body
  );


  /* HEAD */

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.3,
        14,
        10
      ),
      material(
        0xc48c6c,
        0.8
      )
    );

  head.position.y =
    2.08;

  enemy.add(
    head
  );


  /* HELMET */

  const helmet =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.34,
        14,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      material(
        0x171a19,
        0.4,
        0.25
      )
    );

  helmet.position.y =
    2.22;

  enemy.add(
    helmet
  );


  /* WEAPON */

  const weaponMesh =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.13,
        0.13,
        1.15
      ),
      material(
        0x111313,
        0.3,
        0.6
      )
    );

  weaponMesh.position.set(
    0.42,
    1.25,
    -0.55
  );

  enemy.add(
    weaponMesh
  );


  return enemy;
}


/* =========================================================
   SAFE ZONE
========================================================= */

function createZone() {

  const zone =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        zoneRadius,
        zoneRadius,
        0.06,
        96
      ),
      new THREE.MeshBasicMaterial({
        color: 0x43f59a,
        transparent: true,
        opacity: 0.045,
        side: THREE.DoubleSide
      })
    );

  zone.name =
    "ZONE";

  zone.position.y =
    0.06;

  scene.add(
    zone
  );


  const ring =
    new THREE.Mesh(
      new THREE.RingGeometry(
        zoneRadius - 0.3,
        zoneRadius + 0.3,
        96
      ),
      new THREE.MeshBasicMaterial({
        color: 0x63ffb1,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );

  ring.rotation.x =
    -Math.PI / 2;

  ring.position.y =
    0.09;

  ring.name =
    "ZONE_RING";

  scene.add(
    ring
  );
}


/* =========================================================
   KEYBOARD + MOUSE
========================================================= */

function bindControls() {

  addEventListener(
    "resize",
    resize
  );


  addEventListener(
    "keydown",
    event => {

      keys[event.code] = true;


      if (
        event.code === "KeyC"
      ) {
        crouched =
          !crouched;
      }


      if (
        event.code === "Space" &&
        grounded &&
        !crouched
      ) {

        verticalVelocity =
          8.5;

        grounded = false;
      }


      if (
        event.code === "KeyR"
      ) {
        reload();
      }


      if (
        event.code === "KeyV"
      ) {

        firstPerson =
          !firstPerson;

        updateCamera();
      }
    }
  );


  addEventListener(
    "keyup",
    event => {
      keys[event.code] =
        false;
    }
  );


  /* MOUSE AIM */

  addEventListener(
    "mousemove",
    event => {

      if (
        !running ||
        document.pointerLockElement !==
        renderer.domElement
      ) {
        return;
      }


      yaw -=
        event.movementX *
        0.0023;

      pitch -=
        event.movementY *
        0.0018;


      pitch =
        THREE.MathUtils.clamp(
          pitch,
          -0.85,
          0.55
        );
    }
  );


  /* MOUSE SHOOT */

  addEventListener(
    "mousedown",
    event => {

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
        event.button === 0
      ) {
        shoot();
      }
    }
  );


  renderer.domElement.addEventListener(
    "click",
    () => {

      if (running) {

        renderer.domElement
          .requestPointerLock?.();
      }
    }
  );


  /* START */

  const play =
    $("playButton");

  if (play) {

    play.addEventListener(
      "click",
      startGame
    );
  }


  /* RESTART */

  const restart =
    $("restartButton");

  if (restart) {

    restart.addEventListener(
      "click",
      () => {
        location.reload();
      }
    );
  }
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

  if (running)
    return;


  running = true;

  health = 100;

  armor = 65;

  ammo =
    weapon.mag;

  reserve =
    weapon.reserve;


  hide(
    $("startScreen")
  );

  hide(
    $("deathScreen")
  );


  updateHUD();

  toast(
    "DROP COMPLETE"
  );


  if (
    innerWidth > 700
  ) {

    setTimeout(
      () => {

        renderer.domElement
          .requestPointerLock?.();

      },
      180
    );
  }
}


/* =========================================================
   RELOAD
========================================================= */

function reload() {

  if (
    !running ||
    reloading ||
    ammo >= weapon.mag ||
    reserve <= 0
  ) {
    return;
  }


  reloading = true;

  toast(
    "RELOADING..."
  );


  setTimeout(
    () => {

      const amount =
        Math.min(
          weapon.mag - ammo,
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
    700
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


  const now =
    performance.now();


  if (
    now - lastShot <
    weapon.rate
  ) {
    return;
  }


  if (ammo <= 0) {

    reload();

    return;
  }


  lastShot =
    now;

  ammo--;

  updateHUD();


  /* MUZZLE FLASH */

  const flash =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.14,
        8,
        8
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffd56a
      })
    );


  muzzle.add(
    flash
  );


  setTimeout(
    () => {
      muzzle?.remove(
        flash
      );
    },
    45
  );


  /* RAY */

  raycaster.setFromCamera(
    new THREE.Vector2(
      0,
      0
    ),
    camera
  );


  const aliveBots =
    bots.filter(
      bot =>
        bot.userData.alive
    );


  const hits =
    raycaster.intersectObjects(
      aliveBots,
      true
    );


  const end =
    raycaster.ray.origin
      .clone()
      .add(
        raycaster.ray.direction
          .clone()
          .multiplyScalar(
            weapon.range
          )
      );


  if (hits.length) {

    end.copy(
      hits[0].point
    );


    let bot =
      hits[0].object;


    while (
      bot &&
      !bot.userData.alive
    ) {

      bot =
        bot.parent;
    }


    if (
      bot?.userData?.alive
    ) {

      bot.userData.hp -=
        weapon.damage;


      if (
        bot.userData.hp <= 0
      ) {

        killBot(
          bot
        );
      }
    }
  }


  tracer(
    end
  );


  if (ammo === 0) {

    setTimeout(
      reload,
      120
    );
  }
}


/* =========================================================
   BULLET TRACER
========================================================= */

function tracer(end) {

  const start =
    new THREE.Vector3();


  muzzle.getWorldPosition(
    start
  );


  const direction =
    end.clone()
      .sub(start);


  const length =
    direction.length();


  if (
    length < 0.1
  ) {
    return;
  }


  const line =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.012,
        0.012,
        length,
        5
      ),
      new THREE.MeshBasicMaterial({
        color: 0xa5ffd0,
        transparent: true,
        opacity: 0.7
      })
    );


  line.position
    .copy(start)
    .add(end)
    .multiplyScalar(
      0.5
    );


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
   KILL
========================================================= */

function killBot(bot) {

  if (
    !bot.userData.alive
  ) {
    return;
  }


  bot.userData.alive =
    false;

  bot.visible =
    false;

  kills++;


  toast(
    "ELIMINATED " +
    bot.userData.name
  );


  updateHUD();


  if (
    bots.every(
      b =>
        !b.userData.alive
    )
  ) {

    endGame(
      true
    );
  }
}


/* =========================================================
   DAMAGE PLAYER
========================================================= */

function damagePlayer(
  damage
) {

  if (!running)
    return;


  const shield =
    Math.min(
      armor,
      damage * 0.6
    );


  armor -=
    shield;


  health -=
    damage -
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


  const damageOverlay =
    $("damage");


  if (damageOverlay) {

    damageOverlay.style.background =
      "rgba(255,20,20,.25)";


    setTimeout(
      () => {

        damageOverlay.style.background =
          "rgba(255,0,0,0)";

      },
      90
    );
  }


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
   BOT AI
========================================================= */

function updateBots(
  dt
) {

  for (
    const bot of bots
  ) {

    if (
      !bot.userData.alive
    ) {
      continue;
    }


    /* GROUND */

    if (mapReady) {

      const origin =
        bot.position.clone();

      origin.y =
        250;


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


      if (hits.length) {

        bot.position.y =
          hits[0].point.y;
      }
    }


    const dx =
      player.position.x -
      bot.position.x;

    const dz =
      player.position.z -
      bot.position.z;


    const distance =
      Math.hypot(
        dx,
        dz
      );


    if (
      distance < 180
    ) {

      const direction =
        new THREE.Vector3(
          dx,
          0,
          dz
        ).normalize();


      /* MOVE */

      bot.position.addScaledVector(
        direction,
        dt *
        (
          distance > 42
            ? 2.2
            : 0.55
        )
      );


      /* STRAFE */

      const side =
        new THREE.Vector3(
          -direction.z,
          0,
          direction.x
        );


      bot.position.addScaledVector(
        side,
        dt *
        bot.userData.strafe *
        0.7
      );


      /* FACE PLAYER */

      bot.lookAt(
        player.position.x,
        bot.position.y + 1.1,
        player.position.z
      );


      bot.userData.cooldown -=
        dt * 1000;


      /* ATTACK */

      if (
        distance < 75 &&
        bot.userData.cooldown <= 0
      ) {

        bot.userData.cooldown =
          900 +
          Math.random() *
          1200;


        damagePlayer(
          4 +
          Math.random() * 5
        );
      }
    }
  }
}


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(
  dt
) {

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


  const movement =
    new THREE.Vector3();


  /* WASD */

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


  /* MOBILE JOYSTICK */

  if (
    Math.abs(
      joystick.x
    ) +
    Math.abs(
      joystick.y
    ) > 0.05
  ) {

    movement.x +=
      right.x *
      joystick.x +
      forward.x *
      (-joystick.y);


    movement.z +=
      right.z *
      joystick.x +
      forward.z *
      (-joystick.y);
  }


  if (
    movement.lengthSq() > 0
  ) {

    movement.normalize();
  }


  /* SPRINT */

  sprinting =
    (
      keys.ShiftLeft ||
      keys.ShiftRight
    ) &&
    !crouched ||
    joystick.sprint;


  const speed =
    sprinting
      ? 12
      : crouched
        ? 3.3
        : 6.5;


  player.position.addScaledVector(
    movement,
    dt * speed
  );


  /* WORLD LIMIT */

  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -440,
      440
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -440,
      440
    );


  /* JUMP */

  if (!grounded) {

    verticalVelocity -=
      23 * dt;


    player.position.y +=
      verticalVelocity *
      dt;


    if (
      player.position.y <= 0
    ) {

      player.position.y =
        0;

      verticalVelocity =
        0;

      grounded =
        true;
    }
  }


  /* CROUCH */

  player.scale.y =
    crouched
      ? 0.72
      : 0.68;


  /* FACE */

  player.rotation.y =
    yaw;


  snapPlayerToMap();
}


/* =========================================================
   GLB GROUND
========================================================= */

function snapPlayerToMap() {

  if (!mapReady)
    return;


  const origin =
    player.position.clone();

  origin.y =
    250;


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
    hits.length &&
    hits[0].distance < 500
  ) {

    const groundY =
      hits[0].point.y;


    if (
      player.position.y <
      groundY + 0.02
    ) {

      player.position.y =
        groundY;

      grounded =
        true;

      verticalVelocity =
        0;
    }
  }
}


/* =========================================================
   THIRD PERSON CAMERA
========================================================= */

function updateCamera() {

  if (!player)
    return;


  const target =
    player.position.clone();


  target.y +=
    crouched
      ? 1.25
      : 1.55;


  /* FIRST PERSON */

  if (
    firstPerson
  ) {

    player.visible =
      false;


    const position =
      player.position.clone();


    position.y +=
      crouched
        ? 1.45
        : 1.9;


    camera.position.copy(
      position
    );


    const direction =
      new THREE.Vector3(
        -Math.sin(yaw) *
          Math.cos(pitch),

        Math.sin(pitch),

        -Math.cos(yaw) *
          Math.cos(pitch)
      );


    camera.lookAt(
      position
        .clone()
        .add(direction)
    );


    return;
  }


  /* THIRD PERSON */

  player.visible =
    true;


  const distance =
    5.2;


  const offset =
    new THREE.Vector3(
      Math.sin(yaw) *
        distance *
        Math.cos(pitch),

      -Math.sin(pitch) *
        distance +
        1.45,

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
    0.18
  );


  camera.lookAt(
    target
  );
}


/* =========================================================
   SAFE ZONE
========================================================= */

function updateZone(
  dt
) {

  zoneTimer +=
    dt;


  if (
    zoneTimer > 20 &&
    zoneTarget > 120
  ) {

    zoneTimer =
      0;

    zoneTarget -=
      35;

    toast(
      "SAFE ZONE SHRINKING"
    );
  }


  zoneRadius +=
    (
      zoneTarget -
      zoneRadius
    ) *
    dt *
    0.08;


  const zone =
    scene.getObjectByName(
      "ZONE"
    );


  const ring =
    scene.getObjectByName(
      "ZONE_RING"
    );


  const scale =
    zoneRadius /
    360;


  if (zone) {

    zone.scale.set(
      scale,
      1,
      scale
    );
  }


  if (ring) {

    ring.scale.set(
      scale,
      1,
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
      5 * dt
    );
  }
}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  const hp =
    $("healthText");

  const hpBar =
    $("healthBar");

  const ammoEl =
    $("ammo");

  const enemyCount =
    $("enemyCount");

  const weaponEl =
    $("weaponName");


  if (hp) {

    hp.textContent =
      Math.round(
        health
      );
  }


  if (hpBar) {

    hpBar.style.width =
      health + "%";
  }


  if (ammoEl) {

    ammoEl.textContent =
      ammo +
      " / " +
      reserve;
  }


  if (enemyCount) {

    enemyCount.textContent =
      bots.filter(
        bot =>
          bot.userData.alive
      ).length + 1;
  }


  if (weaponEl) {

    weaponEl.textContent =
      weapon.name;
  }


  /* OLD HUD SUPPORT */

  if ($("health")) {

    $("health").textContent =
      Math.round(
        health
      );
  }


  if ($("armor")) {

    $("armor").textContent =
      Math.round(
        armor
      );
  }


  if ($("kills")) {

    $("kills").textContent =
      kills;
  }


  if ($("alive")) {

    $("alive").textContent =
      bots.filter(
        bot =>
          bot.userData.alive
      ).length + 1;
  }


  if ($("zone")) {

    $("zone").textContent =
      Math.round(
        zoneRadius
      ) + "m";
  }
}


/* =========================================================
   END GAME
========================================================= */

function endGame(
  won
) {

  if (!running)
    return;


  running =
    false;


  document.exitPointerLock?.();


  const screen =
    $("deathScreen");


  show(
    screen
  );


  const title =
    screen?.querySelector(
      "h1"
    );


  const subtitle =
    screen?.querySelector(
      ".subtitle"
    );


  if (title) {

    title.textContent =
      won
        ? "BOOYAH!"
        : "ELIMINATED";
  }


  if (subtitle) {

    subtitle.textContent =
      won
        ? "YOU ARE THE LAST ALIVE"
        : "DISTRICT 09 GOT YOU";
  }
}


/* =========================================================
   TOAST
========================================================= */

function toast(
  message
) {

  let element =
    $("toast");


  if (!element) {

    element =
      document.createElement(
        "div"
      );

    element.id =
      "toast";


    Object.assign(
      element.style,
      {
        position: "fixed",
        left: "50%",
        top: "13%",
        transform:
          "translateX(-50%)",
        zIndex: "50",
        color: "#fff",
        font:
          "800 12px Arial",
        letterSpacing:
          "2px",
        padding:
          "10px 16px",
        background:
          "rgba(5,10,8,.72)",
        border:
          "1px solid rgba(255,255,255,.15)",
        pointerEvents:
          "none",
        transition:
          "opacity .2s"
      }
    );


    document.body.appendChild(
      element
    );
  }


  element.textContent =
    message;


  element.style.opacity =
    "1";


  clearTimeout(
    element._timer
  );


  element._timer =
    setTimeout(
      () => {
        element.style.opacity =
          "0";
      },
      1200
    );
}


/* =========================================================
   MOBILE CONTROLS
========================================================= */

function createMobileControls() {

  const style =
    document.createElement(
      "style"
    );


  style.textContent = `

    #mobileControls {
      position: fixed;
      inset: 0;
      z-index: 30;
      pointer-events: none;
      display: none;
      touch-action: none;
    }

    .m-btn {
      position: absolute;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border:
        1px solid
        rgba(255,255,255,.28);
      background:
        rgba(10,15,14,.48);
      backdrop-filter:
        blur(8px);
      color: #fff;
      font:
        800 10px Arial;
      letter-spacing: 1px;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }

    #joy {
      left: 24px;
      bottom: 34px;
      width: 128px;
      height: 128px;
      border-radius: 50%;
      border:
        1px solid
        rgba(255,255,255,.2);
      background:
        rgba(10,15,14,.28);
      position: absolute;
    }

    #stick {
      left: 35px;
      top: 35px;
    }

    #fire {
      right: 26px;
      bottom: 45px;
      width: 82px;
      height: 82px;
      background:
        rgba(180,40,40,.35);
    }

    #aim {
      right: 126px;
      bottom: 118px;
    }

    #jump {
      right: 32px;
      bottom: 145px;
    }

    #sprint {
      left: 160px;
      bottom: 42px;
    }

    #crouch {
      left: 160px;
      bottom: 118px;
    }

    @media(max-width:700px) {
      #mobileControls {
        display: block;
      }
    }
  `;


  document.head.appendChild(
    style
  );


  const controls =
    document.createElement(
      "div"
    );


  controls.id =
    "mobileControls";


  controls.innerHTML = `

    <div id="joy">

      <div
        id="stick"
        class="m-btn"
      >
        MOVE
      </div>

    </div>

    <button
      id="fire"
      class="m-btn"
    >
      FIRE
    </button>

    <button
      id="aim"
      class="m-btn"
    >
      AIM
    </button>

    <button
      id="jump"
      class="m-btn"
    >
      JUMP
    </button>

    <button
      id="sprint"
      class="m-btn"
    >
      SPRINT
    </button>

    <button
      id="crouch"
      class="m-btn"
    >
      CROUCH
    </button>

  `;


  document.body.appendChild(
    controls
  );


  /* JOYSTICK */

  const joy =
    $("joy");

  const stick =
    $("stick");


  function updateJoystick(
    event
  ) {

    const rect =
      joy.getBoundingClientRect();


    const centerX =
      rect.left +
      rect.width / 2;


    const centerY =
      rect.top +
      rect.height / 2;


    let x =
      (
        event.clientX -
        centerX
      ) /
      (rect.width / 2);


    let y =
      (
        event.clientY -
        centerY
      ) /
      (rect.height / 2);


    const length =
      Math.hypot(
        x,
        y
      );


    if (length > 1) {

      x /= length;
      y /= length;
    }


    joystick.x =
      x;

    joystick.y =
      y;


    stick.style.left =
      35 +
      x * 32 +
      "px";


    stick.style.top =
      35 +
      y * 32 +
      "px";
  }


  joy.addEventListener(
    "pointerdown",
    event => {

      joystick.active =
        true;

      joystick.id =
        event.pointerId;


      joy.setPointerCapture(
        event.pointerId
      );


      updateJoystick(
        event
      );
    }
  );


  joy.addEventListener(
    "pointermove",
    event => {

      if (
        joystick.active
      ) {

        updateJoystick(
          event
        );
      }
    }
  );


  function releaseJoystick() {

    joystick.active =
      false;

    joystick.x =
      0;

    joystick.y =
      0;

    stick.style.left =
      "35px";

    stick.style.top =
      "35px";
  }


  joy.addEventListener(
    "pointerup",
    releaseJoystick
  );


  joy.addEventListener(
    "pointercancel",
    releaseJoystick
  );


  /* FIRE */

  $("fire").addEventListener(
    "pointerdown",
    event => {

      event.preventDefault();

      shoot();
    }
  );


  /* JUMP */

  $("jump").addEventListener(
    "pointerdown",
    event => {

      event.preventDefault();


      if (
        grounded &&
        !crouched
      ) {

        verticalVelocity =
          8.5;

        grounded =
          false;
      }
    }
  );


  /* SPRINT */

  $("sprint").addEventListener(
    "pointerdown",
    () => {

      joystick.sprint =
        true;
    }
  );


  $("sprint").addEventListener(
    "pointerup",
    () => {

      joystick.sprint =
        false;
    }
  );


  $("sprint").addEventListener(
    "pointercancel",
    () => {

      joystick.sprint =
        false;
    }
  );


  /* CROUCH */

  $("crouch").addEventListener(
    "pointerdown",
    () => {

      crouched =
        !crouched;
    }
  );


  /* AIM */

  $("aim").addEventListener(
    "pointerdown",
    event => {

      event.preventDefault();

      aimTouch =
        event;

      $("aim")
        .setPointerCapture?.(
          event.pointerId
        );
    }
  );


  $("aim").addEventListener(
    "pointermove",
    event => {

      if (!aimTouch)
        return;


      yaw -=
        (
          event.clientX -
          aimTouch.clientX
        ) *
        0.006;


      pitch -=
        (
          event.clientY -
          aimTouch.clientY
        ) *
        0.004;


      pitch =
        THREE.MathUtils.clamp(
          pitch,
          -0.85,
          0.55
        );


      aimTouch =
        event;
    }
  );


  $("aim").addEventListener(
    "pointerup",
    () => {

      aimTouch =
        null;
    }
  );


  $("aim").addEventListener(
    "pointercancel",
    () => {

      aimTouch =
        null;
    }
  );
}


/* =========================================================
   RESIZE
========================================================= */

function resize() {

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
   MAIN GAME LOOP
========================================================= */

function loop() {

  requestAnimationFrame(
    loop
  );


  const dt =
    Math.min(
      clock.getDelta(),
      0.05
    );


  if (running) {

    updatePlayer(
      dt
    );

    updateCamera();

    updateBots(
      dt
    );

    updateZone(
      dt
    );

    updateHUD();
  }


  renderer.render(
    scene,
    camera
  );
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);

})();
