"use strict";

/* =========================================================
   LAST//ALIVE
   DISTRICT 10
   ZERO DEPENDENCY BROWSER GAME
   Desktop + Mobile
========================================================= */

const $ = id => document.getElementById(id);

const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";
document.body.insertBefore(canvas, document.body.firstChild);

const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = W * DPR;
  canvas.height = H * DPR;

  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

window.addEventListener("resize", resize);
resize();

/* =========================================================
   GAME STATE
========================================================= */

let running = false;
let gameOver = false;

let playerName = "PLAYER";

let kills = 0;
let alive = 12;

let health = 100;
let armor = 100;
let medkits = 2;

let cameraX = 0;
let cameraY = 0;

let mouseX = W / 2;
let mouseY = H / 2;

let aimAngle = 0;

let lastTime = performance.now();

let zoneRadius = 1650;
let zoneDamageTimer = 0;

let messageTimer = 0;

/* =========================================================
   WORLD
========================================================= */

const WORLD = {
  width: 5200,
  height: 5200
};

const world = {
  roads: [],
  buildings: [],
  trees: [],
  rocks: [],
  water: [],
  loot: [],
  enemies: []
};

/* =========================================================
   INPUT
========================================================= */

const keys = {};

window.addEventListener("keydown", e => {

  keys[e.code] = true;

  if (
    e.code === "ArrowUp" ||
    e.code === "ArrowDown" ||
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight" ||
    e.code === "Space"
  ) {
    e.preventDefault();
  }

  if (e.code === "KeyR") reload();

  if (e.code === "Space") jump();

});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});

window.addEventListener("mousemove", e => {

  if (!running) return;

  mouseX = e.clientX;
  mouseY = e.clientY;

  aimAngle = Math.atan2(
    mouseY - H / 2,
    mouseX - W / 2
  );

});

window.addEventListener("mousedown", e => {

  if (!running) return;

  if (e.button === 0) {

    if (
      document.pointerLockElement !== canvas
    ) {
      canvas.requestPointerLock?.();
    }

    fire();
  }

});

canvas.addEventListener("click", () => {

  if (running) {
    canvas.requestPointerLock?.();
  }

});

/* =========================================================
   PLAYER
========================================================= */

const player = {
  x: 2600,
  y: 2600,

  vx: 0,
  vy: 0,

  radius: 24,

  angle: 0,

  speed: 250,
  sprint: 420,

  z: 0,
  vz: 0,

  grounded: true,

  weapon: 0,

  ammo: 30,
  reserve: 150,

  fireCooldown: 0,

  recoil: 0
};

const weapons = [
  {
    name: "AR-01",
    mag: 30,
    damage: 34,
    range: 850,
    rate: 0.11
  },

  {
    name: "SMG-9",
    mag: 40,
    damage: 19,
    range: 600,
    rate: 0.065
  },

  {
    name: "M12",
    mag: 6,
    damage: 14,
    range: 400,
    rate: 0.65,
    pellets: 7
  }
];

/* =========================================================
   RANDOM
========================================================= */

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function dist(a, b, c, d) {
  return Math.hypot(a - c, b - d);
}

/* =========================================================
   MAP GENERATION
========================================================= */

