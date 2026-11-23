const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


/* =========================================
   ROOM CODE
   ========================================= */

function generateRoomCode() {

  let code;

  do {

    code = "";

    for (let i = 0; i < 6; i++) {

      code +=
        ALPHABET[
          Math.floor(
            Math.random() * ALPHABET.length
          )
        ];

    }

  } while (rooms.has(code));

  return code;
}


/* =========================================
   PUBLIC PLAYER DATA
   ========================================= */

function getPlayers(room) {

  return [...room.players.values()].map(
    (player) => ({
      id: player.id,
      name: player.name,
      host: player.id === room.host,
      alive: player.alive,
      x: player.x,
      y: player.y
    })
  );

}


/* =========================================
   SEND LOBBY UPDATE
   ========================================= */

function updateLobby(room) {

  if (!room) return;

  io.to(room.id).emit(
    "lobby",
    {
      players: getPlayers(room)
    }
  );

}


/* =========================================
   DISTANCE
   ========================================= */

function distance(a, b) {

  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2)
  );

}


/* =========================================
   CREATE HAZARDS
   ========================================= */

function createHazards() {

  const hazards = [];


  // Moving bombs
  for (let i = 0; i < 7; i++) {

    hazards.push({

      type: "bomb",

      x: 10 + Math.random() * 80,

      y: 10 + Math.random() * 80,

      vx:
        (Math.random() - 0.5) *
        0.8,

      vy:
        (Math.random() - 0.5) *
        0.8

    });

  }


  // Pits
  for (let i = 0; i < 4; i++) {

    hazards.push({

      type: "pit",

      x: 10 + Math.random() * 80,

      y: 10 + Math.random() * 80

    });

  }


  return hazards;

}


/* =========================================
   RESET PLAYERS
   ========================================= */

function resetPlayers(room) {

  const players =
    [...room.players.values()];

  players.forEach(
    (player, index) => {

      const angle =
        (index / players.length) *
        Math.PI *
        2;

      player.x =
        50 +
        38 *
        Math.cos(angle);

      player.y =
        50 +
        38 *
        Math.sin(angle);

      player.alive = true;

    }
  );

}


/* =========================================
   START ROUND
   ========================================= */

function startRound(room) {

  if (!room) return;

  clearInterval(room.timer);

  room.running = true;

  room.timeLeft = 60;

  room.round++;

  resetPlayers(room);

  room.hazards =
    createHazards();


  io.to(room.id).emit(
    "game-start",
    {

      players:
        getPlayers(room),

      hazards:
        room.hazards,

      timeLeft:
        room.timeLeft,

      round:
        room.round

    }
  );


  room.timer =
    setInterval(
      () => gameTick(room),
      100
    );

}


/* =========================================
   GAME LOOP
   ========================================= */

function gameTick(room) {

  if (!rooms.has(room.id)) {

    clearInterval(room.timer);

    return;

  }


  room.timeLeft -= 0.1;


  /* -------------------------
     MOVE BOMBS
     ------------------------- */

  for (
    const hazard of room.hazards
  ) {

    if (
      hazard.type !== "bomb"
    ) {

      continue;

    }


    hazard.x += hazard.vx;

    hazard.y += hazard.vy;


    if (
      hazard.x < 3 ||
      hazard.x > 97
    ) {

      hazard.vx *= -1;

    }


    if (
      hazard.y < 3 ||
      hazard.y > 97
    ) {

      hazard.vy *= -1;

    }

  }


  /* -------------------------
     PLAYER COLLISIONS
     ------------------------- */

  for (
    const player of room.players.values()
  ) {

    if (!player.alive) continue;


    for (
      const hazard of room.hazards
    ) {

      const d =
        distance(
          player,
          hazard
        );


      // Bomb
      if (
        hazard.type === "bomb" &&
        d < 5
      ) {

        player.alive = false;

        break;

      }


      // Pit
      if (
        hazard.type === "pit" &&
        d < 7
      ) {

        player.alive = false;

        break;

      }

    }

  }


  /* -------------------------
     COUNT ALIVE
     ------------------------- */

  const alivePlayers =
    [...room.players.values()]
      .filter(
        (player) =>
          player.alive
      );


  /* -------------------------
     END ROUND
     ------------------------- */

  if (
    alivePlayers.length <= 1 ||
    room.timeLeft <= 0
  ) {

    endRound(room);

    return;

  }


  /* -------------------------
     SEND GAME STATE
     ------------------------- */

  io.to(room.id).emit(
    "game-state",
    {

      players:
        getPlayers(room),

      hazards:
        room.hazards,

      timeLeft:
        room.timeLeft,

      round:
        room.round

    }
  );

}


