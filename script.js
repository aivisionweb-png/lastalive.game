import * as THREE from "three";


/* =========================================================
   LAST//ALIVE
   DISTRICT 09
   NO GLB
   DESKTOP + MOBILE
========================================================= */

const $ = id =>
  document.getElementById(id);


/* =========================================================
   THREE
========================================================= */

let scene;
let camera;
let renderer;
let clock;


/* =========================================================
   GAME
========================================================= */

let running = false;

let player;

let yaw = 0;

let pitch = -0.12;

let cameraMode = 3;

let mapSize = 260;

let mapHalf = 130;


/* =========================================================
   INPUT
========================================================= */

const keys = {};

let mobileMoveX = 0;
let mobileMoveY = 0;

let mobileAimX = 0;
let mobileAimY = 0;

let mobileSprint = false;

let mobileFiring = false;


/* =========================================================
   PLAYER
========================================================= */

let health = 100;

let armor = 100;

let kills = 0;

let aliveCount = 12;

let medkits = 2;

let onGround = true;

let jumpVelocity = 0;

let crouching = false;


/* =========================================================
   COMBAT
========================================================= */

let currentWeapon = 0;

let lastShot = 0;

let reloading = false;


/* =========================================================
   WORLD
========================================================= */

const enemies = [];

const pickups = [];

const buildings = [];

const colliders = [];

const trees = [];

let zoneRadius = 92;

let zoneMesh;


/* =========================================================
   WEAPONS
========================================================= */

const weapons = [

  {
    name: "AR-01",
    damage: 30,
    fireRate: 115,
    mag: 30,
    ammo: 30,
    reserve: 150,
    spread: .018,
    pellets: 1
  },

  {
    name: "SMG-9",
    damage: 18,
    fireRate: 65,
    mag: 40,
    ammo: 40,
    reserve: 200,
    spread: .035,
    pellets: 1
  },

  {
    name: "M12",
    damage: 14,
    fireRate: 620,
    mag: 6,
    ammo: 6,
    reserve: 48,
    spread: .12,
    pellets: 8
  }

];


/* =========================================================
   START
========================================================= */

function startGame(){

  const name =
    $("name").value.trim();

  if(!name){

    $("name").focus();

    return;

  }

  $("start").style.display =
    "none";

  $("loading").style.display =
    "flex";

  init();

}


/* =========================================================
   INIT
========================================================= */

function init(){

  scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(
      0x91aeb2
    );

  scene.fog =
    new THREE.FogExp2(
      0x91aeb2,
      .0032
    );


  camera =
    new THREE.PerspectiveCamera(
      68,
      innerWidth / innerHeight,
      .1,
      900
    );


  renderer =
    new THREE.WebGLRenderer({
      antialias:true,
      powerPreference:"high-performance"
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
    1.12;


  renderer.shadowMap.enabled =
    true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  document.body.appendChild(
    renderer.domElement
  );


  clock =
    new THREE.Clock();


  setupLights();

  createSky();

  createWater();

  createTerrain();

  createRoads();

  createCity();

  createIndustrialZone();

  createVillage();

  createHill();

  createTrees();

  createLandmarks();

  createZone();

  createPlayer();

  createEnemies();

  createPickups();

  setupControls();


  setTimeout(
    finishLoading,
    600
  );

}


/* =========================================================
   LIGHTS
========================================================= */

function setupLights(){

  const hemi =
    new THREE.HemisphereLight(
      0xdff7ff,
      0x35402e,
      2.4
    );

  scene.add(
    hemi
  );


  const sun =
    new THREE.DirectionalLight(
      0xffe9c7,
      4
    );

  sun.position.set(
    -150,
    260,
    130
  );

  sun.castShadow =
    true;

  sun.shadow.mapSize.width =
    2048;

  sun.shadow.mapSize.height =
    2048;

  sun.shadow.camera.left =
    -180;

  sun.shadow.camera.right =
    180;

  sun.shadow.camera.top =
    180;

  sun.shadow.camera.bottom =
    -180;

  sun.shadow.camera.far =
    650;

  scene.add(
    sun
  );


  const fill =
    new THREE.DirectionalLight(
      0x83b9ff,
      .6
    );

  fill.position.set(
    160,
    100,
    -120
  );

  scene.add(
    fill
  );

}


/* =========================================================
   SKY
========================================================= */

function createSky(){

  const sky =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        600,
        32,
        16
      ),

      new THREE.MeshBasicMaterial({
        color:0x92b4bd,
        side:THREE.BackSide
      })

    );

  scene.add(
    sky
  );


  for(
    let i=0;
    i<12;
    i++
  ){

    const cloud =
      new THREE.Mesh(

        new THREE.SphereGeometry(
          10 + Math.random()*10,
          12,
          8
        ),

        new THREE.MeshStandardMaterial({
          color:0xffffff,
          transparent:true,
          opacity:.28
        })

      );

    cloud.position.set(
      -220 + Math.random()*440,
      90 + Math.random()*60,
      -220 + Math.random()*440
    );

    scene.add(
      cloud
    );

  }

}


/* =========================================================
   WATER
========================================================= */

function createWater(){

  const water =
    new THREE.Mesh(

      new THREE.PlaneGeometry(
        800,
        800
      ),

      new THREE.MeshStandardMaterial({
        color:0x1d6570,
        roughness:.2,
        metalness:.2
      })

    );

  water.rotation.x =
    -Math.PI/2;

  water.position.y =
    -3;

  scene.add(
    water
  );

}


