const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");

let W = 0;
let H = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

const WORLD_W = 5000;
const WORLD_H = 5000;

const keys = {};

let mouse = {
  x: W / 2,
  y: H / 2,
  down: false
};

let camera = {
  x: 0,
  y: 0
};

let running = false;
let lastTime = 0;

let player;
let bullets = [];
let enemies = [];
let buildings = [];
let trees = [];
let pickups = [];
let particles = [];

let weapon = "pistol";

const weapons = {
  pistol: {
    name: "PISTOL",
    damage: 34,
    fireRate: 260,
    magazine: 12,
    ammo: 12,
    reserve: 48,
    speed: 18,
    spread: 0.035
  },

  rifle: {
    name: "ASSAULT RIFLE",
    damage: 20,
    fireRate: 95,
    magazine: 30,
    ammo: 30,
    reserve: 120,
    speed: 22,
    spread: 0.07
  }
};

let currentWeapon = weapons.pistol;

function resetWeapon() {
  currentWeapon = {
    ...weapons[weapon]
  };

  updateWeaponHUD();
}

function updateWeaponHUD() {
  document.getElementById("weaponName").textContent =
    currentWeapon.name;

  document.getElementById("ammo").textContent =
    currentWeapon.ammo;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


/* WORLD */

function createWorld() {

  buildings = [];
  trees = [];
  pickups = [];
  enemies = [];

  /*
    CITY BUILDINGS
  */

  for (let i = 0; i < 90; i++) {

    const w = random(110, 280);
    const h = random(100, 260);

    buildings.push({
      x: random(150, WORLD_W - w - 150),
      y: random(150, WORLD_H - h - 150),
      w,
      h,
      color: Math.random() > .5
        ? "#202722"
        : "#252d27"
    });
  }

  /*
    TREES
  */

  for (let i = 0; i < 240; i++) {

    trees.push({
      x: random(50, WORLD_W - 50),
      y: random(50, WORLD_H - 50),
      r: random(12, 24)
    });
  }

  /*
    AMMO / HEALTH PICKUPS
  */

  for (let i = 0; i < 30; i++) {

    pickups.push({
      x: random(150, WORLD_W - 150),
      y: random(150, WORLD_H - 150),
      type: Math.random() > .45
        ? "ammo"
        : "health",
      active: true
    });
  }

  /*
    ENEMIES
  */

  for (let i = 0; i < 24; i++) {

    let x;
    let y;

    do {
      x = random(250, WORLD_W - 250);
      y = random(250, WORLD_H - 250);
    } while (
      Math.hypot(
        x - WORLD_W / 2,
        y - WORLD_H / 2
      ) < 600
    );

    enemies.push({
      id: i,
      x,
      y,
      radius: 17,
      health: 100,
      maxHealth: 100,
      speed: random(0.55, 1.05),
      angle: random(0, Math.PI * 2),
      shootTimer: random(500, 2000),
      alive: true,
      wanderTimer: 0
    });
  }
}


/* PLAYER */

function createPlayer() {

  player = {
    x: WORLD_W / 2,
    y: WORLD_H / 2,
    radius: 18,

    health: 100,
    maxHealth: 100,

    speed: 3.4,

    angle: 0,

    lastShot: 0,

    sprint: false
  };

  resetWeapon();
}


/* INPUT */

window.addEventListener("keydown", e => {

  keys[e.key.toLowerCase()] = true;

  if (e.key === "Shift") {
    player && (player.sprint = true);
  }

  if (e.key.toLowerCase() === "r") {
    reload();
  }

  if (e.key === "1") {
    weapon = "pistol";
    resetWeapon();
  }

  if (e.key === "2") {
    weapon = "rifle";
    resetWeapon();
  }
});

window.addEventListener("keyup", e => {

  keys[e.key.toLowerCase()] = false;

  if (e.key === "Shift") {
    player && (player.sprint = false);
  }
});

window.addEventListener("mousemove", e => {

  mouse.x = e.clientX;
  mouse.y = e.clientY;

  if (player) {

    const worldMouseX =
      camera.x + mouse.x;

    const worldMouseY =
      camera.y + mouse.y;

    player.angle =
      Math.atan2(
        worldMouseY - player.y,
        worldMouseX - player.x
      );
  }
});

window.addEventListener("mousedown", e => {

  if (e.button === 0) {
    mouse.down = true;
  }
});

window.addEventListener("mouseup", e => {

  if (e.button === 0) {
    mouse.down = false;
  }
});


/* COLLISION */

function circleRectCollision(
  circle,
  rect
) {

  const closestX =
    clamp(
      circle.x,
      rect.x,
      rect.x + rect.w
    );

  const closestY =
    clamp(
      circle.y,
      rect.y,
      rect.y + rect.h
    );

  const dx =
    circle.x - closestX;

  const dy =
    circle.y - closestY;

  return (
    dx * dx +
    dy * dy <
    circle.radius *
    circle.radius
  );
}

function blocked(x, y, radius) {

  const test = {
    x,
    y,
    radius
  };

  return buildings.some(
    building =>
      circleRectCollision(
        test,
        building
      )
  );
}


/* MOVEMENT */

function updatePlayer(dt) {

  let dx = 0;
  let dy = 0;

  if (
    keys["w"] ||
    keys["arrowup"]
  ) dy--;

  if (
    keys["s"] ||
    keys["arrowdown"]
  ) dy++;

  if (
    keys["a"] ||
    keys["arrowleft"]
  ) dx--;

  if (
    keys["d"] ||
    keys["arrowright"]
  ) dx++;

  if (!dx && !dy) return;

  const len =
    Math.hypot(dx, dy);

  dx /= len;
  dy /= len;

  const speed =
    player.sprint
      ? player.speed * 1.65
      : player.speed;

  const nx =
    player.x +
    dx * speed * dt;

  const ny =
    player.y +
    dy * speed * dt;

  if (
    !blocked(
      nx,
      player.y,
      player.radius
    )
  ) {
    player.x = nx;
  }

  if (
    !blocked(
      player.x,
      ny,
      player.radius
    )
  ) {
    player.y = ny;
  }

  player.x =
    clamp(
      player.x,
      30,
      WORLD_W - 30
    );

  player.y =
    clamp(
      player.y,
      30,
      WORLD_H - 30
    );
}


/* CAMERA */

function updateCamera() {

  camera.x =
    player.x -
    W / 2;

  camera.y =
    player.y -
    H / 2;

  camera.x =
    clamp(
      camera.x,
      0,
      WORLD_W - W
    );

  camera.y =
    clamp(
      camera.y,
      0,
      WORLD_H - H
    );
}


/* SHOOTING */

function shoot() {

  const now =
    performance.now();

  if (
    now -
    player.lastShot <
    currentWeapon.fireRate
  ) return;

  if (
    currentWeapon.ammo <= 0
  ) {

    reload();

    return;
  }

  player.lastShot = now;

  currentWeapon.ammo--;

  updateWeaponHUD();

  const spread =
    (
      Math.random() -
      0.5
    ) *
    currentWeapon.spread;

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
      Math.cos(angle) *
      currentWeapon.speed,

    vy:
      Math.sin(angle) *
      currentWeapon.speed,

    damage:
      currentWeapon.damage,

    life: 100
  });

  muzzleFlash();
}

