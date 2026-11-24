import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { ThreeGameStage, ThreeStageContext } from '../shared/ThreeGameStage';
import {
  buildAnimal3D,
  buildPedestal3D,
  buildShape3D,
  buildSkyObject3D,
  buildToyObject3D,
} from '../shared/models3d';
import { ActiveGameProps, pickCorrectMessage, pickTryAgainMessage, shuffleArray } from '../shared/gameHelpers';
import { createCanvasLabelTexture } from '../../components/three/threeUtils';
import { soundEngine } from '../../utils/sound';

// 8. Sehrli labirint — Guide 3D friendly character through a 5x5 hedge maze
export const GameP8MagicMaze: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const mazes = useMemo(
    () => [
      [
        [0, 0, 1, 0, 0],
        [1, 0, 1, 0, 1],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 1, 0],
      ],
      [
        [0, 1, 0, 0, 0],
        [0, 1, 0, 1, 0],
        [0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0],
        [0, 0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 1, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
      ],
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const maxLevels = 3;
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const goal = { r: 4, c: 4 };
  const playerRef = useRef<THREE.Group | null>(null);
  const starRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setLevel(1);
    setPos({ r: 0, c: 0 });
    setScore(0);
    setMoves(0);
    onLevelChange(1, maxLevels);
  }, [restartNonce, onLevelChange]);

  const move = (dr: number, dc: number) => {
    const grid = mazes[level - 1];
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5 || grid[nr][nc] === 1) {
      soundEngine.playError();
      return;
    }
    soundEngine.playClick();
    setMoves((m) => m + 1);
    setPos({ r: nr, c: nc });

    if (nr === goal.r && nc === goal.c) {
      const ns = score + 60;
      setScore(ns);
      onScore(60, true, 'Barakalla! Yulduzchaga yetib keldingiz!');
      stageRef.current?.triggerBurst(new THREE.Vector3((goal.c - 2) * 1.2, 1.0, (goal.r - 2) * 1.2));
      if (level >= maxLevels) {
        setTimeout(() => onComplete({ score: ns, correctCount: maxLevels, totalQuestions: maxLevels, levelReached: maxLevels }), 650);
      } else {
        const nl = level + 1;
        setTimeout(() => {
          setLevel(nl);
          setPos({ r: 0, c: 0 });
          onLevelChange(nl, maxLevels);
        }, 700);
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); move(-1, 0); }
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1, 0); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(0, -1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move(0, 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const grid = mazes[level - 1];

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Labirint {level}/{maxLevels} · Qadamlar: {moves}</div>
          <div className="text-lg font-bold text-white">Quvnoq mushukchani oltin yulduzga olib boring!</div>
        </div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          cameraPosition={[0, 6.8, 5.5]}
          setupKey={`maze-${level}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let r = 0; r < 5; r++) {
              for (let c = 0; c < 5; c++) {
                const x = (c - 2) * 1.2;
                const z = (r - 2) * 1.2;
                const tile = new THREE.Mesh(
                  new THREE.BoxGeometry(1.12, 0.14, 1.12),
                  new THREE.MeshStandardMaterial({
                    color: r === goal.r && c === goal.c ? 0xf59e0b : grid[r][c] === 1 ? 0x166534 : 0x1e293b,
                    roughness: 0.6,
                  })
                );
                tile.position.set(x, 0.07, z);
                tile.receiveShadow = true;
                ctx.scene.add(tile);

                if (grid[r][c] === 1) {
                  const hedge = new THREE.Mesh(
                    new THREE.BoxGeometry(0.95, 0.75, 0.95),
                    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 })
                  );
                  hedge.position.set(x, 0.5, z);
                  hedge.castShadow = true;
                  ctx.scene.add(hedge);
                }
              }
            }

            const star = buildShape3D('yulduz', 0xfacc15);
            star.scale.set(0.75, 0.75, 0.75);
            star.position.set((goal.c - 2) * 1.2, 0.25, (goal.r - 2) * 1.2);
            ctx.scene.add(star);
            starRef.current = star;

            const hero = buildAnimal3D('mushuk');
            hero.scale.set(0.72, 0.72, 0.72);
            hero.position.set((pos.c - 2) * 1.2, 0.16, (pos.r - 2) * 1.2);
            ctx.scene.add(hero);
            playerRef.current = hero;
          }}
          onFrame={(delta) => {
            if (playerRef.current) {
              const tx = (pos.c - 2) * 1.2;
              const tz = (pos.r - 2) * 1.2;
              playerRef.current.position.x = THREE.MathUtils.damp(playerRef.current.position.x, tx, 10, delta);
              playerRef.current.position.z = THREE.MathUtils.damp(playerRef.current.position.z, tz, 10, delta);
            }
            if (starRef.current) {
              starRef.current.rotation.y += delta * 1.5;
            }
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => move(0, -1)} className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 cursor-pointer" aria-label="Chapga">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex flex-col gap-2">
          <button onClick={() => move(-1, 0)} className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 cursor-pointer" aria-label="Yuqoriga">
            <ArrowUp className="w-6 h-6 text-white" />
          </button>
          <button onClick={() => move(1, 0)} className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 cursor-pointer" aria-label="Pastga">
            <ArrowDown className="w-6 h-6 text-white" />
          </button>
        </div>
        <button onClick={() => move(0, 1)} className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 cursor-pointer" aria-label="O'ngga">
          <ArrowRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

// 9. Xotira kartalari — 3D flipping memory cards
export const GameP9MemoryCards: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const symbols = useMemo(
    () => [
      { id: 'olma', label: '🍎', hex: '#EF4444' },
      { id: 'yulduz', label: '⭐', hex: '#FACC15' },
      { id: 'raketa', label: '🚀', hex: '#38BDF8' },
      { id: 'gul', label: '🌸', hex: '#EC4899' },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const maxLevels = 2;
  const [cards, setCards] = useState<{ uid: number; id: string; label: string; hex: string; flipped: boolean; matched: boolean }[]>([]);
  const [openIndices, setOpenIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const cardGroups = useRef<THREE.Group[]>([]);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const init = (lvl: number) => {
    const count = lvl === 1 ? 3 : 4;
    const base = symbols.slice(0, count);
    setCards(
      shuffleArray([...base, ...base]).map((s, uid) => ({
        uid,
        ...s,
        flipped: false,
        matched: false,
      }))
    );
    setOpenIndices([]);
  };

  useEffect(() => {
    setLevel(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    init(1);
    onLevelChange(1, maxLevels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

  const flipCard = (idx: number) => {
    if (openIndices.length >= 2 || cards[idx].flipped || cards[idx].matched) return;
    soundEngine.playClick();
    const nextCards = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    const nextOpen = [...openIndices, idx];
    setCards(nextCards);
    setOpenIndices(nextOpen);

    if (nextOpen.length === 2) {
      setAttempts((a) => a + 1);
      const [a, b] = nextOpen;
      if (nextCards[a].id === nextCards[b].id) {
        const matchedCards = nextCards.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
        setCards(matchedCards);
        setOpenIndices([]);
        const ns = score + 40;
        const nc = corrects + 1;
        setScore(ns);
        setCorrects(nc);
        onScore(40, true, pickCorrectMessage(nc));
        stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.3, 0));

        if (matchedCards.every((c) => c.matched)) {
          if (level >= maxLevels) {
            setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxLevels }), 600);
          } else {
            setTimeout(() => {
              setLevel(2);
              onLevelChange(2, maxLevels);
              init(2);
            }, 700);
          }
        }
      } else {
        onAttempt(false, 'Qayta urinib ko‘ring!');
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setOpenIndices([]);
        }, 750);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Bosqich {level}/{maxLevels}</div>
        <div className="text-lg font-bold text-white">3D kartochkalarni oching va bir xil rasmlarni juftlang!</div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          cameraPosition={[0, 4.4, 6.2]}
          setupKey={`mem-${level}-${cards.length}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            cardGroups.current = [];
            const cols = cards.length <= 6 ? 3 : 4;
            cards.forEach((c, idx) => {
              const row = Math.floor(idx / cols);
              const col = idx % cols;
              const x = (col - (cols - 1) / 2) * 1.75;
              const z = (row - 0.5) * 2.1;

              const grp = new THREE.Group();
              const backTex = createCanvasLabelTexture('?', { bg: '#1e293b', fg: '#f59e0b', border: '#f59e0b', maxAnisotropy: ctx.maxAnisotropy });
              const frontTex = createCanvasLabelTexture(c.label, { bg: c.hex, fg: '#ffffff', border: '#ffffff', fontSize: 110, maxAnisotropy: ctx.maxAnisotropy });

              const cardMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1.3, 0.14, 1.65),
                [
                  new THREE.MeshStandardMaterial({ color: 0x334155 }),
                  new THREE.MeshStandardMaterial({ color: 0x334155 }),
                  new THREE.MeshStandardMaterial({ map: backTex }),
                  new THREE.MeshStandardMaterial({ map: frontTex }),
                  new THREE.MeshStandardMaterial({ color: 0x334155 }),
                  new THREE.MeshStandardMaterial({ color: 0x334155 }),
                ]
              );
              cardMesh.castShadow = true;
              grp.add(cardMesh);
              grp.position.set(x, 0.4, z);
              ctx.scene.add(grp);
              cardGroups.current.push(grp);
              ctx.registerClickable(grp, `card-${idx}`, () => flipCard(idx));
            });
          }}
          onFrame={(delta) => {
            cardGroups.current.forEach((g, idx) => {
              const targetRot = cards[idx]?.flipped || cards[idx]?.matched ? Math.PI : 0;
              g.rotation.z = THREE.MathUtils.damp(g.rotation.z, targetRot, 10, delta);
            });
          }}
        />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {cards.map((c, idx) => (
          <button
            key={c.uid}
            onClick={() => flipCard(idx)}
            className={`py-3 rounded-xl border font-bold text-lg cursor-pointer transition-colors ${
              c.matched
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : c.flipped
                ? 'bg-slate-800 border-amber-400 text-white'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-400'
            }`}
          >
            {c.flipped || c.matched ? c.label : `Karta ${idx + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
};

// 10. Osmonni o'rgan — Identify Sun, Moon, Cloud, and Star in 3D sky
export const GameP10ExploreSky: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const skyItems = useMemo(
    () => [
      { id: 'quyosh' as const, name: 'Quyosh', prompt: 'Kunduzi osmonni yoritib, issiqlik beradigan Quyoshni bosing!' },
      { id: 'oy' as const, name: 'Oy', prompt: 'Tunda osmonda porlaydigan yarim Oyni bosing!' },
      { id: 'bulut' as const, name: 'Bulut', prompt: 'Osmonda suzib yuradigan oppoq Bulutni bosing!' },
      { id: 'yulduz' as const, name: 'Yulduz', prompt: 'Tungi osmonda miltillaydigan Yulduzni bosing!' },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const maxRounds = 4;
  const [order] = useState(() => shuffleArray(skyItems));
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const skyRefs = useRef<THREE.Group[]>([]);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const target = order[(round - 1) % order.length];

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, maxRounds);
  }, [restartNonce, onLevelChange]);

  const choose = (id: string, idx: number) => {
    setAttempts((a) => a + 1);
    if (id === target.id) {
      const ns = score + 35;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(35, true, `Barakalla! Bu ${target.name}!`);
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1.5) * 2.2, 1.5, 0));
      if (round >= maxRounds) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxRounds }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Osmon sarguzashti {round}/{maxRounds}</div>
        <div className="text-lg font-bold text-white">{target.prompt}</div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`sky-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            skyRefs.current = [];
            skyItems.forEach((item, idx) => {
              const x = (idx - 1.5) * 2.2;
              const ped = buildPedestal3D(0x0ea5e9, 0.72, 0.25);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const obj = buildSkyObject3D(item.id);
              obj.position.set(x, 0.45, 0);
              ctx.scene.add(obj);
              skyRefs.current.push(obj);
              ctx.registerClickable(obj, item.id, () => choose(item.id, idx));
            });
          }}
          onFrame={(delta, elapsed) => {
            skyRefs.current.forEach((g, idx) => {
              g.rotation.y += delta * 0.55;
              g.position.y = 0.48 + Math.sin(elapsed * 2 + idx) * 0.08;
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {skyItems.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => choose(item.id, idx)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// 11. To'g'ri predmetni tanla — Choose 3D object matching visual/riddle clue
export const GameP11ChooseObject: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const riddles = useMemo(
    () => [
      { id: 'soyabon' as const, name: 'Soyabon', clue: "Yomg'ir yog'ganda bizni suvdan himoya qiladi.", hex: 0xa855f7 },
      { id: 'raketa' as const, name: 'Raketa', clue: 'Kosmosga va yulduzlar sari uchadi.', hex: 0xef4444 },
      { id: 'kitob' as const, name: 'Kitob', clue: "Ichida qiziqarli ertaklar va bilimlar bor.", hex: 0x3b82f6 },
      { id: 'mashina' as const, name: 'Mashina', clue: "To'rtta g'ildiragi bor, yo'lda tez yuradi.", hex: 0x10b981 },
      { id: 'toj' as const, name: 'Toj', clue: "Qirol va malikalar boshiga kiyadigan oltin bezak.", hex: 0xfacc15 },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [options, setOptions] = useState(() => shuffleArray(riddles).slice(0, 4));
  const [target, setTarget] = useState(() => options[0]);
  const objsRef = useRef<THREE.Group[]>([]);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const prep = () => {
    const next = shuffleArray(riddles).slice(0, 4);
    setOptions(next);
    setTarget(next[Math.floor(Math.random() * next.length)]);
  };

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    prep();
    onLevelChange(1, maxRounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

  const choose = (id: string, idx: number) => {
    setAttempts((a) => a + 1);
    if (id === target.id) {
      const ns = score + 35;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(35, true, `Zo'r! To'g'ri javob: ${target.name}!`);
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1.5) * 2.2, 1.3, 0));
      if (round >= maxRounds) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxRounds }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
        prep();
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Topishmoq {round}/{maxRounds}</div>
        <div className="text-lg font-bold text-white">{target.clue}</div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`rid-${round}-${options.map((o) => o.id).join('-')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            objsRef.current = [];
            options.forEach((o, idx) => {
              const x = (idx - 1.5) * 2.2;
              const ped = buildPedestal3D(o.hex, 0.72, 0.25);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const m = buildToyObject3D(o.id, o.hex);
              m.position.set(x, 0.3, 0);
              ctx.scene.add(m);
              objsRef.current.push(m);
              ctx.registerClickable(m, o.id, () => choose(o.id, idx));
            });
          }}
          onFrame={(delta) => {
            objsRef.current.forEach((m) => {
              m.rotation.y += delta * 0.7;
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {options.map((o, idx) => (
          <button
            key={o.id}
            onClick={() => choose(o.id, idx)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// 12. Rangli konstruktor — Build 3D colorful block towers matching blueprint
export const GameP12ColorBuilder: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const colors = useMemo(
    () => [
      { id: 'R', name: 'Qizil', hex: 0xef4444, css: '#EF4444' },
      { id: 'B', name: "Ko'k", hex: 0x3b82f6, css: '#3B82F6' },
      { id: 'Y', name: 'Sariq', hex: 0xfacc15, css: '#FACC15' },
      { id: 'G', name: 'Yashil', hex: 0x22c55e, css: '#22C55E' },
    ],
    []
  );

  const blueprints = useMemo(
    () => [
      ['R', 'B', 'Y'],
      ['G', 'Y', 'R', 'B'],
      ['B', 'G', 'R', 'Y'],
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const maxLevels = 3;
  const [stack, setStack] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const targetBlueprint = blueprints[level - 1];

  useEffect(() => {
    setLevel(1);
    setStack([]);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, maxLevels);
  }, [restartNonce, onLevelChange]);

  const addBlock = (colorId: string) => {
    if (stack.length >= targetBlueprint.length) return;
    setAttempts((a) => a + 1);
    const expected = targetBlueprint[stack.length];
    if (colorId === expected) {
      const next = [...stack, colorId];
      setStack(next);
      soundEngine.playNote(400 + next.length * 80);
      if (next.length === targetBlueprint.length) {
        const ns = score + 50;
        const nc = corrects + 1;
        setScore(ns);
        setCorrects(nc);
        onScore(50, true, 'Barakalla! Minora muvaffaqiyatli qurildi!');
        stageRef.current?.triggerBurst(new THREE.Vector3(1.2, 2.2, 0));
        if (level >= maxLevels) {
          setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxLevels }), 650);
        } else {
          const nl = level + 1;
          setTimeout(() => {
            setLevel(nl);
            setStack([]);
            onLevelChange(nl, maxLevels);
          }, 700);
        }
      }
    } else {
      onAttempt(false, "Namuna rangiga qarang — boshqa rangdagi kubik kerak!");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Qurilish {level}/{maxLevels}</div>
          <div className="text-lg font-bold text-white">Chapdagi namuna kabi o‘ng tomonda 3D minora quring!</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Tartib (pastdan tepaga):</span>
          {targetBlueprint.map((cid, i) => {
            const c = colors.find((x) => x.id === cid)!;
            return (
              <span
                key={i}
                className="w-6 h-6 rounded border border-white/20 inline-block"
                style={{ backgroundColor: c.css, opacity: i < stack.length ? 1 : 0.45 }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`bld-${level}-${stack.join('')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            // Left: Blueprint tower
            const leftPed = buildPedestal3D(0x64748b, 0.9, 0.25);
            leftPed.position.set(-1.7, 0, 0);
            ctx.scene.add(leftPed);
            targetBlueprint.forEach((cid, idx) => {
              const col = colors.find((x) => x.id === cid)!;
              const block = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.65, 0.9),
                new THREE.MeshStandardMaterial({ color: col.hex, roughness: 0.35 })
              );
              block.position.set(-1.7, 0.58 + idx * 0.68, 0);
              block.castShadow = true;
              ctx.scene.add(block);
            });

            // Right: Player's tower
            const rightPed = buildPedestal3D(0xf59e0b, 0.9, 0.25);
            rightPed.position.set(1.7, 0, 0);
            ctx.scene.add(rightPed);
            stack.forEach((cid, idx) => {
              const col = colors.find((x) => x.id === cid)!;
              const block = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.65, 0.9),
                new THREE.MeshStandardMaterial({ color: col.hex, roughness: 0.35 })
              );
              block.position.set(1.7, 0.58 + idx * 0.68, 0);
              block.castShadow = true;
              ctx.scene.add(block);
            });
          }}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {colors.map((c) => (
          <button
            key={c.id}
            onClick={() => addBlock(c.id)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="w-5 h-5 rounded" style={{ backgroundColor: c.css }} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 13. Shirinliklarni sanash — Count 3D frosted cupcakes & donuts
export const GameP13CountSweets: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [count, setCount] = useState(4);
  const [options, setOptions] = useState<number[]>([3, 4, 5, 6]);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const sweetsRef = useRef<THREE.Group[]>([]);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const prep = (r: number) => {
    const n = 2 + Math.floor(Math.random() * Math.min(7, r + 3));
    const set = new Set<number>([n]);
    while (set.size < 4) set.add(1 + Math.floor(Math.random() * 9));
    setCount(n);
    setOptions(shuffleArray(Array.from(set)));
  };

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    prep(1);
    onLevelChange(1, maxRounds);
  }, [restartNonce, onLevelChange]);

  const answer = (val: number) => {
    setAttempts((a) => a + 1);
    if (val === count) {
      const ns = score + 35;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(35, true, `Barakalla! Tovoqda ${count} ta shirinlik bor!`);
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.3, 0));
      if (round >= maxRounds) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxRounds }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
        prep(nr);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Topshiriq {round}/{maxRounds}</div>
        <div className="text-lg font-bold text-white">Tovoqdagi 3D shirinliklarni sanang!</div>
      </div>
      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`sweet-${round}-${count}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            sweetsRef.current = [];
            const tray = new THREE.Mesh(
              new THREE.CylinderGeometry(3.4, 3.6, 0.2, 32),
              new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.4, metalness: 0.1 })
            );
            tray.position.y = 0.1;
            tray.receiveShadow = true;
            ctx.scene.add(tray);

            const icingPalette = [0xec4899, 0x38bdf8, 0xf59e0b, 0x10b981, 0xa855f7];
            for (let i = 0; i < count; i++) {
              const angle = (i * Math.PI * 2) / count;
              const radius = count === 1 ? 0 : 1.85;
              const cupcake = new THREE.Group();
              const wrapper = new THREE.Mesh(
                new THREE.CylinderGeometry(0.32, 0.24, 0.36, 14),
                new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 })
              );
              wrapper.position.y = 0.18;
              cupcake.add(wrapper);
              const frosting = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 16, 14),
                new THREE.MeshStandardMaterial({ color: icingPalette[i % icingPalette.length], roughness: 0.35 })
              );
              frosting.scale.set(1, 0.72, 1);
              frosting.position.y = 0.44;
              cupcake.add(frosting);
              const cherry = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 })
              );
              cherry.position.y = 0.68;
              cupcake.add(cherry);

              cupcake.position.set(Math.cos(angle) * radius, 0.22, Math.sin(angle) * radius);
              ctx.scene.add(cupcake);
              sweetsRef.current.push(cupcake);
            }
          }}
          onFrame={(delta) => {
            sweetsRef.current.forEach((s) => {
              s.rotation.y += delta * 0.5;
            });
          }}
        />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => answer(n)}
            className="py-4 rounded-xl bg-slate-900 hover:bg-pink-500 hover:text-slate-950 border border-slate-700 font-bold text-2xl font-mono-num text-white transition-colors cursor-pointer"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};
