"use strict";

/*
=========================================================
 LAST//ALIVE
 DISTRICT 10
 ZERO EXTERNAL LIBRARIES
 ZERO THREE.JS
 PURE CANVAS ENGINE
=========================================================
*/

const canvas = document.getElementById("game");
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

/* =====================================================
   GAME STATE
===================================================== */

let running = false;
let gameOver = false;

let player = {
  x: 0,
  y: 0,
  z: 0,

  vx: 0,
  vz: 0,

  angle: 0,

  health: 100,
  armor: 100,

  speed: 5.5,
  sprint: false,
  crouch: false,

  jump: 0,
  grounded: true
};

let camera = {
  x: 0,
  z: 0,
  angle: 0
};

let mouse = {
  x: 0,
  y: 0,
  down: false,
  locked: false
};

let keys = {};

let kills = 0;
let alive = 12;
let medkits = 2;

let zoneRadius = 180;
let zoneDamageTimer = 0;

let time = 0;

let bullets = [];
let enemies = [];
let buildings = [];
let trees = [];
let loot = [];
let particles = [];
let roads = [];

/* =====================================================
   WEAPONS
===================================================== */

const weapons = [
  {
    name: "AR-01",
    damage: 32,
    fireRate: 130,
    ammo: 30,
    mag: 30,
    reserve: 150,
    spread: 0.035
  },

  {
    name: "SMG-9",
    damage: 18,
    fireRate: 70,
    ammo: 40,
    mag: 40,
    reserve: 200,
    spread: 0.055
  },

  {
    name: "M12",
    damage: 16,
    fireRate: 650,
    ammo: 6,
    mag: 6,
    reserve: 48,
    spread: 0.16,
    pellets: 7
  }
];

let currentWeapon = 0;
let lastShot = 0;
let reloadTimer = 0;

/* =====================================================
   MAP
===================================================== */

const MAP_SIZE = 520;

/*
  DISTRICT 10
  Large urban combat map.
*/

function random(min, max) {
  return min + Math.random() * (max - min);
}

function dist(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.z - b.z
  );
}

/* =====================================================
   MAP GENERATION
===================================================== */

function buildMap() {

  buildings = [];
  trees = [];
  roads = [];
  loot = [];

  /* MAIN ROADS */

  roads.push({
    x: 0,
    z: 0,
    w: 30,
    h: 500
  });

  roads.push({
    x: 0,
    z: 0,
    w: 500,
    h: 30
  });

  roads.push({
    x: -120,
    z: 70,
    w: 350,
    h: 18
  });

  roads.push({
    x: 120,
    z: -100,
    w: 18,
    h: 330
  });

  roads.push({
    x: -160,
    z: -130,
    w: 18,
    h: 260
  });

  /* CITY BUILDINGS */

  for (let i = 0; i < 45; i++) {

    const side = i % 2 === 0;

    let x;
    let z;

    if (side) {
      x = random(-220, 220);
      z = random(-220, 220);
    } else {
      x = random(-220, 220);
      z = random(-220, 220);
    }

    if (
      Math.abs(x) < 35 ||
      Math.abs(z) < 35
    ) {
      continue;
    }

    if (
      Math.abs(x) < 30 &&
      Math.abs(z) < 230
    ) {
      continue;
    }

    if (
      Math.abs(z) < 30 &&
      Math.abs(x) < 230
    ) {
      continue;
    }

    buildings.push({
      x,
      z,
      w: random(16, 35),
      d: random(16, 35),
      h: random(15, 50),
      type: Math.floor(random(0, 4)),
      color: [
        "#3b4546",
        "#475052",
        "#51595a",
        "#303b3c",
        "#59605e"
      ][Math.floor(random(0, 5))]
    });
  }

  /* SPECIAL BUILDINGS */

  buildings.push({
    x: -125,
    z: -120,
    w: 70,
    d: 45,
    h: 18,
    type: 3,
    color: "#252d2f"
  });

  buildings.push({
    x: 130,
    z: 120,
    w: 55,
    d: 60,
    h: 25,
    type: 2,
    color: "#394144"
  });

  buildings.push({
    x: -160,
    z: 150,
    w: 50,
    d: 45,
    h: 30,
    type: 1,
    color: "#4b5354"
  });

  /* TREES */

  for (let i = 0; i < 180; i++) {

    const x = random(-245, 245);
    const z = random(-245, 245);

    if (
      Math.abs(x) < 200 &&
      Math.abs(z) < 190
    ) {
      if (Math.random() < 0.7) {
        continue;
      }
    }

    trees.push({
      x,
      z,
      s: random(.65, 1.25)
    });
  }

  /* LOOT */

  for (let i = 0; i < 24; i++) {

    loot.push({
      x: random(-220, 220),
      z: random(-220, 220),
      type: Math.random() > .5
        ? "armor"
        : "medkit",
      alive: true,
      phase: random(0, Math.PI * 2)
    });
  }
}

