import * as THREE from "three";

const canvas = document.getElementById("game");

let scene;
let camera;
let renderer;
let player;
let playerGroup;

let clock;
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

const bullets = [];
const enemies = [];
const buildings = [];

const WORLD = 3000;

const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.45;

const normalSpeed = 7;
const sprintSpeed = 12;
const crouchSpeed = 3.5;

const gravity = 25;
const jumpPower = 9;

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

const cameraOffset = new THREE.Vector3(
  0,
  3.2,
  7
);

init();

function init(){

  scene = new THREE.Scene();

  scene.background =
    new THREE.Color("#101613");

  scene.fog =
    new THREE.Fog(
      "#101613",
      100,
      900
    );

  clock = new THREE.Clock();

  renderer =
    new THREE.WebGLRenderer({
      canvas,
      antialias:true
    });

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.shadowMap.enabled = true;

  camera =
    new THREE.PerspectiveCamera(
      65,
      window.innerWidth /
      window.innerHeight,
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
    e=>{
      if(e.button===0){
        shooting=true;
      }
    }
  );

  window.addEventListener(
    "mouseup",
    e=>{
      if(e.button===0){
        shooting=false;
      }
    }
  );

  document
    .getElementById("play")
    .onclick = startGame;
}

function createLights(){

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

  sun.castShadow=true;

  sun.shadow.mapSize.width=2048;
  sun.shadow.mapSize.height=2048;

  scene.add(sun);
}

function createWorld(){

  const groundGeo =
    new THREE.PlaneGeometry(
      WORLD,
      WORLD
    );

  const groundMat =
    new THREE.MeshStandardMaterial({
      color:"#18201a",
      roughness:1
    });

  const ground =
    new THREE.Mesh(
      groundGeo,
      groundMat
    );

  ground.rotation.x =
    -Math.PI/2;

  ground.receiveShadow=true;

  scene.add(ground);


  /* ROADS */

  for(
    let x=-WORLD/2;
    x<=WORLD/2;
    x+=350
  ){

    const road =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          80,
          WORLD
        ),
        new THREE.MeshStandardMaterial({
          color:"#252b27"
        })
      );

    road.rotation.x =
      -Math.PI/2;

    road.position.x=x;
    road.position.y=.01;

    scene.add(road);
  }

  for(
    let z=-WORLD/2;
    z<=WORLD/2;
    z+=350
  ){

    const road =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          WORLD,
          80
        ),
        new THREE.MeshStandardMaterial({
          color:"#252b27"
        })
      );

    road.rotation.x =
      -Math.PI/2;

    road.position.z=z;
    road.position.y=.012;

    scene.add(road);
  }


  /* BUILDINGS */

  for(
    let i=0;
    i<90;
    i++
  ){

    const x =
      THREE.MathUtils.randFloat(
        -WORLD/2+100,
        WORLD/2-100
      );

    const z =
      THREE.MathUtils.randFloat(
        -WORLD/2+100,
        WORLD/2-100
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
          )
      });

    const building =
      new THREE.Mesh(
        geo,
        mat
      );

    building.position.set(
      x,
      h/2,
      z
    );

    building.castShadow=true;
    building.receiveShadow=true;

    scene.add(building);

    buildings.push({
      mesh:building,
      x,
      z,
      w,
      d
    });
  }


  /* TREES */

  for(
    let i=0;
    i<180;
    i++
  ){

    const x =
      THREE.MathUtils.randFloat(
        -WORLD/2,
        WORLD/2
      );

    const z =
      THREE.MathUtils.randFloat(
        -WORLD/2,
        WORLD/2
      );

    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          .18,
          .25,
          2,
          8
        ),
        new THREE.MeshStandardMaterial({
          color:"#3c3022"
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
          color:"#244229"
        })
      );

    leaves.position.set(
      x,
      3,
      z
    );

    trunk.castShadow=true;
    leaves.castShadow=true;

    scene.add(trunk);
    scene.add(leaves);
  }
}