/* =========================================================
   TERRAIN
========================================================= */

function terrainHeight(
  x,
  z
){

  const h1 =
    Math.sin(
      x*.035
    ) * 3;

  const h2 =
    Math.cos(
      z*.028
    ) * 3;

  const h3 =
    Math.sin(
      (x+z)*.018
    ) * 5;

  const hill =
    Math.max(
      0,
      1 -
      Math.hypot(
        x-75,
        z+55
      )/80
    ) * 14;

  return (
    h1 +
    h2 +
    h3 +
    hill
  );

}


/* =========================================================
   TERRAIN MESH
========================================================= */

function createTerrain(){

  const segments = 100;

  const geometry =
    new THREE.PlaneGeometry(
      mapSize,
      mapSize,
      segments,
      segments
    );


  geometry.rotateX(
    -Math.PI/2
  );


  const position =
    geometry.attributes.position;


  for(
    let i=0;
    i<position.count;
    i++
  ){

    const x =
      position.getX(i);

    const z =
      position.getZ(i);

    const edge =
      Math.max(
        Math.abs(x),
        Math.abs(z)
      );

    let y =
      terrainHeight(
        x,
        z
      );


    /*
     * Flatten center
     * for main city.
     */

    if(
      Math.abs(x)<65 &&
      Math.abs(z)<65
    ){

      y *= .25;

    }


    /*
     * Flatten edges.
     */

    if(
      edge > 108
    ){

      y =
        THREE.MathUtils.lerp(
          y,
          0,
          (edge-108)/22
        );

    }


    position.setY(
      i,
      y
    );

  }


  geometry.computeVertexNormals();


  const material =
    new THREE.MeshStandardMaterial({
      color:0x4e6d42,
      roughness:1
    });


  const terrain =
    new THREE.Mesh(
      geometry,
      material
    );


  terrain.receiveShadow =
    true;


  terrain.name =
    "GROUND";


  scene.add(
    terrain
  );

}


/* =========================================================
   GROUND HEIGHT
========================================================= */

function groundY(
  x,
  z
){

  let y =
    terrainHeight(
      x,
      z
    );


  if(
    Math.abs(x)<65 &&
    Math.abs(z)<65
  ){

    y *= .25;

  }


  if(
    Math.max(
      Math.abs(x),
      Math.abs(z)
    ) > 108
  ){

    const edge =
      Math.max(
        Math.abs(x),
        Math.abs(z)
      );

    y =
      THREE.MathUtils.lerp(
        y,
        0,
        Math.min(
          1,
          (edge-108)/22
        )
      );

  }


  return y;

}


/* =========================================================
   ROAD
========================================================= */

function createRoad(
  x,
  z,
  w,
  d,
  rotation=0
){

  const road =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        w,
        .22,
        d
      ),

      new THREE.MeshStandardMaterial({
        color:0x292f31,
        roughness:.9
      })

    );


  road.position.set(
    x,
    groundY(x,z)+.15,
    z
  );


  road.rotation.y =
    rotation;


  road.receiveShadow =
    true;


  scene.add(
    road
  );


  /*
   * road markings
   */

  const count =
    Math.floor(
      Math.max(w,d)/10
    );


  for(
    let i=0;
    i<count;
    i++
  ){

    const line =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          3.5,
          .06,
          .28
        ),

        new THREE.MeshBasicMaterial({
          color:0xe2c84c
        })

      );


    if(
      w>d
    ){

      line.position.set(
        x-w/2+8+i*10,
        groundY(x,z)+.3,
        z
      );

    }else{

      line.position.set(
        x,
        groundY(x,z)+.3,
        z-d/2+8+i*10
      );

      line.rotation.y =
        Math.PI/2;

    }


    line.rotation.y +=
      rotation;


    scene.add(
      line
    );

  }

}


/* =========================================================
   ROADS
========================================================= */

function createRoads(){

  createRoad(
    0,
    0,
    235,
    9
  );

  createRoad(
    0,
    0,
    9,
    235
  );

  createRoad(
    0,
    -45,
    150,
    8
  );

  createRoad(
    0,
    48,
    155,
    8
  );

  createRoad(
    -50,
    0,
    8,
    150
  );

  createRoad(
    55,
    0,
    8,
    150
  );

  createRoad(
    80,
    75,
    90,
    7,
    -.35
  );

}


/* =========================================================
   BUILDING
========================================================= */

function createBuilding(
  x,
  z,
  w,
  h,
  d,
  color,
  roof=true
){

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
        roughness:.78
      })

    );


  body.position.y =
    h/2;


  body.castShadow =
    true;

  body.receiveShadow =
    true;


  group.add(
    body
  );


  /*
   * windows
   */

  const windowMat =
    new THREE.MeshBasicMaterial({
      color:0x8ed3d5
    });


  const cols =
    Math.max(
      2,
      Math.floor(w/5)
    );


  const rows =
    Math.max(
      2,
      Math.floor(h/5)
    );


  for(
    let row=0;
    row<rows;
    row++
  ){

    for(
      let col=0;
      col<cols;
      col++
    ){

      const win =
        new THREE.Mesh(

          new THREE.BoxGeometry(
            1.8,
            1.7,
            .08
          ),

          windowMat

        );


      win.position.set(
        -w/2+3+col*5,
        3+row*5,
        d/2+.05
      );


      group.add(
        win
      );


      const win2 =
        win.clone();


      win2.position.z =
        -d/2-.05;


      group.add(
        win2
      );

    }

  }


  /*
   * roof
   */

  if(roof){

    const roofMesh =
      new THREE.Mesh(

        new THREE.ConeGeometry(
          Math.max(w,d)*.72,
          3,
          4
        ),

        new THREE.MeshStandardMaterial({
          color:0x303536,
          roughness:.9
        })

      );


    roofMesh.scale.z =
      d/w;


    roofMesh.position.y =
      h+1.5;


    roofMesh.rotation.y =
      Math.PI/4;


    roofMesh.castShadow =
      true;


    group.add(
      roofMesh
    );

  }


  group.position.set(
    x,
    groundY(x,z),
    z
  );


  scene.add(
    group
  );


  buildings.push(
    group
  );


  return group;

}