/* =====================================================
   ENEMIES
===================================================== */

function spawnEnemies() {

  enemies = [];

  const spots = [
    [-205, -190],
    [205, -180],
    [-205, 190],
    [205, 185],
    [-150, -220],
    [150, -220],
    [-225, 50],
    [225, -40],
    [-90, 225],
    [90, 220],
    [0, -225]
  ];

  spots.forEach((p, i) => {

    enemies.push({
      x: p[0],
      z: p[1],

      vx: 0,
      vz: 0,

      angle: random(0, Math.PI * 2),

      health: 100,
      alive: true,

      speed: random(1.4, 2.2),

      attack: random(1, 4),

      wander: random(0, Math.PI * 2),

      color: i % 2
        ? "#a9363d"
        : "#4c6970"
    });
  });

  alive = enemies.length + 1;
}

/* =====================================================
   PARTICLES
===================================================== */

function particle(x, z, color) {

  for (let i = 0; i < 8; i++) {

    particles.push({
      x,
      z,

      vx: random(-2, 2),
      vz: random(-2, 2),

      life: .5,

      color
    });
  }
}

/* =====================================================
   START
===================================================== */

function startGame() {

  const name =
    document.getElementById("name").value.trim();

  if (!name) {
    document.getElementById("name").focus();
    return;
  }

  document.getElementById("start").style.display =
    "none";

  document.getElementById("hud").style.display =
    "block";

  player.x = 0;
  player.z = 0;

  player.health = 100;
  player.armor = 100;

  player.jump = 0;
  player.grounded = true;

  kills = 0;
  medkits = 2;

  zoneRadius = 180;

  currentWeapon = 0;

  weapons[0].ammo = 30;
  weapons[0].reserve = 150;

  weapons[1].ammo = 40;
  weapons[1].reserve = 200;

  weapons[2].ammo = 6;
  weapons[2].reserve = 48;

  buildMap();
  spawnEnemies();

  bullets = [];
  particles = [];

  gameOver = false;
  running = true;

  camera.x = player.x;
  camera.z = player.z;
  camera.angle = 0;

  updateHUD();

  requestAnimationFrame(loop);
}

/* =====================================================
   INPUT
===================================================== */

window.addEventListener("keydown", e => {

  keys[e.code] = true;

  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]
      .includes(e.code)
  ) {
    e.preventDefault();
  }

  if (e.code === "Digit1")
    switchWeapon(0);

  if (e.code === "Digit2")
    switchWeapon(1);

  if (e.code === "Digit3")
    switchWeapon(2);

  if (e.code === "KeyR")
    reload();

  if (e.code === "KeyG")
    useMedkit();

});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});

/* MOUSE */

canvas.addEventListener("mousemove", e => {

  mouse.x = e.clientX;
  mouse.y = e.clientY;

  if (mouse.locked) {
    player.angle += e.movementX * .004;
  }

});

canvas.addEventListener("mousedown", e => {

  if (e.button === 0) {

    mouse.down = true;

    if (
      document.pointerLockElement !== canvas &&
      !isMobile()
    ) {
      canvas.requestPointerLock?.();
    }
  }

});

window.addEventListener("mouseup", e => {

  if (e.button === 0)
    mouse.down = false;

});

document.addEventListener("pointerlockchange", () => {

  mouse.locked =
    document.pointerLockElement === canvas;

});

/* =====================================================
   MOVEMENT
===================================================== */

