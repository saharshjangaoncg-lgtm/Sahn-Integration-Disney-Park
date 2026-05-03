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
let climbFrameId = 0;
let climbSyncInFlight = false;
let climbSyncTimer = null;
let climbStateSyncInFlight = false;
let climbStateSyncTimer = null;
let climbStateDirty = false;
const heldClimbKeys = new Set();
const pendingClimbTurns = [];
const climbMotion = {
  velocity: 0,
  steerVelocity: 0,
  verticalVelocity: 0,
  jumpOffset: 0,
  grounded: true,
  lastGroundedAt: Date.now(),
  pointAccumulator: 0,
  lastTime: 0,
  lastHudAt: 0,
  lastSceneAt: 0,
  jumpBufferUntil: 0
};

setInterval(() => {
  state.now = Date.now();
  refreshClockNodes();
}, 1000);

function refreshClockNodes() {
  document.querySelectorAll("[data-park-clock]").forEach((node) => {
    node.textContent = formatSeconds(overallSecondsLeft());
  });
  document.querySelectorAll("[data-question-clock]").forEach((node) => {
    node.textContent = questionClockLabel();
  });
}

async function api(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });
  return response.json();
}

function preserveLocalClimber(room, localPlayer) {
  if (!room || !localPlayer || !state.playerId) return room;
  const index = room.players?.findIndex((player) => player.id === state.playerId) ?? -1;
  if (index < 0) return room;
  const serverPlayer = room.players[index];
  room.players[index] = {
    ...serverPlayer,
    score: localPlayer.score,
    height: localPlayer.height,
    direction: localPlayer.direction,
    falls: localPlayer.falls,
    lastClimbAt: localPlayer.lastClimbAt,
    lastJumpAt: localPlayer.lastJumpAt,
    lastFallAt: localPlayer.lastFallAt,
    jumpOffset: localPlayer.jumpOffset,
    jumpArmedMoves: localPlayer.jumpArmedMoves,
    checkpointHeight: localPlayer.checkpointHeight,
    coyoteUntil: localPlayer.coyoteUntil,
    pendingCoyoteStep: localPlayer.pendingCoyoteStep,
    pendingCoyoteObstacle: localPlayer.pendingCoyoteObstacle,
    nextObstacle: serverPlayer.nextObstacle || localPlayer.nextObstacle,
    lastResult: localPlayer.lastResult || serverPlayer.lastResult
  };
  return room;
}

async function loadDeck() {
  const response = await fetch("/api/deck");
  state.deck = await response.json();
}

async function getJson(path) {
  const response = await fetch(path);
  return response.json();
}

function roomRenderSignature(room) {
  if (!room) return "";
  return JSON.stringify({
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    players: (room.players || []).map((player) => [
      player.id,
      player.score,
      Math.round(Number(player.height || 0) * 10) / 10,
      Math.round(Number(player.direction || 0) * 10) / 10,
      player.phase,
      player.currentQuestionIndex,
      player.answered,
      player.falls,
      player.streak,
      player.lastFallAt,
      player.lastJumpAt,
      player.questionTimedOut
    ]),
    actionLog: room.actionLog || []
  });
}

function roomPaceSignature(room) {
  if (!room) return "";
  return JSON.stringify({
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    players: (room.players || []).map((player) => [
      player.id,
      player.phase,
      player.currentQuestionIndex,
      player.answered,
      player.questionTimedOut
    ])
  });
}