/* =========================================================
   CITY
========================================================= */

function createCity(){

  const positions = [

    [-48,-48],
    [-24,-50],
    [5,-48],
    [34,-48],

    [-50,-20],
    [-22,-20],
    [8,-20],
    [38,-20],

    [-48,18],
    [-20,18],
    [10,18],
    [40,18],

    [-48,48],
    [-20,48],
    [12,48],
    [42,48]

  ];


  positions.forEach(
    ([x,z],i)=>{

      const w =
        11 +
        Math.random()*8;

      const d =
        11 +
        Math.random()*8;

      const h =
        8 +
        Math.random()*16;


      createBuilding(
        x,
        z,
        w,
        h,
        d,
        [
          0x687175,
          0x596267,
          0x74736c,
          0x505a5d
        ][i%4]
      );

    }
  );


  /*
   * central tall building
   */

  createBuilding(
    0,
    0,
    20,
    30,
    20,
    0x3f494d,
    false
  );

}


/* =========================================================
   INDUSTRIAL ZONE
========================================================= */

function createIndustrialZone(){

  const baseX = 85;
  const baseZ = -45;


  /*
   * warehouses
   */

  for(
    let i=0;
    i<4;
    i++
  ){

    const warehouse =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          28,
          10,
          15
        ),

        new THREE.MeshStandardMaterial({
          color:0x555b5a,
          roughness:.9
        })

      );


    const x =
      baseX +
      (i%2)*34;


    const z =
      baseZ +
      Math.floor(i/2)*25;


    warehouse.position.set(
      x,
      groundY(x,z)+5,
      z
    );


    warehouse.castShadow =
      true;


    warehouse.receiveShadow =
      true;


    scene.add(
      warehouse
    );


    /*
     * warehouse roof
     */

    const roof =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          30,
          1,
          17
        ),

        new THREE.MeshStandardMaterial({
          color:0x282d2e
        })

      );


    roof.position.set(
      x,
      groundY(x,z)+10.5,
      z
    );


    scene.add(
      roof
    );

  }


  /*
   * containers
   */

  const colors = [
    0x8b3934,
    0x315e73,
    0x6a7135,
    0x85552d
  ];


  for(
    let i=0;
    i<18;
    i++
  ){

    const x =
      80 +
      Math.random()*65;


    const z =
      -20 +
      Math.random()*70;


    const container =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          8,
          3.5,
          3
        ),

        new THREE.MeshStandardMaterial({
          color:colors[i%4]
        })

      );


    container.position.set(
      x,
      groundY(x,z)+1.8,
      z
    );


    container.rotation.y =
      Math.random() >
      .5
        ? 0
        : Math.PI/2;


    container.castShadow =
      true;


    scene.add(
      container
    );

  }

}


/* =========================================================
   VILLAGE
========================================================= */

function createVillage(){

  for(
    let i=0;
    i<9;
    i++
  ){

    const x =
      -95 +
      Math.random()*45;


    const z =
      50 +
      Math.random()*55;


    createBuilding(
      x,
      z,
      9,
      5+Math.random()*3,
      9,
      0x9a8064
    );

  }

}


/* =========================================================
   HILL
========================================================= */

function createHill(){

  const hill =
    new THREE.Mesh(

      new THREE.ConeGeometry(
        35,
        30,
        32
      ),

      new THREE.MeshStandardMaterial({
        color:0x3e5c3c,
        roughness:1
      })

    );


  hill.position.set(
    75,
    groundY(75,-55)+15,
    -55
  );


  hill.castShadow =
    true;


  scene.add(
    hill
  );


  /*
   * radio tower
   */

  const tower =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        .7,
        1.2,
        32,
        8
      ),

      new THREE.MeshStandardMaterial({
        color:0x32393a,
        metalness:.7
      })

    );


  tower.position.set(
    75,
    groundY(75,-55)+32,
    -55
  );


  tower.castShadow =
    true;


  scene.add(
    tower
  );


  for(
    let i=0;
    i<3;
    i++
  ){

    const ring =
      new THREE.Mesh(

        new THREE.TorusGeometry(
          2.5+i,
          .2,
          8,
          20
        ),

        new THREE.MeshStandardMaterial({
          color:0x3b4243
        })

      );


    ring.rotation.x =
      Math.PI/2;


    ring.position.set(
      75,
      groundY(75,-55)+20+i*6,
      -55
    );


    scene.add(
      ring
    );

  }

}


/* =========================================================
   TREES
========================================================= */