function updatePlayer(dt) {

  let forward = 0;
  let side = 0;

  if (
    keys["KeyW"] ||
    keys["ArrowUp"]
  ) forward += 1;

  if (
    keys["KeyS"] ||
    keys["ArrowDown"]
  ) forward -= 1;

  if (
    keys["KeyA"] ||
    keys["ArrowLeft"]
  ) side -= 1;

  if (
    keys["KeyD"] ||
    keys["ArrowRight"]
  ) side += 1;

  /* MOBILE */

  forward += mobileMove.y;
  side += mobileMove.x;

  const len = Math.hypot(
    forward,
    side
  );

  if (len > 1) {
    forward /= len;
    side /= len;
  }

  const sprint =
    keys["ShiftLeft"] ||
    keys["ShiftRight"] ||
    mobileSprint;

  const crouch =
    keys["KeyC"] ||
    keys["ControlLeft"];

  player.crouch = crouch;

  let speed =
    sprint ? 9 : 5.5;

  if (crouch)
    speed = 3.2;

  if (len > 0) {

    const sin = Math.sin(player.angle);
    const cos = Math.cos(player.angle);

    player.x +=
      (
        sin * forward +
        cos * side
      ) *
      speed *
      dt;

    player.z +=
      (
        -cos * forward +
        sin * side
      ) *
      speed *
      dt;
  }

  /* JUMP */

  if (
    (keys["Space"] || mobileJump) &&
    player.grounded
  ) {

    player.jump = 1;
    player.grounded = false;
    mobileJump = false;
  }

  if (!player.grounded) {

    player.jump -= dt * 2.8;

    if (player.jump <= 0) {
      player.jump = 0;
      player.grounded = true;
    }
  }

  /* MAP BOUNDARY */

  player.x =
    Math.max(
      -245,
      Math.min(245, player.x)
    );

  player.z =
    Math.max(
      -245,
      Math.min(245, player.z)
    );

  /* AIM WITH MOUSE */

  if (
    !isMobile() &&
    mouse.x &&
    mouse.y
  ) {

    const dx =
      mouse.x - W / 2;

    const dy =
      mouse.y - H / 2;

    if (
      Math.abs(dx) > 25 ||
      Math.abs(dy) > 25
    ) {

      player.angle += dx * .00003;
    }
  }
}

/* =====================================================
   ENEMY AI
===================================================== */

function updateEnemies(dt) {

  enemies.forEach(enemy => {

    if (!enemy.alive)
      return;

    const dx =
      player.x - enemy.x;

    const dz =
      player.z - enemy.z;

    const d =
      Math.hypot(dx, dz);

    /* IMPORTANT:
       enemies don't spawn near player.
    */

    if (d < 22) {

      const push =
        (22 - d) * .04;

      enemy.x -=
        dx / Math.max(d, 1) *
        push;

      enemy.z -=
        dz / Math.max(d, 1) *
        push;
    }

    if (d < 120) {

      enemy.angle =
        Math.atan2(
          dx,
          -dz
        );

      if (d > 35) {

        enemy.x +=
          dx / d *
          enemy.speed *
          dt;

        enemy.z +=
          dz / d *
          enemy.speed *
          dt;
      }

      enemy.attack -= dt;

      if (
        d < 75 &&
        enemy.attack <= 0
      ) {

        enemy.attack =
          random(1.4, 2.5);

        enemyShoot(enemy);
      }

    } else {

      enemy.wander +=
        random(-.04, .04);

      enemy.x +=
        Math.sin(enemy.wander) *
        dt *
        .6;

      enemy.z +=
        -Math.cos(enemy.wander) *
        dt *
        .6;
    }

    enemy.x =
      Math.max(-240,
        Math.min(240, enemy.x));

    enemy.z =
      Math.max(-240,
        Math.min(240, enemy.z));

  });
}

/* =====================================================
   ENEMY SHOOT
===================================================== */

function enemyShoot(enemy) {

  const accuracy =
    Math.random();

  if (accuracy > .35)
    return;

  const d =
    Math.hypot(
      player.x - enemy.x,
      player.z - enemy.z
    );

  let damage =
    random(6, 12);

  if (d < 30)
    damage *= 1.3;

  damagePlayer(damage);

  particle(
    player.x,
    player.z,
    "#ff5b5b"
  );
}

/* =====================================================
   PLAYER DAMAGE
===================================================== */

function damagePlayer(damage) {

  if (!running)
    return;

  const armorHit =
    Math.min(
      player.armor,
      damage * .65
    );

  player.armor -= armorHit;

  player.health -=
    damage - armorHit;

  player.health =
    Math.max(
      0,
      player.health
    );

  updateHUD();

  if (
    player.health <= 0
  ) {

    finish(false);
  }
}

/* =====================================================
   SHOOTING
===================================================== */

