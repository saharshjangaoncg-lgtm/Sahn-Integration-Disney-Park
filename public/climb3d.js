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

const scenes = new WeakMap();
let threeModulePromise = null;

export function getAvatar(id) {
  return avatarOptions.find((avatar) => avatar.id === id) || avatarOptions[0];
}

export function renderClimbScene(container, climbers) {
  if (!container) return;
  const safeClimbers = normalizeClimbers(climbers);
  if (!threeModulePromise) {
    threeModulePromise = import("/vendor/three.module.js");
  }

  threeModulePromise
    .then((THREE) => {
      const scene = scenes.get(container) || createScene(THREE, container);
      scenes.set(container, scene);
      scene.update(safeClimbers);
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
  const platformCount = 52;
  const radius = 3.25;
  const levelGap = 0.52;
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a404a,
    metalness: 0.12,
    roughness: 0.76
  });
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6d24a,
    emissive: 0x2a2100,
    metalness: 0.2,
    roughness: 0.5
  });

  for (let i = 0; i < platformCount; i += 1) {
    const angle = i * 0.64;
    const y = i * levelGap - 2.4;
    const platform = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.13, 0.68), i % 5 === 0 ? railMaterial : baseMaterial);
    platform.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    platform.rotation.y = -angle;
    tower.add(platform);

    if (i % 4 === 0) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10), railMaterial);
      rail.position.set(Math.cos(angle) * (radius - 0.78), y + 0.42, Math.sin(angle) * (radius - 0.78));
      rail.rotation.z = Math.PI / 2;
      rail.rotation.y = -angle;
      tower.add(rail);
    }
  }

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, platformCount * levelGap + 2, 18),
    new THREE.MeshStandardMaterial({ color: 0x5c4dd9, emissive: 0x171136, roughness: 0.7 })
  );
  core.position.y = platformCount * levelGap * 0.5 - 2.4;
  tower.add(core);

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

  function update(climbers) {
    size();
    const active = new Set();
    const leaderHeight = Math.max(120, ...climbers.map((player) => player.height));
    camera.position.y = 4.2 + (leaderHeight % loopFeet) / 55;

    climbers.forEach((player, index) => {
      active.add(player.id);
      const mesh = playerMeshes.get(player.id) || makeClimber(player);
      playerMeshes.set(player.id, mesh);
      const loopHeight = player.height % loopFeet;
      const angle = loopHeight / 72 + index * 0.58;
      const y = loopHeight / 38 - 1.8;
      const lane = radius - 0.35 + (index % 3) * 0.32;
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
