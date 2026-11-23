import * as THREE from "three";

const canvas = document.getElementById("game");

let scene;
let camera;
let renderer;
let clock;

let player;
let playerGroup;

let running = false;

const keys = {};

let yaw = 0;
let pitch = -0.18;

let velocityY = 0;
let grounded = true;
let crouching = false;

let shooting = false;
let lastShot = 0;

let health = 100;
let ammo = 30;
let reserveAmmo = 120;

const enemies = [];
const buildings = [];

const WORLD = 3000;

const normalSpeed = 7;
const sprintSpeed = 12;
const crouchSpeed = 3.5;

const gravity = 25;
const jumpPower = 9;

const raycaster = new THREE.Raycaster();


// ========================================
// INIT
// ========================================

init();

function init() {

  scene = new THREE.Scene();

  scene.background = new THREE.Color("#101613");

  scene.fog = new THREE.Fog(
    "#101613",
    100,
    900
  );

  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );

  createLights();
  createWorld();
  createPlayer();
  createEnemies();

  window.addEventListener(
    "resize",
    resize
  );

  window.addEventListener(
    "keydown",
    keyDown
  );

  window.addEventListener(
    "keyup",
    keyUp
  );

  window.addEventListener(
    "mousemove",
    mouseMove
  );

  window.addEventListener(
    "mousedown",
    e => {

      if (e.button === 0) {
        shooting = true;
      }

    }
  );

  window.addEventListener(
    "mouseup",
    e => {

      if (e.button === 0) {
        shooting = false;
      }

    }
  );


  // FIXED: HTML uses playButton
  const playButton =
    document.getElementById("playButton");

  if (playButton) {
    playButton.onclick = startGame;
  }


  // Also allow Enter to start
  window.addEventListener(
    "keydown",
    e => {

      if (
        e.key === "Enter" &&
        !running
      ) {
        startGame();
      }

    }
  );

  updateHealth();
  updateAmmo();

  console.log("LAST//ALIVE initialized");
}


// ========================================
// LIGHTING
// ========================================

function createLights() {

  const hemi =
    new THREE.HemisphereLight(
      0xbad2c0,
      0x172018,
      2
    );

  scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xffffff,
      2.5
    );

  sun.position.set(
    100,
    200,
    100
  );

  sun.castShadow = true;

  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;

  sun.shadow.camera.left = -600;
  sun.shadow.camera.right = 600;
  sun.shadow.camera.top = 600;
  sun.shadow.camera.bottom = -600;

  scene.add(sun);
}


// ========================================
// WORLD
// ========================================

