const SERVER_URL =
  "https://lastalive-game.onrender.com";

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

const $ = (id) =>
  document.getElementById(id);

const screens = [
  "home",
  "lobby",
  "game",
  "result"
];

function showScreen(name) {
  screens.forEach((screen) => {
    const element = $(screen);

    if (element) {
      element.classList.toggle(
        "active",
        screen === name
      );
    }
  });
}

function error(id, message) {
  const element = $(id);

  if (element) {
    element.textContent =
      message || "";
  }
}

function toast(message) {
  document
    .querySelector(".toast")
    ?.remove();

  const element =
    document.createElement("div");

  element.className = "toast";

  element.textContent = message;

  document.body.appendChild(element);

  setTimeout(() => {
    element.remove();
  }, 2200);
}

function clean(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}


/* SOCKET */

function connectSocket() {

  if (socket?.connected) {
    return;
  }

  socket = io(
    SERVER_URL,
    {
      transports: [
        "websocket",
        "polling"
      ],

      timeout: 10000,

      reconnection: true,

      reconnectionAttempts: 8
    }
  );


  socket.on(
    "connect",
    () => {

      myId =
        socket.id;

      console.log(
        "CONNECTED",
        socket.id
      );

      error(
        "homeError",
        ""
      );
    }
  );


  socket.on(
    "connect_error",
    (err) => {

      console.error(
        "Socket error:",
        err
      );

      error(
        "homeError",
        "Multiplayer server connection failed."
      );
    }
  );


  socket.on(
    "disconnect",
    () => {

      if (room) {
        toast(
          "CONNECTION LOST"
        );
      }
    }
  );


  socket.on(
    "room-created",
    (data) => {

      room = data.room;

      isHost = true;

      state.players =
        data.players || [];

      openLobby();
    }
  );


  socket.on(
    "room-joined",
    (data) => {

      room = data.room;

      isHost = false;

      state.players =
        data.players || [];

      openLobby();
    }
  );


  socket.on(
    "lobby",
    (data) => {

      state.players =
        data.players || [];

      renderLobby();
    }
  );


  socket.on(
    "game-start",
    (data) => {

      state = data;

      showScreen("game");

      renderGame();

      runCountdown();
    }
  );


  socket.on(
    "game-state",
    (data) => {

      state = data;

      renderGame();
    }
  );


  socket.on(
    "round-result",
    (data) => {

      state = data;

      renderResult();
    }
  );


  socket.on(
    "room-error",
    (message) => {

      error(
        "homeError",
        message
      );

      error(
        "lobbyError",
        message
      );

      toast(message);
    }
  );
}


/* EMIT */

function emitWhenConnected(
  event,
  data
) {

  connectSocket();

  if (socket.connected) {

    socket.emit(
      event,
      data
    );

  } else {

    socket.once(
      "connect",
      () => {

        socket.emit(
          event,
          data
        );

      }
    );
  }
}


/* ROOM */

function createRoom() {

  playerName =
    (
      $("nameInput")
        .value
        .trim() ||
      "PLAYER"
    ).slice(0, 14);

  error(
    "homeError",
    ""
  );

  emitWhenConnected(
    "create-room",
    {
      name: playerName
    }
  );
}


function joinRoom() {

  playerName =
    (
      $("nameInput")
        .value
        .trim() ||
      "PLAYER"
    ).slice(0, 14);

  room =
    clean(
      $("roomInput")
        .value
    );

  if (room.length !== 6) {

    error(
      "homeError",
      "Enter a 6-character room code."
    );

    return;
  }

  error(
    "homeError",
    ""
  );

  emitWhenConnected(
    "join-room",
    {
      room,
      name: playerName
    }
  );
}


function openLobby() {

  showScreen("lobby");

  $("roomCode")
    .textContent = room;

  renderLobby();
}


function renderLobby() {

  const players =
    state.players || [];

  $("count")
    .textContent =
    players.length + "/8";

  $("playerList")
    .innerHTML =
    players
      .map(
        (player) => {

          return `
            <div
              class="player
              ${player.host ? "host" : ""}
              ${player.id === myId ? "me" : ""}"
            >

              <span class="player-name">
                ${escapeHTML(player.name)}
              </span>

              <span class="player-meta">

                ${
                  player.id === myId
                    ? "YOU · "
                    : ""
                }

                ${
                  player.host
                    ? "HOST"
                    : "READY"
                }

              </span>

            </div>
          `;
        }
      )
      .join("");


  $("startBtn")
    .disabled =
    !isHost ||
    players.length < 2;
}


function startGame() {

  if (
    isHost &&
    room &&
    state.players.length >= 2
  ) {

    socket.emit(
      "start-game",
      {
        room
      }
    );

  } else {

    toast(
      "NEED 2 PLAYERS"
    );
  }
}


