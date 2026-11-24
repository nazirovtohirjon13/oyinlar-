import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Trash2 } from 'lucide-react';
import { ThreeGameStage, ThreeStageContext } from '../shared/ThreeGameStage';
import { buildPedestal3D, buildRobot3D, buildShape3D } from '../shared/models3d';
import { ActiveGameProps, pickCorrectMessage, pickTryAgainMessage, shuffleArray } from '../shared/gameHelpers';
import { createCanvasLabelTexture } from '../../components/three/threeUtils';
import { soundEngine } from '../../utils/sound';

// 8. Geometrik kashfiyot — 3D Stereometry Volume & Surface Area Lab
export const GameT8GeoDiscovery: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const tasks = useMemo(
    () => [
      {
        shape: 'kub' as const,
        q: 'Tomoni a = 4 sm bo‘lgan 3D kubning hajmini (V = a³) toping:',
        opts: ['16 sm³', '48 sm³', '64 sm³', '96 sm³'],
        ans: '64 sm³',
      },
      {
        shape: 'silindr' as const,
        q: 'Asos yuzi S = 12 sm² va balandligi h = 5 sm bo‘lgan silindr hajmi (V = S·h):',
        opts: ['17 sm³', '45 sm³', '60 sm³', '72 sm³'],
        ans: '60 sm³',
      },
      {
        shape: 'piramida' as const,
        q: 'Asosi 6×6 sm va balandligi h = 4 sm bo‘lgan piramida hajmi (V = ⅓·S·h):',
        opts: ['36 sm³', '48 sm³', '72 sm³', '144 sm³'],
        ans: '48 sm³',
      },
      {
        shape: 'kub' as const,
        q: 'Tomoni a = 3 sm bo‘lgan kubning to‘la sirt yuzasi (S = 6·a²) nechiga teng?',
        opts: ['27 sm²', '36 sm²', '54 sm²', '81 sm²'],
        ans: '54 sm²',
      },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const shapeRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = tasks[round - 1];

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, tasks.length);
  }, [restartNonce, tasks.length, onLevelChange]);

  const answer = (val: string) => {
    setAttempts((a) => a + 1);
    if (val === cur.ans) {
      const ns = score + 50;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(50, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.4, 0));
      if (round >= tasks.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: tasks.length }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, tasks.length);
      }
    } else {
      onAttempt(false, 'Formulani tekshirib qayta hisoblang!');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Stereometriya {round}/{tasks.length}</div>
        <div className="text-lg font-bold text-white">{cur.q}</div>
      </div>
      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="lab"
          setupKey={`gd-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const ped = buildPedestal3D(0x14b8a6, 1.0, 0.3);
            ctx.scene.add(ped);
            const m = buildShape3D(cur.shape, 0x14b8a6);
            m.scale.set(1.5, 1.5, 1.5);
            m.position.y = 0.35;
            ctx.scene.add(m);
            shapeRef.current = m;
          }}
          onFrame={(delta) => {
            if (shapeRef.current) shapeRef.current.rotation.y += delta * 0.7;
          }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cur.opts.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-teal-500 hover:text-slate-950 border border-slate-700 font-bold font-mono-num text-white cursor-pointer"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

// 9. Robot boshqaruvi — Program robot with Loop (2x) and Turn commands
export const GameT9RobotControl: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  type Cmd = 'F' | 'F2' | 'L' | 'R';
  const missions = useMemo(
    () => [
      { start: { r: 4, c: 0, dir: 0 }, goal: { r: 1, c: 3 }, walls: ['2,0', '2,1', '3,2', '1,2'] },
      { start: { r: 4, c: 4, dir: 3 }, goal: { r: 0, c: 1 }, walls: ['3,3', '2,3', '2,1', '1,1'] },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [prog, setProg] = useState<Cmd[]>([]);
  const [bot, setBot] = useState(missions[0].start);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const botRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = missions[level - 1];

  useEffect(() => {
    setLevel(1);
    setProg([]);
    setBot(missions[0].start);
    setRunning(false);
    setScore(0);
    setAttempts(0);
    onLevelChange(1, missions.length);
  }, [restartNonce, missions, onLevelChange]);

  const execute = () => {
    if (running || prog.length === 0) return;
    setRunning(true);
    setAttempts((a) => a + 1);

    // Expand F2 into two F steps
    const expanded: ('F' | 'L' | 'R')[] = [];
    prog.forEach((c) => {
      if (c === 'F2') { expanded.push('F', 'F'); }
      else expanded.push(c);
    });

    let st = { ...cur.start };
    setBot(st);
    const deltas = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    expanded.forEach((c, idx) => {
      setTimeout(() => {
        if (c === 'L') st = { ...st, dir: (st.dir + 3) % 4 };
        else if (c === 'R') st = { ...st, dir: (st.dir + 1) % 4 };
        else {
          const [dr, dc] = deltas[st.dir];
          const nr = st.r + dr;
          const nc = st.c + dc;
          if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && !cur.walls.includes(`${nr},${nc}`)) {
            st = { ...st, r: nr, c: nc };
          }
        }
        soundEngine.playClick();
        setBot({ ...st });

        if (idx === expanded.length - 1) {
          setRunning(false);
          if (st.r === cur.goal.r && st.c === cur.goal.c) {
            const ns = score + 70;
            setScore(ns);
            onScore(70, true, 'Barakalla! Robot missiyani bajardi!');
            stageRef.current?.triggerBurst(new THREE.Vector3((cur.goal.c - 2) * 1.2, 1.2, (cur.goal.r - 2) * 1.2));
            if (level >= missions.length) {
              setTimeout(() => onComplete({ score: ns, correctCount: missions.length, totalQuestions: attempts + 1, levelReached: missions.length }), 600);
            } else {
              const nl = level + 1;
              setTimeout(() => {
                setLevel(nl);
                setProg([]);
                setBot(missions[nl - 1].start);
                onLevelChange(nl, missions.length);
              }, 750);
            }
          } else {
            onAttempt(false, 'Robot manzilga yetmadi. Dasturni qayta tekshiring!');
            setTimeout(() => setBot(cur.start), 450);
          }
        }
      }, (idx + 1) * 320);
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs text-slate-400">Laboratoriya missiyasi {level}/{missions.length}</div>
          <div className="text-base font-bold text-white">Sikl (2× Oldinga) va burilishlar bilan robotni energiya yulduziga yuboring</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {prog.map((c, i) => (
            <span key={i} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono-num text-sky-300">
              {c === 'F' ? '↑1' : c === 'F2' ? '2×↑' : c === 'L' ? '↺' : '↻'}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="lab"
          cameraPosition={[0, 7.2, 6.0]}
          setupKey={`rob-${level}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let r = 0; r < 5; r++) {
              for (let c = 0; c < 5; c++) {
                const x = (c - 2) * 1.2;
                const z = (r - 2) * 1.2;
                const isGoal = r === cur.goal.r && c === cur.goal.c;
                const isWall = cur.walls.includes(`${r},${c}`);
                const tile = new THREE.Mesh(
                  new THREE.BoxGeometry(1.1, 0.16, 1.1),
                  new THREE.MeshStandardMaterial({ color: isGoal ? 0x10b981 : isWall ? 0xef4444 : 0x1e293b })
                );
                tile.position.set(x, 0.08, z);
                ctx.scene.add(tile);
                if (isWall) {
                  const laser = new THREE.Mesh(
                    new THREE.BoxGeometry(0.85, 0.7, 0.85),
                    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.5 })
                  );
                  laser.position.set(x, 0.5, z);
                  ctx.scene.add(laser);
                }
              }
            }
            const goalStar = buildShape3D('yulduz', 0x10b981);
            goalStar.scale.set(0.65, 0.65, 0.65);
            goalStar.position.set((cur.goal.c - 2) * 1.2, 0.25, (cur.goal.r - 2) * 1.2);
            ctx.scene.add(goalStar);

            const rob = buildRobot3D(0x38bdf8);
            rob.scale.set(0.7, 0.7, 0.7);
            rob.position.set((bot.c - 2) * 1.2, 0.18, (bot.r - 2) * 1.2);
            ctx.scene.add(rob);
            botRef.current = rob;
          }}
          onFrame={(delta) => {
            if (botRef.current) {
              botRef.current.position.x = THREE.MathUtils.damp(botRef.current.position.x, (bot.c - 2) * 1.2, 10, delta);
              botRef.current.position.z = THREE.MathUtils.damp(botRef.current.position.z, (bot.r - 2) * 1.2, 10, delta);
              const angles = [Math.PI, Math.PI / 2, 0, -Math.PI / 2];
              botRef.current.rotation.y = angles[bot.dir];
            }
          }}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2.5">
        <button disabled={running} onClick={() => setProg((p) => [...p, 'F'])} className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer">
          ↑ Oldinga
        </button>
        <button disabled={running} onClick={() => setProg((p) => [...p, 'F2'])} className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/50 font-bold text-sky-300 cursor-pointer">
          2× [Oldinga]
        </button>
        <button disabled={running} onClick={() => setProg((p) => [...p, 'L'])} className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer">
          ↺ Chapga
        </button>
        <button disabled={running} onClick={() => setProg((p) => [...p, 'R'])} className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer">
          ↻ O‘ngga
        </button>
        <button disabled={running} onClick={() => { setProg([]); setBot(cur.start); }} className="p-3 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-700 text-rose-400 cursor-pointer">
          <Trash2 className="w-5 h-5" />
        </button>
        <button disabled={running || prog.length === 0} onClick={execute} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer">
          <Play className="w-4 h-4 fill-current" />
          Bajarish
        </button>
      </div>
    </div>
  );
};

