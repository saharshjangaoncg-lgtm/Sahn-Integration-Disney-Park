import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { lessonDeck } from "./data/questions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const rooms = new Map();
const subscribers = new Map();
const CLIMB_COST = 300;
const CLIMB_HEIGHT = 24;

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

const avatarIds = new Set(["mickey", "minnie", "donald", "goofy", "anikshaa", "joy", "saharsh", "divyam", "vtl"]);
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

function publicRoom(room) {
  const question = lessonDeck.questions[room.currentQuestionIndex] || null;
  return {
    code: room.code,
    status: room.status,
    hostName: room.hostName,
    hostSecret: undefined,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: lessonDeck.questions.length,
    questionStartedAt: room.questionStartedAt,
    parkTheme: room.parkTheme || "castle",
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
      streak: player.streak,
      answered: Boolean(room.answers.get(player.id)),
      frozenNext: player.frozenQuestionIndex === room.currentQuestionIndex + 1 || player.frozenQuestionIndex === room.currentQuestionIndex,
      powerUsedThisRound: player.powerUsedQuestion === room.currentQuestionIndex,
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
    const responseMs = answer ? Math.max(0, answer.answeredAt - room.questionStartedAt) : null;
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
  room.status = "results";
  room.lastResults = computeResults(room);
  publish(room);
}

function startQuestion(room) {
  if (room.timer) clearTimeout(room.timer);
  room.status = "answering";
  room.answers = new Map();
  room.lastResults = null;
  room.questionStartedAt = Date.now();
  const question = lessonDeck.questions[room.currentQuestionIndex];
  room.timer = setTimeout(() => closeQuestion(room), question.timeLimitSeconds * 1000);
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
  if (room.status === "answering") {
    throw new Error("Answer the current question first, then spend points to climb on the reveal screen.");
  }
  const player = room.players.get(playerId);
  if (!player) throw new Error("Player session not recognized.");
  if (player.score < CLIMB_COST) {
    throw new Error(`You need ${CLIMB_COST} points to climb. Answer more questions to refill your point bank.`);
  }

  const turnValue = sanitizeTurn(turn);
  player.score -= CLIMB_COST;
  player.height = (player.height || 0) + CLIMB_HEIGHT;
  player.direction = (player.direction || 0) + turnValue;
  player.lastClimbAt = Date.now();
  const turnLabel = turnValue < 0 ? "left" : turnValue > 0 ? "right" : "forward";
  room.actionLog.push(`${player.name} spent ${CLIMB_COST} points, turned ${turnLabel}, and climbed ${CLIMB_HEIGHT} ft.`);
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
      const playerId = makeId();
      room.players.set(playerId, {
        id: playerId,
        name: sanitizeName(body.name),
        avatar: sanitizeAvatar(body.avatar),
        score: 0,
        height: 0,
        direction: 0,
        lastClimbAt: null,
        streak: 0,
        frozenQuestionIndex: null,
        powerUsedQuestion: -1
      });
      sendJson(res, 200, { ok: true, playerId, room: publicRoom(room), deck: lessonDeck });
      publish(room);
      return;
    }

    if (route === "/api/host/start") {
      const room = requireRoom(body.roomCode);
      requireHost(room, body.hostSecret);
      room.currentQuestionIndex = 0;
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
        room.status = "finished";
        publish(room);
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
      const question = lessonDeck.questions[room.currentQuestionIndex];
      if (!question.choices.some((choice) => choice.id === body.choiceId)) throw new Error("Choice not found.");
      room.answers.set(body.playerId, { choiceId: body.choiceId, answeredAt: Date.now() });
      if (room.answers.size >= room.players.size && room.players.size > 0) closeQuestion(room);
      else publish(room);
      sendJson(res, 200, { ok: true });
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