/* GAME */

function renderGame() {

  $("round")
    .textContent =
    state.round || 1;

  $("time")
    .textContent =
    Math.max(
      0,
      Math.ceil(
        state.timeLeft || 0
      )
    );


  const alivePlayers =
    (state.players || [])
      .filter(
        (player) =>
          player.alive
      );

  $("alive")
    .textContent =
    alivePlayers.length;


  const me =
    state.players?.find(
      (player) =>
        player.id === myId
    );


  $("gameStatus")
    .textContent =
    me?.alive === false
      ? "ELIMINATED"
      : "SURVIVE";


  const arena =
    $("arena");

  const entities =
    $("entities");

  if (!arena || !entities) {
    return;
  }


  entities.innerHTML = "";


  const size =
    arena.getBoundingClientRect()
      .width;


  /*
    HAZARDS
  */

  (
    state.hazards || []
  ).forEach(
    (hazard) => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "entity hazard " +
        hazard.type;

      element.style.left =
        (
          hazard.x / 100
        ) *
        size +
        "px";

      element.style.top =
        (
          hazard.y / 100
        ) *
        size +
        "px";

      entities.appendChild(
        element
      );
    }
  );


  /*
    PLAYERS
  */

  (
    state.players || []
  ).forEach(
    (player) => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "entity playerDot " +
        (
          player.id === myId
            ? ""
            : "enemy "
        ) +
        (
          player.alive
            ? ""
            : "dead"
        );


      element.style.left =
        (
          player.x / 100
        ) *
        size +
        "px";


      element.style.top =
        (
          player.y / 100
        ) *
        size +
        "px";


      const label =
        document.createElement(
          "span"
        );

      label.className =
        "player-label";

      label.textContent =
        player.name;


      element.appendChild(
        label
      );


      entities.appendChild(
        element
      );
    }
  );
}


function runCountdown() {

  const countdown =
    $("countdown");

  let number = 3;

  countdown.textContent =
    number;


  const timer =
    setInterval(
      () => {

        number--;

        if (number > 0) {

          countdown.textContent =
            number;

        } else {

          countdown.textContent =
            "GO";

          setTimeout(
            () => {
              countdown.textContent =
                "";
            },
            350
          );

          clearInterval(
            timer
          );
        }

      },
      500
    );
}


/* RESULT */

function renderResult() {

  showScreen(
    "result"
  );


  const alivePlayers =
    (
      state.players || []
    ).filter(
      (player) =>
        player.alive
    );


  $("winner")
    .textContent =
    state.winner ||
    (
      alivePlayers[0]?.name ||
      "NO ONE"
    );


  $("scores")
    .innerHTML =
    (
      state.players || []
    )
      .map(
        (player) => {

          return `
            <div
              class="score
              ${player.alive
                ? "alive"
                : "out"}"
            >

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
        }
      )
      .join("");


  $("rematchBtn")
    .disabled =
    !isHost;
}


/* MOVEMENT */

function move(
  dx,
  dy
) {

  if (
    !socket?.connected ||
    !room ||
    (!dx && !dy)
  ) {
    return;
  }

  socket.emit(
    "move",
    {
      room,
      dx,
      dy
    }
  );
}


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


/*
  Send movement
  every 70ms
*/

setInterval(
  () => {

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


    move(
      dx,
      dy
    );

  },
  70
);


/* BUTTONS */

async function copyRoom() {

  try {

    await navigator.clipboard
      .writeText(room);

    toast(
      "ROOM CODE COPIED"
    );

  } catch {

    toast(room);

  }
}


function leave() {

  if (
    socket &&
    room
  ) {

    socket.emit(
      "leave-room",
      {
        room
      }
    );
  }


  room = "";

  isHost = false;

  showScreen(
    "home"
  );
}


function rematch() {

  if (
    isHost &&
    room
  ) {

    socket.emit(
      "rematch",
      {
        room
      }
    );

  } else {

    toast(
      "ONLY HOST CAN REMATCH"
    );
  }
}


/* EVENTS */

$("createBtn")
  .onclick =
  createRoom;

$("joinBtn")
  .onclick =
  joinRoom;

$("startBtn")
  .onclick =
  startGame;

$("copyBtn")
  .onclick =
  copyRoom;

$("leaveBtn")
  .onclick =
  leave;

$("gameLeave")
  .onclick =
  leave;

$("rematchBtn")
  .onclick =
  rematch;

$("menuBtn")
  .onclick =
  leave;


$("roomInput")
  .addEventListener(
    "input",
    (event) => {

      event.target.value =
        clean(
          event.target.value
        );
    }
  );


$("nameInput")
  .addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {
        createRoom();
      }

    }
  );


console.log(
  "LAST//ALIVE CLIENT READY",
  SERVER_URL
);