function createTree(
  x,
  z,
  scale=1
){

  const tree =
    new THREE.Group();


  const trunk =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        .5,
        .8,
        4.5,
        8
      ),

      new THREE.MeshStandardMaterial({
        color:0x60432d
      })

    );


  trunk.position.y =
    2.25;


  tree.add(
    trunk
  );


  for(
    let i=0;
    i<3;
    i++
  ){

    const crown =
      new THREE.Mesh(

        new THREE.ConeGeometry(
          3.7-i*.6,
          5,
          8
        ),

        new THREE.MeshStandardMaterial({
          color:
            i===0
              ? 0x244b30
              : 0x32643a
        })

      );


    crown.position.y =
      5+i*3;


    crown.castShadow =
      true;


    tree.add(
      crown
    );

  }


  tree.position.set(
    x,
    groundY(x,z),
    z
  );


  tree.scale.setScalar(
    scale
  );


  scene.add(
    tree
  );


  trees.push(
    tree
  );

}


/* =========================================================
   FOREST
========================================================= */

function createTrees(){

  for(
    let i=0;
    i<95;
    i++
  ){

    const x =
      -120 +
      Math.random()*240;


    const z =
      -120 +
      Math.random()*240;


    /*
     * Keep central city
     * mostly clear.
     */

    if(
      Math.abs(x)<62 &&
      Math.abs(z)<62
    ){

      continue;

    }


    /*
     * Don't fill industrial zone.
     */

    if(
      x>65 &&
      z>-75 &&
      z<80
    ){

      continue;

    }


    createTree(
      x,
      z,
      .7+
      Math.random()*.8
    );

  }

}


/* =========================================================
   LANDMARKS
========================================================= */

function createLandmarks(){

  /*
   * Gas station
   */

  const canopy =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        26,
        1.2,
        15
      ),

      new THREE.MeshStandardMaterial({
        color:0xd8d8d0
      })

    );


  canopy.position.set(
    -78,
    groundY(-78,-25)+10,
    -25
  );


  scene.add(
    canopy
  );


  for(
    const x of [-87,-78,-69]
  ){

    const pole =
      new THREE.Mesh(

        new THREE.CylinderGeometry(
          .25,
          .25,
          9,
          8
        ),

        new THREE.MeshStandardMaterial({
          color:0x55595a
        })

      );


    pole.position.set(
      x,
      groundY(x,-25)+4.5,
      -25
    );


    scene.add(
      pole
    );

  }


  /*
   * Water tower
   */

  const tank =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        7,
        7,
        7,
        20
      ),

      new THREE.MeshStandardMaterial({
        color:0x667073,
        metalness:.35
      })

    );


  tank.position.set(
    -82,
    groundY(-82,72)+25,
    72
  );


  scene.add(
    tank
  );


  for(
    let i=0;
    i<4;
    i++
  ){

    const leg =
      new THREE.Mesh(

        new THREE.CylinderGeometry(
          .4,
          .4,
          20,
          8
        ),

        new THREE.MeshStandardMaterial({
          color:0x444a4b
        })

      );


    const a =
      i*Math.PI/2;


    leg.position.set(
      -82+
      Math.cos(a)*4,
      groundY(-82,72)+10,
      72+
      Math.sin(a)*4
    );


    scene.add(
      leg
    );

  }

}


/* =========================================================
   ZONE
========================================================= */

function createZone(){

  const geometry =
    new THREE.RingGeometry(
      .98,
      1,
      96
    );


  const material =
    new THREE.MeshBasicMaterial({
      color:0x42ff9b,
      transparent:true,
      opacity:.72,
      side:THREE.DoubleSide
    });


  zoneMesh =
    new THREE.Mesh(
      geometry,
      material
    );


  zoneMesh.rotation.x =
    -Math.PI/2;


  zoneMesh.position.y =
    1;


  scene.add(
    zoneMesh
  );

}


/* =========================================================
   PLAYER
========================================================= */

function createPlayer(){

  player =
    new THREE.Group();


  /*
   * SMALLER CHARACTER
   */

  const pants =
    new THREE.MeshStandardMaterial({
      color:0x171c20,
      roughness:.75
    });


  const left =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .72,
        2.3,
        .72
      ),
      pants
    );


  left.position.set(
    -.42,
    1.15,
    0
  );


  player.add(
    left
  );


  const right =
    left.clone();


  right.position.x =
    .42;


  player.add(
    right
  );


  const body =
    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        1.05,
        1.7,
        5,
        10
      ),

      new THREE.MeshStandardMaterial({
        color:0x26383c,
        roughness:.65
      })

    );


  body.position.y =
    3.35;


  body.castShadow =
    true;


  player.add(
    body
  );


  const vest =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        2.0,
        1.7,
        1.3
      ),

      new THREE.MeshStandardMaterial({
        color:0x3b4c51
      })

    );


  vest.position.y =
    3.4;


  player.add(
    vest
  );


  const head =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        .85,
        20,
        14
      ),

      new THREE.MeshStandardMaterial({
        color:0xd49a72
      })

    );


  head.position.y =
    5.75;


  head.castShadow =
    true;


  player.add(
    head
  );


  const hair =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        .9,
        18,
        10
      ),

      new THREE.MeshStandardMaterial({
        color:0x17191b
      })

    );


  hair.scale.y =
    .52;


  hair.position.y =
    6.4;


  player.add(
    hair
  );


  playerGun =
    createGun();


  playerGun.scale.setScalar(
    .7
  );


  playerGun.position.set(
    .9,
    3.5,
    -.95
  );


  playerGun.rotation.y =
    Math.PI;


  player.add(
    playerGun
  );


  player.position.set(
    0,
    groundY(0,0),
    82
  );


  scene.add(
    player
  );

}


