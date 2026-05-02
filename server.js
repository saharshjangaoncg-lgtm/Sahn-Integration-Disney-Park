import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { lessonDeck } from "./data/questions.js";
import { avatarIds } from "./public/avatar-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const rooms = new Map();
const subscribers = new Map();
const CLIMB_COST = 300;
const CLIMB_HEIGHT = 24;
const DEFAULT_GAME_DURATION_SECONDS = 20 * 60;
const MIN_GAME_DURATION_SECONDS = 5 * 60;
const MAX_GAME_DURATION_SECONDS = 60 * 60;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const parkThemeIds = new Set(["castle", "mickey", "minnie", "donald", "goofy", "quiz"]);

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
  });
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return rooms.has(code) ? makeRoomCode() : code;
}

function makeId() {
  return crypto.randomBytes(8).toString("hex");
}

function sanitizeName(name) {
  return String(name || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 24) || "Guest";
}

function sanitizeAvatar(avatar) {
  const normalized = String(avatar || "").toLowerCase();
  return avatarIds.has(normalized) ? normalized : "mickey";
}

function sanitizeParkTheme(theme) {
  const normalized = String(theme || "").toLowerCase();
  return parkThemeIds.has(normalized) ? normalized : "castle";
}

function sanitizeTurn(turn) {
  const normalized = String(turn || "straight").toLowerCase();
  if (normalized === "left") return -1;
  if (normalized === "right") return 1;
  return 0;
}

function sanitizeGameDuration(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return DEFAULT_GAME_DURATION_SECONDS;
  return Math.min(MAX_GAME_DURATION_SECONDS, Math.max(MIN_GAME_DURATION_SECONDS, Math.round(value)));
}

const obstaclePatterns = {
  castle: [
    { turn: "straight", title: "Rampart Run", label: "Forward", description: "Stay centered across the castle bridge." },
    { turn: "right", title: "Turret Turn", label: "Right", description: "Curve around the tower spire." },
    { turn: "left", title: "Royal Balcony", label: "Left", description: "Cut left to the balcony stones." },
    { turn: "straight", title: "Firework Rail", label: "Forward", description: "Keep the rail balanced." }
  ],
  mickey: [
    { turn: "right", title: "Red Block Bounce", label: "Right", description: "Jump to the red clubhouse block." },
    { turn: "straight", title: "Yellow Glove Bridge", label: "Forward", description: "Run across the yellow bridge." },
    { turn: "left", title: "Ear Platform", label: "Left", description: "Land on the left ear pad." },
    { turn: "right", title: "Clubhouse Wall", label: "Right", description: "Turn to the wall stack." }
  ],
  minnie: [
    { turn: "left", title: "Bow Ribbon", label: "Left", description: "Follow the pink bow ribbon." },
    { turn: "straight", title: "Polka Dot Pads", label: "Forward", description: "Hop through the center dots." },
    { turn: "right", title: "Ribbon Curl", label: "Right", description: "Curve right around the ribbon." },
    { turn: "left", title: "Bow Knot", label: "Left", description: "Land on the bow knot." }
  ],
  donald: [
    { turn: "straight", title: "Dock Planks", label: "Forward", description: "Sprint over the broken dock frame." },
    { turn: "left", title: "Sail Tilt", label: "Left", description: "Lean left under the sail." },
    { turn: "right", title: "Blue Pier Jump", label: "Right", description: "Jump right to the blue pier." },
    { turn: "straight", title: "Duck Bridge", label: "Forward", description: "Stay centered on the duck-frame bridge." }
  ],
  goofy: [
    { turn: "right", title: "Tree Fork", label: "Right", description: "Take the right branch." },
    { turn: "left", title: "Log Hop", label: "Left", description: "Hop left across the log." },
    { turn: "straight", title: "Forest Beam", label: "Forward", description: "Balance straight through the beam." },
    { turn: "right", title: "Leaf Launch", label: "Right", description: "Launch right to the leaf pad." }
  ],
  quiz: [
    { turn: "straight", title: "Question Gate", label: "Forward", description: "Push through the center gate." },
    { turn: "right", title: "Pixar Pop Ramp", label: "Right", description: "Ride the bright right ramp." },
    { turn: "left", title: "Castle Card Flip", label: "Left", description: "Flip left to the castle card." },
    { turn: "straight", title: "Final Answer Pad", label: "Forward", description: "Hold the forward lane." }
  ]
};

