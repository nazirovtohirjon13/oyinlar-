import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  afterDraw,
  applyStudioEnvironment,
  createRenderer,
  detectSoftwareGl,
  disposeSceneResources,
} from './threeUtils';

interface HeroScene3DProps {
  accentHex: string;
  secondaryHex: string;
  fallbackImage: string;
}

export const HeroScene3D: React.FC<HeroScene3DProps> = ({
  accentHex,
  secondaryHex,
  fallbackImage,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const accentRef = useRef(accentHex);
  const secondaryRef = useRef(secondaryHex);

  accentRef.current = accentHex;
  secondaryRef.current = secondaryHex;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = createRenderer(container, isSoftwareGl);
    } catch {
      setWebglError(true);
      return;
    }

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.048);

    const envTex = applyStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(
      45,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(0, 2.8, 9.5);

    // 3-point warm/cool studio lighting
    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.0);
    keyLight.position.set(6, 9, 6);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.25);
    rimLight.position.set(-7, 4, -5);
    scene.add(rimLight);

    // Central hero assembly (multi-part 3D ZehnOlam core)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const innerMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(accentRef.current),
      roughness: 0.15,
      metalness: 0.35,
      clearcoat: 1.0,
      emissive: new THREE.Color(accentRef.current),
      emissiveIntensity: 0.25,
    });
    const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 0), innerMat);
    innerCore.castShadow = true;
    coreGroup.add(innerCore);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: true,
    });
    const outerFrame = new THREE.Mesh(new THREE.IcosahedronGeometry(1.48, 0), frameMat);
    coreGroup.add(outerFrame);

    const ringMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentRef.current),
      roughness: 0.25,
      metalness: 0.75,
      emissive: new THREE.Color(accentRef.current),
      emissiveIntensity: 0.35,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.045, 16, 64), ringMat1);
    ring1.rotation.x = Math.PI / 2.6;
    coreGroup.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(secondaryRef.current),
      roughness: 0.25,
      metalness: 0.75,
      emissive: new THREE.Color(secondaryRef.current),
      emissiveIntensity: 0.35,
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.035, 16, 64), ringMat2);
    ring2.rotation.y = Math.PI / 3;
    ring2.rotation.x = -Math.PI / 4;
    coreGroup.add(ring2);

    // Floating orbiting educational polyhedra (cube, octahedron, torus, cone, dodecahedron)
    const orbiters: { mesh: THREE.Group; radius: number; speed: number; offset: number; yAmp: number }[] = [];
    const geometries = [
      new THREE.BoxGeometry(0.55, 0.55, 0.55),
      new THREE.OctahedronGeometry(0.42, 0),
      new THREE.ConeGeometry(0.36, 0.65, 6),
      new THREE.DodecahedronGeometry(0.38, 0),
      new THREE.TorusGeometry(0.28, 0.1, 12, 24),
    ];

    geometries.forEach((geo, idx) => {
      const subGroup = new THREE.Group();
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshPhysicalMaterial({
          color: idx % 2 === 0 ? new THREE.Color(accentRef.current) : new THREE.Color(secondaryRef.current),
          roughness: 0.22,
          metalness: 0.45,
          clearcoat: 0.8,
        })
      );
      m.castShadow = true;
      subGroup.add(m);
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.015, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.85, roughness: 0.2 })
      );
      collar.rotation.x = Math.PI / 2;
      subGroup.add(collar);

      scene.add(subGroup);
      orbiters.push({
        mesh: subGroup,
        radius: 3.35 + (idx % 2) * 0.75,
        speed: 0.32 + idx * 0.07,
        offset: (idx * Math.PI * 2) / geometries.length,
        yAmp: 0.35 + (idx % 3) * 0.15,
      });
    });

    // Architectural pedestal disc below
    const stageBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 4.2, 0.22, 48),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.55, metalness: 0.5 })
    );
    stageBase.position.y = -2.2;
    stageBase.receiveShadow = true;
    scene.add(stageBase);

    const gridRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.75, 0.03, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 })
    );
    gridRing.rotation.x = Math.PI / 2;
    gridRing.position.y = -2.08;
    scene.add(gridRing);

    // Instanced ambient starfield particles
    const starCount = 90;
    const stars = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.04, 0),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8 }),
      starCount
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.3) * 12,
        -4 - Math.random() * 14
      );
      const s = 0.6 + Math.random() * 1.3;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    scene.add(stars);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current.x = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      pointerRef.current.y = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };
    container.addEventListener('pointermove', onPointerMove);

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
      const t = clock.getElapsedTime();

      innerCore.rotation.y += delta * 0.45;
      innerCore.rotation.x += delta * 0.25;
      outerFrame.rotation.y -= delta * 0.25;
      ring1.rotation.z += delta * 0.38;
      ring2.rotation.z -= delta * 0.3;
      coreGroup.position.y = Math.sin(t * 1.4) * 0.16;

      orbiters.forEach((o, i) => {
        const angle = t * o.speed + o.offset;
        o.mesh.position.set(
          Math.cos(angle) * o.radius,
          Math.sin(t * 1.3 + i) * o.yAmp,
          Math.sin(angle) * o.radius
        );
        o.mesh.rotation.y += delta * 0.8;
        o.mesh.rotation.x += delta * 0.4;
      });

      const targetCamX = pointerRef.current.x * 1.1;
      const targetCamY = 2.6 - pointerRef.current.y * 0.7;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 4, delta);
      camera.lookAt(0, 0, 0);

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
      container.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      disposeSceneResources(scene);
      envTex.dispose();
      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, [accentHex, secondaryHex]);

  if (webglError) {
    return (
      <div className="relative w-full h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <img
          src={fallbackImage}
          alt="ZehnOlam 3D ta'limiy o'yinlar olami"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0B0F19]"
      aria-label="Interaktiv 3D sahna"
    />
  );
};