function reload() {

  const needed =
    currentWeapon.magazine -
    currentWeapon.ammo;

  if (
    needed <= 0 ||
    currentWeapon.reserve <= 0
  ) return;

  const amount =
    Math.min(
      needed,
      currentWeapon.reserve
    );

  currentWeapon.ammo += amount;

  currentWeapon.reserve -= amount;

  updateWeaponHUD();
}

function muzzleFlash() {

  for (let i = 0; i < 5; i++) {

    particles.push({
      x:
        player.x +
        Math.cos(player.angle) *
        28,

      y:
        player.y +
        Math.sin(player.angle) *
        28,

      vx:
        Math.cos(player.angle) *
        random(2, 7),

      vy:
        Math.sin(player.angle) *
        random(2, 7),

      life: 12,
      size: random(2, 5),
      color: "#ffe36b"
    });
  }
}


/* BULLETS */

function updateBullets() {

  for (
    let i = bullets.length - 1;
    i >= 0;
    i--
  ) {

    const bullet =
      bullets[i];

    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    bullet.life--;

    if (
      bullet.life <= 0 ||
      bullet.x < 0 ||
      bullet.y < 0 ||
      bullet.x > WORLD_W ||
      bullet.y > WORLD_H
    ) {
      bullets.splice(i, 1);
      continue;
    }

    if (
      blocked(
        bullet.x,
        bullet.y,
        2
      )
    ) {

      createImpact(
        bullet.x,
        bullet.y
      );

      bullets.splice(i, 1);

      continue;
    }

    for (
      const enemy of enemies
    ) {

      if (!enemy.alive)
        continue;

      const d =
        Math.hypot(
          bullet.x - enemy.x,
          bullet.y - enemy.y
        );

      if (
        d <
        enemy.radius + 4
      ) {

        enemy.health -=
          bullet.damage;

        createImpact(
          bullet.x,
          bullet.y
        );

        bullets.splice(i, 1);

        if (
          enemy.health <= 0
        ) {

          killEnemy(enemy);
        }

        break;
      }
    }
  }
}


