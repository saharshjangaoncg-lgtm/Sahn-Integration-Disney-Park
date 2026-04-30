const app = document.querySelector("#app");

const state = {
  view: "home",
  deck: null,
  room: null,
  role: null,
  playerId: localStorage.getItem("quizPlayerId") || "",
  hostSecret: localStorage.getItem("quizHostSecret") || "",
  roomCode: localStorage.getItem("quizRoomCode") || "",
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
      <div><strong>Live</strong><span>Room code</span></div>
    </div>
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
      <p class="official-line">Pick a character team, race through 30 BC integration missions, unlock streak powers, and climb the final leaderboard.</p>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
    </section>
    ${lessonStats()}
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
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
        <button class="btn gold" type="submit">Enter Park</button>
        <button class="btn secondary" type="button" data-action="home">Back</button>
      </form>
      <aside class="panel solution">
        <span class="badge">Student Entrance</span>
        <h2>How players use this in Notion</h2>
        <p>Open the Notion page, click the embedded game, type the room code from the host screen, and answer before time runs out.</p>
        <p class="notice">Use your real first name or initials so the teacher can read the leaderboard.</p>
      </aside>
    </section>
  `);
}

function renderLobby() {
  const players = state.room.players.map(playerRow).join("") || `<p class="muted">Waiting for players...</p>`;
  return shell(`
    <section class="lobby">
      <div class="panel">
        <p class="muted">Share this code with players</p>
        <div class="room-code">${escapeHtml(state.room.code)}</div>
        <p class="notice">In Notion, paste your hosted app link with /embed. Players can also open the same link in a browser.</p>
        <div class="actions" style="margin-top: 18px;">
          ${state.role === "host" ? `<button class="btn gold" data-action="start">Start Game</button>` : `<span class="badge">Waiting for host</span>`}
        </div>
        ${lessonStats()}
      </div>
      <div class="panel">
        <h2>Players</h2>
        <div class="player-list">${players}</div>
      </div>
    </section>
  `);
}

function playerRow(player) {
  return `
    <div class="player-row">
      <strong>${escapeHtml(player.name)}</strong>
      <span class="badge">${player.score} pts${player.answered ? " · checked in" : ""}</span>
    </div>
  `;
}

function rankBadge(index, score) {
  if (index === 0) return "Castle Champion";
  if (score >= 20000) return "Fireworks Scholar";
  if (score >= 12000) return "EPCOT Expert";
  if (score >= 7000) return "Main Street Master";
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
      <strong>#${index + 1} ${escapeHtml(result.name)}</strong>
      <span class="badge">${result.isCorrect ? `+${result.pointsAwarded}` : "Missed"} · ${result.frozenPenalty ? "frozen" : result.speedBonus ? `speed +${result.speedBonus}` : "no speed"} · ${result.score} pts</span>
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
          <div><strong>${results?.bonusPoints || 0}</strong><span>${escapeHtml(results?.bonusLabel || "Bonus")}</span></div>
        </div>
        <div class="actions">
          ${state.role === "host" ? `<button class="btn gold" data-action="next">${state.room.currentQuestionIndex >= state.room.totalQuestions - 1 ? "Finish Game" : "Next Mission"}</button>` : `<span class="badge">Waiting for host</span>`}
        </div>
        ${state.role === "player" ? powerPanel() : ""}
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      </div>
      <div class="panel leaderboard">
        <h2>Scoreboard</h2>
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
    .sort((a, b) => b.score - a.score)
    .map((player, index) => `
      <div class="result-row">
        <strong>#${index + 1} ${escapeHtml(player.name)}</strong>
        <span class="badge">${escapeHtml(rankBadge(index, player.score))} · ${player.score} pts</span>
      </div>
    `).join("");

  return shell(`
    <section class="grid">
      <div class="panel solution">
        <span class="badge">Quest Complete</span>
        <h2>Final Scores</h2>
        <p>Use the leaderboard to award badges, recovery credit, or a quick notebook reflection. The strongest presentation move is to show one question, explain the scoring, then show where you edit the deck.</p>
        <button class="btn secondary" data-action="home">Back Home</button>
      </div>
      <div class="panel leaderboard">${rows}</div>
    </section>
  `);
}

function render() {
  if (!state.deck) return;
  if (state.view === "join") app.innerHTML = renderJoin();
  else if (state.room?.status === "lobby") app.innerHTML = renderLobby();
  else if (state.room?.status === "answering") app.innerHTML = renderQuestion();
  else if (state.room?.status === "results") app.innerHTML = renderResults();
  else if (state.room?.status === "finished") app.innerHTML = renderFinished();
  else app.innerHTML = renderHome();
}

app.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const choiceId = event.target.closest("[data-choice]")?.dataset.choice;
  const power = event.target.closest("[data-power]")?.dataset.power;

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
    roomCode: data.get("roomCode")
  });
  if (reply.ok) {
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