function shoot() {

  if (!running)
    return;

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

  if (reloadTimer > 0)
    return;

  if (weapon.ammo <= 0) {
    reload();
    return;
  }

  lastShot = now;

  weapon.ammo--;

  const pellets =
    weapon.pellets || 1;

  for (let i = 0; i < pellets; i++) {

    let angle =
      player.angle;

    angle +=
      random(
        -weapon.spread,
        weapon.spread
      );

    bullets.push({
      x: player.x,
      z: player.z,

      angle,

      life: 1.2,

      speed: 70,

      damage: weapon.damage
    });
  }

  particle(
    player.x +
      Math.sin(player.angle) * 3,
    player.z -
      Math.cos(player.angle) * 3,
    "#ffd66b"
  );

  updateHUD();
}

/* =====================================================
   BULLETS
===================================================== */

function updateBullets(dt) {

  bullets.forEach(b => {

    b.x +=
      Math.sin(b.angle) *
      b.speed *
      dt;

    b.z +=
      -Math.cos(b.angle) *
      b.speed *
      dt;

    b.life -= dt;

    enemies.forEach(enemy => {

      if (!enemy.alive)
        return;

      const d =
        Math.hypot(
          b.x - enemy.x,
          b.z - enemy.z
        );

      if (d < 3.2) {

        enemy.health -=
          b.damage;

        b.life = 0;

        particle(
          enemy.x,
          enemy.z,
          "#ff6c6c"
        );

        if (
          enemy.health <= 0
        ) {

          enemy.alive = false;

          kills++;
          alive--;

          updateHUD();

          if (alive <= 1) {
            finish(true);
          }
        }

      }

    });

  });

  bullets =
    bullets.filter(
      b =>
        b.life > 0 &&
        Math.abs(b.x) < 280 &&
        Math.abs(b.z) < 280
    );
}

/* =====================================================
   ZONE
===================================================== */

function updateZone(dt) {

  zoneRadius -=
    dt * .65;

  zoneRadius =
    Math.max(
      45,
      zoneRadius
    );

  const d =
    Math.hypot(
      player.x,
      player.z
    );

  if (
    d > zoneRadius
  ) {

    zoneDamageTimer -= dt;

    if (
      zoneDamageTimer <= 0
    ) {

      zoneDamageTimer = .35;

      damagePlayer(2);
    }
  }
}

/* =====================================================
   LOOT
===================================================== */

function updateLoot() {

  loot.forEach(item => {

    if (!item.alive)
      return;

    const d =
      Math.hypot(
        item.x - player.x,
        item.z - player.z
      );

    if (d < 5) {

      if (
        item.type === "armor"
      ) {

        player.armor =
          Math.min(
            100,
            player.armor + 35
          );

      } else {

        medkits++;
      }

      item.alive = false;

      updateHUD();
    }
  });
}

/* =====================================================
   MEDKIT
===================================================== */

function useMedkit() {

  if (
    medkits <= 0 ||
    player.health >= 100
  ) {
    return;
  }

  medkits--;

  player.health =
    Math.min(
      100,
      player.health + 45
    );

  updateHUD();
}

/* =====================================================
   RELOAD
===================================================== */

function reload() {

  if (reloadTimer > 0)
    return;

  const weapon =
    weapons[currentWeapon];

  if (
    weapon.ammo >= weapon.mag ||
    weapon.reserve <= 0
  ) {
    return;
  }

  reloadTimer = 1.2;
}

/* =====================================================
   UPDATE RELOAD
===================================================== */

function updateReload(dt) {

  if (reloadTimer <= 0)
    return;

  reloadTimer -= dt;

  if (reloadTimer <= 0) {

    const weapon =
      weapons[currentWeapon];

    const needed =
      weapon.mag -
      weapon.ammo;

    const take =
      Math.min(
        needed,
        weapon.reserve
      );

    weapon.ammo += take;

    weapon.reserve -= take;

    updateHUD();
  }
}

/* =====================================================
   WEAPON
===================================================== */

function switchWeapon(index) {

  if (
    index < 0 ||
    index >= weapons.length
  ) {
    return;
  }

  currentWeapon = index;

  reloadTimer = 0;

  updateHUD();
}

/* =====================================================
   UPDATE HUD
===================================================== */