function turnName(turnValue) {
  if (turnValue < 0) return "left";
  if (turnValue > 0) return "right";
  return "straight";
}

function turnValue(turnNameValue) {
  if (turnNameValue === "left") return -1;
  if (turnNameValue === "right") return 1;
  return 0;
}

function nextObstacleFor(room, player) {
  const pattern = obstaclePatterns[room.parkTheme || "castle"] || obstaclePatterns.castle;
  const step = Math.floor((player.height || 0) / CLIMB_HEIGHT) % pattern.length;
  const obstacle = pattern[step];
  return {
    ...obstacle,
    step: step + 1,
    turnValue: turnValue(obstacle.turn)
  };
}

function playerQuestion(question, includeChoices) {
  return {
    id: question.id,
    title: question.title,
    prompt: question.prompt,
    story: question.story,
    timeLimitSeconds: question.timeLimitSeconds,
    difficulty: question.difficulty,
    pointValue: question.pointValue ?? 1000,
    bonusPoints: question.bonusPoints ?? 150,
    bonusLabel: question.bonusLabel ?? "Castle streak bonus",
    choices: includeChoices
      ? question.choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          park: choice.park,
          color: choice.color
        }))
      : []
  };
}

function questionDurationMs(room) {
  const question = lessonDeck.questions[room.currentQuestionIndex];
  return Math.max(1000, Number(question?.timeLimitSeconds || 45) * 1000);
}

function resetPlayerQuestionTimer(room, player) {
  player.questionTimeLeftMs = questionDurationMs(room);
  player.questionTimerStartedAt = Date.now();
  player.questionPaused = false;
  player.questionTimedOut = false;
}

function visibleQuestionTimeLeft(room, player) {
  if (room.status !== "answering") return null;
  const stored = Number(player.questionTimeLeftMs ?? questionDurationMs(room));
  if (room.answers.has(player.id) || player.questionPaused || !player.questionTimerStartedAt) {
    return Math.max(0, Math.ceil(stored));
  }
  return Math.max(0, Math.ceil(stored - (Date.now() - player.questionTimerStartedAt)));
}

function markPlayerTimedOut(room, player, now = Date.now()) {
  if (room.answers.has(player.id)) return;
  player.questionTimeLeftMs = 0;
  player.questionTimerStartedAt = now;
  player.questionPaused = false;
  player.questionTimedOut = true;
  room.answers.set(player.id, {
    choiceId: null,
    answeredAt: now,
    responseMs: questionDurationMs(room),
    timedOut: true
  });
  room.actionLog.push(`${player.name}'s question timer ended before they answered.`);
}

function settleExpiredPlayerTimers(room) {
  if (room.status !== "answering") return false;
  const now = Date.now();
  let changed = false;

  for (const player of room.players.values()) {
    if (room.answers.has(player.id)) continue;
    if (player.questionTimeLeftMs == null) resetPlayerQuestionTimer(room, player);
    if (player.questionPaused) continue;

    const elapsed = Math.max(0, now - (player.questionTimerStartedAt || now));
    player.questionTimeLeftMs = Math.max(0, Number(player.questionTimeLeftMs || 0) - elapsed);
    player.questionTimerStartedAt = now;
    changed = true;

    if (player.questionTimeLeftMs <= 0) {
      markPlayerTimedOut(room, player, now);
    }
  }

  if (room.players.size > 0 && room.answers.size >= room.players.size) {
    closeQuestion(room);
    return true;
  }

  if (changed) publish(room);
  return changed;
}

function pausePlayerQuestionTimer(room, player) {
  if (room.status !== "answering" || room.answers.has(player.id)) return;
  player.questionTimeLeftMs = visibleQuestionTimeLeft(room, player);
  player.questionTimerStartedAt = Date.now();
  player.questionPaused = true;
  player.questionTimedOut = false;
}

function resumePlayerQuestionTimer(room, player) {
  if (room.status !== "answering" || room.answers.has(player.id)) return;
  const timeLeft = visibleQuestionTimeLeft(room, player);
  if (timeLeft <= 0) {
    markPlayerTimedOut(room, player);
    return;
  }
  player.questionTimeLeftMs = timeLeft;
  player.questionTimerStartedAt = Date.now();
  player.questionPaused = false;
  player.questionTimedOut = false;
}

