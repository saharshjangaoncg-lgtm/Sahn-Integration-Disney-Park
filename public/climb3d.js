import { avatarOptions, getAvatarById } from "./avatar-data.js";

export { avatarOptions };

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
  return getAvatarById(id);
}

export function renderClimbScene(container, climbers, courseId = "castle", focusPlayerId = "") {
  if (!container) return;
  const safeClimbers = normalizeClimbers(climbers);
  if (!threeModulePromise) {
    threeModulePromise = import("/vendor/three.module.js");
  }

  threeModulePromise
    .then((THREE) => {
      const scene = scenes.get(container) || createScene(THREE, container);
      scenes.set(container, scene);
      scene.update(safeClimbers, courseId, focusPlayerId);
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
      falls: Number(player.falls || 0),
      lastClimbAt: Number(player.lastClimbAt || 0),
      lastJumpAt: Number(player.lastJumpAt || 0),
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
  const platformCount = 72;
  const laneWidth = 0.52;
  const levelGap = 0.52;
  let activeCourse = "";
  let cameraTarget = new THREE.Vector3(0, 1, 0);
  let cameraBasePosition = new THREE.Vector3(6.5, 7, 12);
  let lookYaw = 0;
  let lookPitch = 0;
  let draggingLook = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let focusedRoutePoint = null;
  const focusedTarget = new THREE.Vector3();

  function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: options.emissive ?? 0x000000,
      metalness: options.metalness ?? 0.14,
      roughness: options.roughness ?? 0.72
    });
  }

  function roundedPadGeometry(width, height, depth, radius = 0.18) {
    const x = -width / 2;
    const y = -depth / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + depth - radius);
    shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
    shape.lineTo(x + radius, y + depth);
    shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.035,
      bevelSegments: 3,
      curveSegments: 8
    });
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, height / 2, 0);
    return geometry;
  }

  function routePoint(step, lane = 0) {
    const segmentSize = 7;
    const segment = Math.floor(step / segmentSize);
    const local = (step % segmentSize) / segmentSize;
    const direction = segment % 2 === 0 ? 1 : -1;
    const xStart = direction > 0 ? -3.35 : 3.35;
    const xEnd = direction > 0 ? 3.35 : -3.35;
    const zLane = ((segment % 5) - 2) * 1.18;
    const x = xStart + (xEnd - xStart) * local + Math.sin(step * 0.76) * 0.16;
    const z = zLane + Math.sin(step * 0.44) * 0.24 + Math.max(-2, Math.min(2, lane)) * laneWidth;
    const y = step * levelGap - 2.4;
    return { x, y, z, yaw: direction > 0 ? 0 : Math.PI };
  }

  function updateFocusedCameraBase() {
    if (!focusedRoutePoint) return;
    const cameraAngle = focusedRoutePoint.yaw + Math.PI + lookYaw;
    const distance = 4.65;
    cameraBasePosition.set(
      focusedTarget.x + Math.cos(cameraAngle) * distance,
      focusedTarget.y + 2.15 + lookPitch,
      focusedTarget.z + Math.sin(cameraAngle) * distance
    );
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
    const shadowMaterial = material(0x111827, { roughness: 0.92 });

    for (let i = 0; i < platformCount; i += 1) {
      const point = routePoint(i, 0);
      const width = theme.obstacle === "trees" ? 1.28 : theme.obstacle === "dock" ? 1.72 : 1.92;
      const depth = theme.obstacle === "clubhouse" ? 0.94 : 0.72;
      const platformGeometry = roundedPadGeometry(width, 0.13, depth, Math.min(0.28, depth * 0.42));
      const platform = new THREE.Mesh(platformGeometry, i % 5 === 0 ? railMaterial : baseMaterial);
      platform.position.set(point.x, point.y, point.z);
      platform.rotation.y = point.yaw + (i % 9 === 0 ? 0.18 : 0);
      tower.add(platform);

      const underside = new THREE.Mesh(roundedPadGeometry(width * 0.9, 0.2, depth * 0.86, Math.min(0.24, depth * 0.35)), shadowMaterial);
      underside.position.set(point.x, point.y - 0.15, point.z);
      underside.rotation.y = platform.rotation.y;
      tower.add(underside);

      if (i % 3 === 0) {
        addLaneMarker(railMaterial, point, i);
      }

      if (i > 0) {
        const prev = routePoint(i - 1, 0);
        const dx = point.x - prev.x;
        const dz = point.z - prev.z;
        const distance = Math.hypot(dx, dz);
        const bridge = new THREE.Mesh(roundedPadGeometry(Math.max(0.45, distance), 0.055, 0.18, 0.08), railMaterial);
        bridge.position.set((point.x + prev.x) / 2, point.y - 0.08, (point.z + prev.z) / 2);
        bridge.rotation.y = Math.atan2(dz, dx);
        tower.add(bridge);
      }

      if (i % 5 === 0) {
        const left = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.02, 10), railMaterial);
        const right = left.clone();
        left.position.set(point.x, point.y + 0.38, point.z - 0.47);
        right.position.set(point.x, point.y + 0.38, point.z + 0.47);
        left.rotation.z = Math.PI / 2;
        right.rotation.z = Math.PI / 2;
        left.rotation.y = point.yaw;
        right.rotation.y = point.yaw;
        tower.add(left, right);
      }

      if (i % 6 === 2) {
        addObstacle(theme, accentMaterial, railMaterial, shadowMaterial, point, i);
      }
    }

    for (let marker = 0; marker < 5; marker += 1) {
      const banner = new THREE.Mesh(roundedPadGeometry(1.6, 0.08, 0.7, 0.15), accentMaterial);
      const point = routePoint(marker * 12 + 4, marker % 2 ? -1 : 1);
      banner.position.set(point.x, point.y + 1.05, point.z);
      banner.rotation.y = point.yaw;
      tower.add(banner);
    }
  }

  function addLaneMarker(railMaterial, point, index) {
    const group = new THREE.Group();
    group.position.set(point.x, point.y + 0.12, point.z);
    group.rotation.y = point.yaw;
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.055), railMaterial);
    const right = left.clone();
    left.position.set(-0.12, 0, -0.08);
    right.position.set(0.12, 0, 0.08);
    left.rotation.y = 0.45;
    right.rotation.y = -0.45;
    if (index % 2) {
      left.scale.x = 0.72;
      right.scale.x = 0.72;
    }
    group.add(left, right);
    tower.add(group);
  }

  function addObstacle(theme, accentMaterial, railMaterial, shadowMaterial, point, index) {
    const group = new THREE.Group();
    group.position.set(point.x, point.y + 0.42, point.z);
    group.rotation.y = point.yaw;

    const type = theme.obstacle === "mixed"
      ? ["spires", "clubhouse", "bows", "dock", "trees", "inflatable"][index % 6]
      : theme.obstacle;

    if (type === "spires") {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.74, 5), accentMaterial);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.34, 8), railMaterial);
      const towerA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.52, 8), shadowMaterial);
      const towerB = towerA.clone();
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.035), railMaterial);
      cone.position.y = 0.46;
      base.position.y = 0.08;
      towerA.position.set(-0.34, 0.2, -0.12);
      towerB.position.set(0.34, 0.2, -0.12);
      flag.position.set(0.22, 0.82, 0);
      group.add(base, cone, towerA, towerB, flag);
    } else if (type === "clubhouse") {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), accentMaterial);
      const earA = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), railMaterial);
      const earB = earA.clone();
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.035), shadowMaterial);
      earA.position.set(-0.22, 0.42, 0.02);
      earB.position.set(0.22, 0.42, 0.02);
      door.position.set(0, -0.08, 0.27);
      group.add(block, earA, earB, door);
    } else if (type === "bows") {
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), railMaterial);
      const left = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 4), accentMaterial);
      const right = left.clone();
      const ribbonA = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.045), railMaterial);
      const ribbonB = ribbonA.clone();
      left.rotation.z = Math.PI / 2;
      right.rotation.z = -Math.PI / 2;
      left.position.x = -0.24;
      right.position.x = 0.24;
      ribbonA.position.set(-0.1, -0.26, 0);
      ribbonB.position.set(0.1, -0.26, 0);
      ribbonA.rotation.z = 0.28;
      ribbonB.rotation.z = -0.28;
      group.add(left, knot, right, ribbonA, ribbonB);
    } else if (type === "dock") {
      for (let plank = 0; plank < 3; plank += 1) {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.18), plank % 2 ? railMaterial : accentMaterial);
        board.position.x = (plank - 1) * 0.18;
        board.rotation.z = (plank - 1) * 0.35;
        group.add(board);
      }
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 10), railMaterial);
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.035), shadowMaterial);
      mast.position.set(0.34, 0.2, -0.04);
      sail.position.set(0.18, 0.42, -0.04);
      sail.rotation.z = -0.25;
      group.add(mast, sail);
    } else if (type === "trees") {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.74, 10), accentMaterial);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.64, 10), railMaterial);
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.5, 8), accentMaterial);
      top.position.y = 0.58;
      branch.position.set(0.22, 0.28, 0);
      branch.rotation.z = 1.12;
      group.add(trunk, top, branch);
    } else if (type === "inflatable") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.22, 0.34), accentMaterial);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 8, 24, Math.PI), railMaterial);
      const postA = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.45, 12), accentMaterial);
      const postB = postA.clone();
      arch.position.y = 0.28;
      arch.rotation.z = Math.PI;
      postA.position.set(-0.34, 0.2, 0);
      postB.position.set(0.34, 0.2, 0);
      group.add(base, arch, postA, postB);
    }

    tower.add(group);
  }

  buildCourse("castle");

  canvasHost.addEventListener("pointerdown", (event) => {
    draggingLook = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvasHost.setPointerCapture?.(event.pointerId);
  });

  canvasHost.addEventListener("pointermove", (event) => {
    if (!draggingLook) return;
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lookYaw += dx * 0.006;
    lookPitch = Math.max(-0.9, Math.min(1.05, lookPitch + dy * 0.006));
    updateFocusedCameraBase();
  });

  canvasHost.addEventListener("pointerup", (event) => {
    draggingLook = false;
    canvasHost.releasePointerCapture?.(event.pointerId);
  });

  canvasHost.addEventListener("pointerleave", () => {
    draggingLook = false;
  });

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
    const accentColor = new THREE.Color(avatar.accent || avatar.glow || "#ffffff");
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.28),
      roughness: 0.42
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor.clone().multiplyScalar(0.18),
      roughness: 0.48
    });
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.46, 5, 12), material);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), material);
    const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.25, 4, 8), accentMaterial);
    const rightArm = leftArm.clone();
    const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.24, 4, 8), material);
    const rightLeg = leftLeg.clone();
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.025, 8, 24),
      new THREE.MeshBasicMaterial({ color: avatar.glow })
    );
    body.position.y = 0.12;
    head.position.y = 0.47;
    leftArm.position.set(-0.22, 0.19, 0);
    rightArm.position.set(0.22, 0.19, 0);
    leftArm.rotation.z = -0.5;
    rightArm.rotation.z = 0.5;
    leftLeg.position.set(-0.08, -0.22, 0);
    rightLeg.position.set(0.08, -0.22, 0);
    leftLeg.rotation.z = 0.16;
    rightLeg.rotation.z = -0.16;
    glow.position.y = 0.25;
    glow.rotation.x = Math.PI / 2;
    group.add(leftLeg, rightLeg, body, leftArm, rightArm, head, glow);
    group.userData.parts = { leftArm, rightArm, leftLeg, rightLeg, body, head, glow };
    addAvatarFeatures(group, avatar, material, accentMaterial);
    group.scale.setScalar(1.08);
    players.add(group);
    return group;
  }

  function addAvatarFeatures(group, avatar, material, accentMaterial) {
    if (["mouse", "bow", "ears"].includes(avatar.shape)) {
      const left = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), material);
      const right = left.clone();
      left.position.set(-0.14, 0.64, 0);
      right.position.set(0.14, 0.64, 0);
      group.add(left, right);
    }

    if (avatar.shape === "bow") {
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), accentMaterial);
      const leftBow = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 4), accentMaterial);
      const rightBow = leftBow.clone();
      knot.position.set(0, 0.77, 0.02);
      leftBow.position.set(-0.08, 0.77, 0.02);
      rightBow.position.set(0.08, 0.77, 0.02);
      leftBow.rotation.z = Math.PI / 2;
      rightBow.rotation.z = -Math.PI / 2;
      group.add(leftBow, knot, rightBow);
    }

    if (avatar.shape === "duck") {
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4), accentMaterial);
      beak.position.set(0, 0.46, 0.17);
      beak.rotation.x = Math.PI / 2;
      group.add(beak);
    }

    if (["hat", "cowboy", "chef"].includes(avatar.shape)) {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.035, 16), accentMaterial);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(avatar.shape === "chef" ? 0.12 : 0.1, 0.12, 0.14, 14), accentMaterial);
      brim.position.y = 0.66;
      cap.position.y = 0.75;
      group.add(brim, cap);
    }

    if (["alien", "space"].includes(avatar.shape)) {
      const wingA = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.03), accentMaterial);
      const wingB = wingA.clone();
      wingA.position.set(-0.24, 0.2, -0.02);
      wingB.position.set(0.24, 0.2, -0.02);
      wingA.rotation.z = -0.5;
      wingB.rotation.z = 0.5;
      group.add(wingA, wingB);
    }

    if (["snow", "snowman"].includes(avatar.shape)) {
      const snowA = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), accentMaterial);
      const snowB = snowA.clone();
      snowA.position.set(-0.08, 0.08, 0.16);
      snowB.position.set(0.08, -0.1, 0.16);
      group.add(snowA, snowB);
    }

    if (["crown", "lion", "rose", "tower", "magic", "wave", "car", "bear", "star"].includes(avatar.shape)) {
      const marker = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 8, 18), accentMaterial);
      marker.position.y = 0.7;
      marker.rotation.x = Math.PI / 2;
      group.add(marker);
    }
  }

  function playerRoutePoint(player) {
    const loopHeight = player.height % loopFeet;
    const progress = loopHeight / 24;
    const step = Math.min(platformCount - 2, Math.max(0, Math.floor(progress)));
    const nextStep = Math.min(platformCount - 1, step + 1);
    const mix = Math.max(0, Math.min(1, progress - step));
    const lane = Math.max(-2, Math.min(2, player.direction || 0));
    const from = routePoint(step, lane);
    const to = routePoint(nextStep, lane);
    return {
      x: from.x + (to.x - from.x) * mix,
      y: from.y + (to.y - from.y) * mix,
      z: from.z + (to.z - from.z) * mix,
      yaw: from.yaw + (to.yaw - from.yaw) * mix
    };
  }

  function update(climbers, courseId = "castle", focusPlayerId = "") {
    size();
    if (courseId !== activeCourse) buildCourse(courseId);
    const active = new Set();
    const focusPlayer = climbers.find((player) => player.id === focusPlayerId) || null;

    if (focusPlayer) {
      const point = playerRoutePoint(focusPlayer);
      const target = new THREE.Vector3(point.x, point.y + 0.82, point.z);
      if (!focusedRoutePoint) {
        cameraTarget.copy(target);
        focusedTarget.copy(target);
      } else {
        cameraTarget.lerp(target, 0.26);
        focusedTarget.lerp(target, 0.26);
      }
      focusedRoutePoint = point;
      updateFocusedCameraBase();
    } else {
      focusedRoutePoint = null;
      const leaderHeight = Math.max(120, ...climbers.map((player) => player.height));
      const leaderStep = Math.floor((leaderHeight % loopFeet) / 24);
      const leaderPoint = routePoint(Math.min(platformCount - 1, leaderStep), 0);
      cameraTarget.set(leaderPoint.x, leaderPoint.y + 1.4, leaderPoint.z);
      cameraBasePosition.set(leaderPoint.x + 5.8, leaderPoint.y + 5.4, leaderPoint.z + 8.2);
    }

    climbers.forEach((player, index) => {
      active.add(player.id);
      const mesh = playerMeshes.get(player.id) || makeClimber(player);
      playerMeshes.set(player.id, mesh);
      const point = playerRoutePoint(player);
      const targetPosition = new THREE.Vector3(point.x, point.y + 0.45, point.z);
      if (!mesh.userData.targetPosition) {
        mesh.userData.targetPosition = targetPosition.clone();
        mesh.position.copy(targetPosition);
        mesh.rotation.y = point.yaw + Math.PI / 2;
      } else {
        mesh.userData.targetPosition.copy(targetPosition);
      }
      mesh.userData.targetYaw = point.yaw + Math.PI / 2;
      mesh.userData.targetHeight = player.height;
      mesh.userData.answered = player.answered;
      mesh.userData.falling = player.height === 0 && (player.falls || 0) > 0;
      mesh.userData.lastClimbAt = player.lastClimbAt;
      mesh.userData.lastJumpAt = player.lastJumpAt;
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
    tower.rotation.y = Math.sin(frame * 0.22) * 0.035;
    players.rotation.y = tower.rotation.y;
    players.children.forEach((mesh, index) => {
      const now = Date.now();
      const moveAge = mesh.userData.lastClimbAt ? now - mesh.userData.lastClimbAt : 9999;
      const jumpAge = mesh.userData.lastJumpAt ? now - mesh.userData.lastJumpAt : 9999;
      const runBlend = Math.max(0, Math.min(1, 1 - moveAge / 240));
      const jumpLift = jumpAge < 820 ? Math.sin((jumpAge / 820) * Math.PI) * 0.86 : 0;
      const stride = Math.sin(now * 0.018 + index);
      const bob = runBlend * Math.abs(stride) * 0.055;
      const target = mesh.userData.targetPosition;
      if (target) {
        mesh.position.x += (target.x - mesh.position.x) * 0.13;
        mesh.position.z += (target.z - mesh.position.z) * 0.13;
        mesh.position.y += (target.y + bob + jumpLift - mesh.position.y) * 0.16;
      }
      if (typeof mesh.userData.targetYaw === "number") {
        const yawDelta = Math.atan2(Math.sin(mesh.userData.targetYaw - mesh.rotation.y), Math.cos(mesh.userData.targetYaw - mesh.rotation.y));
        mesh.rotation.y += yawDelta * 0.14;
      }
      const parts = mesh.userData.parts || {};
      if (parts.leftLeg) {
        parts.leftLeg.rotation.x = stride * 0.58 * runBlend;
        parts.rightLeg.rotation.x = -stride * 0.58 * runBlend;
        parts.leftArm.rotation.x = -stride * 0.42 * runBlend;
        parts.rightArm.rotation.x = stride * 0.42 * runBlend;
        parts.body.rotation.x = -0.08 * runBlend - jumpLift * 0.08;
        parts.head.position.y = 0.47 + bob * 0.45;
        parts.glow.rotation.z += 0.02 + runBlend * 0.035;
      }
      mesh.rotation.z = mesh.userData.falling ? Math.sin(frame * 8 + index) * 0.24 : 0;
      mesh.scale.setScalar(mesh.userData.answered ? 1.12 : 1);
    });
    camera.position.lerp(cameraBasePosition, 0.08);
    camera.lookAt(cameraTarget);
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
