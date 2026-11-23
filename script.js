(() => {

"use strict";


/* =========================================
   VARIABLES
========================================= */

let scene;
let camera;
let renderer;
let clock;

let player;
let gun;
let zoneRing;

let running = false;
let firstPerson = false;
let crouching = false;
let grounded = true;

let yaw = 0;
let pitch = 0;

let verticalVelocity = 0;

let lastShot = 0;
let reloading = false;

let health = 100;
let armor = 65;

let zoneRadius = 115;

const keys = {};

const bots = [];
const buildings = [];

let weaponIndex = 0;


/* =========================================
   WEAPONS
========================================= */

const weapons = [

  {
    name:"ASSAULT RIFLE",
    mag:30,
    ammo:30,
    reserve:120,
    damage:28,
    rate:105,
    pellets:1
  },

  {
    name:"SMG",
    mag:40,
    ammo:40,
    reserve:160,
    damage:17,
    rate:65,
    pellets:1
  },

  {
    name:"SHOTGUN",
    mag:6,
    ammo:6,
    reserve:42,
    damage:18,
    rate:600,
    pellets:7
  }

];


const $ = id => document.getElementById(id);


/* =========================================
   START GAME
========================================= */

function startGame(){

  const name =
    $("name").value.trim();


  if(!name){

    $("name").focus();

    $("name").placeholder =
      "ENTER YOUR NAME FIRST";

    return;
  }


  if(typeof THREE === "undefined"){

    alert(
      "Three.js did not load.\nRefresh the page and try again."
    );

    return;
  }


  $("start").style.display =
    "none";

  $("hud").style.display =
    "block";


  try{

    init();

    running = true;

    clock.start();

    updateHUD();


    setTimeout(() => {

      if(
        renderer &&
        renderer.domElement
      ){

        renderer.domElement
          .requestPointerLock?.();

      }

    },200);


    requestAnimationFrame(loop);


  }catch(error){

    console.error(error);

    running = false;

    $("start").style.display =
      "flex";

    $("hud").style.display =
      "none";


    alert(
      "GAME ERROR:\n\n" +
      error.message
    );

  }

}


/* =========================================
   ENTER BUTTON
========================================= */

$("enter")
  .addEventListener(
    "click",
    startGame
  );


$("name")
  .addEventListener(
    "keydown",
    e => {

      if(e.key === "Enter"){
        startGame();
      }

    }
  );


$("again")
  .addEventListener(
    "click",
    () => location.reload()
  );


/* =========================================
   INITIALIZE
========================================= */

function init(){

  scene =
    new THREE.Scene();


  scene.background =
    new THREE.Color(
      0x07100c
    );


  scene.fog =
    new THREE.FogExp2(
      0x07100c,
      0.0065
    );


  camera =
    new THREE.PerspectiveCamera(
      72,
      innerWidth / innerHeight,
      0.1,
      800
    );


  renderer =
    new THREE.WebGLRenderer({

      antialias:true,

      powerPreference:
        "high-performance"

    });


  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      1.6
    )
  );


  renderer.setSize(
    innerWidth,
    innerHeight
  );


  renderer.shadowMap.enabled =
    true;


  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  document.body.appendChild(
    renderer.domElement
  );


  clock =
    new THREE.Clock();


  /* LIGHT */

  scene.add(
    new THREE.HemisphereLight(
      0xbdebd5,
      0x101510,
      1.8
    )
  );


  const sun =
    new THREE.DirectionalLight(
      0xffffff,
      2.7
    );


  sun.position.set(
    70,
    130,
    50
  );


  sun.castShadow = true;


  sun.shadow.mapSize.set(
    1024,
    1024
  );


  scene.add(sun);


  /* GROUND */

  const ground =
    new THREE.Mesh(

      new THREE.PlaneGeometry(
        400,
        400
      ),

      new THREE.MeshStandardMaterial({
        color:0x17231c,
        roughness:1
      })

    );


  ground.rotation.x =
    -Math.PI / 2;


  ground.receiveShadow =
    true;


  scene.add(ground);


  /* ROADS */

  road(
    0,
    0,
    400,
    18
  );


  road(
    0,
    0,
    18,
    400
  );


  road(
    90,
    -65,
    120,
    12
  );


  road(
    -90,
    60,
    120,
    12
  );


  /* BUILDINGS */

  const layout = [

    [-70,-70,28,22,20],
    [-30,-70,25,30,28],
    [30,-70,30,25,34],
    [75,-65,25,32,25],

    [-75,-25,22,30,32],
    [-35,-25,30,20,18],
    [35,-25,25,28,30],
    [75,-20,30,22,20],

    [-75,30,30,24,24],
    [-35,35,20,28,36],
    [35,35,32,24,22],
    [78,35,25,30,30],

    [-70,80,28,25,26],
    [-25,80,25,28,32],
    [35,80,30,22,25],
    [78,78,25,28,35]

  ];


  layout.forEach(
    b => building(...b)
  );


  /* TREES */

  for(
    let i = 0;
    i < 55;
    i++
  ){

    const x =
      (Math.random() - .5) *
      350;

    const z =
      (Math.random() - .5) *
      350;


    if(
      Math.abs(x) < 115 &&
      Math.abs(z) < 115
    ){

      continue;

    }


    tree(x,z);

  }


  /* PLAYER */

  player =
    makePlayer();


  player.position.set(
    0,
    0,
    55
  );


  scene.add(player);


  makeGun();


  /* ENEMIES */

  for(
    let i = 0;
    i < 11;
    i++
  ){

    const bot =
      makeBot();


    let x;
    let z;


    do{

      x =
        (Math.random() - .5) *
        190;

      z =
        (Math.random() - .5) *
        190;

    }
    while(
      Math.hypot(x,z) < 35
    );


    bot.position.set(
      x,
      0,
      z
    );


    scene.add(bot);


    bots.push({

      mesh:bot,

      health:100,

      alive:true,

      speed:
        1.7 +
        Math.random()*1.3,

      fire:
        500 +
        Math.random()*1800

    });

  }


  /* SAFE ZONE */

  zoneRing =
    new THREE.Mesh(

      new THREE.RingGeometry(
        zoneRadius - 1,
        zoneRadius,
        96
      ),

      new THREE.MeshBasicMaterial({

        color:0x39ff9f,

        side:
          THREE.DoubleSide,

        transparent:true,

        opacity:.75

      })

    );


  zoneRing.rotation.x =
    -Math.PI / 2;


  zoneRing.position.y =
    .12;


  scene.add(zoneRing);

}