function publicRoom(room) {
  const question = lessonDeck.questions[room.currentQuestionIndex] || null;
  const now = Date.now();
  return {
    code: room.code,
    status: room.status,
    hostName: room.hostName,
    hostSecret: undefined,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: lessonDeck.questions.length,
    questionStartedAt: room.questionStartedAt,
    parkTheme: room.parkTheme || "castle",
    gameDurationSeconds: room.gameDurationSeconds || DEFAULT_GAME_DURATION_SECONDS,
    gameStartedAt: room.gameStartedAt || null,
    gameEndsAt: room.gameEndsAt || null,
    gameSecondsLeft: room.gameEndsAt ? Math.max(0, Math.ceil((room.gameEndsAt - now) / 1000)) : null,
    claimedAvatars: [...room.players.values()].map((player) => player.avatar),
    climbCost: CLIMB_COST,
    climbHeight: CLIMB_HEIGHT,
    players: [...room.players.values()].map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      height: player.height ?? 0,
      avatar: player.avatar || "mickey",
      direction: player.direction ?? 0,
      lastClimbAt: player.lastClimbAt || null,
      nextObstacle: nextObstacleFor(room, player),
      falls: player.falls || 0,
      streak: player.streak,
      answered: Boolean(room.answers.get(player.id)),
      frozenNext: player.frozenQuestionIndex === room.currentQuestionIndex + 1 || player.frozenQuestionIndex === room.currentQuestionIndex,
      powerUsedThisRound: player.powerUsedQuestion === room.currentQuestionIndex,
      questionTimeLeftMs: visibleQuestionTimeLeft(room, player),
      questionPaused: Boolean(player.questionPaused),
      questionTimedOut: Boolean(player.questionTimedOut),
      connected: true
    })),
    question: question ? playerQuestion(question, room.status === "answering") : null,
    lastResults: room.lastResults,
    actionLog: (room.actionLog || []).slice(-6)
  };
}

function publish(room) {
  const message = `event: room\ndata: ${JSON.stringify(publicRoom(room))}\n\n`;
  for (const res of subscribers.get(room.code) || []) res.write(message);
}

function subscribe(code, res) {
  if (!subscribers.has(code)) subscribers.set(code, new Set());
  subscribers.get(code).add(res);
  res.on("close", () => {
    subscribers.get(code)?.delete(res);
    if (subscribers.get(code)?.size === 0) subscribers.delete(code);
  });
}

function computeResults(room) {
  const question = lessonDeck.questions[room.currentQuestionIndex];
  if (!question) return null;
  const correctChoice = question.choices.find((choice) => choice.correct);
  const basePoints = question.pointValue ?? 1000;
  const bonusPoints = question.bonusPoints ?? 150;

  const playerResults = [...room.players.values()].map((player) => {
    const answer = room.answers.get(player.id);
    const selected = question.choices.find((choice) => choice.id === answer?.choiceId);
    const isCorrect = Boolean(selected?.correct);
    const responseMs = answer ? Math.max(0, answer.responseMs ?? (answer.answeredAt - room.questionStartedAt)) : null;
    let pointsAwarded = 0;
    let speedBonus = 0;
    let streakBonus = 0;
    let badgeBonus = 0;
    let frozenPenalty = false;
    player.height ??= 0;
    player.direction ??= 0;

    if (isCorrect) {
      const maxMs = question.timeLimitSeconds * 1000;
      const speedRatio = Math.max(0, maxMs - responseMs) / maxMs;
      frozenPenalty = player.frozenQuestionIndex === room.currentQuestionIndex;
      speedBonus = frozenPenalty ? 0 : Math.round(speedRatio * Math.round(basePoints * 0.5));
      player.streak += 1;
      streakBonus = Math.min(player.streak * 75, 300);
      badgeBonus = player.streak >= 3 ? bonusPoints : 0;
      pointsAwarded = basePoints + speedBonus + streakBonus + badgeBonus;
      player.score += pointsAwarded;
    } else {
      player.streak = 0;
    }

    if (player.frozenQuestionIndex === room.currentQuestionIndex) {
      player.frozenQuestionIndex = null;
    }

    return {
      id: player.id,
      name: player.name,
      selectedChoiceId: answer?.choiceId || null,
      selectedText: selected?.text || "No answer",
      isCorrect,
      responseMs,
      score: player.score,
      height: player.height ?? 0,
      avatar: player.avatar || "mickey",
      direction: player.direction ?? 0,
      nextObstacle: nextObstacleFor(room, player),
      falls: player.falls || 0,
      streak: player.streak,
      pointsAwarded,
      climbsAvailable: Math.floor(player.score / CLIMB_COST),
      speedBonus,
      streakBonus,
      badgeBonus,
      frozenPenalty
    };
  });

  playerResults.sort((a, b) => b.height - a.height || b.score - a.score);
  return {
    questionId: question.id,
    pointValue: basePoints,
    bonusPoints,
    bonusLabel: question.bonusLabel ?? "Castle streak bonus",
    correctChoiceId: correctChoice?.id,
    correctText: correctChoice?.text || "",
    explanation: question.explanation,
    workedSolution: question.workedSolution,
    playerResults,
    powerLog: (room.actionLog || []).slice(-6)
  };
}