function createPlayer(){

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


  /* LEGS */

  const legMat =
    new THREE.MeshStandardMaterial({
      color:"#151a18"
    });

  const leftLeg =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .28,
        .9,
        .3
      ),
      legMat
    );

  leftLeg.position.set(
    -.22,
    .45,
    0
  );

  const rightLeg =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .28,
        .9,
        .3
      ),
      legMat
    );

  rightLeg.position.set(
    .22,
    .45,
    0
  );


  /* BODY */

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .85,
        1.05,
        .48
      ),
      new THREE.MeshStandardMaterial({
        color:"#27352a"
      })
    );

  body.position.y=1.15;


  /* HEAD */

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .36,
        16,
        12
      ),
      new THREE.MeshStandardMaterial({
        color:"#c8926c"
      })
    );

  head.position.y=1.92;


  /* HAIR */

  const hair =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .37,
        16,
        8
      ),
      new THREE.MeshStandardMaterial({
        color:"#111111"
      })
    );

  hair.scale.y=.55;

  hair.position.set(
    0,
    2.13,
    0
  );


  /* ARMS */

  const armMat =
    new THREE.MeshStandardMaterial({
      color:"#30402f"
    });

  const leftArm =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .25,
        .9,
        .25
      ),
      armMat
    );

  leftArm.position.set(
    -.62,
    1.2,
    0
  );

  const rightArm =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .25,
        .9,
        .25
      ),
      armMat
    );

  rightArm.position.set(
    .62,
    1.2,
    0
  );


  /* GUN */

  const gun =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .18,
        .18,
        1.2
      ),
      new THREE.MeshStandardMaterial({
        color:"#111313"
      })
    );

  gun.rotation.x =
    Math.PI/2;

  gun.position.set(
    .48,
    1.15,
    -.48
  );


  player.add(
    leftLeg,
    rightLeg,
    body,
    head,
    hair,
    leftArm,
    rightArm,
    gun
  );


  player.traverse(
    obj=>{
      if(obj.isMesh){
        obj.castShadow=true;
        obj.receiveShadow=true;
      }
    }
  );
}

function createEnemies(){

  for(
    let i=0;
    i<18;
    i++
  ){

    const enemy =
      createEnemy();

    enemy.position.set(
      THREE.MathUtils.randFloat(
        -1200,
        1200
      ),
      0,
      THREE.MathUtils.randFloat(
        -1200,
        1200
      )
    );

    scene.add(enemy);

    enemies.push({
      object:enemy,
      health:100,
      alive:true,
      timer:Math.random()*2
    });
  }
}

function createEnemy(){

  const group =
    new THREE.Group();

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .8,
        1.05,
        .45
      ),
      new THREE.MeshStandardMaterial({
        color:"#6d2429"
      })
    );

  body.position.y=1.1;

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .35,
        14,
        10
      ),
      new THREE.MeshStandardMaterial({
        color:"#a56f55"
      })
    );

  head.position.y=1.85;

  const legs =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .65,
        .9,
        .35
      ),
      new THREE.MeshStandardMaterial({
        color:"#171717"
      })
    );

  legs.position.y=.45;

  group.add(
    body,
    head,
    legs
  );

  group.traverse(
    obj=>{
      if(obj.isMesh)
        obj.castShadow=true;
    }
  );

  return group;
}

function startGame(){

  document.getElementById(
    "start"
  ).style.display="none";

  running=true;

  canvas.requestPointerLock();

  clock.start();

  animate();
}

function keyDown(e){

  keys[
    e.key.toLowerCase()
  ]=true;

  if(
    e.key===" " &&
    grounded &&
    running
  ){

    velocityY=
      jumpPower;

    grounded=false;
  }

  if(
    e.key.toLowerCase()==="c"
  ){

    crouching=true;

    player.scale.y=.72;
  }
}

function keyUp(e){

  keys[
    e.key.toLowerCase()
  ]=false;

  if(
    e.key.toLowerCase()==="c"
  ){

    crouching=false;

    player.scale.y=1;
  }
}

function mouseMove(e){

  if(
    document.pointerLockElement !==
    canvas
  ) return;

  yaw -=
    e.movementX*.0025;

  pitch -=
    e.movementY*.002;

  pitch =
    THREE.MathUtils.clamp(
      pitch,
      -0.65,
      .35
    );
}

