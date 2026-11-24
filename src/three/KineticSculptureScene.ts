import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

export type SculptureKind = 'star' | 'shield' | 'helix';
export type MaterialFinish = 'gold' | 'platinum' | 'obsidian' | 'copper';
export type MotionMode = 'orbital' | 'harmonic' | 'zerog';
export type CameraPreset = 'hero' | 'top' | 'macro';

export interface SceneConfig {
  sculpture: SculptureKind;
  finish: MaterialFinish;
  motion: MotionMode;
  explode: number; // 0..1
}

export interface KineticSceneController {
  setConfig: (partial: Partial<SceneConfig>) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setPointerNormalized: (nx: number, ny: number, active: boolean) => void;
  dispose: () => void;
}

const _vec3 = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _mouseNdc = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();
const _cursorPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _cursorWorld = new THREE.Vector3(0, 0, 0);
const _camTargetPos = new THREE.Vector3(0, 0.35, 7.2);
const _camLookTarget = new THREE.Vector3(0, 0.05, 0);

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createRadialShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.38)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBrushedMetalBumpTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const v = 116 + Math.floor(Math.random() * 24);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, size, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAniso;
  return tex;
}

function createFiveStarGeometry(outerR: number, innerR: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points + Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.045,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

function createShieldGeometry(scale: number, depth: number, hollow = false): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.25 * scale);
  shape.lineTo(1.05 * scale, 0.92 * scale);
  shape.bezierCurveTo(1.08 * scale, 0.05 * scale, 0.68 * scale, -0.78 * scale, 0, -1.28 * scale);
  shape.bezierCurveTo(-0.68 * scale, -0.78 * scale, -1.08 * scale, 0.05 * scale, -1.05 * scale, 0.92 * scale);
  shape.closePath();

  if (hollow) {
    const hole = new THREE.Path();
    const s = scale * 0.78;
    hole.moveTo(0, 1.22 * s);
    hole.lineTo(-1.02 * s, 0.9 * s);
    hole.bezierCurveTo(-1.04 * s, 0.05 * s, -0.66 * s, -0.75 * s, 0, -1.24 * s);
    hole.bezierCurveTo(0.66 * s, -0.75 * s, 1.04 * s, 0.05 * s, 1.02 * s, 0.9 * s);
    hole.closePath();
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

function createBeveledRingGeometry(outerR: number, innerR: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 64,
  });
  geo.center();
  return geo;
}