/* ENEMIES */

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
      Chase player
    */

    if (d < 750) {

      const nx =
        dx / d;

      const ny =
        dy / d;

      enemy.angle =
        Math.atan2(dy, dx);

      if (d > 180) {

        const moveX =
          enemy.x +
          nx *
          enemy.speed *
          dt;

        const moveY =
          enemy.y +
          ny *
          enemy.speed *
          dt;

        if (
          !blocked(
            moveX,
            enemy.y,
            enemy.radius
          )
        ) {
          enemy.x = moveX;
        }

        if (
          !blocked(
            enemy.x,
            moveY,
            enemy.radius
          )
        ) {
          enemy.y = moveY;
        }
      }

      enemy.shootTimer -=
        dt * 16;

      if (
        enemy.shootTimer <= 0 &&
        d < 650
      ) {

        enemy.shootTimer =
          random(900, 1800);

        enemyShoot(enemy);
      }

    } else {

      enemy.wanderTimer -=
        dt;

      if (
        enemy.wanderTimer <= 0
      ) {

        enemy.angle =
          random(
            0,
            Math.PI * 2
          );

        enemy.wanderTimer =
          random(
            30,
            130
          );
      }

      const nx =
        enemy.x +
        Math.cos(enemy.angle) *
        enemy.speed *
        dt;

      const ny =
        enemy.y +
        Math.sin(enemy.angle) *
        enemy.speed *
        dt;

      if (
        !blocked(
          nx,
          enemy.y,
          enemy.radius
        )
      ) {
        enemy.x = nx;
      }

      if (
        !blocked(
          enemy.x,
          ny,
          enemy.radius
        )
      ) {
        enemy.y = ny;
      }
    }


    /*
      Enemy contact damage
    */

    if (d < 35) {

      damagePlayer(
        0.22
      );
    }
  }
}

function enemyShoot(enemy) {

  const angle =
    Math.atan2(
      player.y - enemy.y,
      player.x - enemy.x
    ) +
    random(-0.08, 0.08);

  bullets.push({
    x:
      enemy.x +
      Math.cos(angle) * 20,

    y:
      enemy.y +
      Math.sin(angle) * 20,

    vx:
      Math.cos(angle) * 10,

    vy:
      Math.sin(angle) * 10,

    damage: 8,
    life: 90,
    enemyBullet: true
  });
}


/* DAMAGE */

