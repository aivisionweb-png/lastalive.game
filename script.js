"use strict";

/*
  LAST//ALIVE
  ZERO DEPENDENCIES
  ZERO CDN
  ZERO THREE.JS

  Canvas-based battle royale prototype.
*/

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

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

/* -----------------------------
   GAME STATE
----------------------------- */

let running = false;
let lastTime = 0;

let player = {
  x: 0,
  y: 0,
  angle: 0,
  hp: 100,
  armor: 100,
  ammo: 30,
  reserve: 150,
  kills: 0,
  speed: 155,
  sprint: false,
  fireCooldown: 0,
  invulnerable: 0
};

let camera = {
  x: 0,
  y: 0
};

let enemies = [];
let bullets = [];
let loot = [];
let particles = [];

let mapSize = 4200;
let zoneRadius = 1900;
let zoneTimer = 0;

const keys = {};

let mouse = {
  x: W / 2,
  y: H / 2,
  down: false
};

let mobile = {
  x: 0,
  y: 0,
  active: false,
  sprint: false,
  fire: false
};

/* -----------------------------
   INPUT
----------------------------- */

window.addEventListener("keydown", e => {
  keys[e.code] = true;

  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Space"
    ].includes(e.code)
  ) {
    e.preventDefault();
  }

  if (e.code === "KeyR") {
    reload();
  }

  if (e.code === "Space") {
    dash();
  }
});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});

canvas.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  if (running) {
    const dx = mouse.x - W / 2;
    const dy = mouse.y - H / 2;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      player.angle = Math.atan2(dy, dx);
    }
  }
});

canvas.addEventListener("mousedown", e => {
  if (e.button === 0) {
    mouse.down = true;
  }
});

window.addEventListener("mouseup", e => {
  if (e.button === 0) {
    mouse.down = false;
  }
});

/* -----------------------------
   MOBILE JOYSTICK
----------------------------- */

const joy = document.getElementById("joy");
const stick = document.getElementById("stick");

let joyPointer = null;

joy.addEventListener("pointerdown", e => {
  joyPointer = e.pointerId;
  joy.setPointerCapture(e.pointerId);
  mobile.active = true;
  updateJoy(e);
});

joy.addEventListener("pointermove", e => {
  if (e.pointerId === joyPointer) {
    updateJoy(e);
  }
});

joy.addEventListener("pointerup", resetJoy);
joy.addEventListener("pointercancel", resetJoy);

function updateJoy(e) {
  const r = joy.getBoundingClientRect();

  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  let dx = e.clientX - cx;
  let dy = e.clientY - cy;

  const max = 42;
  const len = Math.hypot(dx, dy);

  if (len > max) {
    dx = dx / len * max;
    dy = dy / len * max;
  }

  mobile.x = dx / max;
  mobile.y = dy / max;

  stick.style.transform =
    `translate(${dx}px, ${dy}px)`;
}

function resetJoy() {
  mobile.active = false;
  mobile.x = 0;
  mobile.y = 0;
  stick.style.transform = "translate(0,0)";
}

/* MOBILE BUTTONS */

const jumpBtn = document.getElementById("jump");
const sprintBtn = document.getElementById("sprint");
const fireBtn = document.getElementById("fire");

jumpBtn.addEventListener("pointerdown", e => {
  e.preventDefault();
  dash();
});

sprintBtn.addEventListener("pointerdown", e => {
  e.preventDefault();
  mobile.sprint = true;
});

sprintBtn.addEventListener("pointerup", () => {
  mobile.sprint = false;
});

sprintBtn.addEventListener("pointercancel", () => {
  mobile.sprint = false;
});

fireBtn.addEventListener("pointerdown", e => {
  e.preventDefault();
  mobile.fire = true;
});

fireBtn.addEventListener("pointerup", () => {
  mobile.fire = false;
});

fireBtn.addEventListener("pointercancel", () => {
  mobile.fire = false;
});