function createWorld() {

  const groundGeo =
    new THREE.PlaneGeometry(
      WORLD,
      WORLD
    );

  const groundMat =
    new THREE.MeshStandardMaterial({
      color: "#18201a",
      roughness: 1
    });

  const ground =
    new THREE.Mesh(
      groundGeo,
      groundMat
    );

  ground.rotation.x =
    -Math.PI / 2;

  ground.receiveShadow = true;

  scene.add(ground);


  // ======================================
  // ROADS
  // ======================================

  for (
    let x = -WORLD / 2;
    x <= WORLD / 2;
    x += 350
  ) {

    const road =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          80,
          WORLD
        ),
        new THREE.MeshStandardMaterial({
          color: "#252b27",
          roughness: 0.95
        })
      );

    road.rotation.x =
      -Math.PI / 2;

    road.position.x = x;
    road.position.y = 0.01;

    scene.add(road);


    // Road center lines

    for (
      let z = -WORLD / 2;
      z < WORLD / 2;
      z += 35
    ) {

      const line =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            2,
            15
          ),
          new THREE.MeshBasicMaterial({
            color: "#b5aa6a"
          })
        );

      line.rotation.x =
        -Math.PI / 2;

      line.position.set(
        x,
        0.025,
        z
      );

      scene.add(line);
    }
  }


  for (
    let z = -WORLD / 2;
    z <= WORLD / 2;
    z += 350
  ) {

    const road =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          WORLD,
          80
        ),
        new THREE.MeshStandardMaterial({
          color: "#252b27",
          roughness: 0.95
        })
      );

    road.rotation.x =
      -Math.PI / 2;

    road.position.z = z;
    road.position.y = 0.012;

    scene.add(road);


    for (
      let x = -WORLD / 2;
      x < WORLD / 2;
      x += 35
    ) {

      const line =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            15,
            2
          ),
          new THREE.MeshBasicMaterial({
            color: "#b5aa6a"
          })
        );

      line.rotation.x =
        -Math.PI / 2;

      line.position.set(
        x,
        0.026,
        z
      );

      scene.add(line);
    }
  }


  // ======================================
  // BUILDINGS
  // ======================================

  for (
    let i = 0;
    i < 90;
    i++
  ) {

    const x =
      THREE.MathUtils.randFloat(
        -WORLD / 2 + 100,
        WORLD / 2 - 100
      );

    const z =
      THREE.MathUtils.randFloat(
        -WORLD / 2 + 100,
        WORLD / 2 - 100
      );

    const w =
      THREE.MathUtils.randFloat(
        25,
        75
      );

    const h =
      THREE.MathUtils.randFloat(
        12,
        60
      );

    const d =
      THREE.MathUtils.randFloat(
        25,
        75
      );

    const geo =
      new THREE.BoxGeometry(
        w,
        h,
        d
      );

    const mat =
      new THREE.MeshStandardMaterial({
        color:
          new THREE.Color(
            THREE.MathUtils.randInt(
              0x242a26,
              0x343c35
            )
          ),
        roughness: 0.85
      });

    const building =
      new THREE.Mesh(
        geo,
        mat
      );

    building.position.set(
      x,
      h / 2,
      z
    );

    building.castShadow = true;
    building.receiveShadow = true;

    scene.add(building);

    buildings.push({
      mesh: building,
      x: x,
      z: z,
      w: w,
      d: d
    });


    // ====================================
    // BUILDING WINDOWS
    // ====================================

    const floors =
      Math.floor(h / 5);

    const columns =
      Math.floor(w / 8);

    for (
      let floor = 0;
      floor < floors;
      floor++
    ) {

      for (
        let col = 0;
        col < columns;
        col++
      ) {

        if (
          Math.random() < 0.45
        ) {
          continue;
        }

        const windowMat =
          new THREE.MeshBasicMaterial({
            color:
              Math.random() > 0.5
                ? "#d6b968"
                : "#718078"
          });

        const win =
          new THREE.Mesh(
            new THREE.PlaneGeometry(
              2.5,
              2.8
            ),
            windowMat
          );

        win.position.set(
          x - w / 2 + 5 + col * 8,
          3 + floor * 5,
          z - d / 2 - 0.04
        );

        win.rotation.y =
          Math.PI;

        scene.add(win);
      }
    }
  }


  // ======================================
  // TREES
  // ======================================

  for (
    let i = 0;
    i < 180;
    i++
  ) {

    const x =
      THREE.MathUtils.randFloat(
        -WORLD / 2,
        WORLD / 2
      );

    const z =
      THREE.MathUtils.randFloat(
        -WORLD / 2,
        WORLD / 2
      );

    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.18,
          0.25,
          2,
          8
        ),
        new THREE.MeshStandardMaterial({
          color: "#3c3022"
        })
      );

    trunk.position.set(
      x,
      1,
      z
    );


    const leaves =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          1.8,
          10,
          8
        ),
        new THREE.MeshStandardMaterial({
          color: "#244229"
        })
      );

    leaves.position.set(
      x,
      3,
      z
    );

    trunk.castShadow = true;
    leaves.castShadow = true;

    scene.add(
      trunk,
      leaves
    );
  }


  // ======================================
  // STREET LIGHTS
  // ======================================

  for (
    let i = -1300;
    i <= 1300;
    i += 100
  ) {

    createStreetLight(
      i,
      35
    );

    createStreetLight(
      i,
      -35
    );

    createStreetLight(
      35,
      i
    );

    createStreetLight(
      -35,
      i
    );
  }
}