export function mountKineticSculptureScene(
  container: HTMLElement,
  initialConfig: SceneConfig,
  onContextLostChange?: (lost: boolean) => void
): KineticSceneController {
  const isSoftwareGl = detectSoftwareGl();

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060d16);
  scene.fog = new THREE.FogExp2(0x060d16, 0.042);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
  camera.position.copy(_camTargetPos);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  scene.environment = envTex;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // Three-point warm/cool studio rig
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x101827, 0.8);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffedd5, 2.4);
  keyLight.position.set(5, 7, 5);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -5;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xfbbf24, 1.5);
  rimLight.position.set(-5, 3, -5);
  scene.add(rimLight);

  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    const softbox1 = new THREE.RectAreaLight(0xfff7ed, 4.5, 4, 2);
    softbox1.position.set(4.5, 3.5, 3.5);
    softbox1.lookAt(0, 0, 0);
    scene.add(softbox1);

    const softbox2 = new THREE.RectAreaLight(0xbae6fd, 2.6, 3.5, 2.5);
    softbox2.position.set(-4.5, -1.5, 3);
    softbox2.lookAt(0, 0, 0);
    scene.add(softbox2);
  }

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  renderer.domElement.style.touchAction = isCoarsePointer ? 'pan-y' : 'none';

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = !isCoarsePointer;
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.enableZoom = !isCoarsePointer;
  controls.minDistance = 4.0;
  controls.maxDistance = 12.0;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI - 0.35;
  controls.target.copy(_camLookTarget);

  let cameraPresetActive = false;
  controls.addEventListener('start', () => {
    cameraPresetActive = false;
  });

  // Grounding shadow + plinth ring
  const shadowTex = createRadialShadowTexture();
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 6.5),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.68,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -2.42;
  scene.add(shadowPlane);

  const stagePlinth = new THREE.Mesh(
    new THREE.RingGeometry(1.78, 1.81, 72),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  stagePlinth.rotation.x = -Math.PI / 2;
  stagePlinth.position.y = -2.4;
  scene.add(stagePlinth);

  // PBR Materials
  const brushedBump = createBrushedMetalBumpTexture(maxAniso);

  const primaryMat = new THREE.MeshPhysicalMaterial({
    color: 0xf5b041,
    metalness: 0.94,
    roughness: 0.17,
    bumpMap: brushedBump,
    bumpScale: 0.008,
    anisotropy: 0.75,
    anisotropyRotation: 0.25,
    clearcoat: 0.25,
    clearcoatRoughness: 0.15,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.55,
    roughness: 0.48,
  });

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xfef3c7,
    metalness: 0.05,
    roughness: 0.08,
    transmission: isSoftwareGl ? 0 : 0.88,
    transparent: true,
    opacity: isSoftwareGl ? 0.52 : 1.0,
    ior: 1.65,
    thickness: 1.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    iridescence: 0.45,
    depthWrite: !isSoftwareGl,
  });

  const filamentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.45,
    roughness: 0.22,
    metalness: 0.2,
  });

  function applyFinish(finish: MaterialFinish) {
    if (finish === 'gold') {
      primaryMat.color.setHex(0xf59e0b);
      primaryMat.metalness = 0.95;
      primaryMat.roughness = 0.16;
      primaryMat.transmission = 0;
      primaryMat.transparent = false;
      primaryMat.opacity = 1;
      secondaryMat.color.setHex(0x162235);
      secondaryMat.roughness = 0.48;
      filamentMat.color.setHex(0xfbbf24);
      filamentMat.emissive.setHex(0xf59e0b);
    } else if (finish === 'platinum') {
      primaryMat.color.setHex(0xe2e8f0);
      primaryMat.metalness = 0.96;
      primaryMat.roughness = 0.14;
      primaryMat.transmission = 0;
      primaryMat.transparent = false;
      primaryMat.opacity = 1;
      secondaryMat.color.setHex(0x334155);
      secondaryMat.roughness = 0.44;
      filamentMat.color.setHex(0x38bdf8);
      filamentMat.emissive.setHex(0x0284c7);
    } else if (finish === 'obsidian') {
      primaryMat.color.setHex(0x18181b);
      primaryMat.metalness = 0.25;
      primaryMat.roughness = 0.08;
      primaryMat.transmission = isSoftwareGl ? 0 : 0.72;
      primaryMat.transparent = true;
      primaryMat.opacity = isSoftwareGl ? 0.65 : 1;
      secondaryMat.color.setHex(0xd4d4d8);
      secondaryMat.roughness = 0.28;
      filamentMat.color.setHex(0xfbbf24);
      filamentMat.emissive.setHex(0xf59e0b);
    } else if (finish === 'copper') {
      primaryMat.color.setHex(0xd97745);
      primaryMat.metalness = 0.92;
      primaryMat.roughness = 0.22;
      primaryMat.transmission = 0;
      primaryMat.transparent = false;
      primaryMat.opacity = 1;
      secondaryMat.color.setHex(0x292524);
      secondaryMat.roughness = 0.52;
      filamentMat.color.setHex(0xfb923c);
      filamentMat.emissive.setHex(0xea580c);
    }
    primaryMat.needsUpdate = true;
  }

  const rootRig = new THREE.Group();
  rootRig.position.y = 0.05;
  scene.add(rootRig);

  // ---------------------------------------------------------------------------
  // SCULPTURE 1: 5-STAR REPUTATION CREST (Multi-part hero star + gimbals + 5 satellites)
  // ---------------------------------------------------------------------------
  const starGroup = new THREE.Group();
  rootRig.add(starGroup);

  // Central beveled 5-star emblem
  const mainStarGeo = createFiveStarGeometry(0.76, 0.34, 0.22);
  const mainStarMesh = new THREE.Mesh(mainStarGeo, filamentMat);
  mainStarMesh.castShadow = !isSoftwareGl;
  starGroup.add(mainStarMesh);

  // Translucent faceted crystal protective housing
  const crystalShellMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, 1), crystalMat);
  crystalShellMesh.renderOrder = 2;
  starGroup.add(crystalShellMesh);

  // Three concentric gimbal trust rings
  const outerRingMesh = new THREE.Mesh(createBeveledRingGeometry(1.78, 1.58, 0.14), primaryMat);
  outerRingMesh.castShadow = !isSoftwareGl;
  starGroup.add(outerRingMesh);

  const midRingMesh = new THREE.Mesh(createBeveledRingGeometry(1.42, 1.25, 0.12), secondaryMat);
  midRingMesh.castShadow = !isSoftwareGl;
  starGroup.add(midRingMesh);

  const innerRingMesh = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.045, 18, 72), primaryMat);
  starGroup.add(innerRingMesh);

  // 5 Orbiting Mini 5-Star Satellites (representing 5-Star Google Rating!)
  const miniStarGeo = createFiveStarGeometry(0.2, 0.09, 0.07);
  const satStars: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const sat = new THREE.Mesh(miniStarGeo, primaryMat);
    sat.castShadow = !isSoftwareGl;
    sat.userData.baseAngle = (i / 5) * Math.PI * 2;
    starGroup.add(sat);
    satStars.push(sat);
  }

  // 30 Instanced precision pins around outer gimbal collar
  const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 10);
  pinGeo.rotateX(Math.PI / 2);
  const pinCount = 30;
  const pinInstanced = new THREE.InstancedMesh(pinGeo, filamentMat, pinCount);
  for (let i = 0; i < pinCount; i++) {
    const a = (i / pinCount) * Math.PI * 2;
    _dummy.position.set(Math.cos(a) * 1.68, Math.sin(a) * 1.68, 0);
    _dummy.rotation.set(0, 0, a);
    _dummy.scale.setScalar(1);
    _dummy.updateMatrix();
    pinInstanced.setMatrixAt(i, _dummy.matrix);
  }
  pinInstanced.instanceMatrix.needsUpdate = true;
  pinInstanced.computeBoundingSphere();
  outerRingMesh.add(pinInstanced);

  // ---------------------------------------------------------------------------
  // SCULPTURE 2: TRUST SHIELD (Beveled layered crest + inner star + orbital shields)
  // ---------------------------------------------------------------------------
  const shieldGroup = new THREE.Group();
  shieldGroup.visible = false;
  rootRig.add(shieldGroup);

  const outerShieldFrame = new THREE.Mesh(createShieldGeometry(1.28, 0.14, true), primaryMat);
  outerShieldFrame.castShadow = !isSoftwareGl;
  const midShieldPlate = new THREE.Mesh(createShieldGeometry(0.95, 0.16, false), secondaryMat);
  midShieldPlate.castShadow = !isSoftwareGl;
  const shieldCoreStar = new THREE.Mesh(createFiveStarGeometry(0.42, 0.19, 0.16), filamentMat);
  shieldCoreStar.position.z = 0.16;
  const shieldBackStar = new THREE.Mesh(createFiveStarGeometry(0.42, 0.19, 0.16), filamentMat);
  shieldBackStar.position.z = -0.16;
  const shieldCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0), crystalMat);
  shieldGroup.add(outerShieldFrame, midShieldPlate, shieldCoreStar, shieldBackStar, shieldCrystal);

  const shieldOrbitRing = new THREE.Mesh(createBeveledRingGeometry(1.72, 1.58, 0.08), primaryMat);
  shieldGroup.add(shieldOrbitRing);

  const cornerPylons: THREE.Mesh[] = [];
  const pylonGeo = new THREE.OctahedronGeometry(0.12, 0);
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(pylonGeo, filamentMat);
    const a = (i / 6) * Math.PI * 2;
    p.userData.dir = new THREE.Vector3(Math.cos(a), Math.sin(a), (i % 2 === 0 ? 1 : -1) * 0.35).normalize();
    shieldGroup.add(p);
    cornerPylons.push(p);
  }

  // ---------------------------------------------------------------------------
  // SCULPTURE 3: GROWTH HELIX (Ascending double spline + 24 turbine vanes)
  // ---------------------------------------------------------------------------
  const helixGroup = new THREE.Group();
  helixGroup.visible = false;
  rootRig.add(helixGroup);

  const helixPtsA: THREE.Vector3[] = [];
  const helixPtsB: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 4;
    const y = (i / 48 - 0.5) * 3.0;
    const r = 0.85 + Math.sin((i / 48) * Math.PI) * 0.35;
    helixPtsA.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
    helixPtsB.push(new THREE.Vector3(Math.cos(t + Math.PI) * r, y, Math.sin(t + Math.PI) * r));
  }
  const helixTubeA = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPtsA), 96, 0.075, 16, false),
    primaryMat
  );
  const helixTubeB = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPtsB), 96, 0.075, 16, false),
    secondaryMat
  );
  helixTubeA.castShadow = !isSoftwareGl;
  helixTubeB.castShadow = !isSoftwareGl;
  helixGroup.add(helixTubeA, helixTubeB);

  const helixCoreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.1, 32), crystalMat);
  const helixFilament = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.9, 16), filamentMat);
  helixGroup.add(helixCoreMesh, helixFilament);

  const vaneCount = 24;
  const vaneInstanced = new THREE.InstancedMesh(new THREE.BoxGeometry(1.45, 0.055, 0.24), primaryMat, vaneCount);
  vaneInstanced.frustumCulled = false;
  helixGroup.add(vaneInstanced);

  const helixCrownTop = new THREE.Mesh(createBeveledRingGeometry(1.15, 0.96, 0.1), secondaryMat);
  helixCrownTop.position.y = 1.55;
  helixCrownTop.rotation.x = Math.PI / 2;
  const helixCrownBot = new THREE.Mesh(createBeveledRingGeometry(1.15, 0.96, 0.1), secondaryMat);
  helixCrownBot.position.y = -1.55;
  helixCrownBot.rotation.x = Math.PI / 2;
  helixGroup.add(helixCrownTop, helixCrownBot);

  // ---------------------------------------------------------------------------
  // ORBITAL STARDUST (160 shards) & 3D CURSOR GRAVITY HALO
  // ---------------------------------------------------------------------------
  const shardCount = 160;
  const shardInstanced = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.032, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.25 }),
    shardCount
  );
  shardInstanced.frustumCulled = false;

  const shardData = Array.from({ length: shardCount }, (_, i) => ({
    angle: (i / shardCount) * Math.PI * 2 + Math.random() * 0.4,
    radius: 2.15 + Math.random() * 2.1,
    yOffset: (Math.random() - 0.5) * 2.8,
    speed: 0.18 + Math.random() * 0.35,
    scale: 0.65 + Math.random() * 0.85,
    phase: Math.random() * Math.PI * 2,
  }));

  const tintColors = [0xf59e0b, 0xfef3c7, 0xcbd5e1, 0x38bdf8];
  const _color = new THREE.Color();
  for (let i = 0; i < shardCount; i++) {
    _color.setHex(tintColors[i % tintColors.length]);
    shardInstanced.setColorAt(i, _color);
  }
  if (shardInstanced.instanceColor) shardInstanced.instanceColor.needsUpdate = true;
  scene.add(shardInstanced);

  // 3D Cursor Halo Ring (compact)
  const cursorHaloGroup = new THREE.Group();
  const haloRing = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.17, 48),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const haloArc = new THREE.Mesh(
    new THREE.RingGeometry(0.21, 0.23, 48, 1, 0, Math.PI * 0.85),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  cursorHaloGroup.add(haloRing, haloArc);
  cursorHaloGroup.position.set(0, 0, 1.4);
  cursorHaloGroup.visible = false;
  scene.add(cursorHaloGroup);

  let config: SceneConfig = { ...initialConfig };
  applyFinish(config.finish);

  function syncActiveModelVisibility() {
    starGroup.visible = config.sculpture === 'star';
    shieldGroup.visible = config.sculpture === 'shield';
    helixGroup.visible = config.sculpture === 'helix';
  }
  syncActiveModelVisibility();

  let pointerActive = false;
  let pointerNx = 0;
  let pointerNy = 0;
  let smoothPointerX = 0;
  let smoothPointerY = 0;
  let smoothExplode = config.explode;
  let smoothScale = 1;

  const handleContextLost = (e: Event) => {
    e.preventDefault();
    onContextLostChange?.(true);
  };
  const handleContextRestored = () => {
    onContextLostChange?.(false);
  };
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  const handleResize = () => {
    const w = Math.max(container.clientWidth, 320);
    const h = Math.max(container.clientHeight, 320);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  let frameId = 0;
  let disposed = false;
  const clock = new THREE.Clock();

  function afterDraw(cb: () => void) {
    if (disposed) return;
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    } else {
      frameId = window.setTimeout(cb, 80);
    }
  }

  function tick() {
    if (disposed) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    smoothExplode = THREE.MathUtils.damp(smoothExplode, config.explode, 6.5, delta);
    smoothScale = THREE.MathUtils.damp(smoothScale, 1, 8.0, delta);

    const targetPx = pointerActive ? pointerNx : Math.sin(elapsed * 0.4) * 0.15;
    const targetPy = pointerActive ? pointerNy : Math.cos(elapsed * 0.3) * 0.1;
    smoothPointerX = THREE.MathUtils.damp(smoothPointerX, targetPx, 6, delta);
    smoothPointerY = THREE.MathUtils.damp(smoothPointerY, targetPy, 6, delta);

    rootRig.rotation.y = THREE.MathUtils.damp(rootRig.rotation.y, smoothPointerX * 0.35, 5, delta);
    rootRig.rotation.x = THREE.MathUtils.damp(rootRig.rotation.x, -smoothPointerY * 0.25, 5, delta);
    rootRig.scale.setScalar(smoothScale);

    if (pointerActive) {
      cursorHaloGroup.visible = true;
      _mouseNdc.set(pointerNx, pointerNy);
      _raycaster.setFromCamera(_mouseNdc, camera);
      _cursorPlane.normal.copy(camera.position).normalize();
      _cursorPlane.constant = -1.6;
      if (_raycaster.ray.intersectPlane(_cursorPlane, _cursorWorld)) {
        cursorHaloGroup.position.lerp(_cursorWorld, 1 - Math.exp(-12 * delta));
        cursorHaloGroup.lookAt(camera.position);
        haloArc.rotation.z = elapsed * 2.4;
      }
    } else {
      cursorHaloGroup.visible = false;
    }

    const motionSpeed =
      config.motion === 'orbital' ? 1.0 : config.motion === 'harmonic' ? 1.55 : 0.45;
    const bobAmp = config.motion === 'zerog' ? 0.18 : 0.08;
    rootRig.position.y = 0.05 + Math.sin(elapsed * 1.4) * bobAmp;

    if (config.sculpture === 'star') {
      mainStarMesh.rotation.y = elapsed * 0.65 * motionSpeed;
      crystalShellMesh.rotation.y = -elapsed * 0.35 * motionSpeed;
      crystalShellMesh.rotation.x = elapsed * 0.2 * motionSpeed;

      outerRingMesh.rotation.x = Math.sin(elapsed * 0.55 * motionSpeed) * 0.45;
      outerRingMesh.rotation.y = elapsed * 0.35 * motionSpeed;
      outerRingMesh.position.z = THREE.MathUtils.damp(outerRingMesh.position.z, smoothExplode * 0.65, 6, delta);

      midRingMesh.rotation.y = -elapsed * 0.6 * motionSpeed;
      midRingMesh.rotation.z = Math.cos(elapsed * 0.45 * motionSpeed) * 0.65;
      midRingMesh.position.z = THREE.MathUtils.damp(midRingMesh.position.z, -smoothExplode * 0.55, 6, delta);

      innerRingMesh.rotation.x = elapsed * 0.9 * motionSpeed;
      innerRingMesh.rotation.z = elapsed * 0.45 * motionSpeed;

      const satRadius = 1.24 + smoothExplode * 0.9;
      for (let i = 0; i < satStars.length; i++) {
        const sat = satStars[i];
        const a = (sat.userData.baseAngle as number) + elapsed * 0.45 * motionSpeed;
        const wave = config.motion === 'harmonic' ? Math.sin(elapsed * 2.5 + i) * 0.15 : 0;
        sat.position.set(
          Math.cos(a) * (satRadius + wave),
          Math.sin(a) * (satRadius + wave),
          Math.cos(elapsed * 1.2 + i) * (0.28 + smoothExplode * 0.35)
        );
        sat.rotation.y = elapsed * 1.1;
        sat.rotation.z = a;
      }
    } else if (config.sculpture === 'shield') {
      outerShieldFrame.position.z = smoothExplode * 0.55;
      midShieldPlate.position.z = -smoothExplode * 0.35;
      shieldCoreStar.position.z = 0.22 + smoothExplode * 0.72;
      shieldBackStar.position.z = -0.22 - smoothExplode * 0.72;
      shieldCoreStar.rotation.z = elapsed * 0.5 * motionSpeed;
      shieldBackStar.rotation.z = -elapsed * 0.5 * motionSpeed;
      shieldCrystal.rotation.y = elapsed * 0.65 * motionSpeed;

      shieldOrbitRing.rotation.x = Math.PI / 2.6 + Math.sin(elapsed * 0.6) * 0.22;
      shieldOrbitRing.rotation.z = elapsed * 0.45 * motionSpeed;

      const pylonDist = 1.58 + smoothExplode * 0.9;
      for (let i = 0; i < cornerPylons.length; i++) {
        const p = cornerPylons[i];
        const dir = p.userData.dir as THREE.Vector3;
        p.position.copy(dir).multiplyScalar(pylonDist + Math.sin(elapsed * 2 + i) * 0.08);
        p.rotation.y = elapsed * 1.4;
      }
    } else if (config.sculpture === 'helix') {
      helixGroup.rotation.y = elapsed * 0.52 * motionSpeed;
      helixTubeA.position.x = smoothExplode * 0.45;
      helixTubeB.position.x = -smoothExplode * 0.45;
      helixCrownTop.position.y = 1.55 + smoothExplode * 0.55;
      helixCrownBot.position.y = -1.55 - smoothExplode * 0.55;

      for (let i = 0; i < vaneCount; i++) {
        const frac = i / (vaneCount - 1) - 0.5;
        const y = frac * (2.6 + smoothExplode * 0.9);
        const angle = frac * Math.PI * 3.0 + elapsed * 0.9 * motionSpeed;
        const radialOffset = smoothExplode * 0.45;
        _dummy.position.set(Math.cos(angle) * radialOffset, y, Math.sin(angle) * radialOffset);
        _dummy.rotation.set(0, angle, config.motion === 'harmonic' ? Math.sin(elapsed * 2 + i * 0.4) * 0.22 : 0);
        _dummy.scale.set(1 + Math.sin(frac * Math.PI) * 0.2, 1, 1);
        _dummy.updateMatrix();
        vaneInstanced.setMatrixAt(i, _dummy.matrix);
      }
      vaneInstanced.instanceMatrix.needsUpdate = true;
    }

    for (let i = 0; i < shardCount; i++) {
      const s = shardData[i];
      const a = s.angle + elapsed * s.speed * motionSpeed;
      const r = s.radius + smoothExplode * 0.75;
      _vec3.set(
        Math.cos(a) * r + smoothPointerX * 0.45,
        s.yOffset + Math.sin(elapsed * 1.1 + s.phase) * 0.25 + smoothPointerY * 0.35,
        Math.sin(a) * r
      );
      _dummy.position.copy(_vec3);
      _dummy.rotation.set(elapsed + s.phase, elapsed * 0.7, s.phase);
      _dummy.scale.setScalar(s.scale);
      _dummy.updateMatrix();
      shardInstanced.setMatrixAt(i, _dummy.matrix);
    }
    shardInstanced.instanceMatrix.needsUpdate = true;

    if (cameraPresetActive) {
      camera.position.lerp(_camTargetPos, 1 - Math.exp(-5.5 * delta));
      controls.target.lerp(_camLookTarget, 1 - Math.exp(-5.5 * delta));
      if (camera.position.distanceTo(_camTargetPos) < 0.02) {
        cameraPresetActive = false;
      }
    }

    controls.update();
    renderer.render(scene, camera);

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);
  }

  tick();

  return {
    setConfig: (partial) => {
      const prevModel = config.sculpture;
      const prevFinish = config.finish;
      config = { ...config, ...partial };
      if (partial.sculpture && partial.sculpture !== prevModel) {
        syncActiveModelVisibility();
        smoothScale = 0.82;
      }
      if (partial.finish && partial.finish !== prevFinish) {
        applyFinish(config.finish);
      }
    },
    setCameraPreset: (preset) => {
      cameraPresetActive = true;
      if (preset === 'hero') {
        _camTargetPos.set(0, 0.35, 7.2);
        _camLookTarget.set(0, 0.05, 0);
      } else if (preset === 'top') {
        _camTargetPos.set(0.01, 6.8, 2.2);
        _camLookTarget.set(0, 0, 0);
      } else if (preset === 'macro') {
        _camTargetPos.set(2.4, 1.1, 3.8);
        _camLookTarget.set(0, 0.1, 0);
      }
    },
    setPointerNormalized: (nx, ny, active) => {
      pointerNx = nx;
      pointerNy = ny;
      pointerActive = active;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      shadowTex.dispose();
      brushedBump.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