/* =========================================
   ROADS
========================================= */

function road(
  x,
  z,
  w,
  d
){

  const r =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        w,
        .05,
        d
      ),

      new THREE.MeshStandardMaterial({
        color:0x202522
      })

    );


  r.position.set(
    x,
    .025,
    z
  );


  scene.add(r);


  const material =
    new THREE.MeshBasicMaterial({
      color:0xd2c86a
    });


  if(w > d){

    for(
      let i = -w/2 + 10;
      i < w/2;
      i += 18
    ){

      const line =
        new THREE.Mesh(

          new THREE.BoxGeometry(
            8,
            .06,
            .14
          ),

          material

        );


      line.position.set(
        x+i,
        .06,
        z
      );


      scene.add(line);

    }

  }else{

    for(
      let i = -d/2 + 10;
      i < d/2;
      i += 18
    ){

      const line =
        new THREE.Mesh(

          new THREE.BoxGeometry(
            .14,
            .06,
            8
          ),

          material

        );


      line.position.set(
        x,
        .06,
        z+i
      );


      scene.add(line);

    }

  }

}


/* =========================================
   BUILDINGS
========================================= */

function building(
  x,
  z,
  w,
  d,
  h
){

  const group =
    new THREE.Group();


  const colors = [

    0x28312c,
    0x343a35,
    0x252d29,
    0x3b403b

  ];


  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        w,
        h,
        d
      ),

      new THREE.MeshStandardMaterial({

        color:
          colors[
            Math.floor(
              Math.random() *
              colors.length
            )
          ],

        roughness:.85

      })

    );


  body.position.y =
    h/2;


  body.castShadow =
    true;


  body.receiveShadow =
    true;


  group.add(body);


  const roof =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        w+.8,
        .7,
        d+.8
      ),

      new THREE.MeshStandardMaterial({
        color:0x111512
      })

    );


  roof.position.y =
    h+.35;


  group.add(roof);


  const windowMaterial =
    new THREE.MeshBasicMaterial({
      color:0x8de8c1
    });


  for(
    let yy = 3;
    yy < h;
    yy += 4
  ){

    for(
      let xx = -w/2 + 2;
      xx < w/2 - 1;
      xx += 4
    ){

      const a =
        new THREE.Mesh(

          new THREE.BoxGeometry(
            1.4,
            .8,
            .05
          ),

          windowMaterial

        );


      a.position.set(
        xx,
        yy,
        d/2+.04
      );


      group.add(a);


      const b =
        a.clone();


      b.position.z =
        -d/2-.04;


      group.add(b);

    }

  }


  group.position.set(
    x,
    0,
    z
  );


  scene.add(group);


  buildings.push({

    x,
    z,
    w,
    d,
    h

  });

}