function closeQuestion(room) {
  if (room.status !== "answering") return;
  if (room.timer) clearInterval(room.timer);
  room.timer = null;
  for (const player of room.players.values()) {
    player.questionPaused = false;
  }
  room.status = "results";
  room.lastResults = computeResults(room);
  publish(room);
}

function finishGame(room) {
  if (room.timer) clearInterval(room.timer);
  if (room.gameTimer) clearTimeout(room.gameTimer);
  room.timer = null;
  room.gameTimer = null;
  room.status = "finished";
  publish(room);
}

function startGameClock(room, seconds) {
  const durationSeconds = sanitizeGameDuration(seconds || room.gameDurationSeconds);
  room.gameDurationSeconds = durationSeconds;
  room.gameStartedAt = Date.now();
  room.gameEndsAt = room.gameStartedAt + durationSeconds * 1000;
  if (room.gameTimer) clearTimeout(room.gameTimer);
  room.gameTimer = setTimeout(() => finishGame(room), durationSeconds * 1000);
}

function startQuestion(room) {
  if (room.gameEndsAt && Date.now() >= room.gameEndsAt) {
    finishGame(room);
    return;
  }
  if (room.timer) clearInterval(room.timer);
  room.status = "answering";
  room.answers = new Map();
  room.lastResults = null;
  room.questionStartedAt = Date.now();
  for (const player of room.players.values()) resetPlayerQuestionTimer(room, player);
  room.timer = setInterval(() => {
    if (room.gameEndsAt && Date.now() >= room.gameEndsAt) {
      finishGame(room);
      return;
    }
    settleExpiredPlayerTimers(room);
  }, 1000);
  publish(room);
}

function syncLastResultScores(room) {
  if (!room.lastResults) return;
  const playersById = new Map(room.players);
  room.lastResults.playerResults = room.lastResults.playerResults.map((result) => {
    const player = playersById.get(result.id);
    return player ? {
      ...result,
      score: player.score,
      height: player.height,
      direction: player.direction ?? 0,
      nextObstacle: nextObstacleFor(room, player),
      falls: player.falls || 0,
      streak: player.streak,
      climbsAvailable: Math.floor(player.score / CLIMB_COST)
    } : result;
  });
  room.lastResults.playerResults.sort((a, b) => b.height - a.height || b.score - a.score);
  room.lastResults.powerLog = (room.actionLog || []).slice(-6);
}

function findTopRival(room, actor) {
  return [...room.players.values()]
    .filter((player) => player.id !== actor.id)
    .sort((a, b) => b.score - a.score)[0] || null;
}