// 10. Fazoviy konstruktor — 3D Voxel Engineering matching height grid
export const GameT10SpatialConstructor: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const blueprints = useMemo(
    () => [
      {
        title: 'Zinapoya modeli',
        target: [
          [1, 1, 1],
          [2, 2, 0],
          [3, 0, 0],
        ],
      },
      {
        title: 'Markaziy piramida',
        target: [
          [1, 1, 1],
          [1, 3, 1],
          [1, 1, 1],
        ],
      },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [heights, setHeights] = useState<number[][]>([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = blueprints[level - 1];

  useEffect(() => {
    setLevel(1);
    setHeights([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    setScore(0);
    setAttempts(0);
    onLevelChange(1, blueprints.length);
  }, [restartNonce, blueprints.length, onLevelChange]);

  const cycleCell = (r: number, c: number) => {
    soundEngine.playClick();
    setHeights((prev) =>
      prev.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? (v + 1) % 4 : v)))
    );
  };

  const verify = () => {
    setAttempts((a) => a + 1);
    const ok = heights.every((row, r) => row.every((v, c) => v === cur.target[r][c]));
    if (ok) {
      const ns = score + 70;
      setScore(ns);
      onScore(70, true, `Barakalla! ${cur.title} aniq qurildi!`);
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 2.0, 0));
      if (level >= blueprints.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: blueprints.length, totalQuestions: attempts + 1, levelReached: blueprints.length }), 600);
      } else {
        const nl = level + 1;
        setLevel(nl);
        setHeights([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
        onLevelChange(nl, blueprints.length);
      }
    } else {
      onAttempt(false, 'Balandliklar chizmaga mos emas. Kataklarni bosib qavatlarni sozlang!');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Chizma {level}/{blueprints.length}: {cur.title}</div>
          <div className="text-base font-bold text-white">Har bir katakdagi qavatlar sonini namunaga moslang!</div>
        </div>
        <div className="text-xs font-mono-num text-amber-300">
          Namuna qavatlari: {cur.target.map((r) => `[${r.join(' ')}]`).join(' ')}
        </div>
      </div>

      <div className="flex-1 min-h-[240px]">
        <ThreeGameStage
          theme="lab"
          cameraPosition={[4.5, 4.8, 4.8]}
          setupKey={`vox-${level}-${heights.flat().join(',')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                const x = (c - 1) * 1.15;
                const z = (r - 1) * 1.15;
                const base = new THREE.Mesh(
                  new THREE.BoxGeometry(1.0, 0.12, 1.0),
                  new THREE.MeshStandardMaterial({ color: 0x334155 })
                );
                base.position.set(x, 0.06, z);
                ctx.scene.add(base);
                ctx.registerClickable(base, `vx-${r}-${c}`, () => cycleCell(r, c));

                const h = heights[r][c];
                for (let y = 0; y < h; y++) {
                  const box = new THREE.Mesh(
                    new THREE.BoxGeometry(0.95, 0.72, 0.95),
                    new THREE.MeshStandardMaterial({ color: [0x06b6d4, 0x3b82f6, 0x6366f1][y], roughness: 0.3 })
                  );
                  box.position.set(x, 0.48 + y * 0.76, z);
                  box.castShadow = true;
                  ctx.scene.add(box);
                  ctx.registerClickable(box, `vxb-${r}-${c}-${y}`, () => cycleCell(r, c));
                }
              }
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="grid grid-cols-3 gap-1.5">
          {heights.map((row, r) =>
            row.map((h, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => cycleCell(r, c)}
                className="w-12 h-11 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 font-mono-num font-bold text-white cursor-pointer"
              >
                {h} / {cur.target[r][c]}
              </button>
            ))
          )}
        </div>
        <button onClick={verify} className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer">
          Tekshirish
        </button>
      </div>
    </div>
  );
};

// 11. Mantiqiy detektiv — Mystery Lab Evidence Deduction
export const GameT11LogicDetective: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const cases = useMemo(
    () => [
      {
        title: "Laboratoriya kaliti qaysi konteynerda?",
        clues: [
          "1. Kalit metall konteynerda emas (Oltin va Kumush chiqarib tashlanadi).",
          "2. Kvars konteynerida faqat suyuqlik saqlanadi.",
          "3. Qolgan yagona konteyner — Kristall.",
        ],
        items: [
          { id: 'oltin', name: 'Oltin kapsula', hex: 0xeab308 },
          { id: 'kumush', name: 'Kumush kapsula', hex: 0x94a3b8 },
          { id: 'kvars', name: 'Kvars kapsula', hex: 0x38bdf8 },
          { id: 'kristall', name: 'Kristall kapsula', hex: 0xa855f7 },
        ],
        ans: 'kristall',
      },
      {
        title: "Sirli chipni kim oldi?",
        clues: [
          "1. Anvar va Dilnoza laboratoriyada soat 14:00 da birga edi (aybsiz).",
          "2. Sardorning ruxsatnomasi bugun ishlamagan.",
          "3. Demak, chipni faqat kirish huquqi bor yolg'iz xodim olgan.",
        ],
        items: [
          { id: 'anvar', name: 'Anvar', hex: 0x3b82f6 },
          { id: 'dilnoza', name: 'Dilnoza', hex: 0xec4899 },
          { id: 'sardor', name: 'Sardor', hex: 0xf59e0b },
          { id: 'jasur', name: 'Jasur', hex: 0x10b981 },
        ],
        ans: 'jasur',
      },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = cases[round - 1];

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, cases.length);
  }, [restartNonce, cases.length, onLevelChange]);

  const accuse = (id: string, idx: number) => {
    setAttempts((a) => a + 1);
    if (id === cur.ans) {
      const ns = score + 65;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(65, true, 'Barakalla! Detektiv tergovi muvaffaqiyatli yakunlandi!');
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1.5) * 2.1, 1.4, 0));
      if (round >= cases.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: cases.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, cases.length);
      }
    } else {
      onAttempt(false, 'Dalillar bilan mos kelmadi! Barcha shartlarni qayta o‘qing.');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400 mb-1">Tergov {round}/{cases.length} — {cur.title}</div>
        <div className="space-y-1 text-sm text-sky-200">
          {cur.clues.map((c) => <div key={c}>{c}</div>)}
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="lab"
          setupKey={`det-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            cur.items.forEach((it, idx) => {
              const x = (idx - 1.5) * 2.1;
              const ped = buildPedestal3D(it.hex, 0.72, 0.28);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const capsule = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.28, 0.55, 8, 16),
                new THREE.MeshStandardMaterial({ color: it.hex, roughness: 0.25, metalness: 0.5 })
              );
              capsule.position.set(x, 0.85, 0);
              ctx.scene.add(capsule);
              ctx.registerClickable(capsule, it.id, () => accuse(it.id, idx));
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cur.items.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => accuse(it.id, idx)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {it.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// 12. Tezkor qaror — Timed Cognitive Logic & Stroop Gates
export const GameT12FastDecision: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  isPaused,
  restartNonce,
}) => {
  const statements = useMemo(
    () => [
      { text: '17 + 15 = 32', valid: true },
      { text: '9 × 7 = 64', valid: false },
      { text: '100 ÷ 4 = 25', valid: true },
      { text: '2³ = 6', valid: false },
      { text: 'Toshkent — O‘zbekiston poytaxti', valid: true },
      { text: 'Quyosh — sayyora', valid: false },
      { text: '45 - 18 = 27', valid: true },
      { text: 'Uchburchakning 4 ta tomoni bor', valid: false },
    ],
    []
  );

  const [timeLeft, setTimeLeft] = useState(35);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const finishedRef = useRef(false);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const deck = useMemo(() => shuffleArray(statements), [statements, restartNonce]);
  const cur = deck[idx % deck.length];

  useEffect(() => {
    finishedRef.current = false;
    setTimeLeft(35);
    setIdx(0);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, 1);
  }, [restartNonce, onLevelChange]);

  useEffect(() => {
    if (isPaused || finishedRef.current) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          if (!finishedRef.current) {
            finishedRef.current = true;
            onComplete({ score, correctCount: corrects, totalQuestions: Math.max(1, attempts), levelReached: 1 });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPaused, score, corrects, attempts, onComplete]);

  const decide = (ans: boolean) => {
    if (finishedRef.current) return;
    setAttempts((a) => a + 1);
    if (ans === cur.valid) {
      setScore((s) => s + 25);
      setCorrects((c) => c + 1);
      onScore(25, true, pickCorrectMessage(corrects));
      stageRef.current?.triggerBurst(new THREE.Vector3(ans ? -1.5 : 1.5, 1.3, 0));
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
    setIdx((i) => i + 1);
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div className="text-lg sm:text-xl font-bold text-white">{cur.text}</div>
        <div className="font-mono-num text-lg font-bold text-rose-400">{timeLeft} s</div>
      </div>
      <div className="flex-1 min-h-[240px]">
        <ThreeGameStage
          theme="lab"
          setupKey={`fd-${idx}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const tGate = buildShape3D('kub', 0x10b981);
            tGate.position.set(-1.7, 0.3, 0);
            ctx.scene.add(tGate);
            ctx.registerClickable(tGate, 'yes', () => decide(true));

            const fGate = buildShape3D('piramida', 0xef4444);
            fGate.position.set(1.7, 0.3, 0);
            ctx.scene.add(fGate);
            ctx.registerClickable(fGate, 'no', () => decide(false));
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => decide(true)} className="py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-lg text-white cursor-pointer">
          To‘g‘ri ✓
        </button>
        <button onClick={() => decide(false)} className="py-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-lg text-white cursor-pointer">
          Noto‘g‘ri ✗
        </button>
      </div>
    </div>
  );
};

// 13. Galaktika strategiyasi — Optimal 3D space route within fuel budget
export const GameT13GalaxyStrategy: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const planets = useMemo(
    () => [
      { id: 0, name: 'Baza', pos: [-3, 0, 1] as [number, number, number], hex: 0x38bdf8 },
      { id: 1, name: 'Alfa', pos: [-1, 0, -1.8] as [number, number, number], hex: 0x10b981 },
      { id: 2, name: 'Beta', pos: [1.5, 0, -1.5] as [number, number, number], hex: 0xf59e0b },
      { id: 3, name: 'Gamma', pos: [3, 0, 1] as [number, number, number], hex: 0xa855f7 },
      { id: 4, name: 'Delta', pos: [0, 0, 2.2] as [number, number, number], hex: 0xec4899 },
    ],
    []
  );

  const [currentId, setCurrentId] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const [fuel, setFuel] = useState(16);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setCurrentId(0);
    setVisited([0]);
    setFuel(16);
    setAttempts(0);
    onLevelChange(1, 1);
  }, [restartNonce, onLevelChange]);

  const travelTo = (targetId: number) => {
    if (visited.includes(targetId)) return;
    const from = planets[currentId];
    const to = planets[targetId];
    const cost = Math.round(Math.hypot(to.pos[0] - from.pos[0], to.pos[2] - from.pos[2]));
    setAttempts((a) => a + 1);
    if (fuel < cost) {
      onAttempt(false, `Yonilg‘i yetarli emas! (${cost} kerak, ${fuel} qolgan). Qayta boshlang!`);
      return;
    }
    soundEngine.playLaunch();
    const nextFuel = fuel - cost;
    const nextVisited = [...visited, targetId];
    setCurrentId(targetId);
    setVisited(nextVisited);
    setFuel(nextFuel);
    onScore(30, true, `${to.name} stansiyasiga qo‘ndingiz (-${cost} yonilg‘i)`);
    stageRef.current?.triggerBurst(new THREE.Vector3(to.pos[0], 1.2, to.pos[2]));

    if (nextVisited.length === planets.length) {
      setTimeout(() => onComplete({ score: 120 + nextFuel * 10, correctCount: planets.length - 1, totalQuestions: attempts + 1, levelReached: 1 }), 650);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Hozirgi stansiya: {planets[currentId].name} · Ziyorat: {visited.length}/{planets.length}</div>
          <div className="text-base font-bold text-white">Eng qisqa marshrutni tanlab barcha sayyoralarga uchib chiqing!</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-num text-amber-400 font-bold">Yonilg‘i: {fuel}</span>
          <button
            onClick={() => { setCurrentId(0); setVisited([0]); setFuel(16); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            Marshrutni tiklash
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="lab"
          cameraPosition={[0, 6.5, 6.5]}
          setupKey={`gal-${visited.join(',')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            planets.forEach((p) => {
              const isVis = visited.includes(p.id);
              const isCur = p.id === currentId;
              const orb = new THREE.Mesh(
                new THREE.SphereGeometry(isCur ? 0.58 : 0.45, 20, 20),
                new THREE.MeshStandardMaterial({
                  color: p.hex,
                  emissive: isCur ? p.hex : isVis ? 0x10b981 : 0x000000,
                  emissiveIntensity: isCur ? 0.8 : 0.25,
                  roughness: 0.3,
                })
              );
              orb.position.set(p.pos[0], 0.8, p.pos[2]);
              ctx.scene.add(orb);
              if (!isVis) {
                ctx.registerClickable(orb, `pl-${p.id}`, () => travelTo(p.id));
              }
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {planets.slice(1).map((p) => {
          const isVis = visited.includes(p.id);
          const from = planets[currentId];
          const dist = Math.round(Math.hypot(p.pos[0] - from.pos[0], p.pos[2] - from.pos[2]));
          return (
            <button
              key={p.id}
              disabled={isVis}
              onClick={() => travelTo(p.id)}
              className={`py-3 px-3 rounded-xl border font-bold text-sm cursor-pointer ${
                isVis ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {isVis ? `${p.name} ✓` : `${p.name} (Sarf: ${dist})`}
            </button>
          );
        })}
      </div>
    </div>
  );
};