/* -----------------------------
   MAP
----------------------------- */

const buildings = [];
const roads = [];
const trees = [];
const cars = [];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function dist(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function generateMap() {

  buildings.length = 0;
  roads.length = 0;
  trees.length = 0;
  cars.length = 0;

  /* ROADS */

  for (let x = -1800; x <= 1800; x += 450) {
    roads.push({
      x,
      y: 0,
      w: 100,
      h: 3600,
      type: "vertical"
    });
  }

  for (let y = -1800; y <= 1800; y += 450) {
    roads.push({
      x: 0,
      y,
      w: 3600,
      h: 100,
      type: "horizontal"
    });
  }

  /* BUILDING DISTRICTS */

  for (let i = 0; i < 85; i++) {

    let x;
    let y;

    let attempts = 0;

    do {

      x = rand(-1850, 1850);
      y = rand(-1850, 1850);

      attempts++;

    } while (
      nearRoad(x, y) &&
      attempts < 50
    );

    const w = rand(65, 190);
    const h = rand(65, 190);

    buildings.push({
      x,
      y,
      w,
      h,
      color: [
        "#26343a",
        "#304147",
        "#3a464a",
        "#253238",
        "#45484a"
      ][Math.floor(Math.random() * 5)]
    });
  }

  /* TREES */

  for (let i = 0; i < 180; i++) {

    const x = rand(-2050, 2050);
    const y = rand(-2050, 2050);

    if (nearRoad(x, y)) continue;

    trees.push({
      x,
      y,
      r: rand(12, 25)
    });
  }

  /* CARS */

  for (let i = 0; i < 35; i++) {

    const horizontal =
      Math.random() > .5;

    cars.push({
      x: horizontal
        ? rand(-1900, 1900)
        : Math.round(rand(-4, 4)) * 450,

      y: horizontal
        ? Math.round(rand(-4, 4)) * 450
        : rand(-1900, 1900),

      horizontal,
      color: [
        "#bd3e38",
        "#4a7180",
        "#d0a64b",
        "#8c8f87",
        "#28383d"
      ][Math.floor(Math.random() * 5)]
    });
  }
}

function nearRoad(x, y) {

  const roadSpacing = 450;

  const nearestX =
    Math.abs(
      x -
      Math.round(x / roadSpacing) *
      roadSpacing
    );

  const nearestY =
    Math.abs(
      y -
      Math.round(y / roadSpacing) *
      roadSpacing
    );

  return (
    nearestX < 115 ||
    nearestY < 115
  );
}

/* -----------------------------
   ENEMIES
----------------------------- */

function createEnemies() {

  enemies.length = 0;

  /*
    IMPORTANT:
    Enemies are NEVER spawned close
    to the player.
  */

  for (let i = 0; i < 9; i++) {

    let x;
    let y;

    do {

      x = rand(-1750, 1750);
      y = rand(-1750, 1750);

    } while (
      Math.hypot(x, y) < 900
    );

    enemies.push({
      x,
      y,
      angle: 0,
      hp: 100,
      speed: rand(45, 72),
      fireCooldown: rand(1, 3),
      alive: true,
      wander: Math.random() * Math.PI * 2,
      color: [
        "#d95b48",
        "#b95046",
        "#e07c53",
        "#c94c52"
      ][i % 4]
    });
  }
}

/* -----------------------------
   LOOT
----------------------------- */

function createLoot() {

  loot.length = 0;

  for (let i = 0; i < 25; i++) {

    loot.push({
      x: rand(-1800, 1800),
      y: rand(-1800, 1800),
      type:
        Math.random() > .5
          ? "ammo"
          : "armor"
    });
  }
}

/* -----------------------------
   START
----------------------------- */

function startGame() {

  const name =
    document.getElementById("name").value.trim();

  if (!name) {
    document.getElementById("name").focus();
    return;
  }

  document.getElementById("start").style.display = "none";
  document.getElementById("hud").style.display = "block";

  resetGame();

  running = true;
  lastTime = performance.now();

  requestAnimationFrame(loop);
}

document
  .getElementById("enter")
  .addEventListener("click", startGame);

document
  .getElementById("name")
  .addEventListener("keydown", e => {
    if (e.key === "Enter") {
      startGame();
    }
  });

/* -----------------------------
   RESET
----------------------------- */

function resetGame() {

  player.x = 0;
  player.y = 0;
  player.angle = 0;

  player.hp = 100;
  player.armor = 100;
  player.ammo = 30;
  player.reserve = 150;
  player.kills = 0;
  player.fireCooldown = 0;
  player.invulnerable = 2;

  zoneRadius = 1900;
  zoneTimer = 0;

  bullets = [];
  particles = [];

  generateMap();
  createEnemies();
  createLoot();

  camera.x = 0;
  camera.y = 0;

  updateHUD();
}

/* -----------------------------
   MOVEMENT
----------------------------- */

function updatePlayer(dt) {

  let mx = 0;
  let my = 0;

  if (keys["KeyW"] || keys["ArrowUp"])
    my -= 1;

  if (keys["KeyS"] || keys["ArrowDown"])
    my += 1;

  if (keys["KeyA"] || keys["ArrowLeft"])
    mx -= 1;

  if (keys["KeyD"] || keys["ArrowRight"])
    mx += 1;

  if (mobile.active) {
    mx = mobile.x;
    my = mobile.y;
  }

  const len = Math.hypot(mx, my);

  if (len > 0) {

    mx /= len;
    my /= len;

    const sprint =
      keys["ShiftLeft"] ||
      keys["ShiftRight"] ||
      mobile.sprint;

    const speed =
      sprint
        ? 280
        : 155;

    player.x += mx * speed * dt;
    player.y += my * speed * dt;

    if (
      !mouse.down &&
      !mobile.fire &&
      len > 0
    ) {
      player.angle =
        Math.atan2(my, mx);
    }
  }

  player.x = Math.max(
    -2050,
    Math.min(2050, player.x)
  );

  player.y = Math.max(
    -2050,
    Math.min(2050, player.y)
  );

  if (player.invulnerable > 0) {
    player.invulnerable -= dt;
  }

  player.fireCooldown -= dt;
}

/* -----------------------------
   AIM
----------------------------- */

function updateAim() {

  if (!running) return;

  if (
    window.innerWidth > 700 &&
    (mouse.down || true)
  ) {

    const dx =
      mouse.x - W / 2;

    const dy =
      mouse.y - H / 2;

    if (
      Math.abs(dx) > 8 ||
      Math.abs(dy) > 8
    ) {
      player.angle =
        Math.atan2(dy, dx);
    }
  }
}

/* -----------------------------
   SHOOT
----------------------------- */

function shoot() {

  if (!running) return;

  if (player.fireCooldown > 0)
    return;

  if (player.ammo <= 0) {
    reload();
    return;
  }

  player.ammo--;

  player.fireCooldown = .11;

  const spread =
    (Math.random() - .5) * .035;

  const angle =
    player.angle + spread;

  bullets.push({
    x:
      player.x +
      Math.cos(angle) * 25,

    y:
      player.y +
      Math.sin(angle) * 25,

    vx:
      Math.cos(angle) * 900,

    vy:
      Math.sin(angle) * 900,

    life: .9,
    owner: "player"
  });

  for (let i = 0; i < 4; i++) {

    particles.push({
      x: player.x + Math.cos(angle) * 25,
      y: player.y + Math.sin(angle) * 25,
      vx: Math.cos(angle) * rand(80, 200),
      vy: Math.sin(angle) * rand(80, 200),
      life: .15,
      color: "#ffd36a"
    });
  }

  updateHUD();
}

function reload() {

  if (player.ammo >= 30)
    return;

  if (player.reserve <= 0)
    return;

  const need =
    30 - player.ammo;

  const amount =
    Math.min(need, player.reserve);

  player.ammo += amount;
  player.reserve -= amount;

  updateHUD();
}

/* -----------------------------
   DASH
----------------------------- */

let dashCooldown = 0;

function dash() {

  if (!running)
    return;

  if (dashCooldown > 0)
    return;

  dashCooldown = .8;

  player.x +=
    Math.cos(player.angle) * 120;

  player.y +=
    Math.sin(player.angle) * 120;
}

/* -----------------------------
   ENEMY AI
----------------------------- */

function updateEnemies(dt) {

  for (const enemy of enemies) {

    if (!enemy.alive)
      continue;

    const dx =
      player.x - enemy.x;

    const dy =
      player.y - enemy.y;

    const d =
      Math.hypot(dx, dy);

    /*
      Enemies only react from a reasonable
      distance. No instant spawning on top.
    */

    if (d < 850) {

      enemy.angle =
        Math.atan2(dy, dx);

      if (d > 260) {

        enemy.x +=
          Math.cos(enemy.angle) *
          enemy.speed *
          dt;

        enemy.y +=
          Math.sin(enemy.angle) *
          enemy.speed *
          dt;

      } else if (d < 180) {

        enemy.x -=
          Math.cos(enemy.angle) *
          enemy.speed *
          .5 *
          dt;

        enemy.y -=
          Math.sin(enemy.angle) *
          enemy.speed *
          .5 *
          dt;
      }

      enemy.fireCooldown -= dt;

      if (
        d < 600 &&
        enemy.fireCooldown <= 0
      ) {

        enemy.fireCooldown =
          rand(1.1, 2.2);

        enemyShoot(enemy);
      }

    } else {

      enemy.wander +=
        rand(-.5, .5) * dt;

      enemy.x +=
        Math.cos(enemy.wander) *
        enemy.speed *
        .25 *
        dt;

      enemy.y +=
        Math.sin(enemy.wander) *
        enemy.speed *
        .25 *
        dt;
    }
  }
}

/* -----------------------------
   ENEMY SHOOT
----------------------------- */

function enemyShoot(enemy) {

  const accuracy =
    .55 +
    Math.random() * .25;

  if (Math.random() > accuracy)
    return;

  const angle =
    Math.atan2(
      player.y - enemy.y,
      player.x - enemy.x
    );

  bullets.push({
    x: enemy.x,
    y: enemy.y,

    vx:
      Math.cos(angle) * 520,

    vy:
      Math.sin(angle) * 520,

    life: 1.5,

    owner: "enemy"
  });
}

/* -----------------------------
   BULLETS
----------------------------- */

function updateBullets(dt) {

  for (let i = bullets.length - 1; i >= 0; i--) {

    const b = bullets[i];

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    b.life -= dt;

    if (b.life <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    if (b.owner === "player") {

      for (const enemy of enemies) {

        if (!enemy.alive)
          continue;

        const d =
          Math.hypot(
            b.x - enemy.x,
            b.y - enemy.y
          );

        if (d < 32) {

          enemy.hp -= 38;

          createHit(
            enemy.x,
            enemy.y
          );

          bullets.splice(i, 1);

          if (enemy.hp <= 0) {

            enemy.alive = false;

            player.kills++;

            createExplosion(
              enemy.x,
              enemy.y
            );

            updateHUD();

            checkWin();
          }

          break;
        }
      }
    }

    else {

      const d =
        Math.hypot(
          b.x - player.x,
          b.y - player.y
        );

      if (
        d < 28 &&
        player.invulnerable <= 0
      ) {

        damagePlayer(
          rand(8, 15)
        );

        bullets.splice(i, 1);
      }
    }
  }
}

/* -----------------------------
   PLAYER DAMAGE
----------------------------- */

function damagePlayer(amount) {

  let remaining = amount;

  const armorHit =
    Math.min(
      player.armor,
      remaining * .65
    );

  player.armor -= armorHit;

  remaining -= armorHit;

  player.hp -= remaining;

  document.getElementById("damage").style.opacity = ".35";

  setTimeout(() => {
    document.getElementById("damage").style.opacity = "0";
  }, 80);

  updateHUD();

  if (player.hp <= 0) {
    endGame(false);
  }
}

/* -----------------------------
   ZONE
----------------------------- */

function updateZone(dt) {

  zoneTimer += dt;

  if (zoneTimer > 3) {

    zoneTimer = 0;

    zoneRadius =
      Math.max(
        450,
        zoneRadius - 18
      );
  }

  const d =
    Math.hypot(
      player.x,
      player.y
    );

  if (
    d > zoneRadius &&
    player.invulnerable <= 0
  ) {
    damagePlayer(4 * dt);
  }

  if (dashCooldown > 0) {
    dashCooldown -= dt;
  }
}

/* -----------------------------
   LOOT
----------------------------- */

function updateLoot() {

  for (let i = loot.length - 1; i >= 0; i--) {

    const item = loot[i];

    const d =
      Math.hypot(
        player.x - item.x,
        player.y - item.y
      );

    if (d < 40) {

      if (item.type === "ammo") {

        player.reserve += 45;

      } else {

        player.armor =
          Math.min(
            100,
            player.armor + 35
          );
      }

      loot.splice(i, 1);

      updateHUD();
    }
  }
}

/* -----------------------------
   PARTICLES
----------------------------- */

function createHit(x, y) {

  for (let i = 0; i < 8; i++) {

    particles.push({
      x,
      y,
      vx: rand(-100, 100),
      vy: rand(-100, 100),
      life: .35,
      color: "#ffce66"
    });
  }
}

function createExplosion(x, y) {

  for (let i = 0; i < 25; i++) {

    particles.push({
      x,
      y,
      vx: rand(-180, 180),
      vy: rand(-180, 180),
      life: rand(.25, .7),
      color:
        Math.random() > .5
          ? "#ff6347"
          : "#ffcf5c"
    });
  }
}

function updateParticles(dt) {

  for (let i = particles.length - 1; i >= 0; i--) {

    const p = particles[i];

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

/* -----------------------------
   CAMERA
----------------------------- */

function updateCamera() {

  camera.x +=
    (player.x - camera.x) * .12;

  camera.y +=
    (player.y - camera.y) * .12;
}

/* -----------------------------
   DRAW
----------------------------- */

function worldToScreen(x, y) {

  return {
    x:
      x - camera.x + W / 2,

    y:
      y - camera.y + H / 2
  };
}

function drawWorld() {

  ctx.fillStyle = "#111a1c";
  ctx.fillRect(0, 0, W, H);

  ctx.save();

  ctx.translate(
    W / 2 - camera.x,
    H / 2 - camera.y
  );

  /* MAP */

  ctx.fillStyle = "#1d3434";

  ctx.fillRect(
    -mapSize / 2,
    -mapSize / 2,
    mapSize,
    mapSize
  );

  /* GRID / BLOCKS */

  ctx.strokeStyle =
    "rgba(100,170,160,.06)";

  ctx.lineWidth = 1;

  for (
    let x = -2000;
    x <= 2000;
    x += 100
  ) {

    ctx.beginPath();
    ctx.moveTo(x, -2100);
    ctx.lineTo(x, 2100);
    ctx.stroke();
  }

  for (
    let y = -2000;
    y <= 2000;
    y += 100
  ) {

    ctx.beginPath();
    ctx.moveTo(-2100, y);
    ctx.lineTo(2100, y);
    ctx.stroke();
  }

  /* ROADS */

  for (const road of roads) {

    ctx.fillStyle = "#273337";

    ctx.fillRect(
      road.x - road.w / 2,
      road.y - road.h / 2,
      road.w,
      road.h
    );

    ctx.strokeStyle = "#d2b44e";
    ctx.lineWidth = 3;
    ctx.setLineDash([25, 25]);

    ctx.beginPath();

    if (road.type === "vertical") {

      ctx.moveTo(
        road.x,
        road.y - road.h / 2
      );

      ctx.lineTo(
        road.x,
        road.y + road.h / 2
      );

    } else {

      ctx.moveTo(
        road.x - road.w / 2,
        road.y
      );

      ctx.lineTo(
        road.x + road.w / 2,
        road.y
      );
    }

    ctx.stroke();

    ctx.setLineDash([]);
  }

  /* BUILDINGS */

  for (const b of buildings) {

    ctx.fillStyle = "rgba(0,0,0,.3)";

    ctx.fillRect(
      b.x - b.w / 2 + 12,
      b.y - b.h / 2 + 14,
      b.w,
      b.h
    );

    ctx.fillStyle = b.color;

    ctx.fillRect(
      b.x - b.w / 2,
      b.y - b.h / 2,
      b.w,
      b.h
    );

    ctx.strokeStyle =
      "rgba(160,220,215,.15)";

    ctx.strokeRect(
      b.x - b.w / 2,
      b.y - b.h / 2,
      b.w,
      b.h
    );

    /* WINDOWS */

    ctx.fillStyle = "#75a9aa";

    const cols =
      Math.max(
        2,
        Math.floor(b.w / 38)
      );

    const rows =
      Math.max(
        2,
        Math.floor(b.h / 38)
      );

    for (let ix = 0; ix < cols; ix++) {

      for (let iy = 0; iy < rows; iy++) {

        ctx.fillRect(
          b.x -
            b.w / 2 +
            15 +
            ix * 38,

          b.y -
            b.h / 2 +
            14 +
            iy * 38,

          9,
          7
        );
      }
    }
  }

  /* TREES */

  for (const t of trees) {

    ctx.fillStyle = "#5a4030";

    ctx.fillRect(
      t.x - 4,
      t.y,
      8,
      20
    );

    ctx.fillStyle = "#214d39";

    ctx.beginPath();

    ctx.arc(
      t.x,
      t.y - 8,
      t.r,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  /* CARS */

  for (const c of cars) {

    ctx.save();

    ctx.translate(c.x, c.y);

    if (!c.horizontal)
      ctx.rotate(Math.PI / 2);

    ctx.fillStyle = "#111719";

    ctx.fillRect(
      -25,
      -11,
      50,
      22
    );

    ctx.fillStyle = c.color;

    ctx.fillRect(
      -20,
      -8,
      40,
      16
    );

    ctx.restore();
  }

  /* LOOT */

  for (const item of loot) {

    ctx.save();

    ctx.translate(
      item.x,
      item.y
    );

    ctx.rotate(
      performance.now() * .002
    );

    ctx.fillStyle =
      item.type === "ammo"
        ? "#ffd15c"
        : "#4de5c1";

    ctx.fillRect(
      -10,
      -10,
      20,
      20
    );

    ctx.restore();
  }

  /* ENEMIES */

  for (const enemy of enemies) {

    if (!enemy.alive)
      continue;

    drawCharacter(
      enemy.x,
      enemy.y,
      enemy.angle,
      enemy.color,
      false
    );

    /* HP */

    ctx.fillStyle = "#111";

    ctx.fillRect(
      enemy.x - 22,
      enemy.y - 42,
      44,
      5
    );

    ctx.fillStyle = "#ef5b5b";

    ctx.fillRect(
      enemy.x - 22,
      enemy.y - 42,
      44 * (enemy.hp / 100),
      5
    );
  }

  /* BULLETS */

  for (const b of bullets) {

    ctx.fillStyle =
      b.owner === "player"
        ? "#ffe18a"
        : "#ff5555";

    ctx.beginPath();

    ctx.arc(
      b.x,
      b.y,
      4,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  /* PARTICLES */

  for (const p of particles) {

    ctx.globalAlpha =
      Math.max(0, p.life * 2);

    ctx.fillStyle = p.color;

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;
  }

  /* PLAYER */

  drawCharacter(
    player.x,
    player.y,
    player.angle,
    "#4fe3c0",
    true
  );

  /* SAFE ZONE */

  ctx.strokeStyle =
    "rgba(80,255,190,.8)";

  ctx.lineWidth = 5;

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    zoneRadius,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.restore();
}

/* -----------------------------
   CHARACTER
----------------------------- */

function drawCharacter(
  x,
  y,
  angle,
  color,
  isPlayer
) {

  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(angle);

  /* shadow */

  ctx.fillStyle =
    "rgba(0,0,0,.35)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    17,
    22,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* legs */

  ctx.fillStyle =
    isPlayer
      ? "#17282a"
      : "#211c1d";

  ctx.fillRect(
    -13,
    2,
    9,
    22
  );

  ctx.fillRect(
    4,
    2,
    9,
    22
  );

  /* body */

  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.roundRect(
    -16,
    -17,
    32,
    30,
    7
  );

  ctx.fill();

  /* head */

  ctx.fillStyle = "#d79a73";

  ctx.beginPath();

  ctx.arc(
    0,
    -25,
    11,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* hair */

  ctx.fillStyle = "#1c2225";

  ctx.beginPath();

  ctx.arc(
    0,
    -29,
    11,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  /* gun */

  ctx.fillStyle = "#0c1113";

  ctx.fillRect(
    7,
    -5,
    34,
    7
  );

  ctx.fillRect(
    31,
    -7,
    14,
    4
  );

  /* muzzle */

  ctx.fillStyle = "#aab6b2";

  ctx.fillRect(
    43,
    -6,
    4,
    6
  );

  ctx.restore();
}

/* -----------------------------
   HUD
----------------------------- */

function updateHUD() {

  document.getElementById("hp").textContent =
    Math.max(0, Math.ceil(player.hp));

  document.getElementById("armor").textContent =
    Math.max(0, Math.ceil(player.armor));

  document.getElementById("ammo").textContent =
    `${player.ammo} / ${player.reserve}`;

  document.getElementById("kills").textContent =
    player.kills;

  const alive =
    enemies.filter(e => e.alive).length + 1;

  document.getElementById("alive").textContent =
    alive;

  document.getElementById("zone").textContent =
    Math.round(zoneRadius) + "m";
}

/* -----------------------------
   WIN / LOSE
----------------------------- */

function checkWin() {

  const alive =
    enemies.filter(e => e.alive).length;

  if (alive <= 0) {
    endGame(true);
  }
}

function endGame(won) {

  if (!running)
    return;

  running = false;

  document.getElementById("result").style.display =
    "flex";

  document.getElementById("resultTitle").textContent =
    won
      ? "BOOYAH!"
      : "ELIMINATED";

  document.getElementById("resultText").textContent =
    won
      ? `${player.kills} ELIMINATIONS • LAST ALIVE`
      : `${player.kills} ELIMINATIONS`;
}

document
  .getElementById("again")
  .addEventListener("click", () => {

    document.getElementById("result").style.display =
      "none";

    startGame();
  });

/* -----------------------------
   LOOP
----------------------------- */

function loop(time) {

  if (!running)
    return;

  const dt =
    Math.min(
      (time - lastTime) / 1000,
      .033
    );

  lastTime = time;

  updatePlayer(dt);
  updateAim();

  if (mouse.down || mobile.fire) {
    shoot();
  }

  updateEnemies(dt);
  updateBullets(dt);
  updateParticles(dt);
  updateLoot();
  updateZone(dt);

  updateCamera();

  drawWorld();

  requestAnimationFrame(loop);
}

/* initial screen */
document.getElementById("hud").style.display = "none";
