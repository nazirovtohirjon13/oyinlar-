import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  afterDraw,
  applyStudioEnvironment,
  createRadialShadowTexture,
  createRenderer,
  detectSoftwareGl,
  disposeSceneResources,
  ParticleBurstManager,
} from '../../components/three/threeUtils';

export type StageTheme = 'playground' | 'island' | 'lab' | 'arena';

export interface ThreeStageContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  maxAnisotropy: number;
  registerClickable: (obj: THREE.Object3D, id: string, onClick: () => void) => void;
  clearClickables: () => void;
  triggerBurst: (pos?: THREE.Vector3) => void;
  setCameraPreset: (pos: [number, number, number], target?: [number, number, number]) => void;
}

interface ThreeGameStageProps {
  theme: StageTheme;
  enableOrbit?: boolean;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  setupKey?: string | number;
  onSetup: (ctx: ThreeStageContext) => void | (() => void);
  onFrame?: (delta: number, elapsed: number, ctx: ThreeStageContext) => void;
}

const THEME_CONFIG: Record<
  StageTheme,
  { bg: number; fog: number; keyColor: number; hemiSky: number; hemiGround: number; floor: number; rim: number }
> = {
  playground: {
    bg: 0x162238,
    fog: 0x162238,
    keyColor: 0xfff5d6,
    hemiSky: 0x93c5fd,
    hemiGround: 0x14532d,
    floor: 0x1e3a2f,
    rim: 0xfbbf24,
  },
  island: {
    bg: 0x0e1d33,
    fog: 0x0e1d33,
    keyColor: 0xfffbeb,
    hemiSky: 0x7dd3fc,
    hemiGround: 0x164e63,
    floor: 0x164e63,
    rim: 0x06b6d4,
  },
  lab: {
    bg: 0x09111f,
    fog: 0x09111f,
    keyColor: 0xe0f2fe,
    hemiSky: 0x38bdf8,
    hemiGround: 0x0f172a,
    floor: 0x0f172a,
    rim: 0x6366f1,
  },
  arena: {
    bg: 0x080b12,
    fog: 0x080b12,
    keyColor: 0xfef3c7,
    hemiSky: 0x94a3b8,
    hemiGround: 0x111827,
    floor: 0x111827,
    rim: 0xeab308,
  },
};

