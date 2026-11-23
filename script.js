const $ = id => document.getElementById(id);

/* =========================================================
   LAST//ALIVE
   ACTUAL GLB MAP VERSION
   ========================================================= */

let scene;
let camera;
let renderer;
let clock;

let mapRoot;
let player;
let playerGun;

let running = false;

let yaw = 0;
let pitch = -0.12;

let cameraMode = 3;

const keys = {};

const enemies = [];
const bullets = [];
const pickups = [];

let health = 100;
let armor = 100;
let kills = 0;
let aliveCount = 12;
let medkits = 2;

let onGround = true;
let jumpVelocity = 0;
let crouching = false;

let lastShot = 0;
let reloading = false;

let zoneRadius = 180;
let zoneDamageTimer = 0;

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
   START
   ========================================================= */

function startGame() {

  const name = $("name").value.trim();

  if (!name) {

    $("name").focus();

    return;

  }

  $("start").style.display = "none";
  $("hud").style.display = "block";

  initGame();

  running = true;

  clock.start();

  updateHUD();

  setTimeout(() => {

    renderer.domElement.requestPointerLock();

  }, 500);

  requestAnimationFrame(gameLoop);

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initGame() {

  scene = new THREE.Scene();

  scene.background =
    new THREE.Color(0x91b3bc);

  scene.fog =
    new THREE.FogExp2(
      0x91b3bc,
      0.0018
    );


  camera =
    new THREE.PerspectiveCamera(
      68,
      innerWidth / innerHeight,
      0.1,
      2000
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
    Math.min(devicePixelRatio, 1.7)
  );


  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.15;


  document.body.appendChild(
    renderer.domElement
  );


  clock =
    new THREE.Clock();


  setupLighting();

  createSky();

  loadMap();

  createPlayer();

  createEnemies();

  createPickups();

  setupControls();

}


/* =========================================================
   LIGHTING
   ========================================================= */

function setupLighting() {

  const hemi =
    new THREE.HemisphereLight(
      0xd9f5ff,
      0x26352d,
      2.4
    );

  scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xfff0d0,
      4
    );

  sun.position.set(
    -300,
    400,
    200
  );


  sun.castShadow = true;


  sun.shadow.mapSize.width = 2048;

  sun.shadow.mapSize.height = 2048;


  sun.shadow.camera.left = -500;

  sun.shadow.camera.right = 500;

  sun.shadow.camera.top = 500;

  sun.shadow.camera.bottom = -500;

  sun.shadow.camera.near = 1;

  sun.shadow.camera.far = 1200;


  scene.add(sun);


  const fill =
    new THREE.DirectionalLight(
      0x8bbdff,
      0.8
    );

  fill.position.set(
    250,
    120,
    -250
  );

  scene.add(fill);

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
        color: 0x9dc1ca,
        side: THREE.BackSide
      })

    );

  scene.add(sky);

}


/* =========================================================
   ACTUAL GLB MAP
   ========================================================= */