function generateMap() {

  world.roads.length = 0;
  world.buildings.length = 0;
  world.trees.length = 0;
  world.rocks.length = 0;
  world.loot.length = 0;
  world.enemies.length = 0;

  /* MAIN ROADS */

  for (let i = -2; i <= 2; i++) {

    world.roads.push({
      x: WORLD.width / 2 + i * 520,
      y: WORLD.height / 2,
      w: 100,
      h: WORLD.height
    });

    world.roads.push({
      x: WORLD.width / 2,
      y: WORLD.height / 2 + i * 520,
      w: WORLD.width,
      h: 100
    });

  }

  /* DIAGONAL ROADS */

  world.roads.push({
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    w: 75,
    h: 6000,
    rot: Math.PI / 4
  });

  world.roads.push({
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    w: 75,
    h: 6000,
    rot: -Math.PI / 4
  });

  /* CITY BLOCKS */

  for (let i = 0; i < 105; i++) {

    let x = rand(500, WORLD.width - 500);
    let y = rand(500, WORLD.height - 500);

    if (
      dist(
        x,
        y,
        WORLD.width / 2,
        WORLD.height / 2
      ) < 420
    ) {
      continue;
    }

    const w = rand(70, 190);
    const h = rand(60, 180);

    world.buildings.push({
      x,
      y,
      w,
      h,
      color: [
        "#273331",
        "#31403d",
        "#3a4643",
        "#26302e",
        "#45504d"
      ][
        Math.floor(Math.random() * 5)
      ],
      roof: Math.random() > .5
    });

  }

  /* FOREST */

  for (let i = 0; i < 260; i++) {

    let x = rand(150, WORLD.width - 150);
    let y = rand(150, WORLD.height - 150);

    if (
      dist(
        x,
        y,
        WORLD.width / 2,
        WORLD.height / 2
      ) < 900
    ) {
      continue;
    }

    world.trees.push({
      x,
      y,
      r: rand(18, 32)
    });

  }

  /* ROCKS */

  for (let i = 0; i < 180; i++) {

    world.rocks.push({
      x: rand(100, WORLD.width - 100),
      y: rand(100, WORLD.height - 100),
      r: rand(8, 28)
    });

  }

  /* LOOT */

  for (let i = 0; i < 45; i++) {

    world.loot.push({
      x: rand(350, WORLD.width - 350),
      y: rand(350, WORLD.height - 350),
      type: Math.random() > .5
        ? "armor"
        : "medkit",
      alive: true
    });

  }

  /* ENEMIES */

  const enemyCount = 11;

  for (let i = 0; i < enemyCount; i++) {

    let x;
    let y;

    do {

      x = rand(250, WORLD.width - 250);
      y = rand(250, WORLD.height - 250);

    } while (
      dist(
        x,
        y,
        player.x,
        player.y
      ) < 900
    );

    world.enemies.push(
      createEnemy(x, y, i)
    );

  }

}

/* =========================================================
   ENEMY
========================================================= */

function createEnemy(x, y, index) {

  return {

    x,
    y,

    vx: 0,
    vy: 0,

    radius: 22,

    angle: 0,

    health: 100,

    alive: true,

    speed: rand(90, 135),

    shootTimer: rand(1, 3),

    wander: Math.random() * Math.PI * 2,

    color: [
      "#e25d54",
      "#d96c38",
      "#b74754",
      "#cf8848"
    ][index % 4]

  };

}

/* =========================================================
   START
========================================================= */

function startGame() {

  const input = $("name");

  if (!input) return;

  playerName =
    input.value.trim() || "PLAYER";

  $("start").style.display = "none";
  $("hud").style.display = "block";

  if (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  ) {
    $("mobile").style.display = "block";
  }

  resetGame();

  running = true;
  gameOver = false;

  showMessage(
    "WELCOME TO DISTRICT 10"
  );

  requestAnimationFrame(loop);

}

$("enter").addEventListener(
  "click",
  startGame
);

$("name").addEventListener(
  "keydown",
  e => {

    if (e.key === "Enter") {
      startGame();
    }

  }
);

/* =========================================================
   RESET
========================================================= */

function resetGame() {

  kills = 0;
  alive = 12;

  health = 100;
  armor = 100;
  medkits = 2;

  zoneRadius = 1650;

  player.x = WORLD.width / 2;
  player.y = WORLD.height / 2;

  player.z = 0;
  player.vz = 0;

  player.weapon = 0;

  player.ammo = 30;
  player.reserve = 150;

  player.fireCooldown = 0;

  generateMap();

  updateHUD();

}

/* =========================================================
   CAMERA
========================================================= */

function updateCamera(dt) {

  const targetX =
    player.x - W / 2;

  const targetY =
    player.y - H / 2;

  cameraX +=
    (targetX - cameraX) *
    Math.min(1, dt * 7);

  cameraY +=
    (targetY - cameraY) *
    Math.min(1, dt * 7);

  cameraX = Math.max(
    0,
    Math.min(
      WORLD.width - W,
      cameraX
    )
  );

  cameraY = Math.max(
    0,
    Math.min(
      WORLD.height - H,
      cameraY
    )
  );

}