function createStreetLight(x, z) {

  const pole =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.08,
        0.12,
        5,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: "#252925"
      })
    );

  pole.position.set(
    x,
    2.5,
    z
  );

  scene.add(pole);


  const lamp =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.18,
        8,
        8
      ),
      new THREE.MeshBasicMaterial({
        color: "#ffd98a"
      })
    );

  lamp.position.set(
    x,
    5.1,
    z
  );

  scene.add(lamp);
}


// ========================================
// PLAYER
// ========================================

function createPlayer() {

  playerGroup =
    new THREE.Group();

  player =
    new THREE.Group();

  playerGroup.add(player);

  scene.add(playerGroup);

  playerGroup.position.set(
    0,
    0,
    0
  );


  // ======================================
  // LEGS
  // ======================================

  const legMat =
    new THREE.MeshStandardMaterial({
      color: "#151a18"
    });

  const leftLeg =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.28,
        0.9,
        0.3
      ),
      legMat
    );

  leftLeg.position.set(
    -0.22,
    0.45,
    0
  );


  const rightLeg =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.28,
        0.9,
        0.3
      ),
      legMat
    );

  rightLeg.position.set(
    0.22,
    0.45,
    0
  );


  // ======================================
  // BODY
  // ======================================

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.85,
        1.05,
        0.48
      ),
      new THREE.MeshStandardMaterial({
        color: "#27352a",
        roughness: 0.8
      })
    );

  body.position.y = 1.15;


  // ======================================
  // HEAD
  // ======================================

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.36,
        16,
        12
      ),
      new THREE.MeshStandardMaterial({
        color: "#c8926c"
      })
    );

  head.position.y = 1.92;


  // ======================================
  // HAIR
  // ======================================

  const hair =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.37,
        16,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: "#111111"
      })
    );

  hair.scale.y = 0.55;

  hair.position.set(
    0,
    2.13,
    0
  );


  // ======================================
  // ARMS
  // ======================================

  const armMat =
    new THREE.MeshStandardMaterial({
      color: "#30402f"
    });

  const leftArm =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.25,
        0.9,
        0.25
      ),
      armMat
    );

  leftArm.position.set(
    -0.62,
    1.2,
    0
  );


  const rightArm =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.25,
        0.9,
        0.25
      ),
      armMat
    );

  rightArm.position.set(
    0.62,
    1.2,
    0
  );


  // ======================================
  // GUN
  // ======================================

  const gun =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.18,
        0.18,
        1.2
      ),
      new THREE.MeshStandardMaterial({
        color: "#111313",
        metalness: 0.7,
        roughness: 0.35
      })
    );

  gun.rotation.x =
    Math.PI / 2;

  gun.position.set(
    0.48,
    1.15,
    -0.48
  );


  // barrel
  const barrel =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.045,
        0.045,
        0.45,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: "#050505",
        metalness: 0.8
      })
    );

  barrel.rotation.x =
    Math.PI / 2;

  barrel.position.set(
    0.48,
    1.15,
    -1.2
  );


  player.add(
    leftLeg,
    rightLeg,
    body,
    head,
    hair,
    leftArm,
    rightArm,
    gun,
    barrel
  );


  player.traverse(
    obj => {

      if (obj.isMesh) {

        obj.castShadow = true;
        obj.receiveShadow = true;

      }

    }
  );
}


// ========================================
// ENEMIES
// ========================================

function createEnemies() {

  for (
    let i = 0;
    i < 18;
    i++
  ) {

    const enemy =
      createEnemy();

    let x;
    let z;

    do {

      x =
        THREE.MathUtils.randFloat(
          -1200,
          1200
        );

      z =
        THREE.MathUtils.randFloat(
          -1200,
          1200
        );

    } while (
      Math.hypot(x, z) < 80
    );


    enemy.position.set(
      x,
      0,
      z
    );

    scene.add(enemy);

    enemies.push({
      object: enemy,
      health: 100,
      alive: true,
      timer: Math.random() * 2,
      speed:
        THREE.MathUtils.randFloat(
          1.5,
          2.4
        )
    });
  }
}