function updatePlayer(dt){

  let forward=0;
  let side=0;

  if(keys["w"]) forward+=1;
  if(keys["s"]) forward-=1;
  if(keys["d"]) side+=1;
  if(keys["a"]) side-=1;

  const len =
    Math.hypot(
      forward,
      side
    );

  if(len>0){

    forward/=len;
    side/=len;

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
      forward*speed*dt
    );

    movement.addScaledVector(
      rightVector,
      side*speed*dt
    );

    const next =
      playerGroup.position.clone();

    next.add(movement);

    if(
      !collides(next)
    ){

      playerGroup.position.copy(
        next
      );
    }

    player.rotation.y =
      THREE.MathUtils.lerp(
        player.rotation.y,
        yaw,
        .18
      );
  }


  /* JUMP */

  velocityY -=
    gravity*dt;

  playerGroup.position.y +=
    velocityY*dt;

  if(
    playerGroup.position.y<=0
  ){

    playerGroup.position.y=0;

    velocityY=0;

    grounded=true;
  }
}

function collides(pos){

  const r=.6;

  for(
    const b of buildings
  ){

    if(
      pos.x+r>b.x-b.w/2 &&
      pos.x-r<b.x+b.w/2 &&
      pos.z+r>b.z-b.d/2 &&
      pos.z-r<b.z+b.d/2
    ){

      return true;
    }
  }

  return false;
}

function updateCamera(){

  const target =
    new THREE.Vector3(
      playerGroup.position.x,
      playerGroup.position.y+
        (crouching?1.25:1.7),
      playerGroup.position.z
    );

  const distance=7;

  const horizontal =
    Math.cos(pitch)*
    distance;

  const vertical =
    Math.sin(pitch)*
    distance;

  const desired =
    new THREE.Vector3(
      target.x+
        Math.sin(yaw)*
        horizontal,

      target.y+
        vertical,

      target.z+
        Math.cos(yaw)*
        horizontal
    );

  camera.position.lerp(
    desired,
    .12
  );

  camera.lookAt(
    target
  );
}

function shoot(){

  const now =
    performance.now();

  if(
    now-lastShot<110
  ) return;

  if(ammo<=0){

    ammo=30;
    reserveAmmo=
      Math.max(
        0,
        reserveAmmo-30
      );

    updateAmmo();

    return;
  }

  lastShot=now;
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
      .filter(e=>e.alive)
      .map(e=>e.object);

  const hits =
    raycaster.intersectObjects(
      objects,
      true
    );

  if(hits.length){

    let hit=
      hits[0].object;

    while(
      hit.parent &&
      !enemies.some(
        e=>e.object===hit
      )
    ){
      hit=hit.parent;
    }

    const enemyData =
      enemies.find(
        e=>
          e.object===hit
      );

    if(enemyData){

      enemyData.health-=35;

      if(
        enemyData.health<=0
      ){

        enemyData.alive=false;

        scene.remove(
          enemyData.object
        );
      }
    }
  }
}

function updateEnemies(dt){

  for(
    const e of enemies
  ){

    if(!e.alive)
      continue;

    const pos =
      e.object.position;

    const dx =
      playerGroup.position.x-
      pos.x;

    const dz =
      playerGroup.position.z-
      pos.z;

    const dist =
      Math.hypot(
        dx,
        dz
      );

    if(
      dist<55 &&
      dist>3
    ){

      pos.x +=
        dx/dist*
        1.7*
        dt;

      pos.z +=
        dz/dist*
        1.7*
        dt;

      e.object.rotation.y =
        Math.atan2(
          dx,
          dz
        );
    }

    if(
      dist<3
    ){

      damage(10*dt);
    }
  }
}

function damage(amount){

  health-=amount;

  health=
    Math.max(
      0,
      health
    );

  updateHealth();

  if(
    health<=0
  ){

    running=false;

    document.getElementById(
      "dead"
    ).style.display="grid";

    if(
      document.pointerLockElement
    ){

      document.exitPointerLock();
    }
  }
}

function updateHealth(){

  document.getElementById(
    "healthBar"
  ).style.width=
    health+"%";

  document.getElementById(
    "healthText"
  ).textContent=
    Math.ceil(health);
}

function updateAmmo(){

  document.getElementById(
    "ammo"
  ).textContent=
    ammo;
}

function animate(){

  if(!running)
    return;

  requestAnimationFrame(
    animate
  );

  const dt =
    Math.min(
      clock.getDelta(),
      .05
    );

  updatePlayer(dt);
  updateCamera();
  updateEnemies(dt);

  if(shooting)
    shoot();

  renderer.render(
    scene,
    camera
  );
}

function resize(){

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}

updateHealth();
updateAmmo();