function usePlayerPower(room, playerId, power) {
  if (room.status !== "results") {
    throw new Error("Power moves can only be used on the results screen.");
  }

  const actor = room.players.get(playerId);
  if (!actor) throw new Error("Player session not recognized.");
  if (room.players.size < 2) throw new Error("Power moves need at least two players.");
  if (actor.powerUsedQuestion === room.currentQuestionIndex) {
    throw new Error("You already used a power move this round.");
  }

  const normalizedPower = String(power || "").toLowerCase();
  const topRival = findTopRival(room, actor);
  if (!topRival) throw new Error("No rival found.");

  if (normalizedPower === "steal") {
    if (actor.streak < 3) throw new Error("Steal unlocks at a 3-question streak.");
    const amount = Math.min(300, topRival.score);
    if (amount <= 0) throw new Error("That rival has no points to steal.");
    topRival.score -= amount;
    actor.score += amount;
    room.actionLog.push(`${actor.name} stole ${amount} climb-bank points from ${topRival.name}.`);
  } else if (normalizedPower === "freeze") {
    if (actor.streak < 4) throw new Error("Freeze unlocks at a 4-question streak.");
    topRival.frozenQuestionIndex = room.currentQuestionIndex + 1;
    room.actionLog.push(`${actor.name} froze ${topRival.name}'s next speed bonus.`);
  } else if (normalizedPower === "nuke") {
    if (actor.streak < 5) throw new Error("Nuke unlocks at a 5-question streak.");
    const targets = [...room.players.values()].filter((player) => player.id !== actor.id && player.score > actor.score);
    if (targets.length === 0) throw new Error("Nuke only hits players currently ahead of you.");
    let totalDrained = 0;
    for (const target of targets) {
      const drained = Math.min(200, target.score);
      target.score -= drained;
      totalDrained += drained;
    }
    actor.score += totalDrained;
    room.actionLog.push(`${actor.name} nuked the leaderboard and absorbed ${totalDrained} climb-bank points.`);
  } else {
    throw new Error("Unknown power move.");
  }

  actor.powerUsedQuestion = room.currentQuestionIndex;
  syncLastResultScores(room);
  publish(room);
}

function useClimb(room, playerId, turn) {
  if (room.status === "finished") throw new Error("The overall park timer ended.");
  const player = room.players.get(playerId);
  if (!player) throw new Error("Player session not recognized.");
  if (player.score < CLIMB_COST) {
    throw new Error(`You need ${CLIMB_COST} points to climb. Answer more questions to refill your point bank.`);
  }

  const turnValue = sanitizeTurn(turn);
  const chosenTurn = turnName(turnValue);
  const obstacle = nextObstacleFor(room, player);
  player.score -= CLIMB_COST;
  player.lastClimbAt = Date.now();

  if (chosenTurn !== obstacle.turn) {
    const oldHeight = player.height || 0;
    player.height = 0;
    player.direction = 0;
    player.falls = (player.falls || 0) + 1;
    room.actionLog.push(`${player.name} missed ${obstacle.title}, fell from ${Math.round(oldHeight)} ft, and reset to ground level.`);
  } else {
    player.height = (player.height || 0) + CLIMB_HEIGHT;
    player.direction = (player.direction || 0) + turnValue;
    const turnLabel = turnValue < 0 ? "left" : turnValue > 0 ? "right" : "forward";
    room.actionLog.push(`${player.name} spent ${CLIMB_COST} points, cleared ${obstacle.title}, turned ${turnLabel}, and climbed ${CLIMB_HEIGHT} ft.`);
  }
  syncLastResultScores(room);
  publish(room);
}

function requireRoom(code) {
  const room = rooms.get(String(code || "").toUpperCase());
  if (!room) throw new Error("Room not found.");
  return room;
}