/* =========================================================
   INPUT MOVEMENT
========================================================= */

let joystickX = 0;
let joystickY = 0;
let sprintMobile = false;

function updateMovement(dt) {

  let x = 0;
  let y = 0;

  if (
    keys["KeyA"] ||
    keys["ArrowLeft"]
  ) x -= 1;

  if (
    keys["KeyD"] ||
    keys["ArrowRight"]
  ) x += 1;

  if (
    keys["KeyW"] ||
    keys["ArrowUp"]
  ) y -= 1;

  if (
    keys["KeyS"] ||
    keys["ArrowDown"]
  ) y += 1;

  x += joystickX;
  y += joystickY;

  const len = Math.hypot(x, y);

  if (len > 1) {
    x /= len;
    y /= len;
  }

  const sprint =
    keys["ShiftLeft"] ||
    keys["ShiftRight"] ||
    sprintMobile;

  const speed =
    sprint
      ? player.sprint
      : player.speed;

  player.vx =
    x * speed;

  player.vy =
    y * speed;

  player.x +=
    player.vx * dt;

  player.y +=
    player.vy * dt;

  player.x = Math.max(
    80,
    Math.min(
      WORLD.width - 80,
      player.x
    )
  );

  player.y = Math.max(
    80,
    Math.min(
      WORLD.height - 80,
      player.y
    )
  );

}

/* =========================================================
   AIM
========================================================= */

function updateAim() {

  if (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  ) {

    if (
      Math.abs(aimTouchX) +
      Math.abs(aimTouchY) > 5
    ) {

      aimAngle =
        Math.atan2(
          aimTouchY,
          aimTouchX
        );

    }

  } else {

    aimAngle =
      Math.atan2(
        mouseY - H / 2,
        mouseX - W / 2
      );

  }

  player.angle = aimAngle;

}

/* =========================================================
   JUMP
========================================================= */

function jump() {

  if (!player.grounded) return;

  player.grounded = false;
  player.vz = 520;

}

/* =========================================================
   UPDATE JUMP
========================================================= */

function updateJump(dt) {

  if (player.grounded) return;

  player.z +=
    player.vz * dt;

  player.vz -=
    1100 * dt;

  if (player.z <= 0) {

    player.z = 0;
    player.vz = 0;
    player.grounded = true;

  }

}

/* =========================================================
   SHOOT
========================================================= */

function fire() {

  if (!running) return;

  if (
    player.fireCooldown > 0
  ) return;

  if (
    player.ammo <= 0
  ) {

    reload();
    return;

  }

  const weapon =
    weapons[player.weapon];

  player.ammo--;

  player.fireCooldown =
    weapon.rate;

  player.recoil = 1;

  const pellets =
    weapon.pellets || 1;

  for (
    let i = 0;
    i < pellets;
    i++
  ) {

    let spread = 0;

    if (pellets > 1) {

      spread =
        (Math.random() - .5) *
        .28;

    } else {

      spread =
        (Math.random() - .5) *
        .035;

    }

    shootRay(
      player.angle + spread,
      weapon
    );

  }

  updateHUD();

}

/* =========================================================
   SHOOT RAY
========================================================= */

function shootRay(angle, weapon) {

  let best = null;
  let bestDistance =
    weapon.range;

  for (
    const enemy of world.enemies
  ) {

    if (!enemy.alive) continue;

    const dx =
      enemy.x - player.x;

    const dy =
      enemy.y - player.y;

    const d =
      Math.hypot(dx, dy);

    if (d > weapon.range)
      continue;

    const targetAngle =
      Math.atan2(dy, dx);

    let difference =
      Math.atan2(
        Math.sin(
          targetAngle - angle
        ),
        Math.cos(
          targetAngle - angle
        )
      );

    const tolerance =
      enemy.radius / d;

    if (
      Math.abs(difference) <
      tolerance
    ) {

      if (
        d < bestDistance
      ) {

        best = enemy;
        bestDistance = d;

      }

    }

  }

  if (best) {

    best.health -=
      weapon.damage;

    if (
      best.health <= 0
    ) {

      best.alive = false;

      kills++;

      alive--;

      showMessage(
        "ELIMINATION +1"
      );

      if (alive <= 1) {
        finish(true);
      }

    }

  }

}