function createEnemy() {

  const group =
    new THREE.Group();


  // body
  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.8,
        1.05,
        0.45
      ),
      new THREE.MeshStandardMaterial({
        color: "#6d2429",
        roughness: 0.8
      })
    );

  body.position.y = 1.1;


  // head
  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.35,
        14,
        10
      ),
      new THREE.MeshStandardMaterial({
        color: "#a56f55"
      })
    );

  head.position.y = 1.85;


  // helmet
  const helmet =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.38,
        14,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: "#15191a"
      })
    );

  helmet.scale.y = 0.5;

  helmet.position.y = 2.08;


  // legs
  const legs =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.65,
        0.9,
        0.35
      ),
      new THREE.MeshStandardMaterial({
        color: "#171717"
      })
    );

  legs.position.y = 0.45;


  // gun
  const gun =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.16,
        0.16,
        0.9
      ),
      new THREE.MeshStandardMaterial({
        color: "#090909",
        metalness: 0.7
      })
    );

  gun.rotation.x =
    Math.PI / 2;

  gun.position.set(
    0.45,
    1.15,
    -0.5
  );


  group.add(
    body,
    head,
    helmet,
    legs,
    gun
  );


  group.traverse(
    obj => {

      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }

    }
  );

  return group;
}


// ========================================
// START GAME
// ========================================

function startGame() {

  const startScreen =
    document.getElementById(
      "startScreen"
    );

  if (startScreen) {
    startScreen.style.display =
      "none";
  }

  running = true;

  health = 100;
  ammo = 30;
  reserveAmmo = 120;

  updateHealth();
  updateAmmo();

  canvas.requestPointerLock();

  clock.start();

  animate();
}


// ========================================
// KEYBOARD
// ========================================

function keyDown(e) {

  keys[
    e.key.toLowerCase()
  ] = true;


  if (
    e.key === " " &&
    grounded &&
    running
  ) {

    velocityY =
      jumpPower;

    grounded = false;

    e.preventDefault();
  }


  if (
    e.key.toLowerCase() === "c"
  ) {

    crouching = true;

    if (player) {
      player.scale.y = 0.72;
    }
  }


  if (
    e.key.toLowerCase() === "r"
  ) {

    reload();
  }
}


function keyUp(e) {

  keys[
    e.key.toLowerCase()
  ] = false;


  if (
    e.key.toLowerCase() === "c"
  ) {

    crouching = false;

    if (player) {
      player.scale.y = 1;
    }
  }
}


// ========================================
// MOUSE
// ========================================

function mouseMove(e) {

  if (
    document.pointerLockElement !==
    canvas
  ) {
    return;
  }


  yaw -=
    e.movementX * 0.0025;

  pitch -=
    e.movementY * 0.002;


  pitch =
    THREE.MathUtils.clamp(
      pitch,
      -0.65,
      0.35
    );
}


// ========================================
// PLAYER MOVEMENT
// ========================================