function connectEvents(roomCode) {
  if (state.events) state.events.close();
  state.events = new EventSource(`/api/events?roomCode=${encodeURIComponent(roomCode)}`);
  state.events.addEventListener("room", (event) => {
    const previousStatus = state.room?.status;
    const previousSignature = roomRenderSignature(state.room);
    const previousPaceSignature = roomPaceSignature(state.room);
    const incomingRoom = JSON.parse(event.data);
    const localClimber = state.view === "climb" && state.role === "player" ? currentPlayer() : null;
    state.room = preserveLocalClimber(incomingRoom, localClimber);
    state.roomCode = state.room.code;
    localStorage.setItem("quizRoomCode", state.roomCode);
    if (state.room.status !== "answering") state.answeredChoiceId = "";
    const nextSignature = roomRenderSignature(state.room);
    const nextPaceSignature = roomPaceSignature(state.room);
    if (state.role === "host" && previousStatus === state.room.status && previousPaceSignature === nextPaceSignature) {
      refreshClockNodes();
      mountInteractiveScenes();
      return;
    }
    if (previousStatus === state.room.status && previousSignature === nextSignature) {
      refreshClockNodes();
      if (state.view === "climb") {
        refreshClimbHud();
        mountInteractiveScenes();
      }
      return;
    }
    if (state.view === "climb" && previousStatus === state.room.status && state.room.status === "answering") {
      refreshClockNodes();
      refreshClimbHud();
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
  const climbCost = state.room?.climbCost || 12;
  const climbHeight = state.room?.climbHeight || 4;
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
        <p class="muted">${escapeHtml(park.description || "")} Answer questions to fill your point bank, open the Climb Course, then run smoothly across real platform gaps. Space clears glowing jump pads; missing a jump stops you at the edge instead of randomly teleporting you.</p>
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
  const costs = state.room?.climbCosts || { forward: climbCost, side: 5, back: 4 };
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
        <strong data-climb-points>${player.score || 0} pts</strong>
        <span data-climb-ready>${Math.floor((player.score || 0) / costs.forward)} smooth steps banked</span>
      </div>
      <div class="obstacle-card">
        <span>Next platform gap</span>
        <strong data-climb-next>${escapeHtml(next.title)} · Jump gap at ${Math.round(nextGapHeight(player.height || 0))} ft</strong>
        <em data-climb-next-description>${escapeHtml(next.description || "Run to the glowing edge and press Space to clear the platform gap.")}</em>
      </div>
      <div class="climb-buttons">
        <button class="btn secondary" data-climb="left" data-climb-button="left" ${(player.score || 0) >= costs.side ? "" : "disabled"}>Left -${costs.side}</button>
        <button class="btn gold" data-climb="straight" data-climb-button="straight" ${(player.score || 0) >= costs.forward ? "" : "disabled"}>Run +${climbHeight} ft -${costs.forward}</button>
        <button class="btn jump" data-climb="jump" data-climb-button="jump" ${(player.score || 0) >= costs.forward ? "" : "disabled"}>Jump -${costs.forward}</button>
        <button class="btn secondary" data-climb="back" data-climb-button="back" ${(player.score || 0) >= costs.back ? "" : "disabled"}>Back -${costs.back}</button>
        <button class="btn secondary" data-climb="right" data-climb-button="right" ${(player.score || 0) >= costs.side ? "" : "disabled"}>Right -${costs.side}</button>
      </div>
      ${showKeyboardHint ? `
        <div class="keyboard-hint">
          <kbd>A</kbd><kbd>←</kbd><span>left</span>
          <kbd>W</kbd><kbd>↑</kbd><span>run</span>
          <kbd>Space</kbd><span>timed jump</span>
          <kbd>S</kbd><kbd>↓</kbd><span>back</span>
          <kbd>D</kbd><kbd>→</kbd><span>right</span>
        </div>
      ` : ""}
      <p class="muted" data-climb-message>${canClimb ? "Hold W to run, steer with A/D, and press Space to clear glowing platform gaps." : `No movement energy yet. Earn at least ${climbCost} points from questions or powers.`}</p>
    </div>
  `;
}

function gameNav({ climbMode = false } = {}) {
  const player = currentPlayer();
  const next = player?.nextObstacle || { title: "First Jump", label: "Forward" };
  const questionTime = state.room?.status === "answering" ? questionClockLabel() : "--";
  const playerQuestionIndex = player?.currentQuestionIndex ?? state.room?.currentQuestionIndex ?? 0;
  const statusLabel = state.room?.status === "answering"
    ? state.role === "host"
      ? "Live Student-Paced Session"
      : `Question ${playerQuestionIndex + 1}/${state.room.totalQuestions}`
    : state.room?.status === "results"
      ? "Results Reveal"
      : state.room?.status === "lobby"
        ? "Lobby"
        : "Quest Complete";

  const answered = state.room?.players?.filter((roomPlayer) => roomPlayer.answered).length || 0;
  const playerCount = state.room?.players?.length || 0;
  const activeCount = state.room?.players?.filter((roomPlayer) => roomPlayer.phase === "answering").length || 0;
  const finishedCount = state.room?.players?.filter((roomPlayer) => roomPlayer.phase === "finished").length || 0;
  const chosenMinutes = Math.round((state.room?.gameDurationSeconds || state.gameDurationMinutes * 60) / 60);
  const stats = state.role === "host"
    ? `
        <div><span>Players</span><strong>${playerCount}</strong></div>
        <div><span>Active</span><strong>${activeCount}</strong></div>
        <div><span>Park</span><strong data-park-clock>${formatSeconds(overallSecondsLeft())}</strong></div>
        <div><span>Chosen</span><strong>${chosenMinutes} min</strong></div>
        <div><span>Finished</span><strong>${finishedCount}</strong></div>
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
        <strong>${state.role === "host" ? "Host Session Clock" : climbMode ? "Climb Course Mode" : "Quiz Mode"}</strong>
      </div>
      <div class="game-nav-stats">${stats}</div>
      <div class="game-nav-actions">
        ${state.role === "host" ? `<span class="badge">Players control pace</span>` : climbMode ? `<button class="btn secondary" data-action="quiz-screen">Back to Quiz</button>` : `<button class="btn gold" data-action="climb-screen">Climb Course</button>`}
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
          <p class="muted">Control ${escapeHtml(player ? getAvatar(player.avatar).name : "your avatar")} on the 3D course. The quiz is student-paced, so no question countdown fights the movement. Hold W to run, press Space to clear glowing platform gaps, use S to back up, A/D to steer, and drag on the course to look around.</p>
        </div>
        <div class="control-card">
          <kbd>A</kbd><kbd>←</kbd><span>left</span>
          <kbd>W</kbd><kbd>↑</kbd><span>run</span>
          <kbd>Space</kbd><span>jump</span>
          <kbd>S</kbd><kbd>↓</kbd><span>back</span>
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
        <p class="muted">This is only the whole game clock. Questions are practice-paced now so the 3D movement stays smooth.</p>
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
  const progress = player.phase === "lobby" ? "waiting" : `Q${(player.currentQuestionIndex || 0) + 1}/${state.room?.totalQuestions || 30}`;
  return `
    <div class="player-row">
      <strong><span class="mini-avatar" style="--avatar-color:${getAvatar(player.avatar).color}">${escapeHtml(getAvatar(player.avatar).short)}</span>${escapeHtml(player.name)}</strong>
        <span class="badge">${progress} · ${escapeHtml(player.phase || "ready")} · ${Math.round(player.height || 0)} ft · ${player.score} pts${next}</span>
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

function currentQuestion() {
  if (state.role === "player") return currentPlayer()?.question || null;
  return state.room?.question || null;
}

function questionMillisecondsLeft() {
  if (state.room?.status !== "answering") return 0;
  if (state.room?.questionTimersEnabled === false) return null;
  const player = currentPlayer();
  if (state.role === "player" && player?.questionTimeLeftMs != null) {
    return Math.max(0, Number(player.questionTimeLeftMs) || 0);
  }
  const liveTimers = (state.room.players || [])
    .map((roomPlayer) => roomPlayer.questionTimeLeftMs)
    .filter((timeLeft) => Number.isFinite(Number(timeLeft)))
    .map(Number);
  if (liveTimers.length) return Math.max(0, ...liveTimers);
  const question = currentQuestion();
  const startedAt = player?.questionStartedAt || state.room?.questionStartedAt;
  if (!question || !startedAt) return 0;
  const elapsed = state.now - startedAt;
  return Math.max(0, question.timeLimitSeconds * 1000 - elapsed);
}

function secondsLeft() {
  const milliseconds = questionMillisecondsLeft();
  if (milliseconds == null) return null;
  return Math.max(0, Math.ceil(milliseconds / 1000));
}

function questionClockLabel() {
  if (state.room?.status !== "answering") return "--";
  if (state.room?.questionTimersEnabled === false) return "Practice";
  const player = currentPlayer();
  if (state.role === "player" && player?.phase === "results") return "Done";
  if (state.role === "player" && player?.phase === "finished") return "--";
  if (state.role === "player" && player?.questionPaused) return "Paused";
  if (state.role === "player" && (player?.questionTimedOut || secondsLeft() <= 0)) return "Time";
  return String(secondsLeft());
}

function renderQuestion() {
  const question = currentQuestion();
  const player = currentPlayer();
  if (!question || !player) return renderFinished();
  const timersEnabled = state.room?.questionTimersEnabled !== false;
  const timerClosed = timersEnabled && (player?.questionTimedOut || secondsLeft() <= 0);
  const choices = question.choices.map((choice) => `
    <button class="choice" style="background:${choice.color}" data-choice="${escapeHtml(choice.id)}" ${state.answeredChoiceId || timerClosed || player.phase !== "answering" ? "disabled" : ""}>
      <span>${escapeHtml(choice.park)}</span>
      <strong>${escapeHtml(choice.text)}</strong>
    </button>
  `).join("");

  return shell(`
    <section class="question-layout">
      ${gameNav()}
      <div class="question-header">
        <div class="question-card">
          <span class="badge">Park Stop ${(player.currentQuestionIndex || 0) + 1} of ${state.room.totalQuestions} · ${escapeHtml(question.difficulty)}</span>
          <span class="badge score-badge">Base + speed + streak + powers</span>
          <h2>${escapeHtml(question.title)}</h2>
          <p class="muted">${escapeHtml(question.story)}</p>
          <div class="prompt">${escapeHtml(question.prompt)}</div>
          <div class="progress-rail"><span style="width:${Math.round(((state.room.currentQuestionIndex + 1) / state.room.totalQuestions) * 100)}%"></span></div>
        </div>
        <div class="timer-stack">
          ${timersEnabled ? `<div class="timer"><span>Your question</span><strong data-question-clock>${questionClockLabel()}</strong></div>` : `<div class="timer"><span>Question pace</span><strong>Practice</strong></div>`}
          <div class="timer small"><span>Park</span><strong data-park-clock>${formatSeconds(overallSecondsLeft())}</strong></div>
        </div>
      </div>
      <div class="choices">${choices}</div>
      ${state.answeredChoiceId ? `<p class="notice">Ticket locked. Your reveal is ready.</p>` : ""}
      ${timerClosed && !state.answeredChoiceId ? `<p class="notice">Your question timer ended. Move to your reveal, then choose your next mission when ready.</p>` : ""}
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

function renderHostSession() {
  const rows = [...(state.room.players || [])]
    .sort((a, b) => (b.height || 0) - (a.height || 0) || (b.score || 0) - (a.score || 0))
    .map((player, index) => `
      <div class="result-row">
        <strong><span class="mini-avatar" style="--avatar-color:${getAvatar(player.avatar).color}">${escapeHtml(getAvatar(player.avatar).short)}</span>#${index + 1} ${escapeHtml(player.name)}</strong>
        <span class="badge">Q${(player.currentQuestionIndex || 0) + 1}/${state.room.totalQuestions} · ${escapeHtml(player.phase || "playing")} · ${Math.round(player.height || 0)} ft · ${player.score || 0} pts</span>
      </div>
    `).join("") || `<p class="muted">Waiting for players...</p>`;

  return shell(`
    <section class="grid">
      ${gameNav()}
      <div class="panel solution">
        <span class="badge">Host dashboard</span>
        <h2>Student-paced park session</h2>
        <p>The host only controls the overall park clock. Players answer, reveal, climb, and move to their next mission independently.</p>
        <div class="score-breakdown">
          <div><strong data-park-clock>${formatSeconds(overallSecondsLeft())}</strong><span>Park Clock</span></div>
          <div><strong>${Math.round((state.room.gameDurationSeconds || 0) / 60)}</strong><span>Chosen min</span></div>
          <div><strong>${state.room.players.length}</strong><span>Players</span></div>
        </div>
      </div>
      <div class="panel leaderboard">
        <h2>Live Progress + Height Board</h2>
        ${rows}
        ${powerLog()}
      </div>
      ${climbPanel("Live Course Preview", { immersive: false })}
    </section>
  `);
}

function renderResults() {
  const player = currentPlayer();
  const results = player?.lastResult;
  const rows = [...(state.room?.players || [])]
    .sort((a, b) => (b.height || 0) - (a.height || 0) || (b.score || 0) - (a.score || 0))
    .map((result, index) => `
    <div class="result-row">
      <strong><span class="mini-avatar" style="--avatar-color:${getAvatar(result.avatar).color}">${escapeHtml(getAvatar(result.avatar).short)}</span>#${index + 1} ${escapeHtml(result.name)}</strong>
      <span class="badge">Q${(result.currentQuestionIndex || 0) + 1} · ${escapeHtml(result.phase || "playing")} · ${Math.round(result.height || 0)} ft · ${result.score || 0} pts</span>
    </div>
  `).join("") || `<p class="muted">No answers submitted.</p>`;
  const isLastQuestion = (player?.currentQuestionIndex || 0) >= (state.room.totalQuestions || 1) - 1;

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
          <div><strong>Move</strong><span>Drain points on the course</span></div>
        </div>
        <div class="actions">
          <button class="btn gold" data-action="player-next">${isLastQuestion ? "Complete My Run" : "Next Mission"}</button>
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

function refreshClimbHud() {
  if (state.view !== "climb") return;
  const player = currentPlayer();
  if (!player) return;
  const next = player.nextObstacle || {};
  const costs = state.room?.climbCosts || { forward: state.room?.climbCost || 18, side: 9, back: 8 };
  const pointsNode = document.querySelector("[data-climb-points]");
  const readyNode = document.querySelector("[data-climb-ready]");
  const nextNode = document.querySelector("[data-climb-next]");
  const nextDescriptionNode = document.querySelector("[data-climb-next-description]");
  const messageNode = document.querySelector("[data-climb-message]");
  const navPointNode = document.querySelector(".game-nav-stats div:first-child strong");
  const navHeightNode = document.querySelector(".game-nav-stats div:nth-child(2) strong");
  const navNextNode = document.querySelector(".game-nav-stats div:nth-child(3) strong");

  if (pointsNode) pointsNode.textContent = `${player.score || 0} pts`;
  if (readyNode) readyNode.textContent = `${Math.floor((player.score || 0) / costs.forward)} smooth steps banked`;
  if (nextNode) nextNode.textContent = `${next.title || "Next platform"} · Jump gap at ${Math.round(nextGapHeight(player.height || 0))} ft`;
  if (nextDescriptionNode) nextDescriptionNode.textContent = next.description || "Run to the glowing edge and press Space to clear the platform gap.";
  if (messageNode) {
    messageNode.textContent = state.error || ((player.score || 0) >= costs.back
      ? "Hold W to run, steer with A/D, and press Space to clear glowing platform gaps."
      : `Movement energy empty. Answer more questions to refill your point bank.`);
  }
  if (navPointNode) navPointNode.textContent = player.score || 0;
  if (navHeightNode) navHeightNode.textContent = `${Math.round(player.height || 0)} ft`;
  if (navNextNode) navNextNode.textContent = `${Math.round(nextGapHeight(player.height || 0))} ft`;
  document.querySelectorAll("[data-climb-button]").forEach((button) => {
    const turn = button.getAttribute("data-climb-button");
    button.disabled = (player.score || 0) < movementCostForTurn(turn);
  });
}

function movementCostForTurn(turn) {
  const costs = state.room?.climbCosts || { forward: state.room?.climbCost || 18, side: 9, back: 8 };
  if (turn === "left" || turn === "right") return costs.side;
  if (turn === "back") return costs.back;
  return costs.forward;
}

function normalizedClimbTurn(turn) {
  if (turn === "left" || turn === "right" || turn === "back" || turn === "jump") return turn;
  return "forward";
}

function laneFromDirection(direction) {
  if (Math.abs(direction || 0) < 0.55) return 0;
  return Math.max(-1, Math.min(1, Math.sign(direction || 0)));
}

function obstacleHeight() {
  return state.room?.obstacleHeight || 72;
}

function nextGapHeight(height = 0) {
  const gap = obstacleHeight();
  return (Math.floor(Math.max(0, height) / gap) + 1) * gap;
}

function platformEdgeLimit() {
  return 3.45;
}

function clampCourseDirection(direction) {
  return Math.max(-3.7, Math.min(3.7, Number(direction || 0)));
}

function isOffPlatform(player) {
  return Math.abs(Number(player?.direction || 0)) > platformEdgeLimit();
}

function canClearPlatformGap(player, now) {
  return climbMotion.jumpOffset > 0.18
    || now - Number(player.lastJumpAt || 0) < 780
    || climbMotion.jumpBufferUntil > now;
}

function resetPlayerPhysics(player) {
  if (!player) return;
  player.jumpOffset = 0;
  player.coyoteUntil = 0;
  player.pendingCoyoteStep = 0;
  player.pendingCoyoteObstacle = null;
  climbMotion.velocity = 0;
  climbMotion.steerVelocity = 0;
  climbMotion.verticalVelocity = 0;
  climbMotion.jumpOffset = 0;
  climbMotion.grounded = true;
  climbMotion.lastGroundedAt = Date.now();
  climbMotion.pointAccumulator = 0;
}

function fallLocalClimber(player, fromHeight = player?.height || 0) {
  if (!player) return;
  const checkpoint = Math.max(0, player.checkpointHeight || 0);
  player.height = checkpoint;
  player.direction = 0;
  player.jumpArmedMoves = 0;
  player.lastFallAt = Date.now();
  player.falls = (player.falls || 0) + 1;
  resetPlayerPhysics(player);
  state.error = `Missed the obstacle timing and respawned at ${Math.round(checkpoint)} ft.`;
  if (player.lastResult) {
    player.lastResult = {
      ...player.lastResult,
      height: player.height,
      direction: player.direction,
      falls: player.falls || 0,
      score: player.score || 0
    };
  }
  scheduleClimbStateSync(40);
}

function expireCoyoteIfNeeded() {
  const player = currentPlayer();
  if (!player?.coyoteUntil || Date.now() <= player.coyoteUntil) return;
  player.coyoteUntil = 0;
  player.pendingCoyoteStep = 0;
  player.pendingCoyoteObstacle = null;
  climbMotion.velocity = Math.min(climbMotion.velocity, 0.2);
  refreshClimbHud();
}

async function attemptClimb(turn) {
  if (state.role !== "player" || !state.room || state.room.status === "finished") return;
  if (state.view === "climb") {
    applyClimbButtonImpulse(turn);
    return;
  }
  if (climbSyncInFlight) return;
  const player = currentPlayer();
  const moveCost = movementCostForTurn(turn);
  if (!player || player.score < moveCost) {
    state.error = `You need ${moveCost} points to move. Answer more questions to refill your point bank.`;
    if (state.view === "climb") refreshClimbHud();
    else render();
    return;
  }
  climbSyncInFlight = true;
  try {
    const reply = await api("/api/player/climb", {
      roomCode: state.roomCode,
      playerId: state.playerId,
      turn
    });
    state.error = reply.ok ? "" : reply.error;
    if (reply.ok && reply.room) state.room = reply.room;
    if (state.view === "climb") {
      refreshClimbHud();
      mountInteractiveScenes();
    } else {
      render();
    }
  } finally {
    climbSyncInFlight = false;
  }
}

function applyClimbButtonImpulse(turn) {
  const action = normalizedClimbTurn(turn);
  if (action === "jump") {
    climbMotion.jumpBufferUntil = Date.now() + 140;
  } else if (action === "left") {
    climbMotion.steerVelocity = Math.min(climbMotion.steerVelocity, -1.4);
  } else if (action === "right") {
    climbMotion.steerVelocity = Math.max(climbMotion.steerVelocity, 1.4);
  } else if (action === "back") {
    climbMotion.velocity = Math.min(climbMotion.velocity, -2.1);
  } else {
    climbMotion.velocity = Math.max(climbMotion.velocity, 4.4);
  }
  startClimbMovementLoop();
}

function applyLocalClimbMove(turn) {
  const player = currentPlayer();
  if (!player || state.role !== "player" || !state.room || state.room.status === "finished") return false;

  const action = normalizedClimbTurn(turn);
  const moveCost = movementCostForTurn(action);
  if ((player.score || 0) < moveCost) {
    state.error = `Movement energy empty. You need ${moveCost} points, so answer more questions before climbing again.`;
    refreshClimbHud();
    return false;
  }

  const climbHeight = state.room?.climbHeight || 2;
  const obstacleHeight = state.room?.obstacleHeight || 24;
  player.score = Math.max(0, (player.score || 0) - moveCost);
  player.lastClimbAt = Date.now();
  player.height ??= 0;
  player.direction ??= 0;
  player.jumpArmedMoves ??= 0;
  player.checkpointHeight ??= Math.floor((player.height || 0) / obstacleHeight) * obstacleHeight;

  if (action === "left" || action === "right") {
    const laneStep = 0.28;
    player.direction = Math.max(-2, Math.min(2, player.direction + (action === "left" ? -laneStep : laneStep)));
  } else if (action === "back") {
    player.height = Math.max(0, (player.height || 0) - climbHeight);
  } else if (action === "jump") {
    player.lastJumpAt = Date.now();
    player.jumpArmedMoves = 5;
    player.coyoteUntil = 0;
  } else {
    const jumpReady = (player.jumpArmedMoves || 0) > 0 || climbMotion.jumpBufferUntil > Date.now();
    if (player.jumpArmedMoves > 0) {
      player.jumpArmedMoves = Math.max(0, player.jumpArmedMoves - 1);
    }
    const oldHeight = player.height || 0;
    const oldStep = Math.floor(oldHeight / obstacleHeight);
    player.height = oldHeight + climbHeight;
    const newStep = Math.floor(player.height / obstacleHeight);

    if (newStep > oldStep) {
      const expectedLane = typeof player.nextObstacle?.turnValue === "number" ? player.nextObstacle.turnValue : 0;
      const currentLane = laneFromDirection(player.direction);
      if (currentLane !== expectedLane) {
        player.height = player.checkpointHeight || 0;
        player.direction = 0;
        player.jumpArmedMoves = 0;
        player.coyoteUntil = 0;
        player.lastFallAt = Date.now();
        player.falls = (player.falls || 0) + 1;
      } else if (!jumpReady) {
        player.height = oldHeight;
        player.coyoteUntil = Date.now() + 110;
      } else {
        player.jumpArmedMoves = 0;
        player.coyoteUntil = 0;
        player.checkpointHeight = newStep * obstacleHeight;
      }
    }
  }

  if (player.lastResult) {
    player.lastResult = {
      ...player.lastResult,
      score: player.score,
      height: player.height,
      direction: player.direction,
      lastJumpAt: player.lastJumpAt,
      lastFallAt: player.lastFallAt,
      falls: player.falls || 0
    };
  }

  state.error = "";
  return true;
}

function queueClimbMove(turn, options = {}) {
  if (!applyLocalClimbMove(turn)) return;
  pendingClimbTurns.push(normalizedClimbTurn(turn));
  refreshClimbHud();
  mountInteractiveScenes();

  if (options.flushSoon || pendingClimbTurns.length >= 10) {
    scheduleClimbSync(90);
  } else {
    scheduleClimbSync(260);
  }
}

function scheduleClimbSync(delay = 260) {
  if (climbSyncTimer) clearTimeout(climbSyncTimer);
  climbSyncTimer = setTimeout(() => {
    climbSyncTimer = null;
    flushClimbMoves();
  }, delay);
}

async function flushClimbMoves() {
  if (climbSyncInFlight || !pendingClimbTurns.length || !state.roomCode || !state.playerId) return;
  if (climbSyncTimer) {
    clearTimeout(climbSyncTimer);
    climbSyncTimer = null;
  }

  const turns = pendingClimbTurns.splice(0, 80);
  climbSyncInFlight = true;
  try {
    const reply = await api("/api/player/climb-batch", {
      roomCode: state.roomCode,
      playerId: state.playerId,
      turns
    });
    if (reply.ok && reply.room) {
      const localClimber = pendingClimbTurns.length ? currentPlayer() : null;
      state.room = preserveLocalClimber(reply.room, localClimber);
      state.error = "";
    } else {
      state.error = reply.error || "Climb sync paused. Keep answering questions if you run out of points.";
    }
  } finally {
    climbSyncInFlight = false;
    refreshClimbHud();
    mountInteractiveScenes();
    if (pendingClimbTurns.length) scheduleClimbSync(80);
  }
}

function climbStatePayload(player) {
  return {
    height: Math.max(0, Number(player.height || 0)),
    direction: Math.max(-2, Math.min(2, Number(player.direction || 0))),
    score: Math.max(0, Math.floor(Number(player.score || 0))),
    falls: Number(player.falls || 0),
    checkpointHeight: Math.max(0, Number(player.checkpointHeight || 0)),
    jumpOffset: Math.max(0, Number(player.jumpOffset || 0)),
    lastClimbAt: player.lastClimbAt || null,
    lastJumpAt: player.lastJumpAt || null,
    lastFallAt: player.lastFallAt || null
  };
}

function scheduleClimbStateSync(delay = 140) {
  climbStateDirty = true;
  if (climbStateSyncTimer) return;
  climbStateSyncTimer = setTimeout(() => {
    climbStateSyncTimer = null;
    flushClimbState();
  }, delay);
}

async function flushClimbState() {
  if (climbStateSyncInFlight) {
    scheduleClimbStateSync(80);
    return;
  }
  if (!climbStateDirty || !state.roomCode || !state.playerId) return;
  if (climbStateSyncTimer) {
    clearTimeout(climbStateSyncTimer);
    climbStateSyncTimer = null;
  }

  const player = currentPlayer();
  if (!player) return;
  const snapshot = climbStatePayload(player);
  climbStateDirty = false;
  climbStateSyncInFlight = true;
  try {
    const reply = await api("/api/player/climb-state", {
      roomCode: state.roomCode,
      playerId: state.playerId,
      snapshot
    });
    if (reply.ok && reply.room) {
      const localClimber = state.view === "climb" ? currentPlayer() : null;
      state.room = preserveLocalClimber(reply.room, localClimber);
      state.error = "";
    } else {
      state.error = reply.error || "Climb sync paused. Keep answering questions if you run out of points.";
    }
  } finally {
    climbStateSyncInFlight = false;
    if (climbStateDirty) scheduleClimbStateSync(80);
  }
}

function climbTurnFromKey(code) {
  const keyMap = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "forward",
    KeyW: "forward",
    Space: "jump",
    ArrowDown: "back",
    KeyS: "back"
  };
  return keyMap[code] || "";
}

function currentHeldClimbTurn() {
  const side = heldClimbKeys.has("KeyA") || heldClimbKeys.has("ArrowLeft")
    ? "left"
    : heldClimbKeys.has("KeyD") || heldClimbKeys.has("ArrowRight")
      ? "right"
      : "";
  const forwardBack = heldClimbKeys.has("KeyS") || heldClimbKeys.has("ArrowDown")
    ? "back"
    : heldClimbKeys.has("KeyW") || heldClimbKeys.has("ArrowUp")
      ? "forward"
      : "";

  if (side && forwardBack) {
    const useSide = Date.now() % 260 < 90;
    return useSide ? side : forwardBack;
  }
  return forwardBack || side;
}

function resetClimbMotion() {
  Object.assign(climbMotion, {
    velocity: 0,
    steerVelocity: 0,
    verticalVelocity: 0,
    jumpOffset: 0,
    grounded: true,
    lastGroundedAt: Date.now(),
    pointAccumulator: 0,
    lastTime: 0,
    lastHudAt: 0,
    lastSceneAt: 0,
    jumpBufferUntil: 0
  });
}

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(target, current + maxDelta);
  return Math.max(target, current - maxDelta);
}

function climbMotionActive() {
  return heldClimbKeys.size > 0
    || Math.abs(climbMotion.velocity) > 0.03
    || Math.abs(climbMotion.steerVelocity) > 0.03
    || Math.abs(climbMotion.verticalVelocity) > 0.03
    || climbMotion.jumpOffset > 0.001
    || climbMotion.jumpBufferUntil > Date.now();
}

function spendMovementEnergy(player, amount) {
  if (!player || amount <= 0) return true;
  climbMotion.pointAccumulator += amount;
  const wholePoints = Math.floor(climbMotion.pointAccumulator);
  if (wholePoints <= 0) return true;

  const available = Math.max(0, Number(player.score || 0));
  const spent = Math.min(available, wholePoints);
  player.score = Math.max(0, available - spent);
  climbMotion.pointAccumulator -= spent;
  if (spent < wholePoints || player.score <= 0) {
    climbMotion.pointAccumulator = 0;
    climbMotion.velocity = 0;
    state.error = "Movement energy empty. Return to the quiz to earn more climb points.";
    return false;
  }
  return true;
}

function beginBufferedJump(player, now) {
  const withinCoyote = now - (climbMotion.lastGroundedAt || 0) <= 160 || (player.coyoteUntil && now <= player.coyoteUntil);
  if (climbMotion.jumpBufferUntil < now || (!climbMotion.grounded && !withinCoyote)) return false;

  climbMotion.verticalVelocity = 8.8;
  climbMotion.grounded = false;
  climbMotion.jumpBufferUntil = 0;
  player.lastJumpAt = now;
  player.jumpArmedMoves = 5;

  if (player.coyoteUntil && player.pendingCoyoteStep) {
    player.checkpointHeight = Math.max(player.checkpointHeight || 0, player.pendingCoyoteStep * (state.room?.obstacleHeight || 24));
    player.coyoteUntil = 0;
    player.pendingCoyoteStep = 0;
    player.pendingCoyoteObstacle = null;
  }
  return true;
}

function updateJumpPhysics(player, dt, now) {
  beginBufferedJump(player, now);

  if (!climbMotion.grounded || climbMotion.jumpOffset > 0) {
    climbMotion.verticalVelocity -= 17.2 * dt;
    climbMotion.jumpOffset += climbMotion.verticalVelocity * dt;
    if (climbMotion.jumpOffset <= 0) {
      climbMotion.jumpOffset = 0;
      climbMotion.verticalVelocity = 0;
      climbMotion.grounded = true;
      climbMotion.lastGroundedAt = now;
    }
  } else {
    climbMotion.lastGroundedAt = now;
  }

  player.jumpOffset = climbMotion.jumpOffset;
}

function checkObstacleGate(player, oldHeight, now) {
  const gapHeight = obstacleHeight();
  const oldStep = Math.floor(Math.max(0, oldHeight) / gapHeight);
  const newStep = Math.floor(Math.max(0, player.height || 0) / gapHeight);
  if (newStep <= oldStep) return;

  const gateHeight = newStep * gapHeight;
  if (!canClearPlatformGap(player, now)) {
    player.height = Math.max(0, gateHeight - 1.2);
    player.coyoteUntil = now + 160;
    player.pendingCoyoteStep = newStep;
    player.pendingCoyoteObstacle = player.nextObstacle?.title || "platform gap";
    climbMotion.velocity = Math.min(climbMotion.velocity, 0.7);
    state.error = "Jump at the glowing platform gap to keep climbing.";
    return;
  }

  player.checkpointHeight = Math.max(player.checkpointHeight || 0, gateHeight);
  player.coyoteUntil = 0;
  player.pendingCoyoteStep = 0;
  player.pendingCoyoteObstacle = null;
  player.jumpArmedMoves = 0;
  state.error = "";
}

function checkPlatformEdges(player) {
  if (!isOffPlatform(player)) return false;
  state.error = "You slipped off the platform edge. Respawning at your last checkpoint.";
  fallLocalClimber(player, player.height || 0);
  return true;
}

function applyContinuousClimbMotion(player, dt, now) {
  const forwardHeld = heldClimbKeys.has("KeyW") || heldClimbKeys.has("ArrowUp");
  const backHeld = heldClimbKeys.has("KeyS") || heldClimbKeys.has("ArrowDown");
  const leftHeld = heldClimbKeys.has("KeyA") || heldClimbKeys.has("ArrowLeft");
  const rightHeld = heldClimbKeys.has("KeyD") || heldClimbKeys.has("ArrowRight");

  const hasEnergy = (player.score || 0) > 0;
  const targetVelocity = hasEnergy && forwardHeld ? 7.8 : hasEnergy && backHeld ? -3.4 : 0;
  const targetSteer = leftHeld && !rightHeld ? -2.35 : rightHeld && !leftHeld ? 2.35 : 0;

  climbMotion.velocity = approach(climbMotion.velocity, targetVelocity, (targetVelocity ? 11.5 : 6.6) * dt);
  climbMotion.steerVelocity = approach(climbMotion.steerVelocity, targetSteer, (targetSteer ? 8.4 : 6.8) * dt);

  const oldHeight = player.height || 0;
  const heightDelta = hasEnergy ? climbMotion.velocity * dt : 0;
  const steeringDelta = climbMotion.steerVelocity * dt;
  const moving = Math.abs(heightDelta) > 0.001 || Math.abs(steeringDelta) > 0.001;
  let fellOffEdge = false;

  if (Math.abs(steeringDelta) > 0.001) {
    player.direction = clampCourseDirection((player.direction || 0) + steeringDelta);
    fellOffEdge = checkPlatformEdges(player);
  }

  if (Math.abs(heightDelta) > 0.001 && !fellOffEdge && !isOffPlatform(player)) {
    const drainPerFoot = heightDelta > 0 ? 6.4 : 3.2;
    const affordable = spendMovementEnergy(player, Math.abs(heightDelta) * drainPerFoot);
    if (affordable) {
      player.height = Math.max(0, oldHeight + heightDelta);
      checkObstacleGate(player, oldHeight, now);
    }
  }

  updateJumpPhysics(player, dt, now);

  if (moving || Math.abs(climbMotion.verticalVelocity) > 0.001 || climbMotion.jumpOffset > 0.001) {
    player.lastClimbAt = now;
    if (player.lastResult) {
      player.lastResult = {
        ...player.lastResult,
        score: player.score || 0,
        height: player.height || 0,
        direction: player.direction || 0,
        lastJumpAt: player.lastJumpAt,
        lastFallAt: player.lastFallAt,
        falls: player.falls || 0
      };
    }
    scheduleClimbStateSync(220);
  }
}

function startClimbMovementLoop() {
  if (climbFrameId) return;
  const tick = (timestamp) => {
    const player = currentPlayer();
    if (state.view !== "climb" || state.role !== "player" || !player || !climbMotionActive()) {
      stopClimbMovementLoop({ reset: false });
      return;
    }
    const last = climbMotion.lastTime || timestamp;
    const dt = Math.min(0.05, Math.max(0.001, (timestamp - last) / 1000));
    climbMotion.lastTime = timestamp;

    const now = Date.now();
    expireCoyoteIfNeeded();
    applyContinuousClimbMotion(player, dt, now);

    if (timestamp - climbMotion.lastHudAt > 90) {
      refreshClimbHud();
      climbMotion.lastHudAt = timestamp;
    }
    if (timestamp - climbMotion.lastSceneAt > 33) {
      mountInteractiveScenes();
      climbMotion.lastSceneAt = timestamp;
    }

    climbFrameId = requestAnimationFrame(tick);
  };
  climbMotion.lastTime = 0;
  climbFrameId = requestAnimationFrame(tick);
}

function stopClimbMovementLoop({ reset = false } = {}) {
  if (!climbFrameId) return;
  cancelAnimationFrame(climbFrameId);
  climbFrameId = 0;
  if (reset) resetClimbMotion();
  flushClimbMoves();
  flushClimbState();
}

function render() {
  if (!state.deck) return;
  if (state.view !== "climb") {
    heldClimbKeys.clear();
    stopClimbMovementLoop({ reset: true });
  }
  const player = currentPlayer();
  if (state.view === "join") app.innerHTML = renderJoin();
  else if (state.view === "climb" && state.room) app.innerHTML = renderClimbMode();
  else if (state.room?.status === "lobby") app.innerHTML = renderLobby();
  else if (state.room?.status === "answering" && state.role === "host") app.innerHTML = renderHostSession();
  else if (state.room?.status === "answering" && player?.phase === "results") app.innerHTML = renderResults();
  else if (state.room?.status === "answering" && player?.phase === "finished") app.innerHTML = renderFinished();
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
    heldClimbKeys.clear();
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
    if (reply.ok) {
      state.answeredChoiceId = choiceId;
      if (reply.room) state.room = reply.room;
      state.error = "";
    } else {
      state.error = reply.error;
    }
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
    await flushClimbMoves();
    await flushClimbState();
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

  if (action === "player-next") {
    const reply = await api("/api/player/next", {
      roomCode: state.roomCode,
      playerId: state.playerId
    });
    if (reply.ok && reply.room) {
      state.room = reply.room;
      state.answeredChoiceId = "";
      state.error = "";
    } else {
      state.error = reply.error;
    }
    render();
    return;
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
  if (state.view !== "climb" || state.role !== "player" || !state.room || state.room.status === "finished") return;
  if (event.target?.matches?.("input, textarea, select")) return;
  const turn = climbTurnFromKey(event.code);
  if (!turn) return;
  event.preventDefault();
  if (turn === "jump") {
    if (!event.repeat) {
      climbMotion.jumpBufferUntil = Date.now() + 140;
      startClimbMovementLoop();
    }
    return;
  }
  heldClimbKeys.add(event.code);
  startClimbMovementLoop();
});

window.addEventListener("keyup", (event) => {
  if (!heldClimbKeys.has(event.code)) return;
  heldClimbKeys.delete(event.code);
  if (!climbMotionActive()) stopClimbMovementLoop();
});

window.addEventListener("blur", () => {
  heldClimbKeys.clear();
  stopClimbMovementLoop({ reset: true });
  flushClimbMoves();
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