/* =========================================================
   RELOAD
========================================================= */

let reloadTimer = 0;

function reload() {

  if (
    player.ammo >=
    weapons[player.weapon].mag
  ) return;

  if (
    player.reserve <= 0
  ) return;

  if (reloadTimer > 0)
    return;

  reloadTimer = 1.2;

  showMessage(
    "RELOADING..."
  );

}

/* =========================================================
   ENEMIES UPDATE
========================================================= */

function updateEnemies(dt) {

  for (
    const enemy of world.enemies
  ) {

    if (!enemy.alive)
      continue;

    const dx =
      player.x - enemy.x;

    const dy =
      player.y - enemy.y;

    const distance =
      Math.hypot(dx, dy);

    enemy.angle =
      Math.atan2(dy, dx);

    /* FAR ENEMIES */

    if (distance > 1000) {

      enemy.wander +=
        (Math.random() - .5) *
        dt;

      enemy.x +=
        Math.cos(enemy.wander) *
        enemy.speed *
        dt;

      enemy.y +=
        Math.sin(enemy.wander) *
        enemy.speed *
        dt;

    }

    /* TRACK PLAYER */

    else if (distance > 260) {

      enemy.x +=
        Math.cos(enemy.angle) *
        enemy.speed *
        dt;

      enemy.y +=
        Math.sin(enemy.angle) *
        enemy.speed *
        dt;

    }

    /* CLOSE RANGE */

    else {

      enemy.x +=
        Math.cos(
          enemy.angle + Math.PI
        ) *
        enemy.speed *
        .3 *
        dt;

      enemy.y +=
        Math.sin(
          enemy.angle + Math.PI
        ) *
        enemy.speed *
        .3 *
        dt;

    }

    enemy.x =
      Math.max(
        100,
        Math.min(
          WORLD.width - 100,
          enemy.x
        )
      );

    enemy.y =
      Math.max(
        100,
        Math.min(
          WORLD.height - 100,
          enemy.y
        )
      );

    enemy.shootTimer -= dt;

    if (
      distance < 850 &&
      enemy.shootTimer <= 0
    ) {

      enemy.shootTimer =
        rand(1.2, 2.4);

      if (
        Math.random() < .48
      ) {

        damagePlayer(
          rand(5, 12)
        );

      }

    }

  }

}

/* =========================================================
   DAMAGE
========================================================= */

function damagePlayer(amount) {

  if (!running) return;

  const absorbed =
    Math.min(
      armor,
      amount * .55
    );

  armor -= absorbed;

  health -=
    amount - absorbed;

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

  if (health <= 0) {

    finish(false);

  }

}

/* =========================================================
   LOOT
========================================================= */

function updateLoot() {

  for (
    const item of world.loot
  ) {

    if (!item.alive)
      continue;

    if (
      dist(
        item.x,
        item.y,
        player.x,
        player.y
      ) < 55
    ) {

      item.alive = false;

      if (
        item.type === "armor"
      ) {

        armor =
          Math.min(
            100,
            armor + 35
          );

        showMessage(
          "ARMOR +35"
        );

      } else {

        medkits++;

        showMessage(
          "MEDKIT +1"
        );

      }

      updateHUD();

    }

  }

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
      health + 45
    );

  updateHUD();

}

/* =========================================================
   WEAPON
========================================================= */

function switchWeapon() {

  player.weapon++;

  if (
    player.weapon >=
    weapons.length
  ) {

    player.weapon = 0;

  }

  const weapon =
    weapons[player.weapon];

  player.ammo =
    weapon.mag;

  player.reserve =
    weapon.mag * 5;

  updateHUD();

}

/* =========================================================
   ZONE
========================================================= */

