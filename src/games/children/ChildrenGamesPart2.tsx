import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, RotateCw, Trash2 } from 'lucide-react';
import { ThreeGameStage, ThreeStageContext } from '../shared/ThreeGameStage';
import { buildPedestal3D, buildRobot3D, buildShape3D } from '../shared/models3d';
import { ActiveGameProps, pickCorrectMessage, pickTryAgainMessage, shuffleArray } from '../shared/gameHelpers';
import { createCanvasLabelTexture } from '../../components/three/threeUtils';
import { soundEngine } from '../../utils/sound';

// 8. Tezkor hisob — Timed 45s rapid arithmetic with 3D answer crystals
export const GameC8FastMath: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  isPaused,
  restartNonce,
}) => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [problem, setProblem] = useState({ q: '6 × 4 = ?', ans: 24, opts: [20, 24, 28, 32] });
  const stageRef = useRef<ThreeStageContext | null>(null);
  const gemsRef = useRef<THREE.Mesh[]>([]);
  const finishedRef = useRef(false);

  const nextProblem = () => {
    const mode = Math.floor(Math.random() * 3);
    let a = 4 + Math.floor(Math.random() * 14);
    let b = 2 + Math.floor(Math.random() * 9);
    let q = '';
    let ans = 0;
    if (mode === 0) {
      q = `${a} + ${b} = ?`;
      ans = a + b;
    } else if (mode === 1) {
      if (a < b) [a, b] = [b, a];
      q = `${a} - ${b} = ?`;
      ans = a - b;
    } else {
      a = 2 + Math.floor(Math.random() * 8);
      b = 2 + Math.floor(Math.random() * 8);
      q = `${a} × ${b} = ?`;
      ans = a * b;
    }
    const set = new Set<number>([ans]);
    while (set.size < 4) {
      const off = (Math.floor(Math.random() * 9) - 4) || 2;
      if (ans + off >= 0) set.add(ans + off);
    }
    setProblem({ q, ans, opts: shuffleArray(Array.from(set)) });
  };

  useEffect(() => {
    finishedRef.current = false;
    setTimeLeft(45);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    nextProblem();
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
            onComplete({
              score,
              correctCount: corrects,
              totalQuestions: Math.max(1, attempts),
              levelReached: 1,
            });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPaused, score, corrects, attempts, onComplete]);

  const answer = (val: number, idx: number) => {
    if (finishedRef.current) return;
    setAttempts((a) => a + 1);
    if (val === problem.ans) {
      setScore((s) => s + 25);
      setCorrects((c) => c + 1);
      onScore(25, true, pickCorrectMessage(corrects));
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1.5) * 2.1, 1.2, 0));
      nextProblem();
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div className="text-2xl sm:text-3xl font-bold font-mono-num text-cyan-400">{problem.q}</div>
        <div className="text-lg font-bold font-mono-num text-rose-400">{timeLeft} soniya</div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="island"
          setupKey={`fm-${problem.q}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            gemsRef.current = [];
            problem.opts.forEach((opt, idx) => {
              const x = (idx - 1.5) * 2.1;
              const ped = buildPedestal3D(0x06b6d4, 0.7, 0.25);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const tex = createCanvasLabelTexture(String(opt), {
                bg: '#0f172a',
                fg: '#38bdf8',
                border: '#06b6d4',
                maxAnisotropy: ctx.maxAnisotropy,
              });
              const block = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.9, 0.9),
                new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25 })
              );
              block.position.set(x, 0.85, 0);
              ctx.scene.add(block);
              gemsRef.current.push(block);
              ctx.registerClickable(block, `fm-${opt}`, () => answer(opt, idx));
            });
          }}
          onFrame={(delta) => {
            gemsRef.current.forEach((g) => {
              g.rotation.y += delta * 0.6;
            });
          }}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {problem.opts.map((opt, idx) => (
          <button
            key={opt}
            onClick={() => answer(opt, idx)}
            className="py-4 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 font-bold text-2xl font-mono-num text-white cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// 9. Rangli sudoku — 4x4 Visual Color Gem Sudoku
export const GameC9ColorSudoku: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const gemPalette = useMemo(
    () => [
      { id: 1, name: 'Qizil', hex: 0xef4444, css: '#EF4444' },
      { id: 2, name: "Ko'k", hex: 0x3b82f6, css: '#3B82F6' },
      { id: 3, name: 'Sariq', hex: 0xfacc15, css: '#FACC15' },
      { id: 4, name: 'Yashil', hex: 0x22c55e, css: '#22C55E' },
    ],
    []
  );

  const solution = useMemo(
    () => [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ],
    []
  );

  const initialMask = useMemo(
    () => [
      [1, 0, 3, 0],
      [0, 4, 0, 2],
      [2, 0, 4, 0],
      [0, 3, 0, 1],
    ],
    []
  );

  const [grid, setGrid] = useState<number[][]>(() => initialMask.map((r) => [...r]));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 1]);
  const [attempts, setAttempts] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setGrid(initialMask.map((r) => [...r]));
    setSelectedCell([0, 1]);
    setAttempts(0);
    setCorrects(0);
    onLevelChange(1, 1);
  }, [restartNonce, initialMask, onLevelChange]);

  const placeColor = (colorId: number) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (initialMask[r][c] !== 0) return;
    setAttempts((a) => a + 1);
    if (solution[r][c] === colorId) {
      const next = grid.map((row, ri) => row.map((val, ci) => (ri === r && ci === c ? colorId : val)));
      setGrid(next);
      setCorrects((x) => x + 1);
      onScore(25, true, 'To‘g‘ri rang joylandi!');
      stageRef.current?.triggerBurst(new THREE.Vector3((c - 1.5) * 1.4, 1.0, (r - 1.5) * 1.4));

      // Move selection to next empty cell
      let foundEmpty: [number, number] | null = null;
      for (let rr = 0; rr < 4 && !foundEmpty; rr++) {
        for (let cc = 0; cc < 4; cc++) {
          if (next[rr][cc] === 0) {
            foundEmpty = [rr, cc];
            break;
          }
        }
      }
      setSelectedCell(foundEmpty);
      if (!foundEmpty) {
        setTimeout(
          () =>
            onComplete({
              score: 200,
              correctCount: corrects + 1,
              totalQuestions: attempts + 1,
              levelReached: 1,
            }),
          600
        );
      }
    } else {
      onAttempt(false, 'Qator, ustun yoki 2×2 blokda bu rang allaqachon bor!');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-lg font-bold text-white">Har bir qator, ustun va 2×2 katakda 4 xil rang bo‘lishi kerak!</div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="island"
          cameraPosition={[0, 6.2, 5.2]}
          setupKey={`sud4-${grid.flat().join('')}-${selectedCell?.join(',')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let r = 0; r < 4; r++) {
              for (let c = 0; c < 4; c++) {
                const x = (c - 1.5) * 1.35;
                const z = (r - 1.5) * 1.35;
                const val = grid[r][c];
                const isSel = selectedCell?.[0] === r && selectedCell?.[1] === c;
                const tile = new THREE.Mesh(
                  new THREE.BoxGeometry(1.15, 0.2, 1.15),
                  new THREE.MeshStandardMaterial({
                    color: isSel ? 0xfacc15 : 0x1e293b,
                    roughness: 0.45,
                  })
                );
                tile.position.set(x, 0.1, z);
                ctx.scene.add(tile);
                if (initialMask[r][c] === 0) {
                  ctx.registerClickable(tile, `sc-${r}-${c}`, () => setSelectedCell([r, c]));
                }
                if (val > 0) {
                  const pal = gemPalette[val - 1];
                  const gem = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.42, 0),
                    new THREE.MeshStandardMaterial({ color: pal.hex, roughness: 0.2, metalness: 0.35 })
                  );
                  gem.position.set(x, 0.65, z);
                  ctx.scene.add(gem);
                }
              }
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-2 rounded-xl border border-slate-800">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const pal = val > 0 ? gemPalette[val - 1] : null;
              const isSel = selectedCell?.[0] === r && selectedCell?.[1] === c;
              return (
                <button
                  key={`${r}-${c}`}
                  disabled={initialMask[r][c] !== 0}
                  onClick={() => setSelectedCell([r, c])}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
                    isSel ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: pal ? pal.css : '#0f172a' }}
                />
              );
            })
          )}
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {gemPalette.map((g) => (
            <button
              key={g.id}
              onClick={() => placeColor(g.id)}
              className="py-3.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: g.css }} />
              <span>{g.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 10. Fazoviy fikrlash — Rotate 3D L-polycube to match target orientation
export const GameC10SpatialThinking: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const targets = useMemo(
    () => [
      { rx: 0, ry: 1 },
      { rx: 1, ry: 2 },
      { rx: 2, ry: 3 },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [rot, setRot] = useState({ rx: 0, ry: 0 });
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const playerShapeRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const target = targets[level - 1];

  useEffect(() => {
    setLevel(1);
    setRot({ rx: 0, ry: 0 });
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, targets.length);
  }, [restartNonce, targets.length, onLevelChange]);

  const buildPolycube = (colorHex: number) => {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.25 });
    const coords = [
      [0, 0, 0],
      [0.65, 0, 0],
      [0, 0.65, 0],
      [0, 0.65, 0.65],
    ];
    coords.forEach(([x, y, z], i) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.62, 0.62),
        i === 3 ? new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25 }) : m
      );
      box.position.set(x - 0.2, y - 0.2, z - 0.2);
      box.castShadow = true;
      g.add(box);
    });
    return g;
  };

  const checkMatch = () => {
    setAttempts((a) => a + 1);
    if (rot.rx % 4 === target.rx && rot.ry % 4 === target.ry) {
      const ns = score + 55;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(55, true, 'Barakalla! 3D shakl holati to‘liq mos keldi!');
      stageRef.current?.triggerBurst(new THREE.Vector3(1.8, 1.3, 0));
      if (level >= targets.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: targets.length }), 600);
      } else {
        const nl = level + 1;
        setLevel(nl);
        setRot({ rx: 0, ry: 0 });
        onLevelChange(nl, targets.length);
      }
    } else {
      onAttempt(false, "Hali mos emas! Sariq kubik yo'nalishiga e'tibor bering.");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Bosqich {level}/{targets.length}</div>
          <div className="text-lg font-bold text-white">O‘ngdagi 3D shaklni aylantirib chapdagiga o‘xshating!</div>
        </div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="island"
          enableOrbit={false}
          setupKey={`sp-${level}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const leftPed = buildPedestal3D(0x64748b, 0.9, 0.24);
            leftPed.position.set(-1.8, 0, 0);
            ctx.scene.add(leftPed);
            const targetMesh = buildPolycube(0x06b6d4);
            targetMesh.position.set(-1.8, 1.15, 0);
            targetMesh.rotation.set((target.rx * Math.PI) / 2, (target.ry * Math.PI) / 2, 0);
            ctx.scene.add(targetMesh);

            const rightPed = buildPedestal3D(0x14b8a6, 0.9, 0.24);
            rightPed.position.set(1.8, 0, 0);
            ctx.scene.add(rightPed);
            const playerMesh = buildPolycube(0x14b8a6);
            playerMesh.position.set(1.8, 1.15, 0);
            ctx.scene.add(playerMesh);
            playerShapeRef.current = playerMesh;
          }}
          onFrame={(delta) => {
            if (playerShapeRef.current) {
              playerShapeRef.current.rotation.x = THREE.MathUtils.damp(
                playerShapeRef.current.rotation.x,
                (rot.rx * Math.PI) / 2,
                10,
                delta
              );
              playerShapeRef.current.rotation.y = THREE.MathUtils.damp(
                playerShapeRef.current.rotation.y,
                (rot.ry * Math.PI) / 2,
                10,
                delta
              );
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            soundEngine.playClick();
            setRot((r) => ({ ...r, rx: (r.rx + 1) % 4 }));
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer"
        >
          <RotateCw className="w-4 h-4 text-cyan-400" />
          X o‘qi bo‘yicha aylantirish
        </button>
        <button
          onClick={() => {
            soundEngine.playClick();
            setRot((r) => ({ ...r, ry: (r.ry + 1) % 4 }));
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer"
        >
          <RotateCw className="w-4 h-4 text-emerald-400" />
          Y o‘qi bo‘yicha aylantirish
        </button>
        <button
          onClick={checkMatch}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
        >
          Tekshirish
        </button>
      </div>
    </div>
  );
};

// 11. Kodlash sarguzashti — Program 3D robot with command queue to reach treasure
export const GameC11CodingAdventure: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  type Cmd = 'F' | 'L' | 'R';
  const levels = useMemo(
    () => [
      {
        start: { r: 3, c: 0, dir: 0 }, // dir: 0=North(-r), 1=East(+c), 2=South(+r), 3=West(-c)
        goal: { r: 1, c: 2 },
        obstacles: ['2,0', '2,1', '1,1'],
      },
      {
        start: { r: 3, c: 3, dir: 3 },
        goal: { r: 0, c: 1 },
        obstacles: ['2,2', '1,2', '0,2', '2,0'],
      },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [queue, setQueue] = useState<Cmd[]>([]);
  const [robotState, setRobotState] = useState(levels[0].start);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const robotRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = levels[level - 1];

  useEffect(() => {
    setLevel(1);
    setQueue([]);
    setRobotState(levels[0].start);
    setRunning(false);
    setScore(0);
    setAttempts(0);
    onLevelChange(1, levels.length);
  }, [restartNonce, levels, onLevelChange]);

  const runProgram = () => {
    if (running || queue.length === 0) return;
    setRunning(true);
    setAttempts((a) => a + 1);
    let state = { ...cur.start };
    setRobotState(state);

    const deltas = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];

    queue.forEach((cmd, idx) => {
      setTimeout(() => {
        if (cmd === 'L') state = { ...state, dir: (state.dir + 3) % 4 };
        else if (cmd === 'R') state = { ...state, dir: (state.dir + 1) % 4 };
        else {
          const [dr, dc] = deltas[state.dir];
          const nr = state.r + dr;
          const nc = state.c + dc;
          if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && !cur.obstacles.includes(`${nr},${nc}`)) {
            state = { ...state, r: nr, c: nc };
          }
        }
        soundEngine.playClick();
        setRobotState({ ...state });

        if (idx === queue.length - 1) {
          setRunning(false);
          if (state.r === cur.goal.r && state.c === cur.goal.c) {
            const ns = score + 65;
            setScore(ns);
            onScore(65, true, 'Barakalla! Robot xazinaga yetib bordi!');
            stageRef.current?.triggerBurst(new THREE.Vector3((cur.goal.c - 1.5) * 1.4, 1.2, (cur.goal.r - 1.5) * 1.4));
            if (level >= levels.length) {
              setTimeout(() => onComplete({ score: ns, correctCount: levels.length, totalQuestions: attempts + 1, levelReached: levels.length }), 650);
            } else {
              const nl = level + 1;
              setTimeout(() => {
                setLevel(nl);
                setQueue([]);
                setRobotState(levels[nl - 1].start);
                onLevelChange(nl, levels.length);
              }, 750);
            }
          } else {
            onAttempt(false, 'Robot manzilga yetmadi. Buyruqlarni tahrirlab qayta urinib ko‘ring!');
            setTimeout(() => setRobotState(cur.start), 500);
          }
        }
      }, (idx + 1) * 380);
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs text-slate-400">Kodlash missiyasi {level}/{levels.length}</div>
          <div className="text-base font-bold text-white">Robotni to‘siqlardan o‘tkazib oltin xazinaga olib boring!</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {queue.length === 0 ? (
            <span className="text-xs text-slate-500">Buyruqlar bo‘sh</span>
          ) : (
            queue.map((q, i) => (
              <span key={i} className="px-2 py-1 rounded bg-slate-800 text-xs font-bold text-cyan-300 border border-slate-700">
                {q === 'F' ? '↑ Oldinga' : q === 'L' ? '↺ Chapga' : '↻ O‘ngga'}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="island"
          cameraPosition={[0, 6.4, 5.4]}
          setupKey={`cod-${level}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let r = 0; r < 4; r++) {
              for (let c = 0; c < 4; c++) {
                const x = (c - 1.5) * 1.4;
                const z = (r - 1.5) * 1.4;
                const isGoal = r === cur.goal.r && c === cur.goal.c;
                const isObs = cur.obstacles.includes(`${r},${c}`);
                const tile = new THREE.Mesh(
                  new THREE.BoxGeometry(1.25, 0.2, 1.25),
                  new THREE.MeshStandardMaterial({ color: isGoal ? 0xeab308 : isObs ? 0x0f172a : 0x1e293b })
                );
                tile.position.set(x, 0.1, z);
                ctx.scene.add(tile);
                if (isObs) {
                  const rock = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.45, 0),
                    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
                  );
                  rock.position.set(x, 0.55, z);
                  ctx.scene.add(rock);
                }
              }
            }
            const star = buildShape3D('yulduz', 0xfacc15);
            star.scale.set(0.68, 0.68, 0.68);
            star.position.set((cur.goal.c - 1.5) * 1.4, 0.25, (cur.goal.r - 1.5) * 1.4);
            ctx.scene.add(star);

            const rob = buildRobot3D(0x0ea5e9);
            rob.scale.set(0.75, 0.75, 0.75);
            rob.position.set((robotState.c - 1.5) * 1.4, 0.22, (robotState.r - 1.5) * 1.4);
            ctx.scene.add(rob);
            robotRef.current = rob;
          }}
          onFrame={(delta) => {
            if (robotRef.current) {
              const tx = (robotState.c - 1.5) * 1.4;
              const tz = (robotState.r - 1.5) * 1.4;
              robotRef.current.position.x = THREE.MathUtils.damp(robotRef.current.position.x, tx, 10, delta);
              robotRef.current.position.z = THREE.MathUtils.damp(robotRef.current.position.z, tz, 10, delta);
              const dirAngles = [Math.PI, Math.PI / 2, 0, -Math.PI / 2];
              robotRef.current.rotation.y = dirAngles[robotState.dir];
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button disabled={running} onClick={() => setQueue((q) => [...q, 'F'])} className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer">
          ↑ Oldinga
        </button>
        <button disabled={running} onClick={() => setQueue((q) => [...q, 'L'])} className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer">
          ↺ Chapga buril
        </button>
        <button disabled={running} onClick={() => setQueue((q) => [...q, 'R'])} className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer">
          ↻ O‘ngga buril
        </button>
        <button disabled={running} onClick={() => { setQueue([]); setRobotState(cur.start); }} className="p-3 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-700 text-rose-400 cursor-pointer" title="Tozalash">
          <Trash2 className="w-5 h-5" />
        </button>
        <button disabled={running || queue.length === 0} onClick={runProgram} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold cursor-pointer">
          <Play className="w-4 h-4 fill-current" />
          Ishga tushirish
        </button>
      </div>
    </div>
  );
};

// 12. Puzzle dunyosi — 3D 3x3 sliding tile puzzle
export const GameC12PuzzleWorld: React.FC<ActiveGameProps> = ({
  onScore,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  // Start with solvable near-solved shuffle
  const [tiles, setTiles] = useState<number[]>([1, 2, 3, 4, 5, 6, 0, 7, 8]);
  const [moves, setMoves] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setTiles([1, 2, 3, 4, 0, 6, 7, 5, 8]);
    setMoves(0);
    onLevelChange(1, 1);
  }, [restartNonce, onLevelChange]);

  const slideTile = (idx: number) => {
    const emptyIdx = tiles.indexOf(0);
    const r1 = Math.floor(idx / 3);
    const c1 = idx % 3;
    const r2 = Math.floor(emptyIdx / 3);
    const c2 = emptyIdx % 3;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;

    soundEngine.playClick();
    const next = [...tiles];
    [next[idx], next[emptyIdx]] = [next[emptyIdx], next[idx]];
    setTiles(next);
    setMoves((m) => m + 1);

    const solved = next.every((v, i) => (i === 8 ? v === 0 : v === i + 1));
    if (solved) {
      onScore(100, true, 'Barakalla! 3D puzzle to‘liq yig‘ildi!');
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.4, 0));
      setTimeout(() => onComplete({ score: Math.max(60, 150 - moves * 4), correctCount: 1, totalQuestions: 1, levelReached: 1 }), 650);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div className="text-lg font-bold text-white">1 dan 8 gacha 3D bo‘laklarni tartibga keltiring!</div>
        <div className="text-sm font-mono-num text-cyan-400">Harakatlar: {moves}</div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="island"
          cameraPosition={[0, 5.8, 4.4]}
          setupKey={`puz-${tiles.join(',')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            tiles.forEach((val, idx) => {
              const r = Math.floor(idx / 3);
              const c = idx % 3;
              const x = (c - 1) * 1.45;
              const z = (r - 1) * 1.45;
              if (val === 0) return;
              const tex = createCanvasLabelTexture(String(val), {
                bg: val === idx + 1 ? '#065f46' : '#1e293b',
                fg: '#f8fafc',
                border: val === idx + 1 ? '#10b981' : '#f97316',
                maxAnisotropy: ctx.maxAnisotropy,
              });
              const block = new THREE.Mesh(
                new THREE.BoxGeometry(1.28, 0.45, 1.28),
                new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 })
              );
              block.position.set(x, 0.25, z);
              block.castShadow = true;
              ctx.scene.add(block);
              ctx.registerClickable(block, `puz-${idx}`, () => slideTile(idx));
            });
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
        {tiles.map((v, idx) => (
          <button
            key={idx}
            disabled={v === 0}
            onClick={() => slideTile(idx)}
            className={`py-3 rounded-xl border font-bold text-xl font-mono-num cursor-pointer ${
              v === 0
                ? 'bg-slate-950 border-slate-800 opacity-30'
                : v === idx + 1
                ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
            }`}
          >
            {v === 0 ? '' : v}
          </button>
        ))}
      </div>
    </div>
  );
};

// 13. Xazina izlovchi — Deductive clue treasure chest hunt
export const GameC13TreasureHunter: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const cases = useMemo(
    () => [
      {
        clues: [
          "1. Xazina Qizil sandiqda emas.",
          "2. Xazina Yashil sandiqning o‘ng tomonida joylashgan.",
          "3. Ko‘k sandiq eng chekkada emas.",
        ],
        chests: [
          { id: 'qizil', label: 'Qizil sandiq', hex: 0xef4444 },
          { id: 'yashil', label: 'Yashil sandiq', hex: 0x22c55e },
          { id: 'kok', label: "Ko'k sandiq", hex: 0x3b82f6 },
          { id: 'oltin', label: 'Sariq sandiq', hex: 0xeab308 },
        ],
        answer: 'oltin',
      },
      {
        clues: [
          "1. Oltin tanga 1- va 4-sandiqda emas.",
          "2. U 3-sandiqdan chapda joylashgan.",
        ],
        chests: [
          { id: 'c1', label: '1-sandiq', hex: 0x64748b },
          { id: 'c2', label: '2-sandiq', hex: 0x06b6d4 },
          { id: 'c3', label: '3-sandiq', hex: 0xa855f7 },
          { id: 'c4', label: '4-sandiq', hex: 0xef4444 },
        ],
        answer: 'c2',
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

  const openChest = (id: string, idx: number) => {
    setAttempts((a) => a + 1);
    if (id === cur.answer) {
      const ns = score + 65;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(65, true, 'Barakalla! Xazina sandig‘ini topdingiz!');
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1.5) * 2.1, 1.3, 0));
      if (round >= cases.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: cases.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, cases.length);
      }
    } else {
      onAttempt(false, "Bu sandiq bo‘sh! Mantiqiy ko‘rsatmalarni qayta o‘qing.");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400 mb-1">Xazina siri {round}/{cases.length}</div>
        <div className="space-y-1 text-sm sm:text-base font-medium text-amber-200">
          {cur.clues.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="island"
          setupKey={`th-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            cur.chests.forEach((ch, idx) => {
              const x = (idx - 1.5) * 2.1;
              const chest = new THREE.Group();
              const base = new THREE.Mesh(
                new THREE.BoxGeometry(1.1, 0.65, 0.8),
                new THREE.MeshStandardMaterial({ color: ch.hex, roughness: 0.4, metalness: 0.2 })
              );
              base.position.y = 0.325;
              chest.add(base);
              const lid = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.4, 1.12, 12, 1, false, 0, Math.PI),
                new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.7 })
              );
              lid.rotation.z = Math.PI / 2;
              lid.position.y = 0.65;
              chest.add(lid);
              chest.position.set(x, 0, 0);
              ctx.scene.add(chest);
              ctx.registerClickable(chest, ch.id, () => openChest(ch.id, idx));
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cur.chests.map((ch, idx) => (
          <button
            key={ch.id}
            onClick={() => openChest(ch.id, idx)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {ch.label}
          </button>
        ))}
      </div>
    </div>
  );
};