function requireHost(room, hostSecret) {
  if (room.hostSecret !== hostSecret) throw new Error("Only the host can do that.");
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const cleanPath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  const filePath = path.normalize(path.join(publicDir, cleanPath));

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { ok: false, error: "Forbidden." });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { ok: false, error: "File not found." });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const route = requestUrl.pathname;

  try {
    if (req.method === "GET" && route === "/api/deck") {
      sendJson(res, 200, lessonDeck);
      return;
    }

    if (req.method === "GET" && route === "/api/room") {
      const code = String(requestUrl.searchParams.get("roomCode") || "").toUpperCase();
      const room = requireRoom(code);
      sendJson(res, 200, { ok: true, room: publicRoom(room) });
      return;
    }

    if (req.method === "GET" && route === "/api/events") {
      const code = String(requestUrl.searchParams.get("roomCode") || "").toUpperCase();
      const room = requireRoom(code);
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      });
      subscribe(code, res);
      res.write(`event: room\ndata: ${JSON.stringify(publicRoom(room))}\n\n`);
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, error: "Method not allowed." });
      return;
    }

    const body = await parseBody(req);

    if (route === "/api/host/create") {
      const code = makeRoomCode();
      const hostSecret = makeId();
      const room = {
        code,
        hostSecret,
        hostName: sanitizeName(body.hostName || "Teacher"),
        parkTheme: sanitizeParkTheme(body.parkTheme),
        status: "lobby",
        currentQuestionIndex: 0,
        questionStartedAt: null,
        gameDurationSeconds: DEFAULT_GAME_DURATION_SECONDS,
        gameStartedAt: null,
        gameEndsAt: null,
        gameTimer: null,
        players: new Map(),
        answers: new Map(),
        timer: null,
        lastResults: null,
        actionLog: []
      };
      rooms.set(code, room);
      sendJson(res, 200, { ok: true, hostSecret, room: publicRoom(room), deck: lessonDeck });
      publish(room);
      return;
    }

    if (route === "/api/player/join") {
      const room = requireRoom(body.roomCode);
      const avatar = sanitizeAvatar(body.avatar);
      if ([...room.players.values()].some((player) => player.avatar === avatar)) {
        throw new Error("That avatar is already taken in this room. Pick another climber.");
      }
      const playerId = makeId();
      const player = {
        id: playerId,
        name: sanitizeName(body.name),
        avatar,
        score: 0,
        height: 0,
        direction: 0,
        lastClimbAt: null,
        falls: 0,
        streak: 0,
        frozenQuestionIndex: null,
        powerUsedQuestion: -1
      };
      if (room.status === "answering") resetPlayerQuestionTimer(room, player);
      room.players.set(playerId, player);
      sendJson(res, 200, { ok: true, playerId, room: publicRoom(room), deck: lessonDeck });
      publish(room);
      return;
    }

    if (route === "/api/host/start") {
      const room = requireRoom(body.roomCode);
      requireHost(room, body.hostSecret);
      room.currentQuestionIndex = 0;
      startGameClock(room, body.gameDurationSeconds);
      startQuestion(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (route === "/api/host/reveal") {
      const room = requireRoom(body.roomCode);
      requireHost(room, body.hostSecret);
      closeQuestion(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (route === "/api/host/next") {
      const room = requireRoom(body.roomCode);
      requireHost(room, body.hostSecret);
      if (room.currentQuestionIndex >= lessonDeck.questions.length - 1) {
        finishGame(room);
        sendJson(res, 200, { ok: true, finished: true });
        return;
      }
      room.currentQuestionIndex += 1;
      startQuestion(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (route === "/api/player/answer") {
      const room = requireRoom(body.roomCode);
      if (room.status !== "answering") throw new Error("This question is not accepting answers.");
      const player = room.players.get(body.playerId);
      if (!player) throw new Error("Player session not recognized.");
      if (room.answers.has(body.playerId)) throw new Error("You already answered this question.");
      if (player.questionPaused) throw new Error("Return to the quiz screen before answering.");
      settleExpiredPlayerTimers(room);
      if (room.status !== "answering") throw new Error("Your question timer already ended.");
      if (room.answers.has(body.playerId)) throw new Error("Your question timer already ended.");
      const question = lessonDeck.questions[room.currentQuestionIndex];
      if (!question.choices.some((choice) => choice.id === body.choiceId)) throw new Error("Choice not found.");
      const now = Date.now();
      const timeLeft = visibleQuestionTimeLeft(room, player);
      const responseMs = Math.max(0, questionDurationMs(room) - timeLeft);
      player.questionTimeLeftMs = timeLeft;
      player.questionTimerStartedAt = now;
      room.answers.set(body.playerId, { choiceId: body.choiceId, answeredAt: now, responseMs });
      if (room.answers.size >= room.players.size && room.players.size > 0) closeQuestion(room);
      else publish(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (route === "/api/player/mode") {
      const room = requireRoom(body.roomCode);
      const player = room.players.get(body.playerId);
      if (!player) throw new Error("Player session not recognized.");
      const mode = String(body.mode || "quiz").toLowerCase();
      if (mode === "climb") {
        pausePlayerQuestionTimer(room, player);
      } else if (mode === "quiz") {
        resumePlayerQuestionTimer(room, player);
      } else {
        throw new Error("Mode not recognized.");
      }
      if (room.status === "answering" && room.players.size > 0 && room.answers.size >= room.players.size) closeQuestion(room);
      else publish(room);
      sendJson(res, 200, { ok: true, room: publicRoom(room) });
      return;
    }

    if (route === "/api/player/power") {
      const room = requireRoom(body.roomCode);
      usePlayerPower(room, body.playerId, body.power);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (route === "/api/player/climb") {
      const room = requireRoom(body.roomCode);
      useClimb(room, body.playerId, body.turn);
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { ok: false, error: "API route not found." });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Notion quiz game running on http://${HOST}:${PORT}`);
});