function updatePlayer(dt) {

  let forward = 0;
  let side = 0;

  if (keys["w"])
    forward += 1;

  if (keys["s"])
    forward -= 1;

  if (keys["d"])
    side += 1;

  if (keys["a"])
    side -= 1;


  const len =
    Math.hypot(
      forward,
      side
    );


  if (len > 0) {

    forward /= len;
    side /= len;


    const speed =
      crouching
        ? crouchSpeed
        : keys["shift"]
          ? sprintSpeed
          : normalSpeed;


    const forwardVector =
      new THREE.Vector3(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
      );


    const rightVector =
      new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
      );


    const movement =
      new THREE.Vector3();


    movement.addScaledVector(
      forwardVector,
      forward * speed * dt
    );


    movement.addScaledVector(
      rightVector,
      side * speed * dt
    );


    const next =
      playerGroup.position.clone();

    next.add(movement);


    if (
      !collides(next)
    ) {

      playerGroup.position.copy(
        next
      );
    }


    player.rotation.y =
      THREE.MathUtils.lerp(
        player.rotation.y,
        yaw,
        0.18
      );
  }


  // ======================================
  // JUMP / GRAVITY
  // ======================================

  velocityY -=
    gravity * dt;

  playerGroup.position.y +=
    velocityY * dt;


  if (
    playerGroup.position.y <= 0
  ) {

    playerGroup.position.y = 0;

    velocityY = 0;

    grounded = true;
  }
}


// ========================================
// COLLISION
// ========================================

function collides(pos) {

  const r = 0.6;


  for (
    const b of buildings
  ) {

    if (
      pos.x + r >
        b.x - b.w / 2 &&

      pos.x - r <
        b.x + b.w / 2 &&

      pos.z + r >
        b.z - b.d / 2 &&

      pos.z - r <
        b.z + b.d / 2
    ) {

      return true;
    }
  }


  return false;
}


// ========================================
// CAMERA
// ========================================

function updateCamera() {

  if (!playerGroup)
    return;


  const target =
    new THREE.Vector3(
      playerGroup.position.x,
      playerGroup.position.y +
        (crouching ? 1.25 : 1.7),
      playerGroup.position.z
    );


  const distance = 7;


  const horizontal =
    Math.cos(pitch) *
    distance;

  const vertical =
    Math.sin(pitch) *
    distance;


  const desired =
    new THREE.Vector3(
      target.x +
        Math.sin(yaw) *
        horizontal,

      target.y +
        vertical,

      target.z +
        Math.cos(yaw) *
        horizontal
    );


  camera.position.lerp(
    desired,
    0.12
  );


  camera.lookAt(
    target
  );
}


// ========================================
// SHOOTING
// ========================================

function shoot() {

  if (!running)
    return;


  const now =
    performance.now();


  if (
    now - lastShot < 110
  ) {
    return;
  }


  if (ammo <= 0) {

    reload();

    return;
  }


  lastShot = now;

  ammo--;

  updateAmmo();


  const origin =
    camera.position.clone();


  const direction =
    new THREE.Vector3();


  camera.getWorldDirection(
    direction
  );


  raycaster.set(
    origin,
    direction
  );


  const objects =
    enemies
      .filter(
        e => e.alive
      )
      .map(
        e => e.object
      );


  const hits =
    raycaster.intersectObjects(
      objects,
      true
    );


  createMuzzleFlash();


  if (
    hits.length === 0
  ) {
    return;
  }


  let hit =
    hits[0].object;


  while (
    hit.parent &&
    !enemies.some(
      e =>
        e.object === hit
    )
  ) {

    hit = hit.parent;
  }


  const enemyData =
    enemies.find(
      e =>
        e.object === hit
    );


  if (!enemyData)
    return;


  enemyData.health -= 35;


  showHit();


  if (
    enemyData.health <= 0
  ) {

    enemyData.alive = false;

    createDeathEffect(
      enemyData.object.position
    );

    scene.remove(
      enemyData.object
    );
  }
}


// ========================================
// MUZZLE FLASH
// ========================================

function createMuzzleFlash() {

  const light =
    new THREE.PointLight(
      0xffb13b,
      10,
      10
    );


  light.position.copy(
    playerGroup.position
  );

  light.position.y += 1.5;

  scene.add(light);


  setTimeout(
    () => {

      scene.remove(light);

    },
    45
  );
}


// ========================================
// HIT EFFECT
// ========================================

function showHit() {

  const marker =
    document.getElementById(
      "hitmarker"
    );


  if (!marker)
    return;


  marker.style.opacity = "1";


  setTimeout(
    () => {

      marker.style.opacity = "0";

    },
    80
  );
}