function updateZone(dt) {

  zoneRadius -=
    4.5 * dt;

  zoneRadius =
    Math.max(
      420,
      zoneRadius
    );

  const distance =
    dist(
      player.x,
      player.y,
      WORLD.width / 2,
      WORLD.height / 2
    );

  if (
    distance >
    zoneRadius
  ) {

    zoneDamageTimer += dt;

    if (
      zoneDamageTimer >
      .5
    ) {

      zoneDamageTimer = 0;

      damagePlayer(4);

    }

  }

}

/* =========================================================
   DRAW WORLD
========================================================= */

function drawWorld() {

  ctx.fillStyle = "#18221f";
  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  /* GROUND */

  ctx.save();

  ctx.translate(
    -cameraX,
    -cameraY
  );

  ctx.fillStyle =
    "#263c32";

  ctx.fillRect(
    0,
    0,
    WORLD.width,
    WORLD.height
  );

  /* WATER EDGE */

  ctx.strokeStyle =
    "#27636a";

  ctx.lineWidth = 120;

  ctx.strokeRect(
    60,
    60,
    WORLD.width - 120,
    WORLD.height - 120
  );

  /* ROADS */

  for (
    const road of world.roads
  ) {

    ctx.save();

    ctx.translate(
      road.x,
      road.y
    );

    ctx.rotate(
      road.rot || 0
    );

    ctx.fillStyle =
      "#252c2b";

    ctx.fillRect(
      -road.w / 2,
      -road.h / 2,
      road.w,
      road.h
    );

    ctx.strokeStyle =
      "rgba(255,211,75,.4)";

    ctx.lineWidth = 2;

    const dash =
      32;

    if (
      road.w <
      road.h
    ) {

      for (
        let y =
          -road.h / 2;
        y <
        road.h / 2;
        y += dash * 2
      ) {

        ctx.fillStyle =
          "#c9a94e";

        ctx.fillRect(
          -2,
          y,
          4,
          dash
        );

      }

    } else {

      for (
        let x =
          -road.w / 2;
        x <
        road.w / 2;
        x += dash * 2
      ) {

        ctx.fillStyle =
          "#c9a94e";

        ctx.fillRect(
          x,
          -2,
          dash,
          4
        );

      }

    }

    ctx.restore();

  }

  /* BUILDINGS */

  for (
    const b of world.buildings
  ) {

    drawBuilding(b);

  }

  /* TREES */

  for (
    const tree of world.trees
  ) {

    if (
      tree.x <
        cameraX - 80 ||
      tree.x >
        cameraX + W + 80 ||
      tree.y <
        cameraY - 80 ||
      tree.y >
        cameraY + H + 80
    ) {
      continue;
    }

    drawTree(tree);

  }

  /* ROCKS */

  for (
    const rock of world.rocks
  ) {

    if (
      rock.x <
        cameraX - 80 ||
      rock.x >
        cameraX + W + 80 ||
      rock.y <
        cameraY - 80 ||
      rock.y >
        cameraY + H + 80
    ) {
      continue;
    }

    ctx.fillStyle =
      "#59645e";

    ctx.beginPath();

    ctx.arc(
      rock.x,
      rock.y,
      rock.r,
      0,
      Math.PI * 2
    );

    ctx.fill();

  }

  /* LOOT */

  for (
    const item of world.loot
  ) {

    if (!item.alive)
      continue;

    drawLoot(item);

  }

  ctx.restore();

}

/* =========================================================
   BUILDING
========================================================= */

function drawBuilding(b) {

  ctx.save();

  ctx.translate(
    b.x,
    b.y
  );

  ctx.shadowColor =
    "rgba(0,0,0,.5)";

  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle =
    "#151b19";

  ctx.fillRect(
    -b.w / 2 + 8,
    -b.h / 2 + 10,
    b.w,
    b.h
  );

  ctx.shadowColor =
    "transparent";

  ctx.fillStyle =
    b.color;

  ctx.fillRect(
    -b.w / 2,
    -b.h / 2,
    b.w,
    b.h
  );

  /* WINDOWS */

  ctx.fillStyle =
    "#77b7ae";

  const cols =
    Math.max(
      2,
      Math.floor(
        b.w / 35
      )
    );

  const rows =
    Math.max(
      2,
      Math.floor(
        b.h / 35
      )
    );

  for (
    let x = 0;
    x < cols;
    x++
  ) {

    for (
      let y = 0;
      y < rows;
      y++
    ) {

      ctx.globalAlpha =
        Math.random() > .3
          ? .75
          : .18;

      ctx.fillRect(
        -b.w / 2 +
          12 +
          x *
            ((b.w - 24) /
              cols),
        -b.h / 2 +
          12 +
          y *
            ((b.h - 24) /
              rows),
        7,
        10
      );

    }

  }

  ctx.globalAlpha = 1;

  if (b.roof) {

    ctx.strokeStyle =
      "rgba(255,255,255,.08)";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      -b.w / 2,
      -b.h / 2,
      b.w,
      b.h
    );

  }

  ctx.restore();

}