/* =========================================
   TREE
========================================= */

function tree(x,z){

  const group =
    new THREE.Group();


  const trunk =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        .45,
        .65,
        5,
        8
      ),

      new THREE.MeshStandardMaterial({
        color:0x513e2d
      })

    );


  trunk.position.y =
    2.5;


  group.add(trunk);


  const leaves =
    new THREE.Mesh(

      new THREE.ConeGeometry(
        3.5,
        8,
        8
      ),

      new THREE.MeshStandardMaterial({
        color:0x183f28
      })

    );


  leaves.position.y =
    7;


  leaves.castShadow =
    true;


  group.add(leaves);


  group.position.set(
    x,
    0,
    z
  );


  scene.add(group);

}


/* =========================================
   PLAYER
========================================= */

function makePlayer(){

  const group =
    new THREE.Group();


  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        .55,
        1.3,
        6,
        12
      ),

      new THREE.MeshStandardMaterial({
        color:0x18362a
      })

    );


  body.position.y =
    1.25;


  body.castShadow =
    true;


  group.add(body);


  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        .42,
        16,
        12
      ),

      new THREE.MeshStandardMaterial({
        color:0xd69c78
      })

    );


  head.position.y =
    2.35;


  group.add(head);


  const vest =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        1.05,
        .8,
        .65
      ),

      new THREE.MeshStandardMaterial({
        color:0x263b31
      })

    );


  vest.position.y =
    1.35;


  group.add(vest);


  return group;

}


/* =========================================
   GUN
========================================= */

function makeGun(){

  gun =
    new THREE.Group();


  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        .18,
        .18,
        .95
      ),

      new THREE.MeshStandardMaterial({

        color:0x111111,

        metalness:.8,

        roughness:.3

      })

    );


  body.rotation.x =
    Math.PI / 2;


  gun.add(body);


  const barrel =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        .045,
        .045,
        .45,
        10
      ),

      new THREE.MeshStandardMaterial({

        color:0x080808,

        metalness:1

      })

    );


  barrel.rotation.x =
    Math.PI / 2;


  barrel.position.z =
    -.65;


  gun.add(barrel);


  gun.position.set(
    .55,
    1.5,
    -.5
  );


  player.add(gun);

}


/* =========================================
   BOT
========================================= */

function makeBot(){

  const group =
    new THREE.Group();


  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        .55,
        1.3,
        6,
        12
      ),

      new THREE.MeshStandardMaterial({
        color:0x652323
      })

    );


  body.position.y =
    1.2;


  group.add(body);


  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        .42,
        14,
        10
      ),

      new THREE.MeshStandardMaterial({
        color:0xb97c63
      })

    );


  head.position.y =
    2.3;


  group.add(head);


  return group;

}


/* =========================================
   RAYCAST SHOOTING
========================================= */

const raycaster =
  new THREE.Raycaster();


function shoot(){

  if(!running)
    return;


  if(reloading)
    return;


  const weapon =
    weapons[weaponIndex];


  const now =
    performance.now();


  if(
    now - lastShot <
    weapon.rate
  ){

    return;

  }


  if(
    weapon.ammo <= 0
  ){

    reload();

    return;

  }


  lastShot =
    now;


  weapon.ammo--;


  const origin =
    camera.getWorldPosition(
      new THREE.Vector3()
    );


  const direction =
    camera.getWorldDirection(
      new THREE.Vector3()
    );


  for(
    let p = 0;
    p < weapon.pellets;
    p++
  ){

    const shotDirection =
      direction.clone();


    if(
      weapon.pellets > 1
    ){

      shotDirection.x +=
        (Math.random()-.5)*.075;

      shotDirection.y +=
        (Math.random()-.5)*.075;

      shotDirection.z +=
        (Math.random()-.5)*.075;

      shotDirection.normalize();

    }


    raycaster.set(
      origin,
      shotDirection
    );


    const aliveBots =
      bots
        .filter(
          bot => bot.alive
        )
        .map(
          bot => bot.mesh
        );


    const hits =
      raycaster.intersectObjects(
        aliveBots,
        true
      );


    if(hits.length){

      let object =
        hits[0].object;


      while(
        object.parent &&
        !bots.some(
          b => b.mesh === object
        )
      ){

        object =
          object.parent;

      }


      const bot =
        bots.find(
          b => b.mesh === object
        );


      if(bot){

        bot.health -=
          weapon.damage;


        if(
          bot.health <= 0
        ){

          bot.alive =
            false;


          scene.remove(
            bot.mesh
          );

        }

      }

    }

  }


  updateHUD();

}


