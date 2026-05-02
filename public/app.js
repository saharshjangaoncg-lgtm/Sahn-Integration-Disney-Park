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
  selectedPark: localStorage.getItem("quizParkTheme") || "castle",
  gameDurationMinutes: Number(localStorage.getItem("quizGameDurationMinutes") || 20),
  previewRoom: null,
  previewCode: "",
  joinName: "",
  answeredChoiceId: "",
  error: "",
  events: null,
  now: Date.now()
};

setInterval(() => {
  state.now = Date.now();
  document.querySelectorAll("[data-park-clock]").forEach((node) => {
    node.textContent = formatSeconds(overallSecondsLeft());
  });
  document.querySelectorAll("[data-question-clock]").forEach((node) => {
    node.textContent = questionClockLabel();
  });
  if (state.view !== "climb" && (state.room?.status === "answering" || state.room?.gameEndsAt)) render();
}, 1000);

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

async function getJson(path) {
  const response = await fetch(path);
  return response.json();
}

function connectEvents(roomCode) {
  if (state.events) state.events.close();
  state.events = new EventSource(`/api/events?roomCode=${encodeURIComponent(roomCode)}`);
  state.events.addEventListener("room", (event) => {
    const previousStatus = state.room?.status;
    state.room = JSON.parse(event.data);
    state.roomCode = state.room.code;
    localStorage.setItem("quizRoomCode", state.roomCode);
    if (state.room.status !== "answering") state.answeredChoiceId = "";
    if (state.view === "climb" && previousStatus === state.room.status && state.room.status === "answering") {
      document.querySelectorAll("[data-park-clock]").forEach((node) => {
        node.textContent = formatSeconds(overallSecondsLeft());
      });
      document.querySelectorAll("[data-question-clock]").forEach((node) => {
        node.textContent = questionClockLabel();
      });
      mountInteractiveScenes();
      return;
    }
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
  const park = parkInfo();
  return `
    <main class="shell" style="--course-color:${park.color || "#7b5aa6"}">
      <header class="topbar">
        <div class="brand">
          <div class="castle">${state.deck?.theme?.castleEmoji || "🏰"}</div>
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p class="muted">${escapeHtml(subtitle)}</p>
          </div>
        </div>
        <div class="top-badges">
          <span class="badge">${escapeHtml(park.title || "Castle Course")}</span>
          ${state.room?.gameEndsAt ? `<span class="badge live-clock">Park Clock ${formatSeconds(overallSecondsLeft())}</span>` : ""}
          ${state.room ? `<span class="badge">Room ${escapeHtml(state.room.code)}</span>` : ""}
        </div>
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
        <button class="park-card ${currentParkTheme() === card.themeId ? "active" : ""}" data-park="${escapeHtml(card.themeId || "castle")}" style="--card-color:${card.color}">
          <div class="park-visual">
            ${card.image ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)} artwork" />` : `<span>${escapeHtml(card.icon)}</span>`}
            <em>${escapeHtml(card.label)}</em>
          </div>
          <div class="park-caption">
            <strong>${escapeHtml(card.title)}</strong>
            <span>${escapeHtml(card.description || card.label)}</span>
          </div>
        </button>
      `).join("")}
    </div>
  `;
}

function parkInfo(themeId = currentParkTheme()) {
  return state.deck?.theme?.parkCards?.find((card) => card.themeId === themeId) || state.deck?.theme?.parkCards?.[0] || {
    title: "Castle Course",
    themeId: "castle",
    label: "Castle",
    color: "#7b5aa6",
    description: "Stone towers, gold rails, and castle ramparts."
  };
}

function currentParkTheme() {
  return state.room?.parkTheme || state.selectedPark || "castle";
}

function formatSeconds(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function overallSecondsLeft() {
  if (!state.room?.gameEndsAt) return state.gameDurationMinutes * 60;
  return Math.max(0, Math.ceil((state.room.gameEndsAt - state.now) / 1000));
}

function claimedAvatarIds(room = state.room || state.previewRoom) {
  return new Set((room?.players || [])
    .filter((player) => player.id !== state.playerId)
    .map((player) => player.avatar));
}

function firstAvailableAvatar(room = state.room || state.previewRoom) {
  const claimed = claimedAvatarIds(room);
  return avatarOptions.find((avatar) => !claimed.has(avatar.id))?.id || avatarOptions[0].id;
}

function safeSelectedAvatar(room = state.room || state.previewRoom) {
  const claimed = claimedAvatarIds(room);
  return claimed.has(state.selectedAvatar) ? firstAvailableAvatar(room) : state.selectedAvatar;
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

function avatarPicker(room = state.room || state.previewRoom) {
  const claimed = claimedAvatarIds(room);
  const selectedId = safeSelectedAvatar(room);
  const selected = getAvatar(selectedId);
  const groups = [
    { id: "class", title: "Class Crew" },
    { id: "character", title: "Character Crew" }
  ];
  return `
    <div class="avatar-select-card" style="--avatar-color:${selected.color}; --avatar-glow:${selected.glow}">
      <div class="avatar-assignment">
        <span>${escapeHtml(selected.short)}</span>
        <div>
          <strong>Appointed character: ${escapeHtml(selected.name)}</strong>
          <em>This is the character that appears on the 3D obstacle course.</em>
        </div>
      </div>
      <label class="field avatar-select-field">
        <span>Character dropdown</span>
        <select name="avatar" data-avatar-select>
          ${groups.map((group) => `
            <optgroup label="${escapeHtml(group.title)}">
              ${avatarOptions.filter((avatar) => avatar.category === group.id).map((avatar) => {
                const taken = claimed.has(avatar.id);
                return `<option value="${escapeHtml(avatar.id)}" ${avatar.id === selectedId ? "selected" : ""} ${taken ? "disabled" : ""}>${escapeHtml(avatar.name)}${taken ? " - taken" : ""}</option>`;
              }).join("")}
            </optgroup>
          `).join("")}
        </select>
      </label>
    </div>
  `;
}

function homeAvatarPicker() {
  return avatarPicker(null);
}

function sampleClimbers() {
  return [
    { id: "saharsh", name: "Saharsh", avatar: "saharsh", score: 1200, height: 842, direction: 3 },
    { id: "anikshaa", name: "Anikshaa", avatar: "anikshaa", score: 900, height: 735, direction: -2 },
    { id: "joy", name: "Joy", avatar: "joy", score: 600, height: 641, direction: 1 },
    { id: "divyam", name: "Divyam", avatar: "divyam", score: 300, height: 548, direction: -1 },
    { id: "vtl", name: "VTL", avatar: "vtl", score: 1500, height: 436, direction: 2 }
  ];
}

function climbPlayers() {
  const players = state.room?.players?.length ? state.room.players : sampleClimbers();
  return [...players].sort((a, b) => (b.height || 0) - (a.height || 0) || (b.score || 0) - (a.score || 0));
}

function climbPanel(title = "3D Infinite Parkour Climb", options = {}) {
  const players = climbPlayers();
  const park = parkInfo();
  const current = currentPlayer();
  const climbCost = state.room?.climbCost || 300;
  const climbHeight = state.room?.climbHeight || 24;
  const canClimb = state.role === "player" && current && state.room?.status !== "finished" && current.score >= climbCost;
  const immersive = Boolean(options.immersive);
  const rows = players.slice(0, 5).map((player, index) => {
    const avatar = getAvatar(player.avatar);
    return `
      <div class="height-row" style="--avatar-color:${avatar.color}">
        <span>${escapeHtml(avatar.short)}</span>
        <strong>#${index + 1} ${escapeHtml(player.name)}</strong>
        <em>${Math.round(player.height || 0)} ft · ${player.score || 0} pts</em>
      </div>
    `;
  }).join("");

  return `
    <section class="climb-shell ${immersive ? "climb-shell-immersive" : ""}" style="--course-color:${park.color || "#7b5aa6"}">
      <div class="climb-copy">
        <span class="badge">${escapeHtml(park.label || "Course")} selected</span>
        <h2>${escapeHtml(title)}</h2>
        <p class="muted">${escapeHtml(park.description || "")} Answer questions to earn point-bank currency, open the Climb Course, then spend ${climbCost} points to attempt the next ${climbHeight} ft obstacle. Pick the wrong lane and your height resets to 0.</p>
        ${state.role === "player" && current ? climbControls(current, canClimb, climbCost, climbHeight, { showKeyboardHint: !immersive }) : ""}
        <div class="height-board">${rows}</div>
      </div>
      <div id="climb-stage" class="climb-stage" aria-label="3D parkour tower"></div>
    </section>
  `;
}

function climbControls(player, canClimb, climbCost, climbHeight, options = {}) {
  const next = player.nextObstacle || { title: "First Jump", label: "Forward", description: "Take the safe center lane." };
  const avatar = getAvatar(player.avatar);
  const showKeyboardHint = options.showKeyboardHint !== false;
  return `
    <div class="climb-controls">
      <div class="assigned-climber" style="--avatar-color:${avatar.color}; --avatar-glow:${avatar.glow}">
        <span>${escapeHtml(avatar.short)}</span>
        <div>
          <strong>Assigned character: ${escapeHtml(avatar.name)}</strong>
          <em>Your selected avatar is the climber on the 3D course.</em>
        </div>
      </div>
      <div class="climb-bank">
        <strong>${player.score || 0} pts</strong>
        <span>${Math.floor((player.score || 0) / climbCost)} climbs ready</span>
      </div>
      <div class="obstacle-card">
        <span>Next obstacle</span>
        <strong>${escapeHtml(next.title)} · Aim ${escapeHtml(next.label)}</strong>
        <em>${escapeHtml(next.description || "Clear the correct lane or fall to ground level.")}</em>
      </div>
      <div class="climb-buttons">
        <button class="btn secondary" data-climb="left" ${canClimb ? "" : "disabled"}>Left +${climbHeight} ft</button>
        <button class="btn gold" data-climb="straight" ${canClimb ? "" : "disabled"}>Forward +${climbHeight} ft</button>
        <button class="btn secondary" data-climb="right" ${canClimb ? "" : "disabled"}>Right +${climbHeight} ft</button>
      </div>
      ${showKeyboardHint ? `
        <div class="keyboard-hint">
          <kbd>A</kbd><kbd>←</kbd><span>left</span>
          <kbd>W</kbd><kbd>↑</kbd><kbd>Space</kbd><span>jump forward</span>
          <kbd>D</kbd><kbd>→</kbd><span>right</span>
        </div>
      ` : ""}
      ${canClimb ? "" : `<p class="muted">No climb available yet. Earn at least ${climbCost} points from questions or powers.</p>`}
    </div>
  `;
}

function gameNav({ climbMode = false } = {}) {
  const player = currentPlayer();
  const next = player?.nextObstacle || { title: "First Jump", label: "Forward" };
  const questionTime = state.room?.status === "answering" ? questionClockLabel() : "--";
  const statusLabel = state.room?.status === "answering"
    ? `Question ${state.room.currentQuestionIndex + 1}/${state.room.totalQuestions}`
    : state.room?.status === "results"
      ? "Results Reveal"
      : state.room?.status === "lobby"
        ? "Lobby"
        : "Quest Complete";

  const answered = state.room?.players?.filter((roomPlayer) => roomPlayer.answered).length || 0;
  const playerCount = state.room?.players?.length || 0;
  const chosenMinutes = Math.round((state.room?.gameDurationSeconds || state.gameDurationMinutes * 60) / 60);
  const stats = state.role === "host"
    ? `
        <div><span>Players</span><strong>${playerCount}</strong></div>
        <div><span>Answered</span><strong>${answered}/${playerCount}</strong></div>
        <div><span>Park</span><strong data-park-clock>${formatSeconds(overallSecondsLeft())}</strong></div>
        <div><span>Chosen</span><strong>${chosenMinutes} min</strong></div>
        <div><span>Question</span><strong data-question-clock>${questionTime}</strong></div>
      `
    : `
        <div><span>Points</span><strong>${player ? player.score || 0 : "-"}</strong></div>
        <div><span>Height</span><strong>${player ? `${Math.round(player.height || 0)} ft` : "-"}</strong></div>
        <div><span>Next</span><strong>${player ? next.label : "Watch"}</strong></div>
        <div><span>Park</span><strong data-park-clock>${formatSeconds(overallSecondsLeft())}</strong></div>
        <div><span>Question</span><strong data-question-clock>${questionTime}</strong></div>
      `;

  return `
    <nav class="game-nav">
      <div class="game-nav-title">
        <span class="badge">${escapeHtml(statusLabel)}</span>
        <strong>${climbMode ? "Climb Course Mode" : "Quiz Mode"}</strong>
      </div>
      <div class="game-nav-stats">${stats}</div>
      <div class="game-nav-actions">
        ${climbMode ? `<button class="btn secondary" data-action="quiz-screen">Back to Quiz</button>` : `<button class="btn gold" data-action="climb-screen" ${state.role !== "player" ? "disabled" : ""}>Climb Course</button>`}
      </div>
    </nav>
  `;
}

function renderClimbMode() {
  const player = currentPlayer();
  const park = parkInfo();
  return shell(`
    <section class="climb-mode-page" style="--course-color:${park.color || "#7b5aa6"}">
      ${gameNav({ climbMode: true })}
      <div class="climb-mode-hero">
        <div>
          <span class="badge">Third-person parkour</span>
          <h2>${escapeHtml(park.title)} Run</h2>
          <p class="muted">Control ${escapeHtml(player ? getAvatar(player.avatar).name : "your avatar")} on the 3D course. Your question timer pauses here. Use A/D or arrow keys to choose lanes, press W/up/space to jump forward, and drag on the course to look around.</p>
        </div>
        <div class="control-card">
          <kbd>A</kbd><kbd>←</kbd><span>left</span>
          <kbd>W</kbd><kbd>↑</kbd><kbd>Space</kbd><span>jump</span>
          <kbd>D</kbd><kbd>→</kbd><span>right</span>
        </div>
      </div>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      ${climbPanel("Playable 3D Climb Course", { immersive: true })}
    </section>
  `);
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
          <button class="btn gold" data-action="host">Host ${escapeHtml(parkInfo().label || "Park")}</button>
          <button class="btn secondary" data-action="join-screen">Join Room</button>
          <a class="btn secondary btn-link" href="/lessons.html">Lesson Map</a>
        </div>
      </div>
      <p class="official-line">Pick a park course, choose an avatar, earn points from BC integration, then spend those points to climb through themed 3D obstacles.</p>
      <div class="home-picker-block">
        <div>
          <span class="badge">30 climbers</span>
          <h2>Choose your appointed character</h2>
        </div>
        ${homeAvatarPicker()}
      </div>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
    </section>
    ${lessonStats()}
    ${climbPanel("Preview the Infinite Disney Parkour Tower")}
    <section class="course-selector-block">
      <div>
        <span class="badge">Functional course selector</span>
        <h2>Choose the park obstacle set</h2>
      </div>
      ${parkBoard()}
    </section>
  `);
}

function renderJoin() {
  return shell(`
    <section class="grid">
      <form class="panel join-panel" data-form="join">
        <h2>Join a live room</h2>
        <label class="field">
          <span>Your display name</span>
          <input name="name" maxlength="24" placeholder="Mickey Scholar" value="${escapeHtml(state.joinName)}" required />
        </label>
        <label class="field">
          <span>Room code</span>
          <input name="roomCode" data-room-code-input maxlength="5" placeholder="ABCDE" value="${escapeHtml(state.previewCode || state.roomCode)}" required />
        </label>
        <div class="field">
          <span>Choose your appointed character</span>
          ${state.previewRoom ? `<p class="notice">Live room found. Taken avatars are locked.</p>` : `<p class="muted">Enter a 5-character room code to see which avatars are already taken.</p>`}
          ${avatarPicker(state.previewRoom)}
        </div>
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
        <button class="btn gold" type="submit">Enter Park</button>
        <button class="btn secondary" type="button" data-action="home">Back</button>
      </form>
      <aside class="panel solution">
        <span class="badge">Student Entrance</span>
        <h2>How players use this in Notion</h2>
        <p>Open the Notion page, choose an avatar, type the room code from the host screen, and answer before time runs out.</p>
        <p class="notice">Correct answers fill your point bank. Spend points to climb; if your bank is empty, you must answer more questions.</p>
      </aside>
    </section>
  `);
}

function timerSetup() {
  const options = [10, 15, 20, 30, 45];
  return `
    <div class="timer-setup">
      <div>
        <span class="badge">Overall Timer</span>
        <h3>${state.gameDurationMinutes} minute park clock</h3>
        <p class="muted">This is the whole game timer. Each question still has its own internal countdown.</p>
      </div>
      <div class="timer-options">
        ${options.map((minutes) => `
          <button class="timer-chip ${state.gameDurationMinutes === minutes ? "active" : ""}" data-duration="${minutes}">${minutes} min</button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderLobby() {
  const players = state.room.players.map(playerRow).join("") || `<p class="muted">Waiting for players...</p>`;
  const isHost = state.role === "host";
  return shell(`
    <section class="lobby">
      ${state.role === "player" ? gameNav() : ""}
      <div class="panel">
        <p class="muted">${isHost ? "Share this code with players" : "You are in the park"}</p>
        <div class="room-code">${escapeHtml(state.room.code)}</div>
        <p class="notice">${isHost ? "Players enter this room code from the same website link. Start when everyone is listed." : "You joined successfully. Stay on this screen until the host starts the first mission."}</p>
        ${isHost ? timerSetup() : `<div class="timer-setup compact"><span class="badge">Park Clock</span><strong>${Math.round((state.room.gameDurationSeconds || state.gameDurationMinutes * 60) / 60)} minutes when host starts</strong></div>`}
        <div class="actions" style="margin-top: 18px;">
          ${isHost ? `<button class="btn gold" data-action="start">Start Game</button>` : `<span class="badge">Waiting for host</span>`}
        </div>
        ${lessonStats()}
      </div>
      <div class="panel">
        <h2>Players</h2>
        <div class="player-list">${players}</div>
      </div>
      ${isHost ? climbPanel("Live Lobby Climb Preview") : ""}
    </section>
  `);
}

function playerRow(player) {
  const next = player.nextObstacle?.label ? ` · next ${player.nextObstacle.label}` : "";
  return `
    <div class="player-row">
      <strong><span class="mini-avatar" style="--avatar-color:${getAvatar(player.avatar).color}">${escapeHtml(getAvatar(player.avatar).short)}</span>${escapeHtml(player.name)}</strong>
        <span class="badge">${Math.round(player.height || 0)} ft · ${player.score} climb pts${next}${player.answered ? " · checked in" : ""}</span>
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

function questionMillisecondsLeft() {
  if (!state.room?.questionStartedAt || !state.room?.question || state.room.status !== "answering") return 0;
  const player = currentPlayer();
  if (state.role === "player" && player?.questionTimeLeftMs != null) {
    return Math.max(0, Number(player.questionTimeLeftMs) || 0);
  }
  const liveTimers = (state.room.players || [])
    .map((roomPlayer) => roomPlayer.questionTimeLeftMs)
    .filter((timeLeft) => Number.isFinite(Number(timeLeft)))
    .map(Number);
  if (liveTimers.length) return Math.max(0, ...liveTimers);
  const elapsed = state.now - state.room.questionStartedAt;
  return Math.max(0, state.room.question.timeLimitSeconds * 1000 - elapsed);
}

function secondsLeft() {
  return Math.max(0, Math.ceil(questionMillisecondsLeft() / 1000));
}

function questionClockLabel() {
  if (state.room?.status !== "answering") return "--";
  const player = currentPlayer();
  if (state.role === "player" && player?.answered) return "Done";
  if (state.role === "player" && player?.questionPaused) return "Paused";
  if (state.role === "player" && (player?.questionTimedOut || secondsLeft() <= 0)) return "Time";
  return String(secondsLeft());
}

function renderQuestion() {
  const question = state.room.question;
  const player = currentPlayer();
  const timerClosed = state.role === "player" && (player?.questionTimedOut || secondsLeft() <= 0);
  const choices = question.choices.map((choice) => `
    <button class="choice" style="background:${choice.color}" data-choice="${escapeHtml(choice.id)}" ${state.role === "host" || state.answeredChoiceId || timerClosed ? "disabled" : ""}>
      <span>${escapeHtml(choice.park)}</span>
      <strong>${escapeHtml(choice.text)}</strong>
    </button>
  `).join("");

  return shell(`
    <section class="question-layout">
      ${gameNav()}
      <div class="question-header">
        <div class="question-card">
          <span class="badge">Park Stop ${state.room.currentQuestionIndex + 1} of ${state.room.totalQuestions} · ${escapeHtml(question.difficulty)}</span>
          <span class="badge score-badge">Base + speed + streak + powers</span>
          <h2>${escapeHtml(question.title)}</h2>
          <p class="muted">${escapeHtml(question.story)}</p>
          <div class="prompt">${escapeHtml(question.prompt)}</div>
          <div class="progress-rail"><span style="width:${Math.round(((state.room.currentQuestionIndex + 1) / state.room.totalQuestions) * 100)}%"></span></div>
        </div>
        <div class="timer-stack">
          <div class="timer"><span>${state.role === "host" ? "Question max" : "Your question"}</span><strong data-question-clock>${questionClockLabel()}</strong></div>
          <div class="timer small"><span>Park</span><strong>${formatSeconds(overallSecondsLeft())}</strong></div>
        </div>
      </div>
      ${state.role === "host" ? hostAnswerMonitor() : ""}
      <div class="choices">${choices}</div>
      ${state.answeredChoiceId ? `<p class="notice">Ticket locked. Watch the host screen for the park reveal.</p>` : ""}
      ${timerClosed && !state.answeredChoiceId ? `<p class="notice">Your question timer ended. Wait for the reveal, then keep climbing with any banked points.</p>` : ""}
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
      <span class="badge">${result.isCorrect ? `+${result.pointsAwarded} pts` : "Missed"} · ${result.climbsAvailable || 0} climbs banked · ${Math.round(result.height || 0)} ft · ${result.falls || 0} falls</span>
    </div>
  `).join("") || `<p class="muted">No answers submitted.</p>`;

  return shell(`
    <section class="grid">
      ${state.role === "player" ? gameNav() : ""}
      <div class="panel solution">
        <span class="badge">Park reveal</span>
        <h2>${escapeHtml(results?.correctText || "")}</h2>
        <p>${escapeHtml(results?.explanation || "")}</p>
        <p class="notice">${escapeHtml(results?.workedSolution || "")}</p>
        <div class="score-breakdown">
          <div><strong>${results?.pointValue || 0}</strong><span>Base</span></div>
          <div><strong>Speed</strong><span>Up to 50%</span></div>
          <div><strong>Climb</strong><span>Spend points after reveal</span></div>
        </div>
        <div class="actions">
          ${state.role === "host" ? `<button class="btn gold" data-action="next">${state.room.currentQuestionIndex >= state.room.totalQuestions - 1 ? "Finish Game" : "Next Mission"}</button>` : `<span class="badge">Waiting for host</span>`}
        </div>
        ${state.role === "player" ? powerPanel() : ""}
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      </div>
      <div class="panel leaderboard">
        <h2>Point Bank + Climb Board</h2>
        ${rows}
        ${powerLog()}
      </div>
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
          <span>3 streak · take 300 climb-bank points from the top rival</span>
        </button>
        <button class="power-card" data-power="freeze" ${player.streak < 4 ? "disabled" : ""}>
          <strong>Freeze</strong>
          <span>4 streak · remove top rival's next speed bonus</span>
        </button>
        <button class="power-card danger" data-power="nuke" ${player.streak < 5 ? "disabled" : ""}>
          <strong>Nuke</strong>
          <span>5 streak · drain 200 climb-bank points from each player ahead</span>
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
      ${state.role === "player" ? gameNav() : ""}
      <div class="panel solution">
        <span class="badge">Quest Complete</span>
        <h2>Final Parkour Heights</h2>
        <p>The final winner is the player who climbed the highest. Use the leaderboard for awards, recovery credit, or a quick notebook reflection.</p>
        <button class="btn secondary" data-action="home">Back Home</button>
      </div>
      <div class="panel leaderboard">${rows}</div>
    </section>
  `);
}

function mountInteractiveScenes() {
  const stage = document.querySelector("#climb-stage");
  if (stage) renderClimbScene(stage, climbPlayers(), currentParkTheme(), state.view === "climb" ? state.playerId : "");
}

async function attemptClimb(turn) {
  if (state.role !== "player" || !state.room || state.room.status === "finished") return;
  const player = currentPlayer();
  const climbCost = state.room?.climbCost || 300;
  if (!player || player.score < climbCost) {
    state.error = `You need ${climbCost} points to climb. Answer more questions to refill your point bank.`;
    render();
    return;
  }
  const reply = await api("/api/player/climb", {
    roomCode: state.roomCode,
    playerId: state.playerId,
    turn
  });
  state.error = reply.ok ? "" : reply.error;
  render();
}

function render() {
  if (!state.deck) return;
  if (state.view === "join") app.innerHTML = renderJoin();
  else if (state.view === "climb" && state.room) app.innerHTML = renderClimbMode();
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
  const park = event.target.closest("[data-park]")?.dataset.park;
  const climb = event.target.closest("[data-climb]")?.dataset.climb;
  const duration = event.target.closest("[data-duration]")?.dataset.duration;

  if (duration) {
    state.gameDurationMinutes = Number(duration);
    localStorage.setItem("quizGameDurationMinutes", String(state.gameDurationMinutes));
    render();
    return;
  }

  if (park) {
    state.selectedPark = park;
    localStorage.setItem("quizParkTheme", park);
    render();
    return;
  }

  if (climb) {
    await attemptClimb(climb);
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
      previewRoom: null,
      previewCode: "",
      answeredChoiceId: "",
      error: ""
    });
    render();
  }

  if (action === "join-screen") {
    state.view = "join";
    state.error = "";
    state.previewRoom = null;
    state.previewCode = state.roomCode || "";
    render();
  }

  if (action === "climb-screen") {
    if (state.role === "player" && state.room) {
      if (state.room.status === "answering") {
        const reply = await api("/api/player/mode", {
          roomCode: state.roomCode,
          playerId: state.playerId,
          mode: "climb"
        });
        if (reply.ok && reply.room) state.room = reply.room;
        state.error = reply.ok ? "" : reply.error;
      }
      state.view = "climb";
      render();
    }
  }

  if (action === "quiz-screen") {
    if (state.role === "player" && state.room?.status === "answering") {
      const reply = await api("/api/player/mode", {
        roomCode: state.roomCode,
        playerId: state.playerId,
        mode: "quiz"
      });
      if (reply.ok && reply.room) state.room = reply.room;
      state.error = reply.ok ? "" : reply.error;
    }
    state.view = "room";
    render();
  }

  if (action === "host") {
    const reply = await api("/api/host/create", { hostName: "Teacher", parkTheme: state.selectedPark });
    if (reply.ok) {
      state.view = "room";
      state.deck = reply.deck;
      state.room = reply.room;
      state.role = "host";
      state.hostSecret = reply.hostSecret;
      state.roomCode = reply.room.code;
      state.selectedPark = reply.room.parkTheme || state.selectedPark;
      localStorage.setItem("quizHostSecret", state.hostSecret);
      localStorage.setItem("quizRoomCode", state.roomCode);
      localStorage.setItem("quizParkTheme", state.selectedPark);
      connectEvents(state.roomCode);
    } else {
      state.error = reply.error;
    }
    render();
  }

  if (action === "start") await api("/api/host/start", { roomCode: state.roomCode, hostSecret: state.hostSecret, gameDurationSeconds: state.gameDurationMinutes * 60 });
  if (action === "next") await api("/api/host/next", { roomCode: state.roomCode, hostSecret: state.hostSecret });
  if (action === "reveal") await api("/api/host/reveal", { roomCode: state.roomCode, hostSecret: state.hostSecret });
});

app.addEventListener("change", (event) => {
  const select = event.target.closest("[data-avatar-select]");
  if (!select) return;
  state.selectedAvatar = select.value;
  localStorage.setItem("quizAvatar", state.selectedAvatar);
  render();
});

window.addEventListener("keydown", async (event) => {
  if (event.repeat || state.view !== "climb" || state.role !== "player" || !state.room || state.room.status === "finished") return;
  if (event.target?.matches?.("input, textarea, select")) return;
  const keyMap = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "straight",
    KeyW: "straight",
    Space: "straight"
  };
  const turn = keyMap[event.code];
  if (!turn) return;
  event.preventDefault();
  await attemptClimb(turn);
});

app.addEventListener("input", async (event) => {
  const input = event.target.closest("[data-room-code-input]");
  const nameInput = event.target.closest("input[name='name']");
  if (nameInput) state.joinName = nameInput.value;
  if (!input) return;
  const code = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  input.value = code;
  state.previewCode = code;
  if (code.length !== 5) {
    state.previewRoom = null;
    return;
  }
  const reply = await getJson(`/api/room?roomCode=${encodeURIComponent(code)}`).catch(() => ({ ok: false }));
  if (state.previewCode !== code) return;
  state.previewRoom = reply.ok ? reply.room : null;
  if (state.previewRoom && claimedAvatarIds(state.previewRoom).has(state.selectedAvatar)) {
    state.selectedAvatar = firstAvailableAvatar(state.previewRoom);
    localStorage.setItem("quizAvatar", state.selectedAvatar);
  }
  render();
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
    state.selectedPark = reply.room.parkTheme || state.selectedPark;
    state.error = "";
    localStorage.setItem("quizPlayerId", state.playerId);
    localStorage.setItem("quizRoomCode", state.roomCode);
    localStorage.setItem("quizParkTheme", state.selectedPark);
    connectEvents(state.roomCode);
  } else {
    state.error = reply.error;
  }
  render();
});

await loadDeck();
render();