/* =========================================================
   TREE
========================================================= */

function drawTree(tree) {

  ctx.save();

  ctx.translate(
    tree.x,
    tree.y
  );

  ctx.fillStyle =
    "#684b32";

  ctx.fillRect(
    -5,
    3,
    10,
    30
  );

  ctx.fillStyle =
    "#173b2a";

  ctx.beginPath();

  ctx.arc(
    -12,
    -4,
    tree.r * .65,
    0,
    Math.PI * 2
  );

  ctx.arc(
    13,
    -8,
    tree.r * .7,
    0,
    Math.PI * 2
  );

  ctx.arc(
    0,
    -22,
    tree.r * .75,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

}

/* =========================================================
   LOOT DRAW
========================================================= */

function drawLoot(item) {

  ctx.save();

  ctx.translate(
    item.x,
    item.y
  );

  ctx.fillStyle =
    item.type === "armor"
      ? "#39bfff"
      : "#4cff91";

  ctx.shadowColor =
    ctx.fillStyle;

  ctx.shadowBlur = 16;

  ctx.fillRect(
    -12,
    -12,
    24,
    24
  );

  ctx.shadowBlur = 0;

  ctx.fillStyle =
    "#06201a";

  ctx.font =
    "bold 12px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    item.type === "armor"
      ? "A"
      : "+",
    0,
    0
  );

  ctx.restore();

}