/* =========================================
   END ROUND
   ========================================= */

function endRound(room) {

  clearInterval(room.timer);

  room.running = false;


  const alivePlayers =
    [...room.players.values()]
      .filter(
        (player) =>
          player.alive
      );


  let winner;


  if (
    alivePlayers.length === 1
  ) {

    winner =
      alivePlayers[0].name;

  } else if (
    alivePlayers.length > 1
  ) {

    winner =
      "TIME DRAW";

  } else {

    winner =
      "NO ONE";

  }


  io.to(room.id).emit(
    "round-result",
    {

      players:
        getPlayers(room),

      winner,

      round:
        room.round

    }
  );

}


/* =========================================
   SOCKET CONNECTION
   ========================================= */

io.on(
  "connection",
  (socket) => {

    console.log(
      "Player connected:",
      socket.id
    );


    /* =====================================
       CREATE ROOM
       ===================================== */

    socket.on(
      "create-room",
      ({ name }) => {

        const roomCode =
          generateRoomCode();


        const room = {

          id: roomCode,

          host:
            socket.id,

          players:
            new Map(),

          running:
            false,

          round:
            0,

          timeLeft:
            60,

          hazards:
            [],

          timer:
            null

        };


        const player = {

          id:
            socket.id,

          name:
            String(
              name || "PLAYER"
            ).slice(0, 14),

          alive:
            true,

          x:
            50,

          y:
            50

        };


        room.players.set(
          socket.id,
          player
        );


        rooms.set(
          roomCode,
          room
        );


        socket.join(
          roomCode
        );


        console.log(
          "Room created:",
          roomCode
        );


        socket.emit(
          "room-created",
          {

            room:
              roomCode,

            players:
              getPlayers(room)

          }
        );

      }
    );


    /* =====================================
       JOIN ROOM
       ===================================== */

    socket.on(
      "join-room",
      ({ room, name }) => {

        const roomCode =
          String(
            room || ""
          ).toUpperCase();


        const gameRoom =
          rooms.get(
            roomCode
          );


        if (!gameRoom) {

          socket.emit(
            "room-error",
            "Room not found."
          );

          return;

        }


        if (gameRoom.running) {

          socket.emit(
            "room-error",
            "Game already started."
          );

          return;

        }


        if (
          gameRoom.players.size >= 8
        ) {

          socket.emit(
            "room-error",
            "Room is full."
          );

          return;

        }


        const player = {

          id:
            socket.id,

          name:
            String(
              name || "PLAYER"
            ).slice(0, 14),

          alive:
            true,

          x:
            50,

          y:
            50

        };


        gameRoom.players.set(
          socket.id,
          player
        );


        socket.join(
          roomCode
        );


        console.log(
          "Player joined:",
          socket.id,
          roomCode
        );


        socket.emit(
          "room-joined",
          {

            room:
              roomCode,

            players:
              getPlayers(gameRoom)

          }
        );


        updateLobby(
          gameRoom
        );

      }
    );


    /* =====================================
       START GAME
       ===================================== */

    socket.on(
      "start-game",
      ({ room }) => {

        const gameRoom =
          rooms.get(room);


        if (!gameRoom) return;


        if (
          gameRoom.host !==
          socket.id
        ) {

          return;

        }


        if (
          gameRoom.players.size < 2
        ) {

          return;

        }


        startRound(
          gameRoom
        );

      }
    );


    /* =====================================
       PLAYER MOVEMENT
       ===================================== */

    socket.on(
      "move",
      ({ room, dx, dy }) => {

        const gameRoom =
          rooms.get(room);


        if (!gameRoom) return;


        const player =
          gameRoom.players.get(
            socket.id
          );


        if (!player) return;


        if (!gameRoom.running)
          return;


        if (!player.alive)
          return;


        let x =
          Number(dx) || 0;

        let y =
          Number(dy) || 0;


        const length =
          Math.sqrt(
            x * x +
            y * y
          );


        if (length === 0)
          return;


        x /= length;

        y /= length;


        const speed = 1.5;


        player.x +=
          x * speed;


        player.y +=
          y * speed;


        // Keep inside arena
        player.x =
          Math.max(
            3,
            Math.min(
              97,
              player.x
            )
          );


        player.y =
          Math.max(
            3,
            Math.min(
              97,
              player.y
            )
          );

      }
    );


    /* =====================================
       REMATCH
       ===================================== */

    socket.on(
      "rematch",
      ({ room }) => {

        const gameRoom =
          rooms.get(room);


        if (!gameRoom)
          return;


        if (
          gameRoom.host !==
          socket.id
        ) {

          return;

        }


        startRound(
          gameRoom
        );

      }
    );


    /* =====================================
       LEAVE ROOM
       ===================================== */

    socket.on(
      "leave-room",
      ({ room }) => {

        removePlayer(
          socket,
          room
        );

      }
    );


    /* =====================================
       DISCONNECT
       ===================================== */

    socket.on(
      "disconnect",
      () => {

        console.log(
          "Player disconnected:",
          socket.id
        );


        for (
          const [
            roomCode,
            gameRoom
          ] of rooms
        ) {

          if (
            gameRoom.players.has(
              socket.id
            )
          ) {

            removePlayer(
              socket,
              roomCode
            );

          }

        }

      }
    );

  }
);


