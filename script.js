/* =========================================
   LAST//ALIVE — CLIENT
   Socket.IO multiplayer client
   ========================================= */

const SERVER_URL = "https://lastalive-game.onrender.com";
// After deploying server.js, change this to:
// const SERVER_URL = "https://YOUR-SERVER-URL.com";

let socket = null;

let room = "";
let playerName = "";
let isHost = false;
let myId = "";

let state = {
  players: [],
  hazards: [],
  timeLeft: 60,
  round: 1
};

const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

const $ = (id) => document.getElementById(id);


/* =========================================
   SCREEN SYSTEM
   ========================================= */

const screens = [
  "home",
  "lobby",
  "game",
  "result"
];

function showScreen(screenName) {
  screens.forEach((screen) => {
    const el = $(screen);

    if (el) {
      el.classList.toggle(
        "active",
        screen === screenName
      );
    }
  });
}


/* =========================================
   ERROR / TOAST
   ========================================= */

function showError(id, message) {
  const el = $(id);

  if (el) {
    el.textContent = message || "";
  }
}

function toast(message) {
  const old = document.querySelector(".toast");

  if (old) {
    old.remove();
  }

  const element = document.createElement("div");

  element.className = "toast";
  element.textContent = message;

  element.style.cssText = `
    position: fixed;
    top: 85px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: #171b19;
    color: white;
    border: 1px solid #b8ff3d;
    padding: 11px 18px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 700;
  `;

  document.body.appendChild(element);

  setTimeout(() => {
    element.remove();
  }, 2200);
}


/* =========================================
   SANITIZE ROOM CODE
   ========================================= */

function cleanRoomCode(value) {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}


/* =========================================
   CONNECT SOCKET
   ========================================= */

function connectSocket() {

  if (socket && socket.connected) {
    return;
  }

  try {

    socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      timeout: 8000,
      reconnection: true,
      reconnectionAttempts: 5
    });

    socket.on("connect", () => {

      myId = socket.id;

      console.log(
        "Connected to server:",
        socket.id
      );

      showError("homeError", "");

    });


    socket.on("connect_error", (error) => {

      console.error(
        "Socket connection error:",
        error
      );

      showError(
        "homeError",
        "Cannot connect to multiplayer server."
      );

    });


    socket.on("disconnect", (reason) => {

      console.log(
        "Disconnected:",
        reason
      );

      if (room) {
        toast("Connection lost");
      }

    });


    /* ================================
       ROOM CREATED
       ================================ */

    socket.on("room-created", (data) => {

      console.log("Room created:", data);

      room = data.room;
      isHost = true;

      state.players = data.players || [];

      openLobby();

    });


    /* ================================
       ROOM JOINED
       ================================ */

    socket.on("room-joined", (data) => {

      console.log("Joined room:", data);

      room = data.room;
      isHost = false;

      state.players = data.players || [];

      openLobby();

    });


    /* ================================
       LOBBY UPDATE
       ================================ */

    socket.on("lobby", (data) => {

      console.log(
        "Lobby update:",
        data
      );

      state.players = data.players || [];

      renderLobby();

    });


    /* ================================
       GAME START
       ================================ */

    socket.on("game-start", (data) => {

      console.log(
        "Game started:",
        data
      );

      state = data;

      showScreen("game");

      renderGame();

    });


    /* ================================
       LIVE GAME STATE
       ================================ */

    socket.on("game-state", (data) => {

      state = data;

      renderGame();

    });


    /* ================================
       ROUND RESULT
       ================================ */

    socket.on("round-result", (data) => {

      console.log(
        "Round result:",
        data
      );

      state = data;

      renderResult();

    });


    /* ================================
       ROOM ERROR
       ================================ */

    socket.on("room-error", (message) => {

      console.error(
        "Room error:",
        message
      );

      showError(
        "homeError",
        message
      );

      showError(
        "lobbyError",
        message
      );

      toast(message);

    });

  } catch (error) {

    console.error(error);

    showError(
      "homeError",
      "Multiplayer connection failed."
    );

  }

}


/* =========================================
   CREATE ROOM
   ========================================= */

function createRoom() {

  showError("homeError", "");

  playerName =
    ($("nameInput").value.trim() || "PLAYER")
      .slice(0, 14);

  connectSocket();

  const sendCreate = () => {

    socket.emit(
      "create-room",
      {
        name: playerName
      }
    );

  };

  if (socket.connected) {

    sendCreate();

  } else {

    socket.once(
      "connect",
      sendCreate
    );

  }

}


