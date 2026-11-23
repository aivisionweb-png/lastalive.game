(() => {
  "use strict";

  let scene;
  let camera;
  let renderer;
  let clock;

  let player;
  let gun;
  let muzzle;

  let running = false;
  let firstPerson = false;
  let crouched = false;
  let jumping = false;

  let yaw = 0;
  let pitch = -0.08;
  let velY = 0;

  let hp = 100;
  let armor = 65;

  let mag = 30;
  let reserve = 120;

  let lastShot = 0;
  let reloading = false;

  let zoneRadius = 115;
  let zoneTarget = 115;
  let zoneTimer = 0;

  let medkits = 2;

  const keys = {};
  const bots = [];
  const obstacles = [];

  const raycaster = new THREE.Raycaster();

  const weapons = {
    ar: {
      name: "ASSAULT RIFLE",
      mag: 30,
      reserve: 120,
      rate: 105,
      damage: 25,
      spread: 0.014,
      pellets: 1,
      range: 150
    },

    smg: {
      name: "SMG",
      mag: 40,
      reserve: 160,
      rate: 65,
      damage: 16,
      spread: 0.028,
      pellets: 1,
      range: 110
    },

    shotgun: {
      name: "SHOTGUN",
      mag: 8,
      reserve: 48,
      rate: 650,
      damage: 14,
      spread: 0.13,
      pellets: 8,
      range: 65
    }
  };

  let currentWeapon = "ar";

  // =========================================================
  // MATERIAL
  // =========================================================

  function material(color, roughness = 0.8, metalness = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness
    });
  }

  // =========================================================
  // BUILD BOX
  // =========================================================

  function createBox(
    width,
    height,
    depth,
    color,
    x,
    y,
    z,
    rotation = 0
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth
      ),
      material(color)
    );

    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;

    scene.add(mesh);
    obstacles.push(mesh);

    return mesh;
  }

  // =========================================================
  // CITY
  // =========================================================

  function buildCity() {

    const world = new THREE.Group();

    scene.add(world);

    // Ground

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(320, 320),
      material(0x0d1713, 0.98)
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;

    world.add(ground);

    // Roads

    for (let i = -2; i <= 2; i++) {

      const road = new THREE.Mesh(
        new THREE.BoxGeometry(
          22,
          0.06,
          320
        ),
        material(0x18211f, 0.95)
      );

      road.position.set(
        i * 48,
        0.01,
        0
      );

      world.add(road);
    }

    for (let i = -2; i <= 2; i++) {

      const road = new THREE.Mesh(
        new THREE.BoxGeometry(
          320,
          0.06,
          22
        ),
        material(0x18211f, 0.95)
      );

      road.position.set(
        0,
        0.012,
        i * 48
      );

      world.add(road);
    }

    // Road markings

    for (let i = -2; i <= 2; i++) {

      for (
        let z = -140;
        z < 140;
        z += 10
      ) {

        const line = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.35,
            0.08,
            5
          ),
          material(0x7f8c84, 0.8)
        );

        line.position.set(
          i * 48,
          0.05,
          z
        );

        world.add(line);
      }
    }

    for (let i = -2; i <= 2; i++) {

      for (
        let x = -140;
        x < 140;
        x += 10
      ) {

        const line = new THREE.Mesh(
          new THREE.BoxGeometry(
            5,
            0.08,
            0.35
          ),
          material(0x7f8c84, 0.8)
        );

        line.position.set(
          x,
          0.05,
          i * 48
        );

        world.add(line);
      }
    }

    // Buildings

    const buildingColors = [
      0x17221e,
      0x202b27,
      0x26332e,
      0x1b2924,
      0x303a35
    ];

    for (let gx = -2; gx <= 2; gx++) {

      for (let gz = -2; gz <= 2; gz++) {

        if (Math.random() < 0.12) {
          continue;
        }

        const x =
          gx * 48 +
          (Math.random() - 0.5) * 13;

        const z =
          gz * 48 +
          (Math.random() - 0.5) * 13;

        const width =
          22 +
          Math.random() * 13;

        const depth =
          20 +
          Math.random() * 14;

        const height =
          10 +
          Math.random() * 22;

        createBox(
          width,
          height,
          depth,
          buildingColors[
            Math.floor(
              Math.random() *
              buildingColors.length
            )
          ],
          x,
          height / 2,
          z,
          Math.random() < 0.5
            ? 0
            : Math.PI / 2
        );

        // Roof

        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(
            width + 1,
            0.5,
            depth + 1
          ),
          material(0x0b1210, 0.8)
        );

        roof.position.set(
          x,
          height + 0.25,
          z
        );

        scene.add(roof);

        // Windows

        for (
          let side = -1;
          side <= 1;
          side += 2
        ) {

          for (
            let yy = 4;
            yy < height - 1;
            yy += 4
          ) {

            for (
              let xx = -width / 2 + 3;
              xx < width / 2 - 1;
              xx += 5
            ) {

              const windowMesh =
                new THREE.Mesh(
                  new THREE.BoxGeometry(
                    0.7,
                    0.9,
                    0.08
                  ),
                  material(
                    0x72d8ad,
                    0.3,
                    0.2
                  )
                );

              windowMesh.position.set(
                x + xx,
                yy,
                z +
                side *
                (depth / 2 + 0.06)
              );

              scene.add(windowMesh);
            }
          }
        }
      }
    }

    // Central park

    const park = new THREE.Mesh(
      new THREE.CircleGeometry(
        25,
        48
      ),
      material(
        0x183522,
        0.95
      )
    );

    park.position.set(
      0,
      0.04,
      0
    );

    park.rotation.x = -Math.PI / 2;

    scene.add(park);

    for (let i = 0; i < 24; i++) {

      const angle =
        Math.random() *
        Math.PI *
        2;

      const radius =
        5 +
        Math.random() * 18;

      const tree = createTree();

      tree.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );

      scene.add(tree);
    }

    // Perimeter lamps

    for (
      let x = -135;
      x <= 135;
      x += 18
    ) {

      createLamp(x, -135);
      createLamp(x, 135);
    }

    for (
      let z = -117;
      z <= 117;
      z += 18
    ) {

      createLamp(-135, z);
      createLamp(135, z);
    }
  }

  // =========================================================
  // TREE
  // =========================================================

  function createTree() {

    const group =
      new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.35,
        0.5,
        3,
        8
      ),
      material(0x4b3624)
    );

    trunk.position.y = 1.5;

    group.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(
        2.5,
        10,
        8
      ),
      material(0x23613c)
    );

    crown.position.y = 4.1;

    group.add(crown);

    return group;
  }

  // =========================================================
  // STREET LAMP
  // =========================================================

  function createLamp(x, z) {

    const group =
      new THREE.Group();

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.08,
        0.12,
        5,
        8
      ),
      material(
        0x3e4a45,
        0.5,
        0.4
      )
    );

    pole.position.y = 2.5;

    group.add(pole);

    const light = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.25,
        8,
        8
      ),
      new THREE.MeshBasicMaterial({
        color: 0x9dffd0
      })
    );

    light.position.y = 5;

    group.add(light);

    group.position.set(
      x,
      0,
      z
    );

    scene.add(group);
  }

  // =========================================================
  // PLAYER
  // =========================================================

  function createPlayer() {

    const group =
      new THREE.Group();

    group.name = "PLAYER";

    // Shadow

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(
        1.15,
        20
      ),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.35
      })
    );

    shadow.rotation.x =
      -Math.PI / 2;

    shadow.position.y = 0.03;

    group.add(shadow);

    // Body

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.48,
        1.15,
        6,
        12
      ),
      material(
        0x18251f,
        0.55,
        0.1
      )
    );

    body.position.y = 1.25;

    group.add(body);

    // Jacket

    const jacket = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.95,
        1.1,
        0.55
      ),
      material(
        0x273a32,
        0.7,
        0.1
      )
    );

    jacket.position.y = 1.25;

    group.add(jacket);

    // Head

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.34,
        16,
        12
      ),
      material(0xd69c79)
    );

    head.position.y = 2.25;

    group.add(head);

    // Helmet

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.38,
        16,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      material(
        0x111916,
        0.35,
        0.25
      )
    );

    helmet.position.y = 2.4;

    group.add(helmet);

    // Legs

    const legMaterial =
      material(0x101614);

    for (
      const x of [-0.22, 0.22]
    ) {

      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.16,
          0.9,
          5,
          8
        ),
        legMaterial
      );

      leg.position.set(
        x,
        0.55,
        0
      );

      group.add(leg);
    }

    // Gun

    gun = new THREE.Group();

    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.13,
        0.13,
        1.45
      ),
      material(
        0x111414,
        0.25,
        0.65
      )
    );

    barrel.position.z = -0.72;

    gun.add(barrel);

    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.25,
        0.22,
        0.55
      ),
      material(
        0x252a28,
        0.6
      )
    );

    stock.position.z = 0.35;

    gun.add(stock);

    gun.position.set(
      0.48,
      1.35,
      -0.55
    );

    gun.rotation.x = -0.08;

    group.add(gun);

    muzzle =
      new THREE.Object3D();

    muzzle.position.set(
      0,
      0,
      -1.45
    );

    gun.add(muzzle);

    scene.add(group);

    return group;
  }

  // =========================================================
  // BOT
  // =========================================================

  function createBot(number) {

    const group =
      new THREE.Group();

    group.userData = {

      alive: true,

      hp: 100,

      name:
        "BOT " +
        String(number).padStart(
          2,
          "0"
        ),

      cooldown:
        Math.random() * 800,

      strafe:
        Math.random() > 0.5
          ? 1
          : -1
    };

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.44,
        1.05,
        6,
        10
      ),
      material(
        number % 2
          ? 0x6d2f2f
          : 0x31516b,
        0.75
      )
    );

    body.position.y = 1.18;

    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.32,
        14,
        10
      ),
      material(0xc38b6b)
    );

    head.position.y = 2.1;

    group.add(head);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.36,
        14,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      material(
        0x141817,
        0.35,
        0.2
      )
    );

    helmet.position.y = 2.25;

    group.add(helmet);

    const weapon = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.12,
        0.12,
        1.25
      ),
      material(
        0x151817,
        0.25,
        0.5
      )
    );

    weapon.position.set(
      0.43,
      1.25,
      -0.6
    );

    group.add(weapon);

    group.position.set(
      (Math.random() - 0.5) * 220,
      0,
      (Math.random() - 0.5) * 220
    );

    if (
      group.position.length() < 35
    ) {
      group.position.x += 55;
    }

    scene.add(group);

    bots.push(group);

    return group;
  }

  // =========================================================
  // INITIALIZE
  // =========================================================

  function setup() {

    scene =
      new THREE.Scene();

    scene.background =
      new THREE.Color(
        0x07100d
      );

    scene.fog =
      new THREE.Fog(
        0x07100d,
        55,
        250
      );

    camera =
      new THREE.PerspectiveCamera(
        70,
        innerWidth / innerHeight,
        0.05,
        500
      );

    renderer =
      new THREE.WebGLRenderer({
        antialias: true
      });

    renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        1.8
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

    document
      .getElementById("game")
      .appendChild(
        renderer.domElement
      );

    clock =
      new THREE.Clock();

    // Lighting

    const hemisphere =
      new THREE.HemisphereLight(
        0xbfe8d2,
        0x101713,
        2.2
      );

    scene.add(hemisphere);

    const sun =
      new THREE.DirectionalLight(
        0xb8ffd7,
        3.2
      );

    sun.position.set(
      50,
      100,
      30
    );

    sun.castShadow = true;

    scene.add(sun);

    // Map

    buildCity();

    // Player

    player =
      createPlayer();

    player.position.set(
      0,
      0,
      70
    );

    // Bots

    for (
      let i = 1;
      i <= 11;
      i++
    ) {

      createBot(i);

    }

    // Zone

    const zone =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          zoneRadius,
          zoneRadius,
          0.08,
          96
        ),
        new THREE.MeshBasicMaterial({
          color: 0x4ff59c,
          transparent: true,
          opacity: 0.055,
          side: THREE.DoubleSide
        })
      );

    zone.position.y = 0.08;

    zone.name = "ZONE";

    scene.add(zone);

    const ring =
      new THREE.Mesh(
        new THREE.RingGeometry(
          zoneRadius - 0.25,
          zoneRadius + 0.25,
          96
        ),
        new THREE.MeshBasicMaterial({
          color: 0x66ffb0,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide
        })
      );

    ring.rotation.x =
      -Math.PI / 2;

    ring.position.y = 0.12;

    ring.name =
      "ZONE_RING";

    scene.add(ring);

    bindControls();

    updateHUD();

    resize();

    animate();
  }

  // =========================================================
  // CONTROLS
  // =========================================================

  function bindControls() {

    window.addEventListener(
      "resize",
      resize
    );

    // -------------------------------------------------------
    // FIXED PLAY BUTTON
    // -------------------------------------------------------

    const playButton =
      document.getElementById(
        "play"
      );

    if (playButton) {

      playButton.addEventListener(
        "click",
        function (event) {

          event.preventDefault();
          event.stopPropagation();

          startGame();

        }
      );

    }

    // -------------------------------------------------------
    // CLICK GAME TO LOCK MOUSE
    // -------------------------------------------------------

    renderer.domElement.addEventListener(
      "click",
      function () {

        if (
          running &&
          document.pointerLockElement !==
          renderer.domElement
        ) {

          renderer.domElement
            .requestPointerLock();

        }

      }
    );

    // -------------------------------------------------------
    // MOUSE AIM
    // -------------------------------------------------------

    document.addEventListener(
      "mousemove",
      function (event) {

        if (!running) {
          return;
        }

        if (
          document.pointerLockElement !==
          renderer.domElement
        ) {
          return;
        }

        yaw -=
          event.movementX *
          0.0025;

        pitch -=
          event.movementY *
          0.002;

        pitch =
          Math.max(
            -1.25,
            Math.min(
              0.7,
              pitch
            )
          );

      }
    );

    // -------------------------------------------------------
    // SHOOT
    // -------------------------------------------------------

    document.addEventListener(
      "mousedown",
      function (event) {

        if (
          event.button === 0 &&
          running
        ) {

          shoot();

        }

      }
    );

    // -------------------------------------------------------
    // KEYBOARD
    // -------------------------------------------------------

    document.addEventListener(
      "keydown",
      function (event) {

        keys[event.code] = true;

        // FIRST / THIRD PERSON

        if (
          event.code === "KeyV"
        ) {

          firstPerson =
            !firstPerson;

          const mode =
            document.getElementById(
              "mode"
            );

          if (mode) {

            mode.textContent =
              firstPerson
                ? "FIRST PERSON"
                : "THIRD PERSON";

          }

          updateCamera();

        }

        // CROUCH

        if (
          event.code === "KeyC"
        ) {

          crouched =
            !crouched;

        }

        // RELOAD

        if (
          event.code === "KeyR"
        ) {

          reload();

        }

        // MEDKIT

        if (
          event.code === "KeyG"
        ) {

          useMedkit();

        }

        // WEAPONS

        if (
          event.code === "Digit1"
        ) {

          switchWeapon("ar");

        }

        if (
          event.code === "Digit2"
        ) {

          switchWeapon("smg");

        }

        if (
          event.code === "Digit3"
        ) {

          switchWeapon("shotgun");

        }

        // JUMP

        if (
          event.code === "Space" &&
          player.position.y <= 0.05 &&
          !crouched
        ) {

          velY = 8.5;

          jumping = true;

        }

      }
    );

    document.addEventListener(
      "keyup",
      function (event) {

        keys[event.code] = false;

      }
    );
  }

  // =========================================================
  // START GAME
  // =========================================================

  function startGame() {

    if (running) {
      return;
    }

    running = true;

    hp = 100;
    armor = 65;

    mag = weapons[currentWeapon].mag;
    reserve =
      weapons[currentWeapon].reserve;

    document
      .getElementById("menu")
      .style.display = "none";

    updateHUD();

    toast(
      "DROP COMPLETE — SURVIVE"
    );

    setTimeout(
      function () {

        if (
          running &&
          renderer &&
          renderer.domElement
        ) {

          renderer.domElement
            .requestPointerLock();

        }

      },
      150
    );
  }

  // =========================================================
  // RESIZE
  // =========================================================

  function resize() {

    if (!camera || !renderer) {
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

  // =========================================================
  // SWITCH WEAPON
  // =========================================================

  function switchWeapon(
    weaponName
  ) {

    currentWeapon =
      weaponName;

    mag =
      Math.min(
        weapons[
          weaponName
        ].mag,
        mag
      );

    updateHUD();

    toast(
      weapons[
        weaponName
      ].name
    );
  }

  // =========================================================
  // RELOAD
  // =========================================================

  function reload() {

    if (
      reloading ||
      mag >=
        weapons[
          currentWeapon
        ].mag ||
      reserve <= 0
    ) {
      return;
    }

    reloading = true;

    toast(
      "RELOADING..."
    );

    setTimeout(
      function () {

        const needed =
          weapons[
            currentWeapon
          ].mag -
          mag;

        const amount =
          Math.min(
            needed,
            reserve
          );

        mag += amount;

        reserve -= amount;

        reloading = false;

        updateHUD();

      },
      700
    );
  }

  // =========================================================
  // MEDKIT
  // =========================================================

  function useMedkit() {

    if (
      medkits <= 0 ||
      hp >= 100
    ) {
      return;
    }

    medkits--;

    hp =
      Math.min(
        100,
        hp + 45
      );

    toast(
      "MEDKIT +45"
    );

    updateHUD();
  }

  // =========================================================
  // SHOOT
  // =========================================================

  function shoot() {

    if (
      !running ||
      reloading
    ) {
      return;
    }

    const weapon =
      weapons[
        currentWeapon
      ];

    const now =
      performance.now();

    if (
      now - lastShot <
      weapon.rate
    ) {
      return;
    }

    lastShot = now;

    if (mag <= 0) {

      reload();

      return;
    }

    mag--;

    updateHUD();

    // Muzzle flash

    const flash =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.13,
          8,
          8
        ),
        new THREE.MeshBasicMaterial({
          color: 0xffdf77
        })
      );

    muzzle.add(flash);

    setTimeout(
      function () {

        muzzle.remove(
          flash
        );

      },
      45
    );

    // Pellets

    for (
      let i = 0;
      i < weapon.pellets;
      i++
    ) {

      raycaster.setFromCamera(
        new THREE.Vector2(
          (
            Math.random() -
            0.5
          ) *
          weapon.spread,

          (
            Math.random() -
            0.5
          ) *
          weapon.spread
        ),
        camera
      );

      const targets =
        bots.filter(
          bot =>
            bot.userData.alive
        );

      const hits =
        raycaster.intersectObjects(
          targets,
          true
        );

      let end =
        raycaster.ray.origin
          .clone()
          .add(
            raycaster.ray.direction
              .clone()
              .multiplyScalar(
                weapon.range
              )
          );

      if (hits.length > 0) {

        const hit =
          hits[0];

        end.copy(
          hit.point
        );

        let bot =
          hit.object;

        while (
          bot.parent &&
          !bot.userData.alive
        ) {

          bot =
            bot.parent;
        }

        if (
          bot.userData &&
          bot.userData.alive
        ) {

          bot.userData.hp -=
            weapon.damage;

          if (
            bot.userData.hp <=
            0
          ) {

            killBot(bot);

          }

        }
      }

      createTracer(end);
    }

    if (mag === 0) {

      setTimeout(
        reload,
        150
      );

    }
  }

  // =========================================================
  // BULLET TRACER
  // =========================================================

  function createTracer(
    end
  ) {

    const start =
      new THREE.Vector3();

    muzzle.getWorldPosition(
      start
    );

    const direction =
      end.clone().sub(
        start
      );

    const length =
      direction.length();

    const tracer =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.015,
          0.015,
          length,
          5
        ),
        new THREE.MeshBasicMaterial({
          color: 0x9effc6,
          transparent: true,
          opacity: 0.75
        })
      );

    tracer.position
      .copy(start)
      .add(end)
      .multiplyScalar(
        0.5
      );

    tracer.quaternion.setFromUnitVectors(
      new THREE.Vector3(
        0,
        1,
        0
      ),
      direction.normalize()
    );

    scene.add(tracer);

    setTimeout(
      function () {

        scene.remove(
          tracer
        );

      },
      55
    );
  }

  // =========================================================
  // BOT KILL
  // =========================================================

  function killBot(bot) {

    if (
      !bot.userData.alive
    ) {
      return;
    }

    bot.userData.alive =
      false;

    bot.visible = false;

    addKill(
      "YOU",
      bot.userData.name
    );

    toast(
      "ELIMINATED " +
      bot.userData.name
    );

    const aliveBots =
      bots.filter(
        bot =>
          bot.userData.alive
      ).length;

    document
      .getElementById(
        "alive"
      )
      .textContent =
      aliveBots + 1;

    if (
      aliveBots === 0
    ) {

      endGame(true);

    }
  }

  // =========================================================
  // KILL FEED
  // =========================================================

  function addKill(
    killer,
    victim
  ) {

    const element =
      document.createElement(
        "div"
      );

    element.className =
      "kill";

    element.textContent =
      killer +
      "  ›  " +
      victim;

    const feed =
      document.getElementById(
        "killfeed"
      );

    if (!feed) {
      return;
    }

    feed.prepend(
      element
    );

    while (
      feed.children.length >
      4
    ) {

      feed.lastChild.remove();

    }
  }

  // =========================================================
  // TOAST
  // =========================================================

  function toast(
    message
  ) {

    const element =
      document.getElementById(
        "toast"
      );

    if (!element) {
      return;
    }

    element.textContent =
      message;

    element.style.opacity =
      "1";

    clearTimeout(
      element._timeout
    );

    element._timeout =
      setTimeout(
        function () {

          element.style.opacity =
            "0";

        },
        1100
      );
  }

  // =========================================================
  // PLAYER DAMAGE
  // =========================================================

  function damagePlayer(
    damage
  ) {

    if (!running) {
      return;
    }

    let remaining =
      damage;

    if (armor > 0) {

      const absorbed =
        Math.min(
          armor,
          Math.ceil(
            damage * 0.6
          )
        );

      armor -= absorbed;

      remaining -=
        absorbed;
    }

    hp -=
      Math.max(
        0,
        remaining
      );

    hp =
      Math.max(
        0,
        hp
      );

    updateHUD();

    const damageOverlay =
      document.getElementById(
        "damage"
      );

    if (damageOverlay) {

      damageOverlay.style.background =
        "rgba(255,20,20,.24)";

      setTimeout(
        function () {

          damageOverlay.style.background =
            "rgba(255,0,0,0)";

        },
        90
      );
    }

    if (hp <= 0) {

      endGame(false);

    }
  }

  // =========================================================
  // BOT AI
  // =========================================================

  function updateBots(
    delta
  ) {

    for (
      const bot of bots
    ) {

      if (
        !bot.userData.alive
      ) {
        continue;
      }

      const distance =
        bot.position.distanceTo(
          player.position
        );

      const direction =
        player.position
          .clone()
          .sub(
            bot.position
          );

      direction.y = 0;

      if (
        distance < 95
      ) {

        direction.normalize();

        bot.position.addScaledVector(
          direction,
          delta *
          (
            distance > 30
              ? 3.2
              : 0.8
          )
        );

        const side =
          new THREE.Vector3(
            -direction.z,
            0,
            direction.x
          );

        bot.position.addScaledVector(
          side,
          delta *
          bot.userData.strafe *
          1.1
        );

        bot.lookAt(
          player.position.x,
          bot.position.y + 1.1,
          player.position.z
        );

        bot.userData.cooldown -=
          delta * 1000;

        if (
          distance < 65 &&
          bot.userData.cooldown <= 0
        ) {

          bot.userData.cooldown =
            700 +
            Math.random() * 900;

          damagePlayer(
            4 +
            Math.random() * 6
          );
        }
      }
    }
  }

  // =========================================================
  // PLAYER MOVEMENT
  // =========================================================

  function updatePlayer(
    delta
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

    if (keys.KeyW) {
      movement.add(
        forward
      );
    }

    if (keys.KeyS) {
      movement.sub(
        forward
      );
    }

    if (keys.KeyD) {
      movement.add(
        right
      );
    }

    if (keys.KeyA) {
      movement.sub(
        right
      );
    }

    if (
      movement.lengthSq() > 0
    ) {

      movement.normalize();

    }

    const sprinting =
      keys.ShiftLeft ||
      keys.ShiftRight;

    const speed =
      sprinting
        ? 8.5
        : crouched
          ? 3.2
          : 5.4;

    player.position.addScaledVector(
      movement,
      delta * speed
    );

    player.position.x =
      Math.max(
        -138,
        Math.min(
          138,
          player.position.x
        )
      );

    player.position.z =
      Math.max(
        -138,
        Math.min(
          138,
          player.position.z
        )
      );

    // Jump

    if (
      jumping ||
      player.position.y > 0.01
    ) {

      velY -=
        22 * delta;

      player.position.y +=
        velY * delta;

      if (
        player.position.y <= 0
      ) {

        player.position.y = 0;

        velY = 0;

        jumping = false;
      }
    }

    player.scale.y =
      crouched
        ? 0.72
        : 1;

    player.rotation.y =
      yaw;
  }

  // =========================================================
  // CAMERA
  // =========================================================

  function updateCamera() {

    if (!player) {
      return;
    }

    const target =
      player.position.clone();

    target.y +=
      crouched
        ? 1.35
        : 1.65;

    // -------------------------------------------------------
    // FIRST PERSON
    // -------------------------------------------------------

    if (firstPerson) {

      player.visible = false;

      const head =
        player.position.clone();

      head.y +=
        crouched
          ? 1.45
          : 1.9;

      camera.position.copy(
        head
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
        head.clone().add(
          direction
        )
      );

      return;
    }

    // -------------------------------------------------------
    // THIRD PERSON
    // -------------------------------------------------------

    player.visible = true;

    const distance = 5.7;

    const offset =
      new THREE.Vector3(

        Math.sin(yaw) *
          distance *
          Math.cos(pitch),

        -Math.sin(pitch) *
          distance +
          1.7,

        Math.cos(yaw) *
          distance *
          Math.cos(pitch)

      );

    const desired =
      target
        .clone()
        .add(
          offset
        );

    camera.position.lerp(
      desired,
      0.18
    );

    camera.lookAt(
      target
    );
  }

  // =========================================================
  // SAFE ZONE
  // =========================================================

  function updateZone(
    delta
  ) {

    zoneTimer +=
      delta;

    if (
      zoneTimer > 18 &&
      zoneTarget > 48
    ) {

      zoneTimer = 0;

      zoneTarget -= 13;

      toast(
        "SAFE ZONE MOVING"
      );
    }

    zoneRadius +=
      (
        zoneTarget -
        zoneRadius
      ) *
      delta *
      0.08;

    const zone =
      scene.getObjectByName(
        "ZONE"
      );

    const ring =
      scene.getObjectByName(
        "ZONE_RING"
      );

    if (zone) {

      const scale =
        zoneRadius / 115;

      zone.scale.set(
        scale,
        1,
        scale
      );
    }

    if (ring) {

      const scale =
        zoneRadius / 115;

      ring.scale.set(
        scale,
        1,
        scale
      );
    }

    const playerDistance =
      Math.hypot(
        player.position.x,
        player.position.z
      );

    if (
      playerDistance >
      zoneRadius
    ) {

      damagePlayer(
        7 * delta
      );

      const warning =
        document.getElementById(
          "zonewarn"
        );

      if (warning) {

        warning.style.display =
          "block";
      }

    } else {

      const warning =
        document.getElementById(
          "zonewarn"
        );

      if (warning) {

        warning.style.display =
          "none";
      }
    }
  }

  // =========================================================
  // HUD
  // =========================================================

  function updateHUD() {

    const hpElement =
      document.getElementById(
        "hp"
      );

    const armorElement =
      document.getElementById(
        "armor"
      );

    const hpBar =
      document.getElementById(
        "hpbar"
      );

    const armorBar =
      document.getElementById(
        "armorbar"
      );

    const magElement =
      document.getElementById(
        "mag"
      );

    const reserveElement =
      document.getElementById(
        "reserve"
      );

    const weaponElement =
      document.getElementById(
        "weaponName"
      );

    const aliveElement =
      document.getElementById(
        "alive"
      );

    const zoneElement =
      document.getElementById(
        "zone"
      );

    if (hpElement) {
      hpElement.textContent =
        Math.round(hp);
    }

    if (armorElement) {
      armorElement.textContent =
        Math.round(armor);
    }

    if (hpBar) {
      hpBar.style.width =
        hp + "%";
    }

    if (armorBar) {
      armorBar.style.width =
        armor + "%";
    }

    if (magElement) {
      magElement.textContent =
        mag;
    }

    if (reserveElement) {
      reserveElement.textContent =
        reserve;
    }

    if (weaponElement) {
      weaponElement.textContent =
        weapons[
          currentWeapon
        ].name;
    }

    if (aliveElement) {

      aliveElement.textContent =
        bots.filter(
          bot =>
            bot.userData.alive
        ).length + 1;
    }

    if (zoneElement) {

      zoneElement.textContent =
        Math.round(
          (
            zoneRadius /
            115
          ) *
          100
        ) + "%";
    }
  }

  // =========================================================
  // END GAME
  // =========================================================

  function endGame(
    victory
  ) {

    running = false;

    if (
      document.pointerLockElement
    ) {

      document.exitPointerLock();

    }

    const menu =
      document.getElementById(
        "menu"
      );

    if (!menu) {
      return;
    }

    menu.style.display =
      "flex";

    menu.innerHTML = `
      <div class="card">

        <h1 style="font-size:54px">
          ${
            victory
              ? "VICTORY"
              : "ELIMINATED"
          }
        </h1>

        <div class="subtitle">
          ${
            victory
              ? "YOU ARE THE LAST ALIVE"
              : "DISTRICT 07 GOT YOU"
          }
        </div>

        <button id="again">
          DROP AGAIN
        </button>

      </div>
    `;

    const again =
      document.getElementById(
        "again"
      );

    if (again) {

      again.onclick =
        function () {

          location.reload();

        };
    }
  }

  // =========================================================
  // MAIN LOOP
  // =========================================================

  function animate() {

    requestAnimationFrame(
      animate
    );

    const delta =
      Math.min(
        clock.getDelta(),
        0.05
      );

    if (running) {

      updatePlayer(
        delta
      );

      updateCamera();

      updateBots(
        delta
      );

      updateZone(
        delta
      );

      updateHUD();
    }

    renderer.render(
      scene,
      camera
    );
  }

  // =========================================================
  // START
  // =========================================================

  setup();

})();