/* =========================================
   REMOVE PLAYER
   ========================================= */

function removePlayer(
  socket,
  roomCode
) {

  const gameRoom =
    rooms.get(
      roomCode
    );


  if (!gameRoom)
    return;


  gameRoom.players.delete(
    socket.id
  );


  socket.leave(
    roomCode
  );


  /* -------------------------
     EMPTY ROOM
     ------------------------- */

  if (
    gameRoom.players.size === 0
  ) {

    clearInterval(
      gameRoom.timer
    );

    rooms.delete(
      roomCode
    );

    console.log(
      "Room deleted:",
      roomCode
    );

    return;

  }


  /* -------------------------
     HOST LEFT
     ------------------------- */

  if (
    gameRoom.host ===
    socket.id
  ) {

    const nextHost =
      gameRoom.players.keys().next()
        .value;


    gameRoom.host =
      nextHost;

  }


  /* -------------------------
     CHECK GAME
     ------------------------- */

  if (
    gameRoom.running
  ) {

    const alive =
      [...gameRoom.players.values()]
        .filter(
          (player) =>
            player.alive
        );


    if (
      alive.length <= 1
    ) {

      endRound(
        gameRoom
      );

    }

  } else {

    updateLobby(
      gameRoom
    );

  }

}


/* =========================================
   HEALTH CHECK
   ========================================= */

app.get(
  "/",
  (req, res) => {

    res.json({

      status:
        "online",

      game:
        "LAST//ALIVE",

      rooms:
        rooms.size

    });

  }
);


/* =========================================
   SERVER START
   ========================================= */

const PORT =
  process.env.PORT || 3000;


server.listen(
  PORT,
  () => {

    console.log(
      `LAST//ALIVE server running on port ${PORT}`
    );

  }
);