/* =========================================================
   GUN
========================================================= */

function createGun(){

  const gun =
    new THREE.Group();


  const metal =
    new THREE.MeshStandardMaterial({
      color:0x101416,
      metalness:.75,
      roughness:.25
    });


  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .5,
        .45,
        2.5
      ),
      metal
    );


  gun.add(
    body
  );


  const barrel =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .08,
        .08,
        1.7,
        8
      ),
      metal
    );


  barrel.rotation.x =
    Math.PI/2;


  barrel.position.z =
    -1.9;


  gun.add(
    barrel
  );


  const stock =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .5,
        .55,
        .8
      ),
      metal
    );


  stock.position.z =
    1.25;


  gun.add(
    stock
  );


  return gun;

}


/* =========================================================
   ENEMIES
========================================================= */

function createEnemies(){

  /*
   * FAR SPAWN.
   *
   * Player starts at z=82.
   * Enemies start around outer ring.
   */

  const positions = [

    [-105,-100],
    [-60,-108],
    [0,-112],
    [58,-108],
    [108,-88],

    [112,-35],
    [112,30],
    [100,82],

    [50,110],
    [-20,110],
    [-75,102]

  ];


  positions.forEach(
    ([x,z],i)=>{

      createEnemy(
        x,
        z,
        i
      );

    }
  );

}


/* =========================================================
   ENEMY
========================================================= */

function createEnemy(
  x,
  z,
  index
){

  const enemy =
    new THREE.Group();


  enemy.scale.setScalar(
    .72
  );


  const dark =
    new THREE.MeshStandardMaterial({
      color:0x181c20
    });


  const red =
    new THREE.MeshStandardMaterial({
      color:0x732e30
    });


  const leg =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .72,
        2.3,
        .72
      ),
      dark
    );


  leg.position.set(
    -.42,
    1.15,
    0
  );


  enemy.add(
    leg
  );


  const leg2 =
    leg.clone();


  leg2.position.x =
    .42;


  enemy.add(
    leg2
  );


  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        1.05,
        1.7,
        5,
        10
      ),
      red
    );


  body.position.y =
    3.35;


  enemy.add(
    body
  );


  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .85,
        18,
        12
      ),
      new THREE.MeshStandardMaterial({
        color:0xc58d6d
      })
    );


  head.position.y =
    5.7;


  enemy.add(
    head
  );


  const gun =
    createGun();


  gun.scale.setScalar(
    .65
  );


  gun.position.set(
    .85,
    3.4,
    -.95
  );


  enemy.add(
    gun
  );


  enemy.position.set(
    x,
    groundY(x,z),
    z
  );


  enemy.userData = {

    health:100,

    alive:true,

    speed:
      2.5+
      Math.random()*1.3,

    attackTimer:
      1+
      Math.random()*2,

    seed:
      Math.random()*100

  };


  enemy.traverse(
    o=>{
      if(o.isMesh)
        o.castShadow=true;
    }
  );


  scene.add(
    enemy
  );


  enemies.push(
    enemy
  );

}


/* =========================================================
   PICKUPS
========================================================= */

function createPickups(){

  const spots = [

    [-72,30],
    [-28,70],
    [35,72],
    [78,35],
    [78,-75],
    [-72,-72]

  ];


  spots.forEach(
    ([x,z],i)=>{

      const type =
        i%2===0
          ? "ARMOR"
          : "MEDKIT";


      const color =
        type==="ARMOR"
          ? 0x2bb8ff
          : 0x42ff89;


      const item =
        new THREE.Mesh(

          new THREE.BoxGeometry(
            1.5,
            1.5,
            1.5
          ),

          new THREE.MeshStandardMaterial({
            color,
            emissive:color,
            emissiveIntensity:.35
          })

        );


      item.position.set(
        x,
        groundY(x,z)+1.2,
        z
      );


      item.userData.type =
        type;


      scene.add(
        item
      );


      pickups.push(
        item
      );

    }
  );

}


/* =========================================================
   CONTROLS
========================================================= */

function setupControls(){

  window.addEventListener(
    "keydown",
    e=>{

      keys[e.code]=true;


      if(e.code==="Digit1")
        switchWeapon(0);

      if(e.code==="Digit2")
        switchWeapon(1);

      if(e.code==="Digit3")
        switchWeapon(2);

      if(e.code==="KeyR")
        reload();

      if(e.code==="KeyV")
        cameraMode =
          cameraMode===3
            ? 1
            : 3;

      if(e.code==="KeyG")
        useMedkit();

      if(
        e.code==="Space" &&
        onGround
      ){

        jumpVelocity=
          9;

        onGround=false;

      }

    }
  );


  window.addEventListener(
    "keyup",
    e=>{
      keys[e.code]=false;
    }
  );


  /*
   * DESKTOP MOUSE AIM
   */

  document.addEventListener(
    "mousemove",
    e=>{

      if(
        document.pointerLockElement !==
        renderer.domElement
      )
        return;


      yaw -=
        e.movementX*.0024;


      pitch -=
        e.movementY*.002;


      pitch =
        THREE.MathUtils.clamp(
          pitch,
          -.85,
          .5
        );

    }
  );


  /*
   * DESKTOP FIRE
   */

  document.addEventListener(
    "mousedown",
    e=>{

      if(
        document.pointerLockElement !==
        renderer.domElement
      ){

        renderer.domElement
          .requestPointerLock?.();

        return;

      }


      if(e.button===0)
        shoot();

    }
  );


  renderer.domElement.addEventListener(
    "click",
    ()=>{
      renderer.domElement
        .requestPointerLock?.();
    }
  );


  setupMobileControls();


  window.addEventListener(
    "resize",
    resize
  );

}