/* =========================================
   RELOAD
========================================= */

function reload(){

  if(reloading)
    return;


  const weapon =
    weapons[weaponIndex];


  if(
    weapon.ammo >=
    weapon.mag
  ){

    return;

  }


  if(
    weapon.reserve <= 0
  ){

    return;

  }


  reloading =
    true;


  setTimeout(() => {

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

  },850);

}


/* =========================================
   PLAYER MOVEMENT
========================================= */

function updatePlayer(dt){

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


  if(keys.KeyW)
    movement.add(forward);


  if(keys.KeyS)
    movement.sub(forward);


  if(keys.KeyD)
    movement.add(right);


  if(keys.KeyA)
    movement.sub(right);


  if(
    movement.lengthSq() > 0
  ){

    movement.normalize();

  }


  let speed = 7;


  if(
    keys.ShiftLeft ||
    keys.ShiftRight
  ){

    speed = 12;

  }


  if(crouching){

    speed = 3.5;

  }


  player.position.addScaledVector(
    movement,
    speed * dt
  );


  /* JUMP / GRAVITY */

  verticalVelocity -=
    20 * dt;


  player.position.y +=
    verticalVelocity * dt;


  if(
    player.position.y <= 0
  ){

    player.position.y = 0;

    verticalVelocity = 0;

    grounded = true;

  }


  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -185,
      185
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -185,
      185
    );


  player.rotation.y =
    yaw;

}


/* =========================================
   CAMERA
========================================= */

function updateCamera(){

  camera.rotation.order =
    "YXZ";


  /* FIRST PERSON */

  if(firstPerson){

    camera.position.set(

      player.position.x,

      player.position.y + 1.72,

      player.position.z

    );


    camera.rotation.y =
      yaw;


    camera.rotation.x =
      pitch;


    return;

  }


  /* THIRD PERSON */

  const target =
    new THREE.Vector3(

      player.position.x,

      player.position.y + 1.45,

      player.position.z

    );


  const offset =
    new THREE.Vector3(

      -Math.sin(yaw) * 6.5,

      3,

      -Math.cos(yaw) * 6.5

    );


  camera.position.copy(
    target.clone().add(offset)
  );


  camera.lookAt(target);

}


/* =========================================
   BOT AI
========================================= */

function updateBots(dt){

  const aliveBots =
    bots.filter(
      bot => bot.alive
    );


  aliveBots.forEach(bot => {

    const distance =
      bot.mesh
        .position
        .distanceTo(
          player.position
        );


    if(distance < 75){

      const direction =
        player.position
          .clone()
          .sub(
            bot.mesh.position
          );


      direction.y = 0;


      if(
        direction.length() > 8
      ){

        direction.normalize();


        bot.mesh
          .position
          .addScaledVector(
            direction,
            bot.speed * dt
          );

      }


      bot.mesh.lookAt(

        player.position.x,

        bot.mesh.position.y,

        player.position.z

      );


      bot.fire -=
        dt * 1000;


      if(
        distance < 45 &&
        bot.fire <= 0
      ){

        bot.fire =
          1000 +
          Math.random()*1400;


        if(
          Math.random() < .42
        ){

          damagePlayer(
            5 +
            Math.random()*9
          );

        }

      }

    }

  });


  $("alive").textContent =
    aliveBots.length + 1;

}


/* =========================================
   DAMAGE
========================================= */

function damagePlayer(amount){

  if(!running)
    return;


  if(armor > 0){

    const absorbed =
      Math.min(
        armor,
        amount * .65
      );


    armor -=
      absorbed;


    amount -=
      absorbed;

  }


  health -=
    amount;


  $("damage").style.opacity =
    .6;


  setTimeout(() => {

    $("damage").style.opacity =
      0;

  },90);


  if(
    health <= 0
  ){

    finish(false);

  }


  updateHUD();

}


/* =========================================
   SAFE ZONE
========================================= */