/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {

  const sx =
    player.x -
    cameraX;

  const sy =
    player.y -
    cameraY -
    player.z;

  ctx.save();

  ctx.translate(
    sx,
    sy
  );

  /* SHADOW */

  ctx.fillStyle =
    "rgba(0,0,0,.35)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    player.z + 18,
    28,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* BODY */

  ctx.rotate(
    player.angle
  );

  /* LEGS */

  ctx.fillStyle =
    "#18211f";

  ctx.fillRect(
    -15,
    -2,
    10,
    28
  );

  ctx.fillRect(
    5,
    -2,
    10,
    28
  );

  /* BODY */

  ctx.fillStyle =
    "#293e3a";

  ctx.beginPath();

  ctx.roundRect(
    -21,
    -34,
    42,
    42,
    9
  );

  ctx.fill();

  /* ARMOR */

  ctx.fillStyle =
    "#4b5e59";

  ctx.fillRect(
    -20,
    -30,
    40,
    23
  );

  /* HEAD */

  ctx.fillStyle =
    "#c98c68";

  ctx.beginPath();

  ctx.arc(
    0,
    -49,
    15,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* HAIR */

  ctx.fillStyle =
    "#202421";

  ctx.beginPath();

  ctx.arc(
    0,
    -54,
    15,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  /* GUN */

  ctx.fillStyle =
    "#101513";

  ctx.fillRect(
    9,
    -25,
    48,
    9
  );

  ctx.fillStyle =
    "#38403d";

  ctx.fillRect(
    25,
    -21,
    12,
    15
  );

  ctx.restore();

}

/* =========================================================
   DRAW ENEMY
========================================================= */

function drawEnemy(enemy) {

  if (!enemy.alive)
    return;

  const sx =
    enemy.x -
    cameraX;

  const sy =
    enemy.y -
    cameraY;

  if (
    sx < -100 ||
    sx > W + 100 ||
    sy < -100 ||
    sy > H + 100
  ) return;

  ctx.save();

  ctx.translate(
    sx,
    sy
  );

  ctx.rotate(
    enemy.angle
  );

  /* SHADOW */

  ctx.fillStyle =
    "rgba(0,0,0,.4)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    15,
    24,
    9,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* BODY */

  ctx.fillStyle =
    enemy.color;

  ctx.fillRect(
    -18,
    -30,
    36,
    42
  );

  /* HEAD */

  ctx.fillStyle =
    "#c88a68";

  ctx.beginPath();

  ctx.arc(
    0,
    -43,
    13,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* MASK */

  ctx.fillStyle =
    "#161b1a";

  ctx.fillRect(
    -13,
    -47,
    26,
    8
  );

  /* GUN */

  ctx.fillStyle =
    "#111514";

  ctx.fillRect(
    10,
    -21,
    38,
    7
  );

  ctx.restore();

  /* HP BAR */

  const barW = 45;

  ctx.fillStyle =
    "rgba(0,0,0,.7)";

  ctx.fillRect(
    sx - barW / 2,
    sy - 62,
    barW,
    5
  );

  ctx.fillStyle =
    "#ff5555";

  ctx.fillRect(
    sx - barW / 2,
    sy - 62,
    barW *
      Math.max(
        0,
        enemy.health / 100
      ),
    5
  );

}

/* =========================================================
   DRAW ZONE
========================================================= */

function drawZone() {

  const cx =
    WORLD.width / 2 -
    cameraX;

  const cy =
    WORLD.height / 2 -
    cameraY;

  ctx.save();

  ctx.fillStyle =
    "rgba(70,130,255,.08)";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    zoneRadius,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "#57d9ff";

  ctx.lineWidth = 7;

  ctx.shadowColor =
    "#57d9ff";

  ctx.shadowBlur = 18;

  ctx.stroke();

  ctx.restore();

}

/* =========================================================
   DRAW
========================================================= */

function draw() {

  drawWorld();

  drawZone();

  for (
    const enemy of world.enemies
  ) {

    drawEnemy(enemy);

  }

  drawPlayer();

}

/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  $("health").textContent =
    Math.ceil(health);

  $("armor").textContent =
    Math.ceil(armor);

  $("kills").textContent =
    kills;

  $("alive").textContent =
    Math.max(
      1,
      alive
    );

  $("zone").textContent =
    Math.round(
      zoneRadius
    ) + "m";

  const weapon =
    weapons[player.weapon];

  $("weapon").textContent =
    weapon.name;

  $("ammo").textContent =
    player.ammo +
    " / " +
    player.reserve;

  $("medkits").textContent =
    medkits;

}

/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text) {

  $("message").textContent =
    text;

  messageTimer = 2;

}

/* =========================================================
   FINISH
========================================================= */

function finish(won) {

  if (!running)
    return;

  running = false;
  gameOver = true;

  document.exitPointerLock?.();

  $("result").style.display =
    "flex";

  $("resultTitle").textContent =
    won
      ? "BOOYAH!"
      : "ELIMINATED";

  $("resultText").textContent =
    won
      ? `${playerName} • ${kills} ELIMINATIONS`
      : `${playerName} • ${kills} KILLS`;

}

$("again").addEventListener(
  "click",
  () => {

    $("result").style.display =
      "none";

    resetGame();

    running = true;
    gameOver = false;

    requestAnimationFrame(loop);

  }
);

/* =========================================================
   GAME LOOP
========================================================= */

function loop(now) {

  if (!running)
    return;

  const dt =
    Math.min(
      .033,
      (now - lastTime) /
        1000
    );

  lastTime = now;

  player.fireCooldown =
    Math.max(
      0,
      player.fireCooldown - dt
    );

  player.recoil =
    Math.max(
      0,
      player.recoil - dt * 5
    );

  /* RELOAD */

  if (reloadTimer > 0) {

    reloadTimer -= dt;

    if (
      reloadTimer <= 0
    ) {

      const weapon =
        weapons[player.weapon];

      const needed =
        weapon.mag -
        player.ammo;

      const take =
        Math.min(
          needed,
          player.reserve
        );

      player.ammo += take;
      player.reserve -= take;

      updateHUD();

    }

  }

  updateMovement(dt);

  updateAim();

  updateJump(dt);

  updateEnemies(dt);

  updateLoot();

  updateZone(dt);

  updateCamera(dt);

  if (messageTimer > 0) {

    messageTimer -= dt;

    if (
      messageTimer <= 0
    ) {

      $("message").textContent =
        "";

    }

  }

  draw();

  requestAnimationFrame(loop);

}

/* =========================================================
   MOBILE JOYSTICK
========================================================= */

const joystick =
  $("joystick");

const stick =
  $("stick");

let joyActive = false;

function handleJoystick(e) {

  const rect =
    joystick.getBoundingClientRect();

  const cx =
    rect.left +
    rect.width / 2;

  const cy =
    rect.top +
    rect.height / 2;

  let dx =
    e.clientX - cx;

  let dy =
    e.clientY - cy;

  const max =
    rect.width / 2 - 30;

  const length =
    Math.hypot(
      dx,
      dy
    );

  if (length > max) {

    dx =
      dx / length * max;

    dy =
      dy / length * max;

  }

  joystickX =
    dx / max;

  joystickY =
    dy / max;

  stick.style.transform =
    `translate(${dx}px,${dy}px)`;

}

joystick.addEventListener(
  "pointerdown",
  e => {

    joyActive = true;

    joystick.setPointerCapture(
      e.pointerId
    );

    handleJoystick(e);

  }
);

joystick.addEventListener(
  "pointermove",
  e => {

    if (joyActive)
      handleJoystick(e);

  }
);

function endJoystick() {

  joyActive = false;

  joystickX = 0;
  joystickY = 0;

  stick.style.transform =
    "translate(0,0)";

}

joystick.addEventListener(
  "pointerup",
  endJoystick
);

joystick.addEventListener(
  "pointercancel",
  endJoystick
);

/* =========================================================
   MOBILE AIM
========================================================= */

let aimTouchX = 0;
let aimTouchY = 0;

const mobileAim =
  $("mobileAim");

mobileAim.addEventListener(
  "pointermove",
  e => {

    if (!running)
      return;

    aimTouchX =
      e.clientX -
      W / 2;

    aimTouchY =
      e.clientY -
      H / 2;

  }
);

/* =========================================================
   MOBILE FIRE
========================================================= */

let fireInterval = null;

$("fire").addEventListener(
  "pointerdown",
  e => {

    e.preventDefault();

    fire();

    fireInterval =
      setInterval(
        fire,
        70
      );

  }
);

function stopFire() {

  if (fireInterval) {

    clearInterval(
      fireInterval
    );

    fireInterval = null;

  }

}

$("fire").addEventListener(
  "pointerup",
  stopFire
);

$("fire").addEventListener(
  "pointercancel",
  stopFire
);

$("fire").addEventListener(
  "pointerleave",
  stopFire
);

/* =========================================================
   MOBILE BUTTONS
========================================================= */

$("sprint").addEventListener(
  "pointerdown",
  () => {

    sprintMobile = true;

  }
);

$("sprint").addEventListener(
  "pointerup",
  () => {

    sprintMobile = false;

  }
);

$("sprint").addEventListener(
  "pointercancel",
  () => {

    sprintMobile = false;

  }
);

$("jump").addEventListener(
  "pointerdown",
  jump
);

$("reload").addEventListener(
  "pointerdown",
  reload
);

$("switch").addEventListener(
  "pointerdown",
  switchWeapon
);

/* =========================================================
   MEDKIT KEY
========================================================= */

window.addEventListener(
  "keydown",
  e => {

    if (e.code === "KeyG") {
      useMedkit();
    }

    if (e.code === "Digit1") {
      player.weapon = 0;
      updateHUD();
    }

    if (e.code === "Digit2") {
      player.weapon = 1;
      updateHUD();
    }

    if (e.code === "Digit3") {
      player.weapon = 2;
      updateHUD();
    }

  }
);

/* =========================================================
   PREVENT CONTEXT MENU
========================================================= */

window.addEventListener(
  "contextmenu",
  e => e.preventDefault()
);

/* =========================================================
   INITIAL
========================================================= */

updateHUD();