/* =========================================================
   MOBILE JOYSTICKS
========================================================= */

function setupMobileControls(){

  setupJoystick(
    $("moveStick"),
    "move"
  );


  setupJoystick(
    $("aimStick"),
    "aim"
  );


  holdButton(
    $("sprint"),
    ()=>{
      mobileSprint=true;
    },
    ()=>{
      mobileSprint=false;
    }
  );


  holdButton(
    $("fire"),
    ()=>{
      mobileFiring=true;
    },
    ()=>{
      mobileFiring=false;
    }
  );


  $("jump").addEventListener(
    "pointerdown",
    e=>{
      e.preventDefault();

      if(onGround){

        jumpVelocity=9;

        onGround=false;

      }

    }
  );


  $("crouch").addEventListener(
    "pointerdown",
    e=>{
      e.preventDefault();

      crouching=true;

    }
  );


  $("crouch").addEventListener(
    "pointerup",
    ()=>{
      crouching=false;
    }
  );


  $("reload").addEventListener(
    "pointerdown",
    e=>{
      e.preventDefault();
      reload();
    }
  );


  $("weapon").addEventListener(
    "pointerdown",
    e=>{
      e.preventDefault();

      switchWeapon(
        (currentWeapon+1)
        %
        weapons.length
      );

    }
  );

}


/* =========================================================
   JOYSTICK
========================================================= */

