import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function createRenderer(container: HTMLElement, isSoftwareGl: boolean): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function applyStudioEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();
  return envTex;
}

export function createCanvasLabelTexture(
  text: string,
  options?: {
    bg?: string;
    fg?: string;
    border?: string;
    fontSize?: number;
    size?: number;
    maxAnisotropy?: number;
  }
): THREE.CanvasTexture {
  const size = options?.size ?? 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = options?.bg ?? '#1E293B';
  ctx.fillRect(0, 0, size, size);

  if (options?.border) {
    ctx.strokeStyle = options.border;
    ctx.lineWidth = Math.max(6, size * 0.04);
    ctx.strokeRect(8, 8, size - 16, size - 16);
  }

  ctx.fillStyle = options?.fg ?? '#F8FAFC';
  const fontSize = options?.fontSize ?? Math.round(size * (text.length > 3 ? 0.28 : 0.48));
  ctx.font = `700 ${fontSize}px Outfit, Plus Jakarta Sans, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + 2, size * 0.85);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (options?.maxAnisotropy) {
    texture.anisotropy = options.maxAnisotropy;
  }
  texture.needsUpdate = true;
  return texture;
}

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function disposeSceneResources(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial;
        std.map?.dispose();
        std.emissiveMap?.dispose();
        std.roughnessMap?.dispose();
        std.normalMap?.dispose();
        m.dispose();
      }
    }
  });
}

// Software-WebGL GPU fence pacing
export function afterDraw(renderer: THREE.WebGLRenderer, cb: () => void, setTimerId: (id: number) => void): void {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (!gl || typeof gl.fenceSync !== 'function') {
    setTimerId(window.setTimeout(cb, 80));
    return;
  }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
    if (state === gl.UNSIGNALED) {
      setTimerId(window.setTimeout(poll, 5));
    } else {
      if (sync) gl.deleteSync(sync);
      setTimerId(window.setTimeout(cb, 80));
    }
  };
  setTimerId(window.setTimeout(poll, 5));
}

// Zero-GC InstancedMesh particle burst system
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyEuler = new THREE.Euler();
const _dummyScale = new THREE.Vector3();
const _burstColor = new THREE.Color();

export class ParticleBurstManager {
  public mesh: THREE.InstancedMesh;
  private count = 64;
  private positions: Float32Array;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private active = false;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.OctahedronGeometry(0.11, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.4,
      emissive: 0x222222,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
    this.mesh.frustumCulled = false;
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.lifetimes = new Float32Array(this.count);

    const palette = [0xf59e0b, 0x10b981, 0x06b6d4, 0xec4899, 0x6366f1, 0xfacc15];
    for (let i = 0; i < this.count; i++) {
      _burstColor.setHex(palette[i % palette.length]);
      this.mesh.setColorAt(i, _burstColor);
      _dummyScale.set(0, 0, 0);
      _dummyMatrix.compose(_dummyPos.set(0, -50, 0), _dummyQuat, _dummyScale);
      this.mesh.setMatrixAt(i, _dummyMatrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    scene.add(this.mesh);
  }

  public trigger(origin: THREE.Vector3): void {
    this.active = true;
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      this.positions[idx] = origin.x;
      this.positions[idx + 1] = origin.y + 0.6;
      this.positions[idx + 2] = origin.z;

      const theta = Math.random() * Math.PI * 2;
      const speed = 2.2 + Math.random() * 4.2;
      this.velocities[idx] = Math.cos(theta) * speed;
      this.velocities[idx + 1] = 3.5 + Math.random() * 4.5;
      this.velocities[idx + 2] = Math.sin(theta) * speed;
      this.lifetimes[i] = 0.8 + Math.random() * 0.55;
    }
  }

  public update(delta: number): void {
    if (!this.active) return;
    let anyAlive = false;
    for (let i = 0; i < this.count; i++) {
      const life = this.lifetimes[i];
      if (life <= 0) {
        _dummyScale.set(0, 0, 0);
        _dummyMatrix.compose(_dummyPos.set(0, -50, 0), _dummyQuat, _dummyScale);
        this.mesh.setMatrixAt(i, _dummyMatrix);
        continue;
      }
      anyAlive = true;
      this.lifetimes[i] -= delta;
      const idx = i * 3;
      this.velocities[idx + 1] -= 9.5 * delta;
      this.positions[idx] += this.velocities[idx] * delta;
      this.positions[idx + 1] += this.velocities[idx + 1] * delta;
      this.positions[idx + 2] += this.velocities[idx + 2] * delta;

      const s = Math.max(0.01, Math.min(1, life * 1.4));
      _dummyPos.set(this.positions[idx], this.positions[idx + 1], this.positions[idx + 2]);
      _dummyEuler.set(life * 7, life * 9, i);
      _dummyQuat.setFromEuler(_dummyEuler);
      _dummyScale.set(s, s, s);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      this.mesh.setMatrixAt(i, _dummyMatrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (!anyAlive) this.active = false;
  }
}
