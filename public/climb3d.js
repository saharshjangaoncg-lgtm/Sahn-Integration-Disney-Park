export const avatarOptions = [
  { id: "mickey", name: "Mickey Method", short: "M", color: "#e63946", glow: "#ffd166" },
  { id: "minnie", name: "Minnie Momentum", short: "Mn", color: "#d86aa7", glow: "#ffe2ef" },
  { id: "donald", name: "Donald Derivatives", short: "D", color: "#2563eb", glow: "#fef08a" },
  { id: "goofy", name: "Goofy Graphs", short: "G", color: "#16a34a", glow: "#bbf7d0" },
  { id: "anikshaa", name: "Anikshaa Arc", short: "A", color: "#8b5cf6", glow: "#ddd6fe" },
  { id: "joy", name: "Joy Jump", short: "J", color: "#f59e0b", glow: "#fef3c7" },
  { id: "saharsh", name: "Saharsh July 2 Sprint", short: "S", color: "#06b6d4", glow: "#cffafe" },
  { id: "divyam", name: "Divyam Dash", short: "Dv", color: "#ef4444", glow: "#fee2e2" },
  { id: "vtl", name: "VTL Vector", short: "V", color: "#14b8a6", glow: "#ccfbf1" }
];

export const courseThemes = {
  castle: {
    name: "Castle Course",
    background: 0x202329,
    fog: 0x202329,
    base: 0x3a404a,
    rail: 0xf6d24a,
    accent: 0x7b5aa6,
    obstacle: "spires"
  },
  mickey: {
    name: "Mickey Clubhouse Climb",
    background: 0x211f22,
    fog: 0x211f22,
    base: 0xe63946,
    rail: 0xf6d24a,
    accent: 0x0f172a,
    obstacle: "clubhouse"
  },
  minnie: {
    name: "Minnie Bow Bounce",
    background: 0x2d222d,
    fog: 0x2d222d,
    base: 0xd86aa7,
    rail: 0xffd6ea,
    accent: 0xff8ac6,
    obstacle: "bows"
  },
  donald: {
    name: "Donald Dock Framework",
    background: 0x1c2733,
    fog: 0x1c2733,
    base: 0x2563eb,
    rail: 0xfef08a,
    accent: 0xffffff,
    obstacle: "dock"
  },
  goofy: {
    name: "Goofy Tree Parkour",
    background: 0x1f281f,
    fog: 0x1f281f,
    base: 0x7a4a25,
    rail: 0x5fa470,
    accent: 0x2f6d3a,
    obstacle: "trees"
  },
  quiz: {
    name: "Quiz Quest Mix",
    background: 0x252336,
    fog: 0x252336,
    base: 0xf39b4a,
    rail: 0x168bd3,
    accent: 0x8b5cf6,
    obstacle: "mixed"
  }
};

const scenes = new WeakMap();
let threeModulePromise = null;

export function getAvatar(id) {
  return avatarOptions.find((avatar) => avatar.id === id) || avatarOptions[0];
}

export function renderClimbScene(container, climbers, courseId = "castle") {
  if (!container) return;
  const safeClimbers = normalizeClimbers(climbers);
  if (!threeModulePromise) {
    threeModulePromise = import("/vendor/three.module.js");
  }

  threeModulePromise
    .then((THREE) => {
      const scene = scenes.get(container) || createScene(THREE, container);
      scenes.set(container, scene);
      scene.update(safeClimbers, courseId);
    })
    .catch(() => renderFallback(container, safeClimbers));
}

function normalizeClimbers(climbers) {
  const fallback = [{ name: "Saharsh", avatar: "saharsh", score: 0, height: 120 }];
  return (climbers?.length ? climbers : fallback)
    .map((player, index) => ({
      id: player.id || `${player.name}-${index}`,
      name: player.name || "Guest",
      avatar: player.avatar || avatarOptions[index % avatarOptions.length].id,
      score: Number(player.score || 0),
      height: Math.max(0, Number(player.height || 0)),
      direction: Number(player.direction || 0),
      answered: Boolean(player.answered)
    }))
    .sort((a, b) => b.height - a.height || b.score - a.score)
    .slice(0, 9);
}