function setupJoystick(
  element,
  type
){

  const stick =
    element.querySelector(
      ".stick"
    );


  let active=false;

  let pointerId=null;


  element.addEventListener(
    "pointerdown",
    e=>{

      e.preventDefault();

      active=true;

      pointerId=e.pointerId;

      element.setPointerCapture(
        pointerId
      );

      updateJoystick(
        e
      );

    }
  );


  element.addEventListener(
    "pointermove",
    e=>{

      if(!active)
        return;

      updateJoystick(
        e
      );

    }
  );


  element.addEventListener(
    "pointerup",
    reset
  );


  element.addEventListener(
    "pointercancel",
    reset
  );


  function updateJoystick(e){

    const rect =
      element.getBoundingClientRect();


    const cx =
      rect.left+
      rect.width/2;


    const cy =
      rect.top+
      rect.height/2;


    let dx =
      e.clientX-cx;


    let dy =
      e.clientY-cy;


    const max =
      rect.width*.34;


    const length =
      Math.hypot(
        dx,
        dy
      );


    if(length>max){

      dx =
        dx/length*max;

      dy =
        dy/length*max;

    }


    stick.style.transform =
      `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;


    const nx =
      dx/max;


    const ny =
      dy/max;


    if(type==="move"){

      mobileMoveX =
        nx;

      mobileMoveY =
        ny;

    }else{

      mobileAimX =
        nx;

      mobileAimY =
        ny;

    }

  }


  function reset(){

    active=false;

    pointerId=null;


    stick.style.transform =
      "translate(-50%,-50%)";


    if(type==="move"){

      mobileMoveX=0;
      mobileMoveY=0;

    }else{

      mobileAimX=0;
      mobileAimY=0;

    }

  }

}


/* =========================================================
   HOLD BUTTON
========================================================= */

function holdButton(
  button,
  down,
  up
){

  button.addEventListener(
    "pointerdown",
    e=>{
      e.preventDefault();
      down();
    }
  );


  button.addEventListener(
    "pointerup",
    e=>{
      e.preventDefault();
      up();
    }
  );


  button.addEventListener(
    "pointercancel",
    up
  );

}


/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer(dt){

  if(!player)
    return;


  let forward=0;

  let side=0;


  /*
   * KEYBOARD
   */

  if(
    keys["KeyW"] ||
    keys["ArrowUp"]
  )
    forward+=1;


  if(
    keys["KeyS"] ||
    keys["ArrowDown"]
  )
    forward-=1;


  if(
    keys["KeyA"] ||
    keys["ArrowLeft"]
  )
    side-=1;


  if(
    keys["KeyD"] ||
    keys["ArrowRight"]
  )
    side+=1;


  /*
   * MOBILE JOYSTICK
   */

  if(
    Math.abs(mobileMoveY)>.05 ||
    Math.abs(mobileMoveX)>.05
  ){

    forward =
      -mobileMoveY;

    side =
      mobileMoveX;

  }


  const length =
    Math.hypot(
      forward,
      side
    );


  /*
   * CROUCH
   */

  crouching =
    crouching ||
    keys["KeyC"] ||
    keys["ControlLeft"];


  /*
   * SPRINT
   */

  const sprint =
    mobileSprint ||
    keys["ShiftLeft"] ||
    keys["ShiftRight"];


  if(length>.01){

    forward/=length;

    side/=length;


    let speed =
      sprint
        ? 14
        : 8;


    if(crouching)
      speed*=.55;


    const sin =
      Math.sin(yaw);

    const cos =
      Math.cos(yaw);


    player.position.x +=
      (
        side*cos+
        forward*sin
      )
      *
      speed*
      dt;


    player.position.z +=
      (
        side*sin-
        forward*cos
      )
      *
      speed*
      dt;


    player.rotation.y =
      yaw;

  }


  /*
   * MOBILE AIM
   */

  if(
    Math.abs(mobileAimX)>.04 ||
    Math.abs(mobileAimY)>.04
  ){

    yaw -=
      mobileAimX*
      .045;


    pitch -=
      mobileAimY*
      .035;


    pitch =
      THREE.MathUtils.clamp(
        pitch,
        -.85,
        .5
      );

  }


  /*
   * JUMP
   */

  if(!onGround){

    jumpVelocity -=
      24*dt;


    player.position.y +=
      jumpVelocity*dt;


    if(
      player.position.y <=
      groundY(
        player.position.x,
        player.position.z
      )
    ){

      player.position.y =
        groundY(
          player.position.x,
          player.position.z
        );


      jumpVelocity=0;

      onGround=true;

    }

  }else{

    player.position.y =
      groundY(
        player.position.x,
        player.position.z
      );

  }


  /*
   * BOUNDARY
   */

  const limit =
    122;


  player.position.x =
    THREE.MathUtils.clamp(
      player.position.x,
      -limit,
      limit
    );


  player.position.z =
    THREE.MathUtils.clamp(
      player.position.z,
      -limit,
      limit
    );


  /*
   * MOBILE FIRE
   */

  if(
    mobileFiring
  ){

    shoot();

  }

}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera(){

  if(!player)
    return;


  if(cameraMode===1){

    const head =
      new THREE.Vector3(
        0,
        5.7,
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
   * Smaller third-person
   * camera because character
   * is now smaller.
   */

  const distance =
    crouching
      ? 5
      : 6;


  const height =
    crouching
      ? 5
      : 6.2;


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
    new THREE.Vector3(1,0,0),
    pitch
  );


  offset.applyAxisAngle(
    new THREE.Vector3(0,1,0),
    yaw
  );


  const desired =
    target.clone()
      .add(offset);


  camera.position.lerp(
    desired,
    .18
  );


  camera.lookAt(
    target
  );

}


/* =========================================================
   SHOOT
========================================================= */

function shoot(){

  if(
    !running ||
    reloading
  )
    return;


  const weapon =
    weapons[
      currentWeapon
    ];


  const now =
    performance.now();


  if(
    now-lastShot <
    weapon.fireRate
  )
    return;


  if(
    weapon.ammo<=0
  ){

    reload();

    return;

  }


  lastShot =
    now;


  weapon.ammo--;


  for(
    let i=0;
    i<weapon.pellets;
    i++
  ){

    fireRay(
      weapon
    );

  }


  muzzleFlash();

  updateHUD();

}


/* =========================================================
   RAY
========================================================= */

function fireRay(
  weapon
){

  const ray =
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
    (Math.random()-.5)*
    weapon.spread;


  direction.y +=
    (Math.random()-.5)*
    weapon.spread;


  direction.normalize();


  ray.set(
    origin,
    direction
  );


  const targets=[];


  enemies.forEach(
    enemy=>{

      if(
        !enemy.userData.alive
      )
        return;


      enemy.traverse(
        o=>{

          if(o.isMesh)
            targets.push(o);

        }
      );

    }
  );


  const hits =
    ray.intersectObjects(
      targets,
      false
    );


  if(!hits.length)
    return;


  let object =
    hits[0].object;


  let enemy=null;


  while(
    object &&
    object!==scene
  ){

    if(
      object.userData &&
      object.userData.alive !==
      undefined
    ){

      enemy=object;

      break;

    }


    object =
      object.parent;

  }


  if(enemy){

    enemy.userData.health -=
      weapon.damage;


    if(
      enemy.userData.health<=0
    ){

      enemy.userData.alive=
        false;

      enemy.visible=
        false;

      kills++;

      aliveCount--;

      updateHUD();


      if(
        aliveCount<=1
      )
        finishGame(true);

    }

  }

}


/* =========================================================
   MUZZLE
========================================================= */

function muzzleFlash(){

  const flash =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        .2,
        8,
        8
      ),

      new THREE.MeshBasicMaterial({
        color:0xffc94d
      })

    );


  const p =
    new THREE.Vector3(
      0,
      0,
      -3
    );


  playerGun.localToWorld(
    p
  );


  flash.position.copy(
    p
  );


  scene.add(
    flash
  );


  setTimeout(
    ()=>{
      scene.remove(
        flash
      );
    },
    40
  );

}


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemies(dt){

  enemies.forEach(
    enemy=>{

      if(
        !enemy.userData.alive
      )
        return;


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


      /*
       * Enemies only engage
       * when close enough.
       *
       * They spawn far away.
       */

      if(
        distance<80
      ){

        const angle =
          Math.atan2(
            dx,
            -dz
          );


        enemy.rotation.y =
          angle;


        if(
          distance>15
        ){

          enemy.position.x +=
            Math.sin(angle)*
            enemy.userData.speed*
            dt;


          enemy.position.z +=
            -Math.cos(angle)*
            enemy.userData.speed*
            dt;

        }


        enemy.userData.attackTimer -=
          dt;


        if(
          distance<30 &&
          enemy.userData.attackTimer<=0
        ){

          enemy.userData.attackTimer =
            .7+
            Math.random()*.8;


          enemyShoot(
            enemy
          );

        }

      }else{

        /*
         * Patrol far away.
         */

        const t =
          performance.now()*
          .0002+
          enemy.userData.seed;


        enemy.position.x +=
          Math.sin(t)*
          dt*.5;


        enemy.position.z +=
          Math.cos(t)*
          dt*.5;

      }


      enemy.position.x =
        THREE.MathUtils.clamp(
          enemy.position.x,
          -120,
          120
        );


      enemy.position.z =
        THREE.MathUtils.clamp(
          enemy.position.z,
          -120,
          120
        );


      enemy.position.y =
        groundY(
          enemy.position.x,
          enemy.position.z
        );

    }
  );

}


/* =========================================================
   ENEMY SHOOT
========================================================= */

function enemyShoot(enemy){

  if(
    Math.random()>.4
  )
    return;


  const damage =
    7+
    Math.random()*7;


  damagePlayer(
    damage
  );

}


/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(
  damage
){

  if(!running)
    return;


  const armorDamage =
    Math.min(
      armor,
      damage*.6
    );


  armor -=
    armorDamage;


  health -=
    damage-
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


  $("damage").style.opacity=
    ".75";


  setTimeout(
    ()=>{
      $("damage").style.opacity=
        "0";
    },
    120
  );


  updateHUD();


  if(
    health<=0
  )
    finishGame(false);

}


/* =========================================================
   PICKUPS UPDATE
========================================================= */

function updatePickups(dt){

  pickups.forEach(
    item=>{

      if(!item.visible)
        return;


      item.rotation.y +=
        dt*1.6;


      const baseY =
        groundY(
          item.position.x,
          item.position.z
        )+
        1.2;


      item.position.y =
        baseY+
        Math.sin(
          performance.now()*.003
        )*.35;


      if(
        item.position.distanceTo(
          player.position
        )<4
      ){

        if(
          item.userData.type===
          "ARMOR"
        ){

          armor =
            Math.min(
              100,
              armor+35
            );

        }else{

          medkits++;

        }


        item.visible=false;

        updateHUD();

      }

    }
  );

}


/* =========================================================
   ZONE
========================================================= */

function updateZone(dt){

  zoneRadius =
    Math.max(
      25,
      zoneRadius-
      .15*dt
    );


  zoneMesh.scale.set(
    zoneRadius,
    zoneRadius,
    zoneRadius
  );


  const distance =
    Math.hypot(
      player.position.x,
      player.position.z
    );


  if(
    distance>zoneRadius
  ){

    damagePlayer(
      2.5*dt
    );

  }


  $("zone").textContent =
    Math.round(
      zoneRadius
    )+
    "m";

}


/* =========================================================
   HUD
========================================================= */

function updateHUD(){

  const weapon =
    weapons[
      currentWeapon
    ];


  $("health").textContent =
    Math.ceil(
      health
    );


  $("armor").textContent =
    Math.ceil(
      armor
    );


  $("ammo").textContent =
    weapon.ammo+
    " / "+
    weapon.reserve;


  $("weaponName").textContent =
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
    )+
    "m";

}


/* =========================================================
   WEAPON
========================================================= */

function switchWeapon(
  index
){

  currentWeapon =
    index;


  reloading=false;

  updateHUD();

}


/* =========================================================
   RELOAD
========================================================= */

function reload(){

  if(reloading)
    return;


  const weapon =
    weapons[
      currentWeapon
    ];


  if(
    weapon.ammo>=
    weapon.mag
  )
    return;


  if(
    weapon.reserve<=0
  )
    return;


  reloading=true;


  setTimeout(
    ()=>{

      const needed =
        weapon.mag-
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


      reloading=false;

      updateHUD();

    },
    1300
  );

}


/* =========================================================
   MEDKIT
========================================================= */

function useMedkit(){

  if(
    medkits<=0 ||
    health>=100
  )
    return;


  medkits--;


  health =
    Math.min(
      100,
      health+45
    );


  updateHUD();

}


/* =========================================================
   LOADING
========================================================= */

function finishLoading(){

  $("progress").style.width=
    "100%";


  $("loadText").textContent=
    "DISTRICT READY";


  setTimeout(
    ()=>{

      $("loading").style.display=
        "none";


      $("hud").style.display=
        "block";


      running=true;


      clock.start();


      updateHUD();


      renderer.domElement
        .requestPointerLock?.();


      requestAnimationFrame(
        gameLoop
      );

    },
    300
  );

}


/* =========================================================
   LOOP
========================================================= */

function gameLoop(){

  if(!running)
    return;


  requestAnimationFrame(
    gameLoop
  );


  const dt =
    Math.min(
      clock.getDelta(),
      .05
    );


  updatePlayer(dt);

  updateEnemies(dt);

  updatePickups(dt);

  updateZone(dt);

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
){

  if(!running)
    return;


  running=false;


  document.exitPointerLock?.();


  $("result").style.display=
    "flex";


  $("resultTitle").textContent=
    won
      ? "BOOYAH!"
      : "ELIMINATED";


  $("resultText").textContent=
    won
      ? `${kills} KILLS • LAST ALIVE`
      : `${kills} KILLS • DISTRICT LOST`;

}


/* =========================================================
   RESIZE
========================================================= */

function resize(){

  camera.aspect =
    innerWidth/
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

$("enter").addEventListener(
  "click",
  startGame
);


$("again").addEventListener(
  "click",
  ()=>{
    location.reload();
  }
);


$("name").addEventListener(
  "keydown",
  e=>{
    if(e.key==="Enter")
      startGame();
  }
);