/* =========================================
   JOIN ROOM
   ========================================= */

function joinRoom() {

  showError("homeError", "");

  playerName =
    ($("nameInput").value.trim() || "PLAYER")
      .slice(0, 14);

  room =
    cleanRoomCode(
      $("roomInput").value
    );

  if (room.length !== 6) {

    showError(
      "homeError",
      "Enter a 6-character room code."
    );

    return;

  }

  connectSocket();

  const sendJoin = () => {

    socket.emit(
      "join-room",
      {
        room: room,
        name: playerName
      }
    );

  };

  if (socket.connected) {

    sendJoin();

  } else {

    socket.once(
      "connect",
      sendJoin
    );

  }

}


/* =========================================
   OPEN LOBBY
   ========================================= */

function openLobby() {

  showScreen("lobby");

  $("roomCode").textContent = room;

  renderLobby();

}


/* =========================================
   RENDER LOBBY
   ========================================= */

function renderLobby() {

  const count =
    state.players.length;

  $("count").textContent =
    `${count}/8`;


  $("playerList").innerHTML =
    state.players
      .map((player) => {

        return `
          <div class="player ${
            player.host ? "host" : ""
          }">

            <span>
              ${escapeHTML(player.name)}
            </span>

            <em>
              ${
                player.host
                  ? "HOST"
                  : "READY"
              }
            </em>

          </div>
        `;

      })
      .join("");


  const startButton =
    $("startBtn");

  if (startButton) {

    startButton.disabled =
      !isHost ||
      state.players.length < 2;

  }

}


/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeHTML(value) {

  return String(value)
    .replace(/[&<>"']/g, (character) => {

      const map = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      };

      return map[character];

    });

}


/* =========================================
   START GAME
   ========================================= */

function startGame() {

  if (!socket) {
    return;
  }

  if (!isHost) {
    return;
  }

  if (!room) {
    return;
  }

  if (state.players.length < 2) {

    toast(
      "Need at least 2 players"
    );

    return;

  }

  socket.emit(
    "start-game",
    {
      room: room
    }
  );

}


/* =========================================
   RENDER GAME
   ========================================= */

function renderGame() {

  if (!$("arena")) {
    return;
  }


  $("round").textContent =
    state.round || 1;


  $("time").textContent =
    Math.max(
      0,
      Math.ceil(
        state.timeLeft || 0
      )
    );


  const alivePlayers =
    (state.players || [])
      .filter(
        (player) => player.alive
      );


  $("alive").textContent =
    alivePlayers.length;


  const entities =
    $("entities");

  entities.innerHTML = "";


  const arena =
    $("arena");

  const arenaSize =
    arena.getBoundingClientRect().width;


  /* ================================
     HAZARDS
     ================================ */

  (state.hazards || [])
    .forEach((hazard) => {

      const element =
        document.createElement("div");

      element.className =
        `entity hazard ${hazard.type}`;


      element.style.left =
        `${(hazard.x / 100) * arenaSize}px`;


      element.style.top =
        `${(hazard.y / 100) * arenaSize}px`;


      entities.appendChild(
        element
      );

    });


  /* ================================
     PLAYERS
     ================================ */

  (state.players || [])
    .forEach((player) => {

      const element =
        document.createElement("div");


      element.className =
        `entity playerDot ${
          player.id === myId
            ? ""
            : "enemy"
        }`;


      element.style.left =
        `${(player.x / 100) * arenaSize}px`;


      element.style.top =
        `${(player.y / 100) * arenaSize}px`;


      if (!player.alive) {

        element.style.opacity = "0.18";

      }


      element.title =
        player.name;


      entities.appendChild(
        element
      );

    });

}


/* =========================================
   MOVEMENT
   ========================================= */

function sendMovement(dx, dy) {

  if (!socket) {
    return;
  }

  if (!socket.connected) {
    return;
  }

  if (!room) {
    return;
  }

  if (dx === 0 && dy === 0) {
    return;
  }

  socket.emit(
    "move",
    {
      room: room,
      dx: dx,
      dy: dy
    }
  );

}


/* =========================================
   KEYBOARD DOWN
   ========================================= */