export const ThreeGameStage: React.FC<ThreeGameStageProps> = ({
  theme,
  enableOrbit = true,
  cameraPosition = [0, 4.8, 7.6],
  cameraTarget = [0, 0.6, 0],
  setupKey = 'default',
  onSetup,
  onFrame,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onSetupRef = useRef(onSetup);
  const onFrameRef = useRef(onFrame);
  onSetupRef.current = onSetup;
  onFrameRef.current = onFrame;

  const [contextFailed, setContextFailed] = useState(false);

  // Store dynamic stage refs so setupKey re-runs don't tear down the WebGLRenderer
  const stageApiRef = useRef<{
    ctx: ThreeStageContext;
    dynamicGroup: THREE.Group;
    cleanupDynamic?: void | (() => void);
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = createRenderer(container, isSoftwareGl);
    } catch {
      setContextFailed(true);
      return;
    }

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextFailed(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const cfg = THEME_CONFIG[theme];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(cfg.bg);
    scene.fog = new THREE.FogExp2(cfg.fog, 0.032);
    const envTex = applyStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(
      46,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      120
    );
    camera.position.set(...cameraPosition);

    const controls = new OrbitControls(camera, canvas);
    controls.enableRotate = enableOrbit;
    controls.enablePan = false;
    controls.enableZoom = enableOrbit;
    controls.minDistance = 4;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.target.set(...cameraTarget);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;

    // 3-point warm/cool lighting
    const hemi = new THREE.HemisphereLight(cfg.hemiSky, cfg.hemiGround, 0.9);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(cfg.keyColor, 1.9);
    keyLight.position.set(6, 10, 7);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -8;
      keyLight.shadow.camera.right = 8;
      keyLight.shadow.camera.top = 8;
      keyLight.shadow.camera.bottom = -8;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(cfg.rim, 1.0);
    rimLight.position.set(-7, 5, -6);
    scene.add(rimLight);

    // Ground disc & subtle contact shadow
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 15, 0.4, 48),
      new THREE.MeshStandardMaterial({ color: cfg.floor, roughness: 0.78, metalness: 0.15 })
    );
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    scene.add(ground);

    const shadowTex = createRadialShadowTexture();
    const contactPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 11),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.35, depthWrite: false })
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = 0.01;
    scene.add(contactPlane);

    const grid = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b);
    grid.position.y = 0.015;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    scene.add(grid);

    // Natural outdoor perimeter crystals/trees outside playable area
    const perimCount = 12;
    const perimGeo = theme === 'playground' ? new THREE.ConeGeometry(0.48, 1.3, 6) : new THREE.OctahedronGeometry(0.45, 0);
    const perimMat = new THREE.MeshStandardMaterial({
      color: theme === 'playground' ? 0x15803d : cfg.rim,
      roughness: 0.4,
      metalness: 0.35,
    });
    const perimMesh = new THREE.InstancedMesh(perimGeo, perimMat, perimCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < perimCount; i++) {
      const a = (i * Math.PI * 2) / perimCount;
      const r = 8.6 + (i % 2) * 1.4;
      dummy.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r);
      const s = 0.8 + (i % 3) * 0.25;
      dummy.scale.set(s, s, s);
      dummy.rotation.y = a;
      dummy.updateMatrix();
      perimMesh.setMatrixAt(i, dummy.matrix);
    }
    perimMesh.computeBoundingSphere();
    scene.add(perimMesh);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);

    const bursts = new ParticleBurstManager(scene);

    const clickables: { root: THREE.Object3D; id: string; onClick: () => void }[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let hoveredRoot: THREE.Object3D | null = null;
    let lastHoverCheck = 0;

    // Smooth camera preset interpolation
    let camLerpActive = false;
    const camGoalPos = new THREE.Vector3(...cameraPosition);
    const camGoalTarget = new THREE.Vector3(...cameraTarget);

    controls.addEventListener('start', () => {
      camLerpActive = false;
    });

    const ctx: ThreeStageContext = {
      scene: dynamicGroup as unknown as THREE.Scene,
      camera,
      renderer,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
      registerClickable: (obj, id, onClick) => {
        clickables.push({ root: obj, id, onClick });
      },
      clearClickables: () => {
        clickables.length = 0;
        hoveredRoot = null;
      },
      triggerBurst: (pos) => {
        bursts.trigger(pos ?? new THREE.Vector3(0, 1, 0));
      },
      setCameraPreset: (pos, target = [0, 0.6, 0]) => {
        camGoalPos.set(...pos);
        camGoalTarget.set(...target);
        camLerpActive = true;
      },
    };

    stageApiRef.current = {
      ctx,
      dynamicGroup,
      cleanupDynamic: onSetupRef.current(ctx),
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const findClickableRoot = (hitObj: THREE.Object3D): { root: THREE.Object3D; onClick: () => void } | null => {
      let cur: THREE.Object3D | null = hitObj;
      while (cur) {
        const found = clickables.find((c) => c.root === cur);
        if (found) return found;
        cur = cur.parent;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 8) return; // Ignore orbit drags
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const roots = clickables.map((c) => c.root);
      const hits = raycaster.intersectObjects(roots, true);
      if (hits.length > 0) {
        const entry = findClickableRoot(hits[0].object);
        if (entry) entry.onClick();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const roots = clickables.map((c) => c.root);
      const hits = raycaster.intersectObjects(roots, true);
      if (hits.length > 0) {
        const entry = findClickableRoot(hits[0].object);
        hoveredRoot = entry ? entry.root : null;
        canvas.style.cursor = entry ? 'pointer' : 'grab';
      } else {
        hoveredRoot = null;
        canvas.style.cursor = enableOrbit ? 'grab' : 'default';
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.getElapsedTime();

      if (camLerpActive) {
        camera.position.lerp(camGoalPos, 1 - Math.exp(-5 * delta));
        controls.target.lerp(camGoalTarget, 1 - Math.exp(-5 * delta));
        if (camera.position.distanceTo(camGoalPos) < 0.03) {
          camLerpActive = false;
        }
      }

      // Subtle hover scale feedback
      for (const c of clickables) {
        const targetScale = c.root === hoveredRoot ? 1.07 : 1.0;
        const s = THREE.MathUtils.damp(c.root.scale.x, targetScale, 10, delta);
        c.root.scale.set(s, s, s);
      }

      bursts.update(delta);
      onFrameRef.current?.(delta, elapsed, ctx);
      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(renderer, tick, (id) => {
          frameId = id;
        });
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (typeof stageApiRef.current?.cleanupDynamic === 'function') {
        stageApiRef.current.cleanupDynamic();
      }
      controls.dispose();
      shadowTex.dispose();
      disposeSceneResources(scene);
      envTex.dispose();
      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
      stageApiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, enableOrbit]);

  // Re-populate dynamic scene objects cleanly when setupKey changes
  useEffect(() => {
    const api = stageApiRef.current;
    if (!api) return;
    if (typeof api.cleanupDynamic === 'function') {
      api.cleanupDynamic();
    }
    api.ctx.clearClickables();
    while (api.dynamicGroup.children.length > 0) {
      const child = api.dynamicGroup.children[0];
      api.dynamicGroup.remove(child);
      disposeSceneResources(child);
    }
    api.cleanupDynamic = onSetupRef.current(api.ctx);
  }, [setupKey]);

  if (contextFailed) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-900 rounded-xl border border-slate-800 text-slate-300 p-6 text-center">
        3D sahnani yuklashda muammo yuz berdi. Brauzerni yangilab ko‘ring.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full relative overflow-hidden rounded-xl" />;
};