function updateZone(dt){

  zoneRadius =
    Math.max(
      30,
      zoneRadius -
      dt * .48
    );


  zoneRing.geometry.dispose();


  zoneRing.geometry =
    new THREE.RingGeometry(

      zoneRadius - 1,

      zoneRadius,

      96

    );


  $("zone").textContent =
    "ZONE " +
    Math.round(
      zoneRadius /
      115 *
      100
    ) +
    "%";


  const distance =
    Math.hypot(
      player.position.x,
      player.position.z
    );


  if(
    distance >
    zoneRadius
  ){

    damagePlayer(
      dt * 3.8
    );

  }

}


/* =========================================
   WIN / LOSE
========================================= */

function finish(win){

  if(!running)
    return;


  running = false;


  document
    .exitPointerLock?.();


  $("result").style.display =
    "flex";


  $("resultTitle")
    .textContent =
    win
      ? "BOOYAH!"
      : "ELIMINATED";


  $("resultText")
    .textContent =
    win
      ? "YOU ARE THE LAST//ALIVE."
      : "You were eliminated in District 07.";

}


/* =========================================
   HUD
========================================= */

function updateHUD(){

  const weapon =
    weapons[weaponIndex];


  $("hpText").textContent =
    Math.max(
      0,
      Math.round(health)
    );


  $("armorText").textContent =
    Math.max(
      0,
      Math.round(armor)
    );


  $("hp").style.width =
    Math.max(
      0,
      health
    ) + "%";


  $("armor").style.width =
    Math.max(
      0,
      armor
    ) + "%";


  $("weaponName")
    .textContent =
    weapon.name;


  $("mag")
    .textContent =
    weapon.ammo;


  $("reserve")
    .textContent =
    weapon.reserve;

}


/* =========================================
   KEYBOARD
========================================= */

addEventListener(
  "keydown",
  e => {

    keys[e.code] =
      true;


    /* CROUCH */

    if(
      e.code === "KeyC"
    ){

      crouching =
        !crouching;

    }


    /* JUMP */

    if(
      e.code === "Space" &&
      grounded
    ){

      verticalVelocity =
        8;


      grounded =
        false;

    }


    /* CAMERA */

    if(
      e.code === "KeyV"
    ){

      firstPerson =
        !firstPerson;


      $("mode")
        .textContent =
        firstPerson
          ? "FIRST PERSON"
          : "THIRD PERSON";

    }


    /* WEAPONS */

    if(
      e.code === "Digit1"
    ){

      weaponIndex = 0;

      updateHUD();

    }


    if(
      e.code === "Digit2"
    ){

      weaponIndex = 1;

      updateHUD();

    }


    if(
      e.code === "Digit3"
    ){

      weaponIndex = 2;

      updateHUD();

    }


    /* RELOAD */

    if(
      e.code === "KeyR"
    ){

      reload();

    }


    /* MEDKIT */

    if(
      e.code === "KeyG"
    ){

      if(
        health < 100
      ){

        health =
          Math.min(
            100,
            health + 30
          );


        updateHUD();

      }

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


/* =========================================
   MOUSE AIM
========================================= */

document.addEventListener(
  "mousemove",
  e => {

    if(!running)
      return;


    if(
      document.pointerLockElement !==
      renderer.domElement
    ){

      return;

    }


    yaw -=
      e.movementX *
      .0025;


    pitch -=
      e.movementY *
      .0025;


    pitch =
      THREE.MathUtils.clamp(
        pitch,
        -1.25,
        1.25
      );

  }
);


/* =========================================
   SHOOT
========================================= */

document.addEventListener(
  "mousedown",
  e => {

    if(!running)
      return;


    if(
      document.pointerLockElement !==
      renderer.domElement
    ){

      renderer
        .domElement
        .requestPointerLock?.();


      return;

    }


    if(
      e.button === 0
    ){

      shoot();

    }

  }
);


/* =========================================
   RESIZE
========================================= */

addEventListener(
  "resize",
  () => {

    if(
      !camera ||
      !renderer
    ){

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
);


/* =========================================
   GAME LOOP
========================================= */

function loop(){

  if(!running){

    if(
      renderer &&
      scene &&
      camera
    ){

      renderer.render(
        scene,
        camera
      );

    }

    return;

  }


  requestAnimationFrame(
    loop
  );


  const dt =
    Math.min(
      clock.getDelta(),
      .05
    );


  updatePlayer(dt);

  updateBots(dt);

  updateZone(dt);

  updateCamera();


  if(
    bots.every(
      bot => !bot.alive
    )
  ){

    finish(true);

  }


  renderer.render(
    scene,
    camera
  );

}


})();