function createScene(THREE, container) {
  container.textContent = "";
  const canvasHost = document.createElement("div");
  canvasHost.className = "climb-canvas";
  container.append(canvasHost);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202329);
  scene.fog = new THREE.Fog(0x202329, 13, 34);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(6.5, 7, 12);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  canvasHost.append(renderer.domElement);

  const tower = new THREE.Group();
  const players = new THREE.Group();
  scene.add(tower, players);

  scene.add(new THREE.HemisphereLight(0xfff2c7, 0x243044, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(4, 12, 6);
  scene.add(key);

  const loopFeet = 900;
  const platformCount = 58;
  const radius = 3.25;
  const levelGap = 0.52;
  let activeCourse = "";

  function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: options.emissive ?? 0x000000,
      metalness: options.metalness ?? 0.14,
      roughness: options.roughness ?? 0.72
    });
  }

  function buildCourse(courseId) {
    const theme = courseThemes[courseId] || courseThemes.castle;
    activeCourse = courseId;
    tower.clear();
    scene.background = new THREE.Color(theme.background);
    scene.fog = new THREE.Fog(theme.fog, 13, 36);

    const baseMaterial = material(theme.base);
    const railMaterial = material(theme.rail, { emissive: theme.rail, roughness: 0.5 });
    const accentMaterial = material(theme.accent, { emissive: theme.accent, roughness: 0.62 });

    for (let i = 0; i < platformCount; i += 1) {
      const bend = Math.sin(i * 0.37) * 0.28;
      const angle = i * 0.64 + bend;
      const y = i * levelGap - 2.4;
      const width = theme.obstacle === "trees" ? 1.35 : theme.obstacle === "dock" ? 1.55 : 1.82;
      const depth = theme.obstacle === "clubhouse" ? 0.82 : 0.66;
      const platform = new THREE.Mesh(new THREE.BoxGeometry(width, 0.13, depth), i % 5 === 0 ? railMaterial : baseMaterial);
      platform.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      platform.rotation.y = -angle + (i % 7 === 0 ? 0.32 : 0);
      tower.add(platform);

      if (i % 4 === 0) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.16, 10), railMaterial);
        rail.position.set(Math.cos(angle) * (radius - 0.8), y + 0.42, Math.sin(angle) * (radius - 0.8));
        rail.rotation.z = Math.PI / 2;
        rail.rotation.y = -angle;
        tower.add(rail);
      }

      if (i % 6 === 2) {
        addObstacle(theme, accentMaterial, railMaterial, angle, y + 0.42, i);
      }
    }

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, platformCount * levelGap + 2, 18),
      material(theme.accent, { emissive: theme.accent, roughness: 0.7 })
    );
    core.position.y = platformCount * levelGap * 0.5 - 2.4;
    tower.add(core);
  }

  function addObstacle(theme, accentMaterial, railMaterial, angle, y, index) {
    const group = new THREE.Group();
    const lane = radius + 0.12;
    group.position.set(Math.cos(angle) * lane, y, Math.sin(angle) * lane);
    group.rotation.y = -angle;

    const type = theme.obstacle === "mixed"
      ? ["spires", "clubhouse", "bows", "dock", "trees"][index % 5]
      : theme.obstacle;

    if (type === "spires") {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.74, 5), accentMaterial);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.34, 8), railMaterial);
      cone.position.y = 0.46;
      base.position.y = 0.08;
      group.add(base, cone);
    } else if (type === "clubhouse") {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), accentMaterial);
      const earA = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), railMaterial);
      const earB = earA.clone();
      earA.position.set(-0.22, 0.42, 0.02);
      earB.position.set(0.22, 0.42, 0.02);
      group.add(block, earA, earB);
    } else if (type === "bows") {
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), railMaterial);
      const left = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 4), accentMaterial);
      const right = left.clone();
      left.rotation.z = Math.PI / 2;
      right.rotation.z = -Math.PI / 2;
      left.position.x = -0.24;
      right.position.x = 0.24;
      group.add(left, knot, right);
    } else if (type === "dock") {
      for (let plank = 0; plank < 3; plank += 1) {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.18), plank % 2 ? railMaterial : accentMaterial);
        board.position.x = (plank - 1) * 0.18;
        board.rotation.z = (plank - 1) * 0.35;
        group.add(board);
      }
    } else if (type === "trees") {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.74, 10), accentMaterial);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.64, 10), railMaterial);
      top.position.y = 0.58;
      group.add(trunk, top);
    }

    tower.add(group);
  }

  buildCourse("castle");

  const labelLayer = document.createElement("div");
  labelLayer.className = "climb-label-layer";
  container.append(labelLayer);

  const playerMeshes = new Map();

  function size() {
    const rect = canvasHost.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(300, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function makeClimber(player) {
    const avatar = getAvatar(player.avatar);
    const color = new THREE.Color(avatar.color);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.28),
      roughness: 0.42
    });
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.46, 5, 12), material);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), material);
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.025, 8, 24),
      new THREE.MeshBasicMaterial({ color: avatar.glow })
    );
    head.position.y = 0.47;
    glow.position.y = 0.25;
    glow.rotation.x = Math.PI / 2;
    group.add(body, head, glow);
    players.add(group);
    return group;
  }

  function update(climbers, courseId = "castle") {
    size();
    if (courseId !== activeCourse) buildCourse(courseId);
    const active = new Set();
    const leaderHeight = Math.max(120, ...climbers.map((player) => player.height));
    camera.position.y = 4.2 + (leaderHeight % loopFeet) / 55;

    climbers.forEach((player, index) => {
      active.add(player.id);
      const mesh = playerMeshes.get(player.id) || makeClimber(player);
      playerMeshes.set(player.id, mesh);
      const loopHeight = player.height % loopFeet;
      const angle = loopHeight / 72 + (player.direction || 0) * 0.55 + index * 0.32;
      const y = loopHeight / 38 - 1.8;
      const lane = radius - 0.45 + (Math.abs(player.direction || index) % 4) * 0.23;
      mesh.position.set(Math.cos(angle) * lane, y, Math.sin(angle) * lane);
      mesh.rotation.y = -angle + Math.PI / 2;
      mesh.userData.targetHeight = player.height;
      mesh.userData.answered = player.answered;
    });

    for (const [id, mesh] of playerMeshes) {
      if (!active.has(id)) {
        players.remove(mesh);
        playerMeshes.delete(id);
      }
    }

    labelLayer.innerHTML = climbers.map((player, index) => {
      const avatar = getAvatar(player.avatar);
      const lap = Math.floor(player.height / loopFeet) + 1;
      return `
        <div class="climb-label" style="--avatar-color:${avatar.color}">
          <strong>#${index + 1} ${escape(player.name)}</strong>
          <span>${escape(avatar.name)} · ${Math.round(player.height)} ft · Loop ${lap}</span>
        </div>
      `;
    }).join("");
  }

  let frame = 0;
  function animate() {
    if (!document.body.contains(container)) {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      return;
    }
    frame += 0.01;
    tower.rotation.y = frame * 0.28;
    players.children.forEach((mesh, index) => {
      mesh.position.y += Math.sin(frame * 5 + index) * 0.002;
      mesh.scale.setScalar(mesh.userData.answered ? 1.12 : 1);
    });
    camera.lookAt(0, camera.position.y + 2, 0);
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", size, { passive: true });
  size();
  renderer.setAnimationLoop(animate);

  return { update };
}

function renderFallback(container, climbers) {
  container.innerHTML = `
    <div class="climb-fallback">
      ${climbers.map((player) => {
        const avatar = getAvatar(player.avatar);
        const progress = Math.min(100, (player.height % 900) / 9);
        return `
          <div class="fallback-row">
            <span style="--avatar-color:${avatar.color}">${escape(avatar.short)}</span>
            <strong>${escape(player.name)}</strong>
            <em>${Math.round(player.height)} ft</em>
            <div><i style="width:${progress}%"></i></div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function escape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