window.addEventListener(
  "keydown",
  (event) => {

    const key =
      event.key.toLowerCase();


    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright"
      ].includes(key)
    ) {

      event.preventDefault();

    }


    if (
      key === "w" ||
      key === "arrowup"
    ) {

      keys.up = true;

    }


    if (
      key === "s" ||
      key === "arrowdown"
    ) {

      keys.down = true;

    }


    if (
      key === "a" ||
      key === "arrowleft"
    ) {

      keys.left = true;

    }


    if (
      key === "d" ||
      key === "arrowright"
    ) {

      keys.right = true;

    }

  }
);


/* =========================================
   KEYBOARD UP
   ========================================= */

window.addEventListener(
  "keyup",
  (event) => {

    const key =
      event.key.toLowerCase();


    if (
      key === "w" ||
      key === "arrowup"
    ) {

      keys.up = false;

    }


    if (
      key === "s" ||
      key === "arrowdown"
    ) {

      keys.down = false;

    }


    if (
      key === "a" ||
      key === "arrowleft"
    ) {

      keys.left = false;

    }


    if (
      key === "d" ||
      key === "arrowright"
    ) {

      keys.right = false;

    }

  }
);


/* =========================================
   MOVEMENT LOOP
   ========================================= */

setInterval(() => {

  if (
    !$("game")
      .classList
      .contains("active")
  ) {

    return;

  }


  const dx =
    (keys.right ? 1 : 0) -
    (keys.left ? 1 : 0);


  const dy =
    (keys.down ? 1 : 0) -
    (keys.up ? 1 : 0);


  sendMovement(
    dx,
    dy
  );

}, 70);


/* =========================================
   COPY ROOM
   ========================================= */

async function copyRoomCode() {

  if (!room) {
    return;
  }

  try {

    await navigator.clipboard.writeText(
      room
    );

    toast(
      "ROOM CODE COPIED"
    );

  } catch {

    toast(room);

  }

}


/* =========================================
   LEAVE ROOM
   ========================================= */

function leaveRoom() {

  if (socket && room) {

    socket.emit(
      "leave-room",
      {
        room: room
      }
    );

  }

  room = "";
  isHost = false;

  showScreen("home");

}


/* =========================================
   REMATCH
   ========================================= */

function rematch() {

  if (!socket) {
    return;
  }

  if (!isHost) {

    toast(
      "Only the host can start rematch"
    );

    return;

  }

  socket.emit(
    "rematch",
    {
      room: room
    }
  );

}


/* =========================================
   RESULT SCREEN
   ========================================= */

function renderResult() {

  showScreen("result");


  const alivePlayers =
    (state.players || [])
      .filter(
        (player) => player.alive
      );


  let winner =
    state.winner;


  if (!winner) {

    winner =
      alivePlayers.length === 1
        ? alivePlayers[0].name
        : "NO WINNER";

  }


  $("winner").textContent =
    winner;


  $("scores").innerHTML =
    (state.players || [])
      .map((player) => {

        return `
          <div class="score">

            <span>
              ${escapeHTML(
                player.name
              )}
            </span>

            <b>
              ${
                player.alive
                  ? "ALIVE"
                  : "OUT"
              }
            </b>

          </div>
        `;

      })
      .join("");


  $("rematchBtn").disabled =
    !isHost;

}


/* =========================================
   BUTTON EVENTS
   ========================================= */

$("createBtn").addEventListener(
  "click",
  createRoom
);


$("joinBtn").addEventListener(
  "click",
  joinRoom
);


$("startBtn").addEventListener(
  "click",
  startGame
);


$("copyBtn").addEventListener(
  "click",
  copyRoomCode
);


$("leaveBtn").addEventListener(
  "click",
  leaveRoom
);


$("gameLeave").addEventListener(
  "click",
  leaveRoom
);


$("rematchBtn").addEventListener(
  "click",
  rematch
);


$("menuBtn").addEventListener(
  "click",
  leaveRoom
);


$("roomInput").addEventListener(
  "input",
  (event) => {

    event.target.value =
      cleanRoomCode(
        event.target.value
      );

  }
);


/* =========================================
   INITIAL STATE
   ========================================= */

showScreen("home");

console.log(
  "LAST//ALIVE client loaded"
);

console.log(
  "Server:",
  SERVER_URL
);