function damagePlayer(amount) {

  if (!running) return;

  player.health -= amount;

  player.health =
    Math.max(
      0,
      player.health
    );

  updateHealth();

  const flash =
    document.getElementById(
      "damageFlash"
    );

  flash.style.opacity = ".18";

  setTimeout(() => {
    flash.style.opacity = "0";
  }, 70);

  if (
    player.health <= 0
  ) {
    die();
  }
}

function updateHealth() {

  const percent =
    (
      player.health /
      player.maxHealth
    ) * 100;

  document.getElementById(
    "healthBar"
  ).style.width =
    percent + "%";

  document.getElementById(
    "healthText"
  ).textContent =
    Math.ceil(
      player.health
    );
}


/* PICKUPS */

function updatePickups() {

  for (const pickup of pickups) {

    if (!pickup.active)
      continue;

    const d =
      distance(
        player,
        pickup
      );

    if (d < 35) {

      pickup.active = false;

      if (
        pickup.type ===
        "health"
      ) {

        player.health =
          Math.min(
            player.maxHealth,
            player.health + 35
          );

        addFeed(
          "HEALTH +35"
        );

      } else {

        currentWeapon.reserve +=
          currentWeapon ===
          weapons.rifle
            ? 60
            : 24;

        addFeed(
          "AMMO COLLECTED"
        );
      }

      updateHealth();
      updateWeaponHUD();
    }
  }
}


/* KILLS */

function killEnemy(enemy) {

  enemy.alive = false;

  for (let i = 0; i < 20; i++) {

    particles.push({
      x: enemy.x,
      y: enemy.y,
      vx: random(-4, 4),
      vy: random(-4, 4),
      life: random(20, 45),
      size: random(2, 6),
      color: "#ff4d55"
    });
  }

  addFeed(
    "TARGET ELIMINATED"
  );
}


/* PARTICLES */

function createImpact(x, y) {

  for (let i = 0; i < 7; i++) {

    particles.push({
      x,
      y,
      vx: random(-3, 3),
      vy: random(-3, 3),
      life: random(8, 20),
      size: random(1, 3),
      color: "#f4f4d0"
    });
  }
}