function updateHUD() {

  document.getElementById("health")
    .textContent =
    Math.ceil(player.health);

  document.getElementById("armor")
    .textContent =
    Math.ceil(player.armor);

  document.getElementById("ammo")
    .textContent =
    weapons[currentWeapon].ammo +
    " / " +
    weapons[currentWeapon].reserve;

  document.getElementById("weapon")
    .textContent =
    weapons[currentWeapon].name;

  document.getElementById("kills")
    .textContent =
    kills;

  document.getElementById("alive")
    .textContent =
    alive;

  document.getElementById("medkits")
    .textContent =
    medkits;

  document.getElementById("zone")
    .textContent =
    Math.round(zoneRadius) + "m";
}

/* =====================================================
   CAMERA
===================================================== */

function updateCamera(dt) {

  camera.x +=
    (player.x - camera.x) *
    Math.min(1, dt * 6);

  camera.z +=
    (player.z - camera.z) *
    Math.min(1, dt * 6);

  camera.angle =
    player.angle;
}

/* =====================================================
   WORLD TO SCREEN
===================================================== */

function worldToScreen(x, z) {

  const dx =
    x - camera.x;

  const dz =
    z - camera.z;

  const sin =
    Math.sin(camera.angle);

  const cos =
    Math.cos(camera.angle);

  const forward =
    -dx * sin -
    dz * cos;

  const side =
    dx * cos -
    dz * sin;

  const horizon =
    H * .42;

  const scale =
    500 /
    Math.max(
      80,
      forward + 150
    );

  return {
    x:
      W / 2 +
      side * scale,

    y:
      horizon -
      scale * 130,

    depth:
      forward
  };
}

/* =====================================================
   DRAW GROUND
===================================================== */

function drawGround() {

  ctx.fillStyle =
    "#18211f";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  const horizon =
    H * .42;

  ctx.fillStyle =
    "#23312d";

  ctx.fillRect(
    0,
    horizon,
    W,
    H - horizon
  );

  /* distant skyline */

  ctx.fillStyle =
    "#0c1414";

  for (
    let x = 0;
    x < W;
    x += 70
  ) {

    const h =
      30 +
      Math.sin(x * .07) * 20;

    ctx.fillRect(
      x,
      horizon - h,
      48,
      h
    );
  }

  /* road grid */

  roads.forEach(r => {

    const p =
      worldToScreen(
        r.x,
        r.z
      );

    if (
      p.depth < -20 ||
      p.depth > 600
    )
      return;

    const scale =
      500 /
      Math.max(
        80,
        p.depth + 150
      );

    const w =
      r.w * scale;

    const h =
      r.h * scale;

    ctx.save();

    ctx.translate(
      p.x,
      p.y
    );

    ctx.fillStyle =
      "#222b2a";

    ctx.fillRect(
      -w / 2,
      -h / 2,
      w,
      h
    );

    ctx.restore();
  });

}

/* =====================================================
   DRAW BUILDING
===================================================== */

function drawBuilding(b) {

  const p =
    worldToScreen(
      b.x,
      b.z
    );

  if (
    p.depth < -20 ||
    p.depth > 500
  )
    return;

  const scale =
    500 /
    Math.max(
      80,
      p.depth + 150
    );

  const w =
    b.w * scale;

  const h =
    b.h * scale;

  const d =
    b.d * scale;

  const top =
    p.y - h;

  /* shadow */

  ctx.fillStyle =
    "rgba(0,0,0,.3)";

  ctx.fillRect(
    p.x - w / 2 + 8,
    p.y - 4,
    w,
    7
  );

  /* building */

  ctx.fillStyle =
    b.color;

  ctx.fillRect(
    p.x - w / 2,
    top,
    w,
    h
  );

  /* side */

  ctx.fillStyle =
    "rgba(0,0,0,.2)";

  ctx.beginPath();

  ctx.moveTo(
    p.x + w / 2,
    top
  );

  ctx.lineTo(
    p.x + w / 2 + d * .2,
    top + d * .1
  );

  ctx.lineTo(
    p.x + w / 2 + d * .2,
    p.y
  );

  ctx.lineTo(
    p.x + w / 2,
    p.y
  );

  ctx.closePath();

  ctx.fill();

  /* windows */

  const rows =
    Math.min(
      7,
      Math.max(
        2,
        Math.floor(
          b.h / 7
        )
      )
    );

  const cols =
    Math.min(
      5,
      Math.max(
        2,
        Math.floor(
          b.w / 7
        )
      )
    );

  ctx.fillStyle =
    "#8ac7bc";

  for (
    let r = 0;
    r < rows;
    r++
  ) {

    for (
      let c = 0;
      c < cols;
      c++
    ) {

      const wx =
        p.x -
        w / 2 +
        w * .16 +
        c *
        (w * .68 /
          Math.max(1, cols - 1));

      const wy =
        top +
        h * .15 +
        r *
        (h * .68 /
          Math.max(1, rows - 1));

      ctx.fillRect(
        wx,
        wy,
        Math.max(2, w * .07),
        Math.max(3, h * .035)
      );
    }
  }
}