function loadMap() {

  if (
    typeof THREE.GLTFLoader ===
    "undefined"
  ) {

    console.error(
      "GLTFLoader not loaded"
    );

    return;

  }


  const loader =
    new THREE.GLTFLoader();


  loader.load(

    "./free_fire_ful_map.glb",

    gltf => {

      mapRoot = gltf.scene;


      mapRoot.traverse(
        object => {

          if (
            object.isMesh
          ) {

            object.castShadow = true;

            object.receiveShadow = true;

            if (
              object.material
            ) {

              object.material.needsUpdate =
                true;

            }

          }

        }
      );


      /*
       * Map scaling.
       *
       * If your GLB already appears
       * correct size, keep this at 1.
       */

      mapRoot.scale.set(
        1,
        1,
        1
      );


      mapRoot.position.set(
        0,
        0,
        0
      );


      scene.add(mapRoot);


      console.log(
        "LAST//ALIVE MAP LOADED",
        gltf
      );


      /*
       * Automatically calculate
       * map size.
       */

      const box =
        new THREE.Box3()
          .setFromObject(mapRoot);


      const center =
        new THREE.Vector3();

      box.getCenter(center);


      console.log(
        "MAP CENTER:",
        center
      );


      console.log(
        "MAP SIZE:",
        box.getSize(
          new THREE.Vector3()
        )
      );

    },

    xhr => {

      if (xhr.total) {

        const percent =
          xhr.loaded /
          xhr.total *
          100;

        console.log(
          "MAP:",
          Math.round(percent) + "%"
        );

      }

    },

    error => {

      console.error(
        "MAP LOAD ERROR:",
        error
      );

      alert(
        "Map load nahi hua.\n\n" +
        "Check karo ki free_fire_ful_map.glb " +
        "index.html ke same folder me hai."
      );

    }

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

  const legMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x171b1e,
      roughness: 0.7
    });


  const leftLeg =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.15,
        4.2,
        1.15
      ),
      legMaterial
    );


  leftLeg.position.set(
    -0.65,
    2.1,
    0
  );


  player.add(leftLeg);


  const rightLeg =
    leftLeg.clone();


  rightLeg.position.x =
    0.65;


  player.add(rightLeg);


  /*
   * BODY
   */

  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        1.8,
        3.2,
        6,
        12
      ),

      new THREE.MeshStandardMaterial({
        color: 0x26353a,
        roughness: 0.65
      })

    );


  body.position.y = 6;

  body.castShadow = true;

  player.add(body);


  /*
   * VEST
   */

  const vest =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        3.5,
        2.8,
        2.2
      ),

      new THREE.MeshStandardMaterial({
        color: 0x35464b,
        roughness: 0.6
      })

    );


  vest.position.y = 6.1;

  vest.castShadow = true;

  player.add(vest);


  /*
   * HEAD
   */

  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1.4,
        24,
        16
      ),

      new THREE.MeshStandardMaterial({
        color: 0xd69a72,
        roughness: 0.75
      })

    );


  head.position.y = 9.7;

  head.castShadow = true;

  player.add(head);


  /*
   * HAIR
   */

  const hair =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1.48,
        20,
        12
      ),

      new THREE.MeshStandardMaterial({
        color: 0x16191c
      })

    );


  hair.scale.y = 0.55;

  hair.position.y = 10.6;

  player.add(hair);


  /*
   * GUN
   */

  playerGun =
    createGun();


  playerGun.position.set(
    1.5,
    6.2,
    -1.5
  );


  playerGun.rotation.y =
    Math.PI;


  player.add(playerGun);


  player.userData.gun =
    playerGun;


  /*
   * SPAWN
   */

  player.position.set(
    0,
    0,
    0
  );


  scene.add(player);

}


/* =========================================================
   GUN
   ========================================================= */

function createGun() {

  const gun =
    new THREE.Group();


  const material =
    new THREE.MeshStandardMaterial({
      color: 0x111517,
      metalness: 0.8,
      roughness: 0.25
    });


  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        0.65,
        0.65,
        3.5
      ),

      material

    );


  gun.add(body);


  const barrel =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.11,
        0.11,
        2.3,
        10
      ),

      material

    );


  barrel.rotation.x =
    Math.PI / 2;


  barrel.position.z =
    -2.6;


  gun.add(barrel);


  const stock =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        0.65,
        0.75,
        1.2
      ),

      material

    );


  stock.position.z =
    1.8;


  gun.add(stock);


  return gun;

}


/* =========================================================
   ENEMIES
   ========================================================= */

function createEnemies() {

  const spawnPoints = [

    [-70, 0, -70],
    [60, 0, -90],
    [120, 0, -30],
    [100, 0, 80],
    [30, 0, 120],
    [-70, 0, 110],
    [-130, 0, 60],
    [-140, 0, -20],
    [-90, 0, -120],
    [0, 0, -130],
    [150, 0, 100]

  ];


  spawnPoints.forEach(
    (position, index) => {

      createEnemy(
        position[0],
        position[1],
        position[2],
        index
      );

    }
  );

}


/* =========================================================
   ENEMY
   ========================================================= */

function createEnemy(
  x,
  y,
  z,
  index
) {

  const enemy =
    new THREE.Group();


  const dark =
    new THREE.MeshStandardMaterial({
      color: 0x17191b,
      roughness: 0.7
    });


  const red =
    new THREE.MeshStandardMaterial({
      color: 0x70292a,
      roughness: 0.7
    });


  const leg =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.1,
        4,
        1.1
      ),

      dark

    );


  leg.position.set(
    -0.65,
    2,
    0
  );


  enemy.add(leg);


  const leg2 =
    leg.clone();


  leg2.position.x =
    0.65;


  enemy.add(leg2);


  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        1.7,
        3,
        5,
        10
      ),

      red

    );


  body.position.y = 5.9;


  enemy.add(body);


  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        1.35,
        20,
        14
      ),

      new THREE.MeshStandardMaterial({
        color: 0xc58e6c
      })

    );


  head.position.y = 9.4;


  enemy.add(head);


  const gun =
    createGun();


  gun.scale.setScalar(
    0.8
  );


  gun.position.set(
    1.4,
    6,
    -1.3
  );


  enemy.add(gun);


  enemy.position.set(
    x,
    y,
    z
  );


  enemy.userData = {

    health: 100,

    alive: true,

    speed:
      3 +
      Math.random() * 1.8,

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


  scene.add(enemy);

  enemies.push(enemy);

}


/* =========================================================
   PICKUPS
   ========================================================= */