// ========================================
// DEATH EFFECT
// ========================================

function createDeathEffect(position) {

  const geometry =
    new THREE.SphereGeometry(
      0.4,
      8,
      8
    );


  const material =
    new THREE.MeshBasicMaterial({
      color: "#ff5b38"
    });


  const flash =
    new THREE.Mesh(
      geometry,
      material
    );


  flash.position.copy(
    position
  );

  scene.add(flash);


  let scale = 1;


  const interval =
    setInterval(
      () => {

        scale += 0.3;

        flash.scale.set(
          scale,
          scale,
          scale
        );

        material.opacity =
          Math.max(
            0,
            1 - scale / 4
          );

        material.transparent =
          true;


        if (scale >= 4) {

          clearInterval(interval);

          scene.remove(
            flash
          );
        }

      },
      30
    );
}


// ========================================
// ENEMY AI
// ========================================

function updateEnemies(dt) {

  for (
    const e of enemies
  ) {

    if (!e.alive)
      continue;


    const pos =
      e.object.position;


    const dx =
      playerGroup.position.x -
      pos.x;


    const dz =
      playerGroup.position.z -
      pos.z;


    const dist =
      Math.hypot(
        dx,
        dz
      );


    // Chase
    if (
      dist < 55 &&
      dist > 3
    ) {

      pos.x +=
        dx / dist *
        e.speed *
        dt;


      pos.z +=
        dz / dist *
        e.speed *
        dt;


      e.object.rotation.y =
        Math.atan2(
          dx,
          dz
        );
    }


    // Contact damage
    if (
      dist < 3
    ) {

      damage(
        10 * dt
      );
    }
  }
}


// ========================================
// PLAYER DAMAGE
// ========================================

function damage(amount) {

  if (!running)
    return;


  health -= amount;


  health =
    Math.max(
      0,
      health
    );


  updateHealth();


  const damageOverlay =
    document.getElementById(
      "damage"
    );


  if (damageOverlay) {

    damageOverlay.style.opacity =
      "0.22";


    setTimeout(
      () => {

        damageOverlay.style.opacity =
          "0";

      },
      100
    );
  }


  if (
    health <= 0
  ) {

    running = false;


    // FIXED: HTML uses deathScreen
    const deathScreen =
      document.getElementById(
        "deathScreen"
      );


    if (deathScreen) {

      deathScreen.style.display =
        "grid";
    }


    if (
      document.pointerLockElement
    ) {

      document.exitPointerLock();
    }
  }
}


// ========================================
// RELOAD
// ========================================

function reload() {

  const needed =
    30 - ammo;


  if (
    needed <= 0 ||
    reserveAmmo <= 0
  ) {

    return;
  }


  const amount =
    Math.min(
      needed,
      reserveAmmo
    );


  ammo += amount;

  reserveAmmo -= amount;

  updateAmmo();
}


// ========================================
// HUD
// ========================================

function updateHealth() {

  const bar =
    document.getElementById(
      "healthBar"
    );


  const text =
    document.getElementById(
      "healthText"
    );


  if (bar) {

    bar.style.width =
      health + "%";
  }


  if (text) {

    text.textContent =
      Math.ceil(health);
  }
}


function updateAmmo() {

  const ammoElement =
    document.getElementById(
      "ammo"
    );


  if (ammoElement) {

    ammoElement.textContent =
      ammo;
  }
}


// ========================================
// GAME LOOP
// ========================================

function animate() {

  if (!running)
    return;


  requestAnimationFrame(
    animate
  );


  const dt =
    Math.min(
      clock.getDelta(),
      0.05
    );


  updatePlayer(dt);

  updateCamera();

  updateEnemies(dt);


  if (shooting) {

    shoot();
  }


  renderer.render(
    scene,
    camera
  );
}


// ========================================
// RESIZE
// ========================================

function resize() {

  camera.aspect =
    window.innerWidth /
    window.innerHeight;


  camera.updateProjectionMatrix();


  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}