/* =====================================================
   DRAW TREE
===================================================== */

function drawTree(t) {

  const p =
    worldToScreen(
      t.x,
      t.z
    );

  if (
    p.depth < -20 ||
    p.depth > 420
  )
    return;

  const scale =
    500 /
    Math.max(
      80,
      p.depth + 150
    );

  const s =
    25 *
    t.s *
    scale;

  ctx.fillStyle =
    "#533e2b";

  ctx.fillRect(
    p.x - s * .08,
    p.y - s * .35,
    s * .16,
    s * .55
  );

  ctx.fillStyle =
    "#1f5738";

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y - s * .55,
    s * .48,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    "#2d7044";

  ctx.beginPath();

  ctx.arc(
    p.x - s * .25,
    p.y - s * .68,
    s * .35,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

/* =====================================================
   DRAW LOOT
===================================================== */

function drawLoot(item) {

  if (!item.alive)
    return;

  const p =
    worldToScreen(
      item.x,
      item.z
    );

  if (
    p.depth < -10 ||
    p.depth > 350
  )
    return;

  const scale =
    500 /
    Math.max(
      80,
      p.depth + 150
    );

  const size =
    10 * scale;

  ctx.fillStyle =
    item.type === "armor"
      ? "#37aaff"
      : "#5aff9c";

  ctx.shadowBlur = 15;

  ctx.shadowColor =
    ctx.fillStyle;

  ctx.fillRect(
    p.x - size / 2,
    p.y - size,
    size,
    size
  );

  ctx.shadowBlur = 0;
}

/* =====================================================
   DRAW ENEMY
===================================================== */

function drawEnemy(enemy) {

  if (!enemy.alive)
    return;

  const p =
    worldToScreen(
      enemy.x,
      enemy.z
    );

  if (
    p.depth < -30 ||
    p.depth > 350
  )
    return;

  const scale =
    500 /
    Math.max(
      80,
      p.depth + 150
    );

  const s =
    32 * scale;

  /* shadow */

  ctx.fillStyle =
    "rgba(0,0,0,.35)";

  ctx.beginPath();

  ctx.ellipse(
    p.x,
    p.y,
    s * .35,
    s * .12,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* body */

  ctx.fillStyle =
    enemy.color;

  ctx.fillRect(
    p.x - s * .25,
    p.y - s * .7,
    s * .5,
    s * .55
  );

  /* head */

  ctx.fillStyle =
    "#c78e6d";

  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y - s * .85,
    s * .18,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* weapon */

  ctx.strokeStyle =
    "#14191a";

  ctx.lineWidth =
    Math.max(2, s * .07);

  ctx.beginPath();

  ctx.moveTo(
    p.x + s * .12,
    p.y - s * .48
  );

  ctx.lineTo(
    p.x + s * .65,
    p.y - s * .42
  );

  ctx.stroke();

  /* health */

  ctx.fillStyle =
    "#111";

  ctx.fillRect(
    p.x - s * .35,
    p.y - s * 1.18,
    s * .7,
    4
  );

  ctx.fillStyle =
    "#5aff8c";

  ctx.fillRect(
    p.x - s * .35,
    p.y - s * 1.18,
    s * .7 *
    Math.max(
      0,
      enemy.health / 100
    ),
    4
  );
}

/* =====================================================
   DRAW PLAYER
===================================================== */

function drawPlayer() {

  const x = W / 2;
  const y = H * .70;

  const s =
    Math.min(W, H) * .075;

  const jumpOffset =
    player.jump * -s * .5;

  /* shadow */

  ctx.fillStyle =
    "rgba(0,0,0,.4)";

  ctx.beginPath();

  ctx.ellipse(
    x,
    y + 5,
    s * .45,
    s * .14,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* legs */

  ctx.fillStyle =
    "#172023";

  ctx.fillRect(
    x - s * .25,
    y - s * .25 + jumpOffset,
    s * .17,
    s * .5
  );

  ctx.fillRect(
    x + s * .08,
    y - s * .25 + jumpOffset,
    s * .17,
    s * .5
  );

  /* body */

  ctx.fillStyle =
    "#273b3c";

  ctx.fillRect(
    x - s * .38,
    y - s * .78 + jumpOffset,
    s * .76,
    s * .58
  );

  /* vest */

  ctx.strokeStyle =
    "#5de0bd";

  ctx.lineWidth =
    2;

  ctx.strokeRect(
    x - s * .38,
    y - s * .78 + jumpOffset,
    s * .76,
    s * .58
  );

  /* head */

  ctx.fillStyle =
    "#c98e6c";

  ctx.beginPath();

  ctx.arc(
    x,
    y - s * 1.0 + jumpOffset,
    s * .22,
    0,
    Math.PI * 2
  );

  ctx.fill();

  /* hair */

  ctx.fillStyle =
    "#1a2022";

  ctx.beginPath();

  ctx.arc(
    x,
    y - s * 1.08 + jumpOffset,
    s * .23,
    Math.PI,
    Math.PI * 2
  );

  ctx.fill();

  /* gun */

  ctx.strokeStyle =
    "#111718";

  ctx.lineWidth =
    Math.max(
      3,
      s * .09
    );

  ctx.beginPath();

  ctx.moveTo(
    x + s * .2,
    y - s * .62 + jumpOffset
  );

  ctx.lineTo(
    x + s * .78,
    y - s * .75 + jumpOffset
  );

  ctx.stroke();
}

/* =====================================================
   DRAW ZONE
===================================================== */

function drawZone() {

  const center =
    worldToScreen(
      0,
      0
    );

  const edge =
    worldToScreen(
      zoneRadius,
      0
    );

  const radius =
    Math.abs(
      edge.x -
      center.x
    );

  ctx.save();

  ctx.strokeStyle =
    "rgba(74,255,164,.75)";

  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.arc(
    center.x,
    center.y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.fillStyle =
    "rgba(40,255,150,.025)";

  ctx.beginPath();

  ctx.arc(
    center.x,
    center.y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}

/* =====================================================
   DRAW BULLETS
===================================================== */

function drawBullets() {

  bullets.forEach(b => {

    const p =
      worldToScreen(
        b.x,
        b.z
      );

    if (
      p.depth < -10 ||
      p.depth > 400
    )
      return;

    ctx.fillStyle =
      "#ffd76b";

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();
  });
}

/* =====================================================
   PARTICLES
===================================================== */

function updateParticles(dt) {

  particles.forEach(p => {

    p.x += p.vx * dt;
    p.z += p.vz * dt;

    p.life -= dt;
  });

  particles =
    particles.filter(
      p => p.life > 0
    );
}

function drawParticles() {

  particles.forEach(p => {

    const s =
      worldToScreen(
        p.x,
        p.z
      );

    if (
      s.depth < -10 ||
      s.depth > 400
    )
      return;

    ctx.globalAlpha =
      Math.max(
        0,
        p.life * 2
      );

    ctx.fillStyle =
      p.color;

    ctx.fillRect(
      s.x,
      s.y,
      4,
      4
    );

    ctx.globalAlpha = 1;
  });
}

/* =====================================================
   SORT WORLD
===================================================== */

function drawWorld() {

  drawGround();

  const objects = [];

  buildings.forEach(b => {
    objects.push({
      depth:
        Math.hypot(
          b.x - camera.x,
          b.z - camera.z
        ),
      fn: () => drawBuilding(b)
    });
  });

  trees.forEach(t => {
    objects.push({
      depth:
        Math.hypot(
          t.x - camera.x,
          t.z - camera.z
        ),
      fn: () => drawTree(t)
    });
  });

  loot.forEach(l => {
    if (l.alive) {
      objects.push({
        depth:
          Math.hypot(
            l.x - camera.x,
            l.z - camera.z
          ),
        fn: () => drawLoot(l)
      });
    }
  });

  enemies.forEach(e => {
    if (e.alive) {
      objects.push({
        depth:
          Math.hypot(
            e.x - camera.x,
            e.z - camera.z
          ),
        fn: () => drawEnemy(e)
      });
    }
  });

  objects.sort(
    (a, b) =>
      b.depth - a.depth
  );

  objects.forEach(
    o => o.fn()
  );

  drawZone();
  drawBullets();
  drawParticles();
  drawPlayer();
}

/* =====================================================
   GAME LOOP
===================================================== */

let lastTime = performance.now();

function loop(now) {

  if (!running)
    return;

  const dt =
    Math.min(
      .033,
      (now - lastTime) / 1000
    );

  lastTime = now;

  time += dt;

  updatePlayer(dt);

  updateEnemies(dt);

  updateBullets(dt);

  updateLoot();

  updateZone(dt);

  updateReload(dt);

  updateParticles(dt);

  updateCamera(dt);

  if (
    mouse.down ||
    mobileFire
  ) {
    shoot();
  }

  drawWorld();

  requestAnimationFrame(loop);
}

/* =====================================================
   GAME OVER
===================================================== */

function finish(won) {

  if (!running)
    return;

  running = false;
  gameOver = true;

  document.exitPointerLock?.();

  document.getElementById(
    "result"
  ).style.display = "flex";

  document.getElementById(
    "resultTitle"
  ).textContent =
    won
      ? "BOOYAH!"
      : "ELIMINATED";

  document.getElementById(
    "resultText"
  ).textContent =
    won
      ? `WINNER • ${kills} ELIMINATIONS`
      : `ELIMINATED • ${kills} ELIMINATIONS`;
}

/* =====================================================
   MOBILE
===================================================== */

let mobileMove = {
  x: 0,
  y: 0
};

let mobileFire = false;
let mobileJump = false;
let mobileSprint = false;

function isMobile() {

  return (
    window.matchMedia(
      "(pointer:coarse)"
    ).matches ||
    W < 800
  );
}

/* JOYSTICK */

const stick =
  document.getElementById("stick");

const knob =
  document.getElementById("stickKnob");

let stickActive = false;

function joystick(e) {

  const rect =
    stick.getBoundingClientRect();

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
    rect.width / 2 - 28;

  const len =
    Math.hypot(dx, dy);

  if (len > max) {

    dx =
      dx / len *
      max;

    dy =
      dy / len *
      max;
  }

  knob.style.transform =
    `translate(${dx}px,${dy}px)`;

  mobileMove.x =
    dx / max;

  mobileMove.y =
    -dy / max;
}

stick.addEventListener(
  "pointerdown",
  e => {

    stickActive = true;

    stick.setPointerCapture(
      e.pointerId
    );

    joystick(e);
  }
);

stick.addEventListener(
  "pointermove",
  e => {

    if (stickActive)
      joystick(e);

  }
);

stick.addEventListener(
  "pointerup",
  resetStick
);

stick.addEventListener(
  "pointercancel",
  resetStick
);

function resetStick() {

  stickActive = false;

  mobileMove.x = 0;
  mobileMove.y = 0;

  knob.style.transform =
    "translate(0,0)";
}

/* BUTTONS */

function holdButton(
  id,
  down,
  up
) {

  const el =
    document.getElementById(id);

  el.addEventListener(
    "pointerdown",
    e => {

      e.preventDefault();

      down();
    }
  );

  el.addEventListener(
    "pointerup",
    e => {

      e.preventDefault();

      up();
    }
  );

  el.addEventListener(
    "pointercancel",
    up
  );

  el.addEventListener(
    "pointerleave",
    up
  );
}

holdButton(
  "fire",
  () => mobileFire = true,
  () => mobileFire = false
);

holdButton(
  "sprint",
  () => mobileSprint = true,
  () => mobileSprint = false
);

holdButton(
  "jump",
  () => mobileJump = true,
  () => {}
);

holdButton(
  "aim",
  () => {
    player.angle += .8;
  },
  () => {}
);

/* =====================================================
   START BUTTON
===================================================== */

document
  .getElementById("enter")
  .addEventListener(
    "click",
    startGame
  );

document
  .getElementById("name")
  .addEventListener(
    "keydown",
    e => {

      if (
        e.key === "Enter"
      ) {
        startGame();
      }

    }
  );

/* =====================================================
   PLAY AGAIN
===================================================== */

document
  .getElementById("again")
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "result"
      ).style.display = "none";

      startGame();
    }
  );

/* =====================================================
   INITIAL DRAW
===================================================== */

buildMap();

drawGround();