function createPickups() {

  const locations = [

    [-45, 0, -30],
    [40, 0, 30],
    [80, 0, -70],
    [-100, 0, 50],
    [100, 0, 100],
    [-50, 0, 100]

  ];


  locations.forEach(
    position => {

      createPickup(
        position[0],
        position[1] + 3,
        position[2],
        Math.random() > .5
          ? "ARMOR"
          : "MEDKIT"
      );

    }
  );

}


function createPickup(
  x,
  y,
  z,
  type
) {

  const color =
    type === "ARMOR"
      ? 0x29b9ff
      : 0x3dff86;


  const mesh =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        2,
        2,
        2
      ),

      new THREE.MeshStandardMaterial({

        color,

        emissive:
          color,

        emissiveIntensity:
          .4

      })

    );


  mesh.position.set(
    x,
    y,
    z
  );


  mesh.userData.type =
    type;


  scene.add(mesh);

  pickups.push(mesh);

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

        switchWeapon(0);

      }


      if (
        event.code ===
        "Digit2"
      ) {

        switchWeapon(1);

      }


      if (
        event.code ===
        "Digit3"
      ) {

        switchWeapon(2);

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
          11;

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
        0.0023;


      pitch -=
        event.movementY *
        0.002;


      pitch =
        THREE.MathUtils.clamp(
          pitch,
          -1,
          0.6
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

        renderer.domElement.requestPointerLock();

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

      renderer.domElement.requestPointerLock();

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

function updatePlayer(dt) {

  if (!player) return;


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
        : 9;


    if (
      crouching
    ) {

      speed *= .55;

    }


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


  /*
   * JUMP
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
   * WORLD LIMIT
   */

  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -250,
      250
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -250,
      250
    );

}


/* =========================================================
   THIRD PERSON CAMERA
   ========================================================= */

function updateCamera() {

  if (!player) return;


  /*
   * FIRST PERSON
   */

  if (
    cameraMode === 1
  ) {

    const head =
      new THREE.Vector3(
        0,
        9,
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
      : 7.5;


  const height =
    crouching
      ? 7
      : 8.5;


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


  camera.position.lerp(
    desired,
    0.15
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


  updateHUD();

}


/* =========================================================
   RAYCAST SHOOTING
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
        enemy.userData.alive
      ) {

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

    }
  );


  const hits =
    raycaster.intersectObjects(
      targets,
      false
    );


  if (
    hits.length === 0
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


  if (enemy) {

    damageEnemy(
      enemy,
      weapon.damage
    );

  }

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

function updateEnemies(dt) {

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
        distance < 100
      ) {

        const angle =
          Math.atan2(
            dx,
            -dz
          );


        enemy.rotation.y =
          angle;


        if (
          distance > 14
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


        enemy.userData.attackTimer -=
          dt;


        if (
          distance < 30 &&
          enemy.userData.attackTimer <= 0
        ) {

          enemy.userData.attackTimer =
            .7 +
            Math.random() *
            .8;


          enemyShoot(
            enemy
          );

        }

      }

    }
  );

}


/* =========================================================
   ENEMY SHOOT
   ========================================================= */

function enemyShoot(
  enemy
) {

  if (
    Math.random() > .38
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
   WEAPON
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
    weapons[currentWeapon];


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
   PICKUPS
   ========================================================= */

function updatePickups(
  dt
) {

  pickups.forEach(
    item => {

      if (
        !item.visible
      ) {

        return;

      }


      item.rotation.y +=
        dt * 1.5;


      item.position.y +=
        Math.sin(
          performance.now() *
          .003
        ) *
        dt *
        .5;


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


/* =========================================================
   SAFE ZONE
   ========================================================= */

function updateZone(
  dt
) {

  zoneDamageTimer +=
    dt;


  if (
    zoneRadius > 35
  ) {

    zoneRadius -=
      .8 * dt;

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

    if (
      zoneDamageTimer >
      .25
    ) {

      zoneDamageTimer =
        0;

      damagePlayer(
        2
      );

    }

  }


  if (
    $("zone")
  ) {

    $("zone").textContent =
      Math.round(
        zoneRadius
      ) + "m";

  }

}


/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

  const weapon =
    weapons[currentWeapon];


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
    ) + "m";

}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop() {

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


  $("resultTitle").textContent =
    won
      ? "BOOYAH!"
      : "ELIMINATED";


  $("resultText").textContent =
    won
      ? `${kills} ELIMINATIONS • LAST PLAYER ALIVE`
      : `${kills} ELIMINATIONS • YOU WERE ELIMINATED`;

}


/* =========================================================
   RESTART
   ========================================================= */

function restartGame() {

  location.reload();

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

    $("enter").addEventListener(
      "click",
      startGame
    );


    $("again").addEventListener(
      "click",
      restartGame
    );


    $("name").addEventListener(
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
