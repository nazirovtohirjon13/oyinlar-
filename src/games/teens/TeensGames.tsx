import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeGameStage, ThreeStageContext } from '../shared/ThreeGameStage';
import { buildPedestal3D, buildShape3D } from '../shared/models3d';
import { ActiveGameProps, pickCorrectMessage, pickTryAgainMessage, shuffleArray } from '../shared/gameHelpers';
import { createCanvasLabelTexture } from '../../components/three/threeUtils';
import { soundEngine } from '../../utils/sound';

// 1. Matematik duel — Progressive algebra/powers/fractions duel in 3D lab
export const GameT1MathDuel: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const rounds = useMemo(
    () => [
      { q: '2x + 6 = 18  →  x = ?', ans: 6, opts: [4, 6, 8, 9] },
      { q: '3² + 4² = ?', ans: 25, opts: [19, 24, 25, 29] },
      { q: '(3/4) × 20 = ?', ans: 15, opts: [12, 15, 16, 18] },
      { q: '5x - 7 = 28  →  x = ?', ans: 7, opts: [5, 6, 7, 8] },
      { q: '√144 + 2³ = ?', ans: 20, opts: [18, 20, 22, 24] },
      { q: '2x² = 32 (x > 0)  →  x = ?', ans: 4, opts: [3, 4, 5, 6] },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [playerPower, setPlayerPower] = useState(20);
  const [aiPower, setAiPower] = useState(20);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);
  const coreRef = useRef<THREE.Mesh | null>(null);

  const cur = rounds[round - 1];

  useEffect(() => {
    setRound(1);
    setPlayerPower(20);
    setAiPower(20);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, rounds.length);
  }, [restartNonce, rounds.length, onLevelChange]);

  const answer = (val: number) => {
    setAttempts((a) => a + 1);
    if (val === cur.ans) {
      const ns = score + 45;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      setPlayerPower((p) => Math.min(100, p + 15));
      onScore(45, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(-1.5, 1.5, 0));
      if (round >= rounds.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: rounds.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, rounds.length);
      }
    } else {
      setAiPower((p) => Math.min(100, p + 15));
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">Duel raundi {round}/{rounds.length}</div>
          <div className="text-xl sm:text-2xl font-bold font-mono-num text-sky-400">{cur.q}</div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-num">
          <div>
            <div className="text-cyan-400 mb-1">Sizning yadro: {playerPower}%</div>
            <div className="w-28 h-2 bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-cyan-400" style={{ width: `${playerPower}%` }} />
            </div>
          </div>
          <div>
            <div className="text-rose-400 mb-1">AI raqib: {aiPower}%</div>
            <div className="w-28 h-2 bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${aiPower}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="lab"
          setupKey={`duel-${round}-${playerPower}-${aiPower}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const pPed = buildPedestal3D(0x06b6d4, 0.9, 0.3);
            pPed.position.set(-1.8, 0, 0);
            ctx.scene.add(pPed);
            const pCore = new THREE.Mesh(
              new THREE.IcosahedronGeometry(0.45 + playerPower * 0.004, 0),
              new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.6 })
            );
            pCore.position.set(-1.8, 1.35, 0);
            ctx.scene.add(pCore);
            coreRef.current = pCore;

            const aPed = buildPedestal3D(0xef4444, 0.9, 0.3);
            aPed.position.set(1.8, 0, 0);
            ctx.scene.add(aPed);
            const aCore = new THREE.Mesh(
              new THREE.IcosahedronGeometry(0.45 + aiPower * 0.004, 0),
              new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.6 })
            );
            aCore.position.set(1.8, 1.35, 0);
            ctx.scene.add(aCore);
          }}
          onFrame={(delta) => {
            if (coreRef.current) coreRef.current.rotation.y += delta * 1.1;
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cur.opts.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="py-4 rounded-xl bg-slate-900 hover:bg-sky-500 hover:text-slate-950 border border-slate-700 font-bold text-xl font-mono-num text-white cursor-pointer"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

// 2. 3D mantiqiy kub — Inspect 3x3x3 voxel matrix and find missing node
export const GameT2LogicCube3D: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const puzzles = useMemo(
    () => [
      {
        title: "Diagonal simmetriya: qaysi koordinatadagi tugun bo'sh?",
        missing: [1, 1, 1] as [number, number, number],
        activeFn: (x: number, y: number, z: number) => x === y && y === z,
        opts: [
          { label: '(1, 1, 1) — Markaz', val: '1,1,1' },
          { label: '(0, 2, 1) — Yon qirra', val: '0,2,1' },
          { label: '(2, 0, 2) — Burchak', val: '2,0,2' },
        ],
      },
      {
        title: 'Markaziy ustun qoidasi: X=1 va Z=1 ustunida qaysi qavat yetishmayapti?',
        missing: [1, 2, 1] as [number, number, number],
        activeFn: (x: number, _y: number, z: number) => x === 1 && z === 1,
        opts: [
          { label: '(1, 2, 1) — Yuqori markaz', val: '1,2,1' },
          { label: '(1, 0, 2) — Pastki chet', val: '1,0,2' },
          { label: '(0, 2, 0) — Burchak', val: '0,2,0' },
        ],
      },
      {
        title: 'Ustki qatlam ramkasi (Y=2): qaysi burchak tuguni yo‘q?',
        missing: [2, 2, 2] as [number, number, number],
        activeFn: (x: number, y: number, z: number) => y === 2 && (x === 0 || x === 2) && (z === 0 || z === 2),
        opts: [
          { label: '(2, 2, 2) — Old o‘ng burchak', val: '2,2,2' },
          { label: '(1, 1, 0) — O‘rta devor', val: '1,1,0' },
          { label: '(0, 0, 1) — Pastki qirra', val: '0,0,1' },
        ],
      },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = puzzles[round - 1];

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, puzzles.length);
  }, [restartNonce, puzzles.length, onLevelChange]);

  const choose = (val: string) => {
    setAttempts((a) => a + 1);
    if (val === cur.missing.join(',')) {
      const ns = score + 55;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(55, true, 'Barakalla! 3D koordinata aniq topildi!');
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
      if (round >= puzzles.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: puzzles.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, puzzles.length);
      }
    } else {
      onAttempt(false, '3D kubni sichqoncha bilan aylantirib qatlamlarni tekshiring!');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">3D Matritsa {round}/{puzzles.length} (Aylantirish uchun sudrang)</div>
        <div className="text-lg font-bold text-white">{cur.title}</div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="lab"
          cameraPosition={[4.2, 4.2, 4.6]}
          cameraTarget={[0, 1.2, 0]}
          setupKey={`lcube-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let x = 0; x < 3; x++) {
              for (let y = 0; y < 3; y++) {
                for (let z = 0; z < 3; z++) {
                  const isMissing = x === cur.missing[0] && y === cur.missing[1] && z === cur.missing[2];
                  const isActive = cur.activeFn(x, y, z) && !isMissing;
                  const mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.55, 0.55, 0.55),
                    new THREE.MeshStandardMaterial({
                      color: isMissing ? 0xfacc15 : isActive ? 0x38bdf8 : 0x1e293b,
                      transparent: !isActive,
                      opacity: isMissing ? 0.55 : isActive ? 1 : 0.14,
                      wireframe: isMissing,
                      emissive: isActive ? 0x0284c7 : 0x000000,
                      emissiveIntensity: 0.45,
                    })
                  );
                  mesh.position.set((x - 1) * 0.85, 0.5 + y * 0.85, (z - 1) * 0.85);
                  ctx.scene.add(mesh);
                }
              }
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shuffleArray(cur.opts).map((o) => (
          <button
            key={o.val}
            onClick={() => choose(o.val)}
            className="py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// 3. Fizika laboratoriyasi — 3D Projectile Motion & Gravity Lab
export const GameT3PhysicsLab: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const missions = useMemo(
    () => [
      { targetX: 4.5, gravity: 9.8, planet: 'Yer (g = 9.8 m/s²)' },
      { targetX: 6.2, gravity: 3.7, planet: 'Mars (g = 3.7 m/s²)' },
      { targetX: 5.5, gravity: 1.6, planet: 'Oy (g = 1.6 m/s²)' },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(7);
  const [flying, setFlying] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const ballRef = useRef<THREE.Mesh | null>(null);
  const simRef = useRef<{ active: boolean; t: number; vx: number; vy: number; g: number; checked: boolean }>({
    active: false,
    t: 0,
    vx: 0,
    vy: 0,
    g: 9.8,
    checked: false,
  });
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = missions[level - 1];

  useEffect(() => {
    setLevel(1);
    setAngle(45);
    setVelocity(7);
    setFlying(false);
    setScore(0);
    setAttempts(0);
    simRef.current.active = false;
    onLevelChange(1, missions.length);
  }, [restartNonce, missions.length, onLevelChange]);

  const launch = () => {
    if (flying) return;
    soundEngine.playLaunch();
    setFlying(true);
    setAttempts((a) => a + 1);
    const rad = (angle * Math.PI) / 180;
    simRef.current = {
      active: true,
      t: 0,
      vx: velocity * Math.cos(rad),
      vy: velocity * Math.sin(rad),
      g: cur.gravity,
      checked: false,
    };
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Tajriba {level}/{missions.length} · {cur.planet}</div>
          <div className="text-lg font-bold text-white">
            Snaryadni <span className="text-emerald-400 font-mono-num">{cur.targetX} m</span> masofadagi nishonga tekkizing!
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="lab"
          cameraPosition={[0, 3.6, 9.5]}
          cameraTarget={[0, 1.0, 0]}
          setupKey={`phys-${level}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const startX = -3.8;
            const cannon = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.24, 0.9, 14),
              new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.25 })
            );
            cannon.rotation.z = -Math.PI / 4;
            cannon.position.set(startX, 0.4, 0);
            ctx.scene.add(cannon);

            const targetRing = new THREE.Mesh(
              new THREE.TorusGeometry(0.65, 0.1, 12, 28),
              new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6 })
            );
            targetRing.rotation.x = Math.PI / 2;
            targetRing.position.set(startX + cur.targetX, 0.12, 0);
            ctx.scene.add(targetRing);

            const ball = new THREE.Mesh(
              new THREE.SphereGeometry(0.24, 16, 16),
              new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.4 })
            );
            ball.position.set(startX, 0.5, 0);
            ctx.scene.add(ball);
            ballRef.current = ball;
          }}
          onFrame={(delta) => {
            const sim = simRef.current;
            if (!sim.active || !ballRef.current) return;
            sim.t += delta * 1.15;
            const startX = -3.8;
            const dx = sim.vx * sim.t;
            const y = 0.5 + sim.vy * sim.t - 0.5 * sim.g * sim.t * sim.t;
            ballRef.current.position.set(startX + dx, Math.max(0.24, y), 0);

            if (y <= 0.24 && sim.t > 0.15 && !sim.checked) {
              sim.active = false;
              sim.checked = true;
              setFlying(false);
              const err = Math.abs(dx - cur.targetX);
              if (err <= 0.85) {
                const ns = score + 65;
                setScore(ns);
                onScore(65, true, `Ajoyib! Nishonga aniq tegdi (${dx.toFixed(1)} m)!`);
                stageRef.current?.triggerBurst(new THREE.Vector3(startX + cur.targetX, 0.8, 0));
                if (level >= missions.length) {
                  setTimeout(() => onComplete({ score: ns, correctCount: missions.length, totalQuestions: attempts, levelReached: missions.length }), 650);
                } else {
                  const nl = level + 1;
                  setTimeout(() => {
                    setLevel(nl);
                    onLevelChange(nl, missions.length);
                  }, 750);
                }
              } else {
                onAttempt(false, `Snaryad ${dx.toFixed(1)} m ga tushdi. Tezlik yoki burchakni o‘zgartiring!`);
              }
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <label className="text-xs text-slate-300 flex justify-between mb-1">
            <span>Uchirish burchagi</span>
            <span className="font-mono-num text-cyan-400">{angle}°</span>
          </label>
          <input type="range" min={15} max={75} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-cyan-400" />
        </div>
        <div>
          <label className="text-xs text-slate-300 flex justify-between mb-1">
            <span>Boshlang‘ich tezlik</span>
            <span className="font-mono-num text-emerald-400">{velocity} m/s</span>
          </label>
          <input type="range" min={2} max={14} step={0.5} value={velocity} onChange={(e) => setVelocity(Number(e.target.value))} className="w-full accent-emerald-400" />
        </div>
        <button
          disabled={flying}
          onClick={launch}
          className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold cursor-pointer"
        >
          {flying ? 'Uchmoqda...' : 'Uchirish'}
        </button>
      </div>
    </div>
  );
};

// 4. Strategik shahar — Build 3D eco-city balancing budget, energy, population & happiness
export const GameT4StrategicCity: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  type BuildingType = 'uy' | 'stansiya' | 'bog' | 'maktab';
  const catalog: Record<BuildingType, { label: string; cost: number; pop: number; energy: number; happy: number; hex: number }> = useMemo(
    () => ({
      uy: { label: 'Turar joy', cost: 20, pop: 30, energy: -10, happy: 5, hex: 0x3b82f6 },
      stansiya: { label: 'Quyosh stansiyasi', cost: 25, pop: 0, energy: 35, happy: 0, hex: 0xfacc15 },
      bog: { label: 'Eko-bog‘', cost: 15, pop: 5, energy: 0, happy: 25, hex: 0x22c55e },
      maktab: { label: 'Akademiya', cost: 30, pop: 15, energy: -10, happy: 20, hex: 0xa855f7 },
    }),
    []
  );

  const [selectedTool, setSelectedTool] = useState<BuildingType>('stansiya');
  const [plots, setPlots] = useState<(BuildingType | null)[]>(Array(9).fill(null));
  const [budget, setBudget] = useState(140);
  const [pop, setPop] = useState(0);
  const [energy, setEnergy] = useState(10);
  const [happy, setHappy] = useState(40);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setPlots(Array(9).fill(null));
    setBudget(140);
    setPop(0);
    setEnergy(10);
    setHappy(40);
    onLevelChange(1, 1);
  }, [restartNonce, onLevelChange]);

  const buildAt = (idx: number) => {
    if (plots[idx] !== null) return;
    const item = catalog[selectedTool];
    if (budget < item.cost) {
      onAttempt(false, 'Byudjet yetarli emas! Arzonroq bino tanlang.');
      return;
    }
    if (energy + item.energy < 0) {
      onAttempt(false, 'Energiya yetishmaydi! Avval Quyosh stansiyasi quring.');
      return;
    }

    soundEngine.playClick();
    const nextPlots = [...plots];
    nextPlots[idx] = selectedTool;
    const nPop = pop + item.pop;
    const nEnergy = energy + item.energy;
    const nHappy = Math.min(100, happy + item.happy);
    const nBudget = budget - item.cost;

    setPlots(nextPlots);
    setPop(nPop);
    setEnergy(nEnergy);
    setHappy(nHappy);
    setBudget(nBudget);
    onScore(25, true, `${item.label} qurildi!`);

    if (nPop >= 60 && nHappy >= 75 && nEnergy >= 10) {
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
      setTimeout(
        () =>
          onComplete({
            score: 140 + nBudget,
            correctCount: nextPlots.filter(Boolean).length,
            totalQuestions: nextPlots.filter(Boolean).length,
            levelReached: 1,
          }),
        650
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Maqsad: Aholi ≥ 60, Baxt ≥ 75%, Energiya ≥ 10</div>
          <div className="text-base font-bold text-white">Bo‘sh 3D maydonchalarni bosib shahar quring</div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-num">
          <span className="text-amber-400">Byudjet: {budget}</span>
          <span className="text-sky-400">Aholi: {pop}/60</span>
          <span className="text-yellow-300">Energiya: {energy}</span>
          <span className="text-emerald-400">Baxt: {happy}%/75%</span>
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="lab"
          cameraPosition={[4.8, 5.4, 5.4]}
          setupKey={`city-${plots.map((p) => p ?? '_').join(',')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            plots.forEach((b, idx) => {
              const r = Math.floor(idx / 3);
              const c = idx % 3;
              const x = (c - 1) * 1.8;
              const z = (r - 1) * 1.8;
              const base = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.16, 1.5),
                new THREE.MeshStandardMaterial({ color: b ? 0x1e293b : 0x334155, roughness: 0.6 })
              );
              base.position.set(x, 0.08, z);
              ctx.scene.add(base);
              if (!b) {
                ctx.registerClickable(base, `plot-${idx}`, () => buildAt(idx));
              } else {
                const info = catalog[b];
                const h = b === 'uy' ? 1.1 : b === 'maktab' ? 0.9 : b === 'stansiya' ? 0.5 : 0.35;
                const building = new THREE.Mesh(
                  new THREE.BoxGeometry(1.0, h, 1.0),
                  new THREE.MeshStandardMaterial({ color: info.hex, roughness: 0.35, metalness: 0.3 })
                );
                building.position.set(x, 0.16 + h / 2, z);
                building.castShadow = true;
                ctx.scene.add(building);
              }
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(Object.keys(catalog) as BuildingType[]).map((key) => {
          const item = catalog[key];
          return (
            <button
              key={key}
              onClick={() => setSelectedTool(key)}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedTool === key ? 'bg-sky-500/20 border-sky-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <div className="font-bold text-sm">{item.label}</div>
              <div className="text-xs text-slate-400 font-mono-num">Narx: {item.cost} · Aholi: +{item.pop}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 5. Kodlash missiyasi — Trace code execution on a 3D node pipeline
export const GameT5CodingMission: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const tasks = useMemo(
    () => [
      {
        code: `let s = 0;\nfor (let i = 1; i <= 4; i++) {\n  s = s + i;\n}`,
        q: 'Sikl tugagach s ning qiymati nechiga teng bo‘ladi?',
        opts: ['8', '10', '12', '14'],
        ans: '10',
      },
      {
        code: `let x = 5;\nif (x * 2 > 8) {\n  x = x + 4;\n} else {\n  x = x - 2;\n}`,
        q: 'Shart bajarilgandan keyin x nechiga teng?',
        opts: ['3', '7', '9', '10'],
        ans: '9',
      },
      {
        code: `const sonlar = [4, 7, 11, 15];\nlet natija = sonlar[1] + sonlar[3];`,
        q: 'natija o‘zgaruvchisi nechiga teng?',
        opts: ['18', '19', '22', '26'],
        ans: '22',
      },
      {
        code: `function kvadrat(n) { return n * n; }\nlet y = kvadrat(3) + kvadrat(2);`,
        q: 'y ning qiymatini toping:',
        opts: ['11', '13', '17', '25'],
        ans: '13',
      },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);

  const cur = tasks[round - 1];

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, tasks.length);
  }, [restartNonce, tasks.length, onLevelChange]);

  const choose = (val: string) => {
    setAttempts((a) => a + 1);
    if (val === cur.ans) {
      const ns = score + 50;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(50, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
      if (round >= tasks.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: tasks.length }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, tasks.length);
      }
    } else {
      onAttempt(false, 'Qadamma-qadam o‘zgaruvchilar qiymatini hisoblab ko‘ring!');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <pre className="p-3 rounded-lg bg-[#090E1A] border border-slate-800 text-cyan-300 font-mono-num text-xs sm:text-sm overflow-x-auto">
          {cur.code}
        </pre>
        <div>
          <div className="text-xs text-slate-400 mb-1">Algoritm {round}/{tasks.length}</div>
          <div className="text-lg font-bold text-white">{cur.q}</div>
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ThreeGameStage
          theme="lab"
          setupKey={`code-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            nodesRef.current = [];
            cur.opts.forEach((opt, idx) => {
              const x = (idx - 1.5) * 2.1;
              const ped = buildPedestal3D(0x06b6d4, 0.72, 0.25);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const tex = createCanvasLabelTexture(opt, {
                bg: '#09111f',
                fg: '#38bdf8',
                border: '#0ea5e9',
                maxAnisotropy: ctx.maxAnisotropy,
              });
              const node = new THREE.Mesh(
                new THREE.BoxGeometry(0.95, 0.95, 0.95),
                new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25 })
              );
              node.position.set(x, 0.9, 0);
              ctx.scene.add(node);
              nodesRef.current.push(node);
              ctx.registerClickable(node, `c-${opt}`, () => choose(opt));
            });
          }}
          onFrame={(delta) => {
            nodesRef.current.forEach((n) => {
              n.rotation.y += delta * 0.55;
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cur.opts.map((opt) => (
          <button
            key={opt}
            onClick={() => choose(opt)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 font-bold text-xl font-mono-num text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// 6. Xotira rekordi — 4x4 3D matrix pattern recall
export const GameT6MemoryRecord: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const [level, setLevel] = useState(1);
  const maxLevels = 3;
  const [targets, setTargets] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [memorizePhase, setMemorizePhase] = useState(true);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const startLevel = (lvl: number) => {
    const count = lvl + 3;
    const indices = shuffleArray(Array.from({ length: 16 }, (_, i) => i)).slice(0, count);
    setTargets(indices);
    setPicked([]);
    setMemorizePhase(true);
    setTimeout(() => setMemorizePhase(false), 2200);
  };

  useEffect(() => {
    setLevel(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, maxLevels);
    startLevel(1);
  }, [restartNonce, onLevelChange]);

  const clickTile = (idx: number) => {
    if (memorizePhase || picked.includes(idx)) return;
    setAttempts((a) => a + 1);
    if (targets.includes(idx)) {
      soundEngine.playClick();
      const next = [...picked, idx];
      setPicked(next);
      setCorrects((c) => c + 1);
      if (next.length === targets.length) {
        const ns = score + 60;
        setScore(ns);
        onScore(60, true, 'Ajoyib! Barcha tugunlarni aniq eslab qoldingiz!');
        stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.3, 0));
        if (level >= maxLevels) {
          setTimeout(() => onComplete({ score: ns, correctCount: corrects + 1, totalQuestions: attempts + 1, levelReached: maxLevels }), 600);
        } else {
          const nl = level + 1;
          setLevel(nl);
          onLevelChange(nl, maxLevels);
          setTimeout(() => startLevel(nl), 700);
        }
      }
    } else {
      onAttempt(false, "Noto'g'ri katak! Eslab qolish uchun qayta ko'rsatilmoqda.");
      setMemorizePhase(true);
      setPicked([]);
      setTimeout(() => setMemorizePhase(false), 1800);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Bosqich {level}/{maxLevels} · Tugunlar soni: {targets.length}</div>
          <div className="text-lg font-bold text-white">
            {memorizePhase ? 'Yorug‘ tugunlar o‘rnini eslab qoling!' : `Endi o‘sha ${targets.length} ta tugunni belgilang (${picked.length}/${targets.length})`}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="lab"
          cameraPosition={[0, 6.4, 5.2]}
          setupKey={`mr-${level}-${memorizePhase ? 'show' : 'hide'}-${picked.join(',')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let i = 0; i < 16; i++) {
              const r = Math.floor(i / 4);
              const c = i % 4;
              const x = (c - 1.5) * 1.35;
              const z = (r - 1.5) * 1.35;
              const lit = (memorizePhase && targets.includes(i)) || picked.includes(i);
              const tile = new THREE.Mesh(
                new THREE.BoxGeometry(1.12, lit ? 0.45 : 0.2, 1.12),
                new THREE.MeshStandardMaterial({
                  color: lit ? 0xec4899 : 0x1e293b,
                  emissive: lit ? 0xbe185d : 0x000000,
                  emissiveIntensity: 0.7,
                  roughness: 0.35,
                })
              );
              tile.position.set(x, lit ? 0.22 : 0.1, z);
              ctx.scene.add(tile);
              if (!memorizePhase) {
                ctx.registerClickable(tile, `mr-${i}`, () => clickTile(i));
              }
            }
          }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto w-full">
        {Array.from({ length: 16 }, (_, i) => {
          const lit = (memorizePhase && targets.includes(i)) || picked.includes(i);
          return (
            <button
              key={i}
              disabled={memorizePhase}
              onClick={() => clickTile(i)}
              className={`h-11 rounded-lg border font-bold cursor-pointer ${
                lit ? 'bg-pink-500 border-pink-300 text-slate-950' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {lit ? '◆' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 7. Shifrlangan xabar — 3D Caesar Cipher wheel decoder
export const GameT7CipherMessage: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const puzzles = useMemo(
    () => [
      { plain: 'SALOM', shift: 3, opts: ['SALOM', 'SAVOL', 'SAMON', 'KALOM'] },
      { plain: 'KOSMOS', shift: 4, opts: ['KOSMOS', 'KAKTUS', 'KOMPAS', 'KARVON'] },
      { plain: 'MANTIQ', shift: 2, opts: ['MANTIQ', 'MAKTAB', 'MARKAZ', 'MANZIL'] },
    ],
    []
  );

  const encode = (text: string, shift: number) =>
    text
      .split('')
      .map((ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65))
      .join('');

  const [round, setRound] = useState(1);
  const [dialShift, setDialShift] = useState(0);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const wheelRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = puzzles[round - 1];
  const cipherText = encode(cur.plain, cur.shift);
  const decodedPreview = encode(cipherText, 26 - dialShift);

  useEffect(() => {
    setRound(1);
    setDialShift(0);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, puzzles.length);
  }, [restartNonce, puzzles.length, onLevelChange]);

  const choose = (word: string) => {
    setAttempts((a) => a + 1);
    if (word === cur.plain) {
      const ns = score + 55;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(55, true, `Barakalla! Maxfiy so'z "${cur.plain}" ochildi!`);
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.4, 0));
      if (round >= puzzles.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: puzzles.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        setDialShift(0);
        onLevelChange(nr, puzzles.length);
      }
    } else {
      onAttempt(false, `Kalit siljishini (+${cur.shift}) qo‘llab ko‘ring!`);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Shifr {round}/{puzzles.length} · Kalit siljishi: +{cur.shift}</div>
          <div className="text-lg font-bold text-white">
            Shifrlangan matn: <span className="font-mono-num text-amber-400">{cipherText}</span> → Halqa natijasi:{' '}
            <span className="font-mono-num text-emerald-400">{decodedPreview}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialShift((s) => (s + 25) % 26)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white cursor-pointer"
          >
            -1
          </button>
          <span className="font-mono-num text-sm text-cyan-300 w-16 text-center">Siljish: {dialShift}</span>
          <button
            onClick={() => setDialShift((s) => (s + 1) % 26)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white cursor-pointer"
          >
            +1
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="lab"
          setupKey={`ciph-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const ringGroup = new THREE.Group();
            const outer = new THREE.Mesh(
              new THREE.TorusGeometry(2.1, 0.25, 16, 36),
              new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.25 })
            );
            outer.rotation.x = Math.PI / 2;
            ringGroup.add(outer);

            const inner = new THREE.Mesh(
              new THREE.CylinderGeometry(1.45, 1.45, 0.35, 26),
              new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.5, roughness: 0.3 })
            );
            ringGroup.add(inner);
            ringGroup.position.y = 0.65;
            ctx.scene.add(ringGroup);
            wheelRef.current = ringGroup;

            const badge = buildShape3D('kub', 0xfacc15);
            badge.scale.set(0.65, 0.65, 0.65);
            badge.position.y = 0.9;
            ctx.scene.add(badge);
          }}
          onFrame={(delta) => {
            if (wheelRef.current) {
              const targetRot = (dialShift / 26) * Math.PI * 2;
              wheelRef.current.rotation.y = THREE.MathUtils.damp(wheelRef.current.rotation.y, targetRot, 8, delta);
            }
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {shuffleArray(cur.opts).map((opt) => (
          <button
            key={opt}
            onClick={() => choose(opt)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-violet-600 border border-slate-700 font-bold font-mono-num text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