function updateParticles() {

  for (
    let i = particles.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      particles[i];

    p.x += p.vx;
    p.y += p.vy;

    p.vx *= .96;
    p.vy *= .96;

    p.life--;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}


/* DRAW WORLD */

function drawWorld() {

  ctx.fillStyle =
    "#111612";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.save();

  ctx.translate(
    -camera.x,
    -camera.y
  );


  /*
    Ground
  */

  ctx.fillStyle =
    "#151b17";

  ctx.fillRect(
    0,
    0,
    WORLD_W,
    WORLD_H
  );


  /*
    Roads
  */

  ctx.strokeStyle =
    "#202722";

  ctx.lineWidth = 95;

  for (
    let x = 250;
    x < WORLD_W;
    x += 650
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x,
      0
    );

    ctx.lineTo(
      x,
      WORLD_H
    );

    ctx.stroke();
  }

  for (
    let y = 250;
    y < WORLD_H;
    y += 650
  ) {

    ctx.beginPath();

    ctx.moveTo(
      0,
      y
    );

    ctx.lineTo(
      WORLD_W,
      y
    );

    ctx.stroke();
  }


  /*
    Road lines
  */

  ctx.strokeStyle =
    "#59615b";

  ctx.lineWidth = 2;

  ctx.setLineDash([
    25,
    25
  ]);

  for (
    let x = 250;
    x < WORLD_W;
    x += 650
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x,
      0
    );

    ctx.lineTo(
      x,
      WORLD_H
    );

    ctx.stroke();
  }

  for (
    let y = 250;
    y < WORLD_H;
    y += 650
  ) {

    ctx.beginPath();

    ctx.moveTo(
      0,
      y
    );

    ctx.lineTo(
      WORLD_W,
      y
    );

    ctx.stroke();
  }

  ctx.setLineDash([]);


  /*
    Buildings
  */

  for (
    const building of buildings
  ) {

    ctx.fillStyle =
      "#090c0a";

    ctx.fillRect(
      building.x + 9,
      building.y + 12,
      building.w,
      building.h
    );

    ctx.fillStyle =
      building.color;

    ctx.fillRect(
      building.x,
      building.y,
      building.w,
      building.h
    );

    ctx.strokeStyle =
      "#39413b";

    ctx.strokeRect(
      building.x,
      building.y,
      building.w,
      building.h
    );


    /*
      Windows
    */

    ctx.fillStyle =
      "#c6d36b55";

    for (
      let xx =
        building.x + 20;
      xx <
        building.x +
        building.w -
        10;
      xx += 35
    ) {

      for (
        let yy =
          building.y + 20;
        yy <
          building.y +
          building.h -
          10;
        yy += 38
      ) {

        if (
          Math.random() > .45
        ) {

          ctx.fillRect(
            xx,
            yy,
            7,
            10
          );
        }
      }
    }
  }


  /*
    Trees
  */

  for (
    const tree of trees
  ) {

    if (
      tree.x <
        camera.x - 50 ||
      tree.x >
        camera.x + W + 50 ||
      tree.y <
        camera.y - 50 ||
      tree.y >
        camera.y + H + 50
    ) {
      continue;
    }

    ctx.fillStyle =
      "#10150f";

    ctx.fillRect(
      tree.x - 3,
      tree.y,
      6,
      24
    );

    ctx.beginPath();

    ctx.fillStyle =
      "#263d27";

    ctx.arc(
      tree.x,
      tree.y,
      tree.r,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.fillStyle =
      "#304d30";

    ctx.arc(
      tree.x - 5,
      tree.y - 6,
      tree.r * .65,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  /*
    Pickups
  */

  for (
    const pickup of pickups
  ) {

    if (!pickup.active)
      continue;

    ctx.save();

    ctx.translate(
      pickup.x,
      pickup.y
    );

    ctx.rotate(
      performance.now() / 800
    );

    ctx.strokeStyle =
      pickup.type === "health"
        ? "#4dff8a"
        : "#b8ff32";

    ctx.lineWidth = 3;

    ctx.strokeRect(
      -9,
      -9,
      18,
      18
    );

    ctx.restore();
  }


  /*
    Enemies
  */

  for (
    const enemy of enemies
  ) {

    if (!enemy.alive)
      continue;

    drawEnemy(
      enemy
    );
  }


  /*
    Bullets
  */

  for (
    const bullet of bullets
  ) {

    ctx.beginPath();

    ctx.fillStyle =
      bullet.enemyBullet
        ? "#ff5962"
        : "#fff7bd";

    ctx.arc(
      bullet.x,
      bullet.y,
      bullet.enemyBullet
        ? 3
        : 4,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  /*
    Particles
  */

  for (
    const p of particles
  ) {

    ctx.globalAlpha =
      Math.max(
        0,
        p.life / 30
      );

    ctx.fillStyle =
      p.color;

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.size,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.globalAlpha = 1;


  /*
    Player
  */

  drawPlayer();


  ctx.restore();
}


/* PLAYER DRAW */

function drawPlayer() {

  ctx.save();

  ctx.translate(
    player.x,
    player.y
  );

  ctx.rotate(
    player.angle
  );


  /*
    shadow
  */

  ctx.fillStyle =
    "#0008";

  ctx.beginPath();

  ctx.ellipse(
    0,
    9,
    20,
    11,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /*
    body
  */

  ctx.fillStyle =
    "#b8ff32";

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    18,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /*
    armor
  */

  ctx.fillStyle =
    "#172116";

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    11,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /*
    gun
  */

  ctx.fillStyle =
    "#dce5dc";

  ctx.fillRect(
    8,
    -4,
    26,
    8
  );

  ctx.fillStyle =
    "#4b554e";

  ctx.fillRect(
    10,
    4,
    8,
    9
  );

  ctx.restore();
}


/* ENEMY DRAW */

function drawEnemy(enemy) {

  ctx.save();

  ctx.translate(
    enemy.x,
    enemy.y
  );

  ctx.rotate(
    enemy.angle
  );


  ctx.fillStyle =
    "#0009";

  ctx.beginPath();

  ctx.ellipse(
    0,
    9,
    20,
    11,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.fillStyle =
    "#ff3f4b";

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    17,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.fillStyle =
    "#221113";

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    10,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.fillStyle =
    "#f0dddd";

  ctx.fillRect(
    7,
    -3,
    22,
    6
  );

  ctx.restore();


  /*
    health bar
  */

  ctx.fillStyle =
    "#111";

  ctx.fillRect(
    enemy.x - 18,
    enemy.y - 28,
    36,
    4
  );

  ctx.fillStyle =
    "#ff4d55";

  ctx.fillRect(
    enemy.x - 18,
    enemy.y - 28,
    36 *
      (
        enemy.health /
        enemy.maxHealth
      ),
    4
  );
}


/* MINIMAP */

function drawMinimap() {

  const mw =
    mapCanvas.width;

  const mh =
    mapCanvas.height;

  mapCtx.clearRect(
    0,
    0,
    mw,
    mh
  );

  mapCtx.fillStyle =
    "#0b100d";

  mapCtx.fillRect(
    0,
    0,
    mw,
    mh
  );


  const sx =
    mw / WORLD_W;

  const sy =
    mh / WORLD_H;


  /*
    buildings
  */

  mapCtx.fillStyle =
    "#39443d";

  for (
    const b of buildings
  ) {

    mapCtx.fillRect(
      b.x * sx,
      b.y * sy,
      b.w * sx,
      b.h * sy
    );
  }


  /*
    enemies
  */

  mapCtx.fillStyle =
    "#ff4d55";

  for (
    const enemy of enemies
  ) {

    if (!enemy.alive)
      continue;

    mapCtx.fillRect(
      enemy.x * sx - 2,
      enemy.y * sy - 2,
      4,
      4
    );
  }


  /*
    player
  */

  mapCtx.fillStyle =
    "#b8ff32";

  mapCtx.beginPath();

  mapCtx.arc(
    player.x * sx,
    player.y * sy,
    4,
    0,
    Math.PI * 2
  );

  mapCtx.fill();


  /*
    camera
  */

  mapCtx.strokeStyle =
    "#ffffff55";

  mapCtx.strokeRect(
    camera.x * sx,
    camera.y * sy,
    W * sx,
    H * sy
  );
}


/* FEED */

function addFeed(text) {

  const feed =
    document.getElementById(
      "killFeed"
    );

  const div =
    document.createElement(
      "div"
    );

  div.className =
    "feed";

  div.innerHTML =
    `<b>◆</b> ${text}`;

  feed.prepend(div);

  setTimeout(
    () => div.remove(),
    2500
  );
}


/* DEATH */

function die() {

  running = false;
  mouse.down = false;

  document.getElementById(
    "deathScreen"
  ).style.display =
    "grid";
}


/* START */

function startGame() {

  document.getElementById(
    "startScreen"
  ).style.display =
    "none";

  document.getElementById(
    "deathScreen"
  ).style.display =
    "none";

  bullets = [];
  particles = [];

  createPlayer();
  createWorld();

  running = true;

  updateHealth();

  requestAnimationFrame(
    gameLoop
  );
}


/* LOOP */

function gameLoop(time) {

  if (!running)
    return;

  const dt =
    Math.min(
      2,
      (time - lastTime) / 16.67 || 1
    );

  lastTime = time;


  updatePlayer(dt);

  updateCamera();

  if (mouse.down) {
    shoot();
  }

  updateBullets();

  updateEnemies(dt);

  updatePickups();

  updateParticles();


  drawWorld();

  drawMinimap();


  requestAnimationFrame(
    gameLoop
  );
}


/* BUTTONS */

document.getElementById(
  "startBtn"
).addEventListener(
  "click",
  startGame
);

document.getElementById(
  "restartBtn"
).addEventListener(
  "click",
  startGame
);
