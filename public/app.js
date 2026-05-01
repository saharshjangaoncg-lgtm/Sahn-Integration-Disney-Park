import { avatarOptions, getAvatar, renderClimbScene } from "./climb3d.js";

const app = document.querySelector("#app");

const state = {
  view: "home",
  deck: null,
  room: null,
  role: null,
  playerId: localStorage.getItem("quizPlayerId") || "",
  hostSecret: localStorage.getItem("quizHostSecret") || "",
  roomCode: localStorage.getItem("quizRoomCode") || "",
  selectedAvatar: localStorage.getItem("quizAvatar") || "mickey",
  answeredChoiceId: "",
  error: "",
  events: null,
  now: Date.now()
};

setInterval(() => {
  state.now = Date.now();
  if (state.room?.status === "answering") render();
}, 500);

async function api(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });
  return response.json();
}

async function loadDeck() {
  const response = await fetch("/api/deck");
  state.deck = await response.json();
}

function connectEvents(roomCode) {
  if (state.events) state.events.close();
  state.events = new EventSource(`/api/events?roomCode=${encodeURIComponent(roomCode)}`);
  state.events.addEventListener("room", (event) => {
    state.room = JSON.parse(event.data);
    state.roomCode = state.room.code;
    localStorage.setItem("quizRoomCode", state.roomCode);
    if (state.room.status !== "answering") state.answeredChoiceId = "";
    render();
  });
  state.events.onerror = () => {
    state.error = "Live connection paused. Refresh if the room does not update.";
    render();
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shell(content) {
  const title = state.deck?.title || "Integral Imperial Intelligence";
  const subtitle = state.deck?.subtitle || "Multiplayer math quest";
  return `
    <main class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="castle">${state.deck?.theme?.castleEmoji || "🏰"}</div>
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p class="muted">${escapeHtml(subtitle)}</p>
          </div>
        </div>
        ${state.room ? `<span class="badge">Room ${escapeHtml(state.room.code)}</span>` : ""}
      </header>
      ${content}
    </main>
  `;
}

function parkBoard() {
  const cards = state.deck?.theme?.parkCards || [];
  return `
    <div class="park-board">
      ${cards.map((card) => `
        <div class="park-card" style="--card-color:${card.color}">
          <div class="park-visual">
            ${card.image ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)} artwork" />` : `<span>${escapeHtml(card.icon)}</span>`}
            <em>${escapeHtml(card.label)}</em>
          </div>
          <div class="park-caption">
            <strong>${escapeHtml(card.title)}</strong>
            <span>${escapeHtml(card.label)}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function lessonStats() {
  const lesson = state.deck?.lessonPlan;
  return `
    <div class="stats-strip">
      <div><strong>${state.deck?.questions?.length || 0}</strong><span>Missions</span></div>
      <div><strong>${lesson?.gameMinutes || 0}</strong><span>Game min</span></div>
      <div><strong>${lesson?.debriefMinutes || 0}</strong><span>Debrief min</span></div>
      <div><strong>3D</strong><span>Climb race</span></div>
    </div>
  `;
}

function avatarPicker() {
  return `
    <div class="avatar-picker" aria-label="Choose your climber avatar">
      ${avatarOptions.map((avatar) => `
        <button type="button" class="avatar-token ${state.selectedAvatar === avatar.id ? "active" : ""}" data-avatar="${escapeHtml(avatar.id)}" style="--avatar-color:${avatar.color}; --avatar-glow:${avatar.glow};">
          <span>${escapeHtml(avatar.short)}</span>
          <strong>${escapeHtml(avatar.name)}</strong>
        </button>
      `).join("")}
    </div>
  `;
}

function sampleClimbers() {
  return [
    { id: "saharsh", name: "Saharsh", avatar: "saharsh", score: 18400, height: 842 },
    { id: "anikshaa", name: "Anikshaa", avatar: "anikshaa", score: 16300, height: 735 },
    { id: "joy", name: "Joy", avatar: "joy", score: 14100, height: 641 },
    { id: "divyam", name: "Divyam", avatar: "divyam", score: 12050, height: 548 },
    { id: "vtl", name: "VTL", avatar: "vtl", score: 9600, height: 436 }
  ];
}

function climbPlayers() {
  const players = state.room?.players?.length ? state.room.players : sampleClimbers();
  return [...players].sort((a, b) => (b.height || 0) - (a.height || 0) || (b.score || 0) - (a.score || 0));
}

function climbPanel(title = "3D Infinite Parkour Climb") {
  const players = climbPlayers();
  const rows = players.slice(0, 5).map((player, index) => {
    const avatar = getAvatar(player.avatar);
    return `
      <div class="height-row" style="--avatar-color:${avatar.color}">
        <span>${escapeHtml(avatar.short)}</span>
        <strong>#${index + 1} ${escapeHtml(player.name)}</strong>
        <em>${Math.round(player.height || 0)} ft</em>
      </div>
    `;
  }).join("");

  return `
    <section class="climb-shell">
      <div class="climb-copy">
        <span class="badge">Points become height</span>
        <h2>${escapeHtml(title)}</h2>
        <p class="muted">Correct answers, streak bonuses, speed bonuses, steals, and nukes push your avatar higher on a looping parkour tower. The course repeats every 900 ft, so the race can keep going.</p>
        <div class="height-board">${rows}</div>
      </div>
      <div id="climb-stage" class="climb-stage" aria-label="3D parkour tower"></div>
    </section>
  `;
}

function renderHome() {
  return shell(`
    <section class="notion-cover">
      <div class="cover-castle" aria-hidden="true">🏰</div>
    </section>
    <section class="notion-page-head">
      <div class="notion-icon" aria-hidden="true">🏰</div>
      <h1>Triple T Integration Disney Park Challenge</h1>
      <p class="notion-tagline">Who wants to go to DisneyWorld with Triple T?</p>
      <div class="mascot-strip" aria-label="Character teams">
        <span><img src="/assets/characters/mickey-card.png" alt="Mickey artwork" />Mickey Method</span>
        <span><img src="/assets/characters/minnie-card.png" alt="Minnie artwork" />Minnie Momentum</span>
        <span><img src="/assets/characters/donald-card.png" alt="Donald artwork" />Donald Derivatives</span>
        <span><img src="/assets/characters/goofy-card.png" alt="Goofy artwork" />Goofy Graphs</span>
        <span><img src="/assets/characters/castle-cover.png" alt="Castle artwork" />Castle Crew</span>
      </div>
      <div class="notion-action-row">
        <h2>Click on the park of your choice!</h2>
        <div class="actions">
          <button class="btn gold" data-action="host">Host Park</button>
          <button class="btn secondary" data-action="join-screen">Join Room</button>
          <a class="btn secondary btn-link" href="/lessons.html">Lesson Map</a>
        </div>
      </div>
      <p class="official-line">Pick an avatar, race through 30 harder BC integration missions, unlock streak powers, and climb the 3D infinite parkour leaderboard.</p>
      ${avatarPicker()}
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
    </section>
    ${lessonStats()}
    ${climbPanel("Preview the Infinite Disney Parkour Tower")}
    ${parkBoard()}
  `);
}

function renderJoin() {
  return shell(`
    <section class="grid">
      <form class="panel join-panel" data-form="join">
        <h2>Join a live room</h2>
        <label class="field">
          <span>Your display name</span>
          <input name="name" maxlength="24" placeholder="Mickey Scholar" required />
        </label>
        <label class="field">
          <span>Room code</span>
          <input name="roomCode" maxlength="5" placeholder="ABCDE" value="${escapeHtml(state.roomCode)}" required />
        </label>
        <input type="hidden" name="avatar" value="${escapeHtml(state.selectedAvatar)}" />
        <div class="field">
          <span>Choose your parkour avatar</span>
          ${avatarPicker()}
        </div>
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
        <button class="btn gold" type="submit">Enter Park</button>
        <button class="btn secondary" type="button" data-action="home">Back</button>
      </form>
      <aside class="panel solution">
        <span class="badge">Student Entrance</span>
        <h2>How players use this in Notion</h2>
        <p>Open the Notion page, choose an avatar, type the room code from the host screen, and answer before time runs out.</p>
        <p class="notice">Every correct answer turns points into climb height. The leaderboard ranks the highest parkour climbers first.</p>
      </aside>
    </section>
  `);
}

function renderLobby() {
  const players = state.room.players.map(playerRow).join("") || `<p class="muted">Waiting for players...</p>`;
  const isHost = state.role === "host";
  return shell(`
    <section class="lobby">
      <div class="panel">
        <p class="muted">${isHost ? "Share this code with players" : "You are in the park"}</p>
        <div class="room-code">${escapeHtml(state.room.code)}</div>
        <p class="notice">${isHost ? "Players enter this room code from the same website link. Start when everyone is listed." : "You joined successfully. Stay on this screen until the host starts the first mission."}</p>
        <div class="actions" style="margin-top: 18px;">
          ${isHost ? `<button class="btn gold" data-action="start">Start Game</button>` : `<span class="badge">Waiting for host</span>`}
        </div>
        ${lessonStats()}
      </div>
      <div class="panel">
        <h2>Players</h2>
        <div class="player-list">${players}</div>
      </div>
      ${climbPanel(isHost ? "Live Lobby Climb Preview" : "Your Avatar Is Checked In")}
    </section>
  `);
}

function playerRow(player) {
  return `
    <div class="player-row">
      <strong><span class="mini-avatar" style="--avatar-color:${getAvatar(player.avatar).color}">${escapeHtml(getAvatar(player.avatar).short)}</span>${escapeHtml(player.name)}</strong>
      <span class="badge">${Math.round(player.height || 0)} ft · ${player.score} pts${player.answered ? " · checked in" : ""}</span>
    </div>
  `;
}

function rankBadge(index, height) {
  if (index === 0) return "Castle Champion";
  if (height >= 1500) return "Skyline Legend";
  if (height >= 900) return "Loop Breaker";
  if (height >= 500) return "Tower Runner";
  return "Park Explorer";
}

function currentPlayer() {
  return state.room?.players.find((player) => player.id === state.playerId) || null;
}

function secondsLeft() {
  if (!state.room?.questionStartedAt || !state.room?.question) return 0;
  const elapsed = Math.floor((state.now - state.room.questionStartedAt) / 1000);
  return Math.max(0, state.room.question.timeLimitSeconds - elapsed);
}

function renderQuestion() {
  const question = state.room.question;
  const choices = question.choices.map((choice) => `
    <button class="choice" style="background:${choice.color}" data-choice="${escapeHtml(choice.id)}" ${state.role === "host" || state.answeredChoiceId ? "disabled" : ""}>
      <span>${escapeHtml(choice.park)}</span>
      <strong>${escapeHtml(choice.text)}</strong>
    </button>
  `).join("");

  return shell(`
    <section class="question-layout">
      <div class="question-header">
        <div class="question-card">
          <span class="badge">Park Stop ${state.room.currentQuestionIndex + 1} of ${state.room.totalQuestions} · ${escapeHtml(question.difficulty)}</span>
          <span class="badge score-badge">Base + speed + streak + powers</span>
          <h2>${escapeHtml(question.title)}</h2>
          <p class="muted">${escapeHtml(question.story)}</p>
          <div class="prompt">${escapeHtml(question.prompt)}</div>
          <div class="progress-rail"><span style="width:${Math.round(((state.room.currentQuestionIndex + 1) / state.room.totalQuestions) * 100)}%"></span></div>
        </div>
        <div class="timer">${secondsLeft()}</div>
      </div>
      ${state.role === "host" ? hostAnswerMonitor() : ""}
      <div class="choices">${choices}</div>
      ${state.answeredChoiceId ? `<p class="notice">Ticket locked. Watch the host screen for the park reveal.</p>` : ""}
    </section>
  `);
}

function hostAnswerMonitor() {
  const answered = state.room.players.filter((player) => player.answered).length;
  return `
    <div class="panel">
      <div class="actions">
        <span class="badge">${answered}/${state.room.players.length} checked in</span>
        <button class="btn secondary" data-action="reveal">Reveal Now</button>
      </div>
    </div>
  `;
}

function renderResults() {
  const results = state.room.lastResults;
  const rows = (results?.playerResults || []).map((result, index) => `
    <div class="result-row">
      <strong><span class="mini-avatar" style="--avatar-color:${getAvatar(result.avatar).color}">${escapeHtml(getAvatar(result.avatar).short)}</span>#${index + 1} ${escapeHtml(result.name)}</strong>
      <span class="badge">${result.isCorrect ? `+${result.pointsAwarded} pts · +${result.heightGain} ft` : "Missed"} · ${result.frozenPenalty ? "frozen" : result.speedBonus ? `speed +${result.speedBonus}` : "no speed"} · ${Math.round(result.height || 0)} ft</span>
    </div>
  `).join("") || `<p class="muted">No answers submitted.</p>`;

  return shell(`
    <section class="grid">
      <div class="panel solution">
        <span class="badge">Park reveal</span>
        <h2>${escapeHtml(results?.correctText || "")}</h2>
        <p>${escapeHtml(results?.explanation || "")}</p>
        <p class="notice">${escapeHtml(results?.workedSolution || "")}</p>
        <div class="score-breakdown">
          <div><strong>${results?.pointValue || 0}</strong><span>Base</span></div>
          <div><strong>Speed</strong><span>Up to 50%</span></div>
          <div><strong>Height</strong><span>1 ft per 22 pts</span></div>
        </div>
        <div class="actions">
          ${state.role === "host" ? `<button class="btn gold" data-action="next">${state.room.currentQuestionIndex >= state.room.totalQuestions - 1 ? "Finish Game" : "Next Mission"}</button>` : `<span class="badge">Waiting for host</span>`}
        </div>
        ${state.role === "player" ? powerPanel() : ""}
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      </div>
      <div class="panel leaderboard">
        <h2>Climb Leaderboard</h2>
        ${rows}
        ${powerLog()}
      </div>
      ${climbPanel("Results Tower")}
    </section>
  `);
}

function powerPanel() {
  const player = currentPlayer();
  if (!player) return "";
  if (player.powerUsedThisRound) {
    return `<div class="power-panel"><span class="badge">Magic used</span><p class="muted">You used your one power move for this round.</p></div>`;
  }

  return `
    <div class="power-panel">
      <div>
        <span class="badge">Streak Magic</span>
        <h3>${player.streak}-streak power moves</h3>
      </div>
      <p class="muted">Power moves are available only on results screens. Build a high streak to unlock stronger moves.</p>
      <div class="power-grid">
        <button class="power-card" data-power="steal" ${player.streak < 3 ? "disabled" : ""}>
          <strong>Steal</strong>
          <span>3 streak · take 300 from the top rival</span>
        </button>
        <button class="power-card" data-power="freeze" ${player.streak < 4 ? "disabled" : ""}>
          <strong>Freeze</strong>
          <span>4 streak · remove top rival's next speed bonus</span>
        </button>
        <button class="power-card danger" data-power="nuke" ${player.streak < 5 ? "disabled" : ""}>
          <strong>Nuke</strong>
          <span>5 streak · drain 200 from each player ahead</span>
        </button>
      </div>
    </div>
  `;
}

function powerLog() {
  const logs = state.room?.actionLog || state.room?.lastResults?.powerLog || [];
  if (!logs.length) return "";
  return `
    <div class="action-log">
      <h3>Magic Feed</h3>
      ${logs.map((log) => `<p>${escapeHtml(log)}</p>`).join("")}
    </div>
  `;
}

function renderFinished() {
  const rows = [...state.room.players]
    .sort((a, b) => (b.height || 0) - (a.height || 0) || b.score - a.score)
    .map((player, index) => `
      <div class="result-row">
        <strong><span class="mini-avatar" style="--avatar-color:${getAvatar(player.avatar).color}">${escapeHtml(getAvatar(player.avatar).short)}</span>#${index + 1} ${escapeHtml(player.name)}</strong>
        <span class="badge">${escapeHtml(rankBadge(index, player.height || 0))} · ${Math.round(player.height || 0)} ft · ${player.score} pts</span>
      </div>
    `).join("");

  return shell(`
    <section class="grid">
      <div class="panel solution">
        <span class="badge">Quest Complete</span>
        <h2>Final Parkour Heights</h2>
        <p>The final winner is the player who climbed the highest. Use the leaderboard for awards, recovery credit, or a quick notebook reflection.</p>
        <button class="btn secondary" data-action="home">Back Home</button>
      </div>
      <div class="panel leaderboard">${rows}</div>
      ${climbPanel("Final Infinite Climb")}
    </section>
  `);
}

function mountInteractiveScenes() {
  const stage = document.querySelector("#climb-stage");
  if (stage) renderClimbScene(stage, climbPlayers());
}

function render() {
  if (!state.deck) return;
  if (state.view === "join") app.innerHTML = renderJoin();
  else if (state.room?.status === "lobby") app.innerHTML = renderLobby();
  else if (state.room?.status === "answering") app.innerHTML = renderQuestion();
  else if (state.room?.status === "results") app.innerHTML = renderResults();
  else if (state.room?.status === "finished") app.innerHTML = renderFinished();
  else app.innerHTML = renderHome();
  mountInteractiveScenes();
}

app.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const choiceId = event.target.closest("[data-choice]")?.dataset.choice;
  const power = event.target.closest("[data-power]")?.dataset.power;
  const avatar = event.target.closest("[data-avatar]")?.dataset.avatar;

  if (avatar) {
    state.selectedAvatar = avatar;
    localStorage.setItem("quizAvatar", avatar);
    render();
    return;
  }

  if (power) {
    const reply = await api("/api/player/power", {
      roomCode: state.roomCode,
      playerId: state.playerId,
      power
    });
    state.error = reply.ok ? "" : reply.error;
    render();
    return;
  }

  if (choiceId) {
    const reply = await api("/api/player/answer", {
      roomCode: state.roomCode,
      playerId: state.playerId,
      choiceId
    });
    if (reply.ok) state.answeredChoiceId = choiceId;
    else state.error = reply.error;
    render();
    return;
  }

  if (!action) return;

  if (action === "home") {
    if (state.events) state.events.close();
    localStorage.removeItem("quizPlayerId");
    localStorage.removeItem("quizHostSecret");
    localStorage.removeItem("quizRoomCode");
    Object.assign(state, {
      view: "home",
      room: null,
      role: null,
      playerId: "",
      hostSecret: "",
      roomCode: "",
      answeredChoiceId: "",
      error: ""
    });
    render();
  }

  if (action === "join-screen") {
    state.view = "join";
    state.error = "";
    render();
  }

  if (action === "host") {
    const reply = await api("/api/host/create", { hostName: "Teacher" });
    if (reply.ok) {
      state.view = "room";
      state.deck = reply.deck;
      state.room = reply.room;
      state.role = "host";
      state.hostSecret = reply.hostSecret;
      state.roomCode = reply.room.code;
      localStorage.setItem("quizHostSecret", state.hostSecret);
      localStorage.setItem("quizRoomCode", state.roomCode);
      connectEvents(state.roomCode);
    } else {
      state.error = reply.error;
    }
    render();
  }

  if (action === "start") await api("/api/host/start", { roomCode: state.roomCode, hostSecret: state.hostSecret });
  if (action === "next") await api("/api/host/next", { roomCode: state.roomCode, hostSecret: state.hostSecret });
  if (action === "reveal") await api("/api/host/reveal", { roomCode: state.roomCode, hostSecret: state.hostSecret });
});

app.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-form='join']");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const reply = await api("/api/player/join", {
    name: data.get("name"),
    roomCode: data.get("roomCode"),
    avatar: data.get("avatar") || state.selectedAvatar
  });
  if (reply.ok) {
    state.view = "room";
    state.deck = reply.deck;
    state.room = reply.room;
    state.role = "player";
    state.playerId = reply.playerId;
    state.roomCode = reply.room.code;
    state.error = "";
    localStorage.setItem("quizPlayerId", state.playerId);
    localStorage.setItem("quizRoomCode", state.roomCode);
    connectEvents(state.roomCode);
  } else {
    state.error = reply.error;
  }
  render();
});

await loadDeck();
render();
