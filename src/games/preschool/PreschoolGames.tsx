import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Volume2 } from 'lucide-react';
import { ThreeGameStage, ThreeStageContext } from '../shared/ThreeGameStage';
import {
  buildAnimal3D,
  buildFruit3D,
  buildPedestal3D,
  buildShape3D,
  buildToyObject3D,
} from '../shared/models3d';
import { ActiveGameProps, pickCorrectMessage, pickTryAgainMessage, shuffleArray } from '../shared/gameHelpers';
import { createCanvasLabelTexture } from '../../components/three/threeUtils';
import { soundEngine } from '../../utils/sound';

// 1. Ranglarni top — Identify and match colors on 3D toys
export const GameP1Colors: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const palette = useMemo(
    () => [
      { id: 'qizil', name: 'Qizil', hex: 0xef4444, css: '#EF4444' },
      { id: 'kok', name: "Ko'k", hex: 0x3b82f6, css: '#3B82F6' },
      { id: 'sariq', name: 'Sariq', hex: 0xfacc15, css: '#FACC15' },
      { id: 'yashil', name: 'Yashil', hex: 0x22c55e, css: '#22C55E' },
      { id: 'binafsha', name: 'Binafsha', hex: 0xa855f7, css: '#A855F7' },
      { id: 'apelsin', name: "To'q sariq", hex: 0xf97316, css: '#F97316' },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const maxRounds = 6;
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [choices, setChoices] = useState(() => shuffleArray(palette).slice(0, 4));
  const [target, setTarget] = useState(() => choices[0]);
  const toysRef = useRef<THREE.Group[]>([]);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    const next = shuffleArray(palette).slice(0, 4);
    setChoices(next);
    setTarget(next[Math.floor(Math.random() * next.length)]);
    onLevelChange(1, maxRounds);
  }, [restartNonce, palette, onLevelChange]);

  const handlePick = (id: string, idx: number) => {
    setAttempts((a) => a + 1);
    if (id === target.id) {
      const nextScore = score + 30;
      const nextCorrects = corrects + 1;
      setScore(nextScore);
      setCorrects(nextCorrects);
      onScore(30, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1.5) * 2.1, 1.2, 0));

      if (round >= maxRounds) {
        setTimeout(() => {
          onComplete({ score: nextScore, correctCount: nextCorrects, totalQuestions: attempts + 1, levelReached: maxRounds });
        }, 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
        const count = nr >= 4 ? 5 : 4;
        const next = shuffleArray(palette).slice(0, count);
        setChoices(next);
        setTarget(next[Math.floor(Math.random() * next.length)]);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Topshiriq {round}/{maxRounds}</div>
          <div className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
            <span>Qaysi 3D o‘yinchoq</span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">
              <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: target.css }} />
              {target.name}
            </span>
            <span>rangda?</span>
          </div>
        </div>
        <div className="text-xs text-slate-400">3D o‘yinchoqni yoki pastdagi tugmani bosing</div>
      </div>

      <div className="flex-1 min-h-[280px] relative">
        <ThreeGameStage
          theme="playground"
          setupKey={`${round}-${choices.map((c) => c.id).join('-')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            toysRef.current = [];
            const toyKinds: ('mashina' | 'raketa' | 'soyabon' | 'kitob' | 'samolyot')[] = [
              'mashina',
              'raketa',
              'soyabon',
              'kitob',
              'samolyot',
            ];
            choices.forEach((c, idx) => {
              const x = (idx - (choices.length - 1) / 2) * 2.05;
              const ped = buildPedestal3D(c.hex, 0.72, 0.3);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);

              const toy = buildToyObject3D(toyKinds[(idx + round) % toyKinds.length], c.hex);
              toy.position.set(x, 0.34, 0);
              ctx.scene.add(toy);
              toysRef.current.push(toy);
              ctx.registerClickable(toy, c.id, () => handlePick(c.id, idx));
              ctx.registerClickable(ped, c.id, () => handlePick(c.id, idx));
            });
          }}
          onFrame={(delta, elapsed) => {
            toysRef.current.forEach((t, i) => {
              t.rotation.y += delta * 0.7;
              t.position.y = 0.36 + Math.sin(elapsed * 2 + i) * 0.06;
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {choices.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => handlePick(c.id, idx)}
            className="py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white flex items-center justify-center gap-2.5 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: c.css }} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 2. Shakllar olami — Match 3D geometric shapes
export const GameP2Shapes: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const shapes = useMemo(
    () => [
      { id: 'kub' as const, label: 'Kub', color: 0x3b82f6 },
      { id: 'shar' as const, label: 'Shar', color: 0xf59e0b },
      { id: 'konus' as const, label: 'Konus', color: 0x10b981 },
      { id: 'silindr' as const, label: 'Silindr', color: 0xec4899 },
      { id: 'piramida' as const, label: 'Piramida', color: 0x8b5cf6 },
      { id: 'yulduz' as const, label: 'Yulduz', color: 0xef4444 },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const maxRounds = 6;
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [options, setOptions] = useState(() => shuffleArray(shapes).slice(0, 4));
  const [target, setTarget] = useState(() => options[0]);
  const meshList = useRef<THREE.Group[]>([]);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    const next = shuffleArray(shapes).slice(0, 4);
    setOptions(next);
    setTarget(next[0]);
    onLevelChange(1, maxRounds);
  }, [restartNonce, shapes, onLevelChange]);

  const choose = (id: string, idx: number) => {
    setAttempts((a) => a + 1);
    if (id === target.id) {
      const ns = score + 30;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(30, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1.5) * 2.1, 1.3, 0));
      if (round >= maxRounds) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxRounds }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
        const next = shuffleArray(shapes).slice(0, 4);
        setOptions(next);
        setTarget(next[Math.floor(Math.random() * next.length)]);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Bosqich {round}/{maxRounds}</div>
          <div className="text-lg sm:text-xl font-bold text-white">
            Sahnadan <span className="text-emerald-400">{target.label}</span> shaklini toping!
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`${round}-${options.map((o) => o.id).join('-')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            meshList.current = [];
            options.forEach((opt, idx) => {
              const x = (idx - (options.length - 1) / 2) * 2.2;
              const ped = buildPedestal3D(opt.color, 0.72, 0.28);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const shape = buildShape3D(opt.id, opt.color);
              shape.position.set(x, 0.34, 0);
              ctx.scene.add(shape);
              meshList.current.push(shape);
              ctx.registerClickable(shape, opt.id, () => choose(opt.id, idx));
            });
          }}
          onFrame={(delta) => {
            meshList.current.forEach((m) => {
              m.rotation.y += delta * 0.85;
            });
          }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {options.map((o, i) => (
          <button
            key={o.id}
            onClick={() => choose(o.id, i)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// 3. Hayvonlar ovozi — Identify 3D animals by procedural Web Audio sounds
export const GameP3AnimalSounds: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const animals = useMemo(
    () => [
      { id: 'mushuk' as const, name: 'Mushuk', soundHint: 'Miyov-miyov' },
      { id: 'kuchuk' as const, name: 'Kuchuk', soundHint: 'Vov-vov' },
      { id: 'sigir' as const, name: 'Sigir', soundHint: 'Muuu' },
      { id: 'qoy' as const, name: "Qo'y", soundHint: 'Baaa' },
      { id: 'ordak' as const, name: "O'rdak", soundHint: "G'aq-g'aq" },
      { id: 'arslon' as const, name: 'Arslon', soundHint: 'Ar-r-r!' },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const maxRounds = 6;
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [pool, setPool] = useState(() => shuffleArray(animals).slice(0, 4));
  const [target, setTarget] = useState(() => pool[0]);
  const animalGroups = useRef<THREE.Group[]>([]);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    const p = shuffleArray(animals).slice(0, 4);
    setPool(p);
    setTarget(p[0]);
    onLevelChange(1, maxRounds);
  }, [restartNonce, animals, onLevelChange]);

  const playSound = () => {
    soundEngine.playAnimalSound(target.id);
  };

  const pickAnimal = (id: string, idx: number) => {
    setAttempts((a) => a + 1);
    if (id === target.id) {
      const ns = score + 35;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(35, true, `Barakalla! Bu ${target.name} edi!`);
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1.5) * 2.2, 1.3, 0));
      if (round >= maxRounds) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxRounds }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
        const np = shuffleArray(animals).slice(0, 4);
        setPool(np);
        const nt = np[Math.floor(Math.random() * np.length)];
        setTarget(nt);
        setTimeout(() => soundEngine.playAnimalSound(nt.id), 350);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Topshiriq {round}/{maxRounds}</div>
          <div className="text-lg font-bold text-white">
            Bu qaysi hayvonning ovozi? <span className="text-amber-400">({target.soundHint})</span>
          </div>
        </div>
        <button
          onClick={playSound}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
        >
          <Volume2 className="w-5 h-5" />
          Ovozni eshitish
        </button>
      </div>
      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`${round}-${pool.map((p) => p.id).join('-')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            animalGroups.current = [];
            pool.forEach((a, idx) => {
              const x = (idx - (pool.length - 1) / 2) * 2.25;
              const ped = buildPedestal3D(0x10b981, 0.78, 0.25);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const model = buildAnimal3D(a.id);
              model.position.set(x, 0.28, 0);
              model.rotation.y = -0.35;
              ctx.scene.add(model);
              animalGroups.current.push(model);
              ctx.registerClickable(model, a.id, () => pickAnimal(a.id, idx));
            });
          }}
          onFrame={(delta, elapsed) => {
            animalGroups.current.forEach((g, idx) => {
              g.position.y = 0.28 + Math.abs(Math.sin(elapsed * 2.2 + idx)) * 0.08;
              g.rotation.y += delta * 0.35;
            });
          }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pool.map((a, idx) => (
          <button
            key={a.id}
            onClick={() => pickAnimal(a.id, idx)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {a.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// 4. Mevalarni sarala — Sort 3D fruits by color and basket
export const GameP4SortFruits: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const fruits = useMemo(
    () => [
      { id: 'olma' as const, name: 'Olma', colorName: 'Qizil savat', hex: '#EF4444', threeHex: 0xef4444 },
      { id: 'banan' as const, name: 'Banan', colorName: 'Sariq savat', hex: '#FACC15', threeHex: 0xfacc15 },
      { id: 'uzum' as const, name: 'Uzum', colorName: 'Binafsha savat', hex: '#9333EA', threeHex: 0x9333ea },
      { id: 'apelsin' as const, name: 'Apelsin', colorName: "To'q sariq savat", hex: '#F97316', threeHex: 0xf97316 },
      { id: 'nok' as const, name: 'Nok', colorName: 'Yashil savat', hex: '#84CC16', threeHex: 0x84cc16 },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const maxRounds = 6;
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentFruit, setCurrentFruit] = useState(() => fruits[0]);
  const [baskets, setBaskets] = useState(() => shuffleArray(fruits).slice(0, 3));
  const fruitRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const nextRoundState = (r: number) => {
    const picked = fruits[(r - 1) % fruits.length];
    const others = shuffleArray(fruits.filter((f) => f.id !== picked.id)).slice(0, 2);
    setCurrentFruit(picked);
    setBaskets(shuffleArray([picked, ...others]));
  };

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    nextRoundState(1);
    onLevelChange(1, maxRounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

  const sortIntoBasket = (basketId: string, idx: number) => {
    setAttempts((a) => a + 1);
    if (basketId === currentFruit.id) {
      const ns = score + 30;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(30, true, `Ajoyib! ${currentFruit.name} to'g'ri savatga tushdi!`);
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1) * 2.4, 0.8, 1.2));
      if (round >= maxRounds) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxRounds }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
        nextRoundState(nr);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Saralash {round}/{maxRounds}</div>
        <div className="text-lg font-bold text-white">
          Markazdagi 3D <span className="text-amber-400">{currentFruit.name}</span> mevasini qaysi savatga solamiz?
        </div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`${round}-${currentFruit.id}-${baskets.map((b) => b.id).join('-')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const ped = buildPedestal3D(currentFruit.threeHex, 0.9, 0.35);
            ped.position.set(0, 0, -1.2);
            ctx.scene.add(ped);

            const f = buildFruit3D(currentFruit.id);
            f.scale.set(1.5, 1.5, 1.5);
            f.position.set(0, 0.4, -1.2);
            ctx.scene.add(f);
            fruitRef.current = f;

            // 3D colored sorting baskets in foreground
            baskets.forEach((b, idx) => {
              const x = (idx - 1) * 2.4;
              const basketGroup = new THREE.Group();
              const pot = new THREE.Mesh(
                new THREE.CylinderGeometry(0.7, 0.52, 0.55, 18),
                new THREE.MeshStandardMaterial({ color: b.threeHex, roughness: 0.45, metalness: 0.1 })
              );
              pot.position.y = 0.28;
              pot.castShadow = true;
              basketGroup.add(pot);
              const rim = new THREE.Mesh(
                new THREE.TorusGeometry(0.7, 0.06, 10, 24),
                new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
              );
              rim.rotation.x = Math.PI / 2;
              rim.position.y = 0.55;
              basketGroup.add(rim);

              basketGroup.position.set(x, 0, 1.2);
              ctx.scene.add(basketGroup);
              ctx.registerClickable(basketGroup, b.id, () => sortIntoBasket(b.id, idx));
            });
          }}
          onFrame={(delta, elapsed) => {
            if (fruitRef.current) {
              fruitRef.current.rotation.y += delta * 0.9;
              fruitRef.current.position.y = 0.45 + Math.sin(elapsed * 2.4) * 0.08;
            }
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {baskets.map((b, idx) => (
          <button
            key={b.id}
            onClick={() => sortIntoBasket(b.id, idx)}
            className="py-3.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: b.hex }} />
            <span className="truncate">{b.colorName}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 5. Katta yoki kichik — Compare 3D object sizes
export const GameP5CompareSizes: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [askLargest, setAskLargest] = useState(true);
  const [scales, setScales] = useState<number[]>([0.65, 1.45, 1.0]);
  const stageRef = useRef<ThreeStageContext | null>(null);
  const itemsRef = useRef<THREE.Group[]>([]);

  const genRound = (r: number) => {
    setAskLargest(r % 2 === 1);
    setScales(shuffleArray([0.6, 1.02, 1.52]));
  };

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    genRound(1);
    onLevelChange(1, maxRounds);
  }, [restartNonce, onLevelChange]);

  const pickSize = (idx: number) => {
    setAttempts((a) => a + 1);
    const targetVal = askLargest ? Math.max(...scales) : Math.min(...scales);
    if (scales[idx] === targetVal) {
      const ns = score + 35;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(35, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3((idx - 1) * 2.4, 1.2, 0));
      if (round >= maxRounds) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxRounds }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
        genRound(nr);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  const labels = ['Chapdagi', "O'rtadagi", "O'ngdagi"];

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Taqqoslash {round}/{maxRounds}</div>
        <div className="text-lg sm:text-xl font-bold text-white">
          Qaysi 3D jism <span className="text-amber-400">{askLargest ? 'ENG KATTA' : 'ENG KICHIK'}</span>?
        </div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`${round}-${scales.join('-')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            itemsRef.current = [];
            const shapeKinds: ('kub' | 'shar' | 'konus' | 'piramida')[] = ['kub', 'shar', 'konus', 'piramida'];
            const kind = shapeKinds[round % shapeKinds.length];
            scales.forEach((sc, idx) => {
              const x = (idx - 1) * 2.4;
              const ped = buildPedestal3D(0x3b82f6, 0.78, 0.24);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const obj = buildShape3D(kind, [0x3b82f6, 0xf59e0b, 0x10b981][idx]);
              obj.scale.set(sc, sc, sc);
              obj.position.set(x, 0.28, 0);
              ctx.scene.add(obj);
              itemsRef.current.push(obj);
              ctx.registerClickable(obj, `s-${idx}`, () => pickSize(idx));
            });
          }}
          onFrame={(delta) => {
            itemsRef.current.forEach((m) => {
              m.rotation.y += delta * 0.6;
            });
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {labels.map((lbl, idx) => (
          <button
            key={lbl}
            onClick={() => pickSize(idx)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
};

// 6. Raqamlarni o'rgan — Count 3D objects 1..10 and match 3D number block
export const GameP6LearnNumbers: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const [round, setRound] = useState(1);
  const maxRounds = 6;
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [targetNum, setTargetNum] = useState(3);
  const [choices, setChoices] = useState<number[]>([2, 3, 4, 5]);
  const stageRef = useRef<ThreeStageContext | null>(null);
  const starsRef = useRef<THREE.Group[]>([]);

  const setupRound = (r: number) => {
    const maxN = Math.min(10, 3 + r);
    const n = 1 + Math.floor(Math.random() * maxN);
    const opts = new Set<number>([n]);
    while (opts.size < 4) {
      opts.add(1 + Math.floor(Math.random() * 10));
    }
    setTargetNum(n);
    setChoices(shuffleArray(Array.from(opts)));
  };

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    setupRound(1);
    onLevelChange(1, maxRounds);
  }, [restartNonce, onLevelChange]);

  const answer = (val: number) => {
    setAttempts((a) => a + 1);
    if (val === targetNum) {
      const ns = score + 30;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(30, true, `Barakalla! Jami ${targetNum} ta yulduz bor!`);
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.3, 0));
      if (round >= maxRounds) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxRounds }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, maxRounds);
        setupRound(nr);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Sanash {round}/{maxRounds}</div>
        <div className="text-lg sm:text-xl font-bold text-white">
          Sahnada nechta 3D yulduzcha bor? Sanab, to‘g‘ri raqamni bosing!
        </div>
      </div>
      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`${round}-${targetNum}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            starsRef.current = [];
            const cols = Math.min(5, targetNum);
            for (let i = 0; i < targetNum; i++) {
              const row = Math.floor(i / 5);
              const col = i % 5;
              const rowCount = row === 0 ? cols : targetNum - 5;
              const x = (col - (rowCount - 1) / 2) * 1.45;
              const z = (row - (targetNum > 5 ? 0.5 : 0)) * 1.5;
              const star = buildShape3D('yulduz', 0xfacc15);
              star.scale.set(0.85, 0.85, 0.85);
              star.position.set(x, 0.25, z);
              ctx.scene.add(star);
              starsRef.current.push(star);
            }
          }}
          onFrame={(delta, elapsed) => {
            starsRef.current.forEach((s, i) => {
              s.rotation.y += delta * 1.1;
              s.position.y = 0.25 + Math.sin(elapsed * 2.5 + i * 0.6) * 0.1;
            });
          }}
        />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {choices.map((num) => (
          <button
            key={num}
            onClick={() => answer(num)}
            className="py-4 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 font-bold text-2xl font-mono-num text-white transition-colors cursor-pointer"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

// 7. Juftini top — Match identical 3D objects in pairs
export const GameP7FindPairs: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  type PairKind = 'mashina' | 'raketa' | 'toj' | 'soyabon';
  const defs: { kind: PairKind; label: string; hex: number }[] = useMemo(
    () => [
      { kind: 'mashina', label: 'Mashina', hex: 0xef4444 },
      { kind: 'raketa', label: 'Raketa', hex: 0x38bdf8 },
      { kind: 'toj', label: 'Toj', hex: 0xfacc15 },
      { kind: 'soyabon', label: 'Soyabon', hex: 0xa855f7 },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const maxLevels = 3;
  const [board, setBoard] = useState<{ uid: number; kind: PairKind; label: string; hex: number; matched: boolean }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);
  const meshesRef = useRef<THREE.Group[]>([]);

  const initLevel = (lvl: number) => {
    const pairCount = Math.min(4, lvl + 1);
    const chosen = defs.slice(0, pairCount);
    const items = shuffleArray([...chosen, ...chosen]).map((d, i) => ({
      uid: i,
      ...d,
      matched: false,
    }));
    setBoard(items);
    setSelectedIdx(null);
  };

  useEffect(() => {
    setLevel(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    initLevel(1);
    onLevelChange(1, maxLevels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

  const handleSelect = (idx: number) => {
    if (board[idx]?.matched) return;
    soundEngine.playClick();
    if (selectedIdx === null) {
      setSelectedIdx(idx);
      return;
    }
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      return;
    }

    setAttempts((a) => a + 1);
    const first = board[selectedIdx];
    const second = board[idx];
    if (first.kind === second.kind) {
      const updated = board.map((item, i) =>
        i === selectedIdx || i === idx ? { ...item, matched: true } : item
      );
      setBoard(updated);
      setSelectedIdx(null);
      const ns = score + 40;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(40, true, `Ajoyib! ${first.label} juftligi topildi!`);
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.2, 0));

      if (updated.every((u) => u.matched)) {
        if (level >= maxLevels) {
          setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxLevels }), 600);
        } else {
          const nl = level + 1;
          setTimeout(() => {
            setLevel(nl);
            onLevelChange(nl, maxLevels);
            initLevel(nl);
          }, 700);
        }
      }
    } else {
      setSelectedIdx(null);
      onAttempt(false, 'Bular har xil! Bir xil juftini toping.');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Bosqich {level}/{maxLevels}</div>
          <div className="text-lg font-bold text-white">Ikkita bir xil 3D o‘yinchoqni tanlang!</div>
        </div>
        {selectedIdx !== null && (
          <div className="text-sm font-semibold text-amber-400">
            Tanlandi: {board[selectedIdx].label} — juftini bosing
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="playground"
          setupKey={`${level}-${board.map((b) => (b.matched ? '1' : '0')).join('')}-${selectedIdx}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            meshesRef.current = [];
            const cols = board.length <= 4 ? 2 : board.length <= 6 ? 3 : 4;
            board.forEach((item, idx) => {
              const row = Math.floor(idx / cols);
              const col = idx % cols;
              const x = (col - (cols - 1) / 2) * 2.1;
              const z = (row - 0.5) * 2.0;

              const ped = buildPedestal3D(item.matched ? 0x22c55e : selectedIdx === idx ? 0xfacc15 : item.hex, 0.72, 0.25);
              ped.position.set(x, 0, z);
              ctx.scene.add(ped);

              if (!item.matched) {
                const toy = buildToyObject3D(item.kind, item.hex);
                toy.position.set(x, 0.3, z);
                ctx.scene.add(toy);
                meshesRef.current.push(toy);
                ctx.registerClickable(toy, `pair-${idx}`, () => handleSelect(idx));
                ctx.registerClickable(ped, `pair-ped-${idx}`, () => handleSelect(idx));
              } else {
                const tex = createCanvasLabelTexture('✓', { bg: '#15803d', fg: '#ffffff', maxAnisotropy: ctx.maxAnisotropy });
                const badge = new THREE.Mesh(
                  new THREE.BoxGeometry(0.5, 0.5, 0.1),
                  new THREE.MeshStandardMaterial({ map: tex })
                );
                badge.position.set(x, 0.65, z);
                ctx.scene.add(badge);
              }
            });
          }}
          onFrame={(delta) => {
            meshesRef.current.forEach((m) => {
              m.rotation.y += delta * 0.7;
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {board.map((item, idx) => (
          <button
            key={item.uid}
            disabled={item.matched}
            onClick={() => handleSelect(idx)}
            className={`py-3 rounded-xl border font-bold text-sm transition-colors cursor-pointer ${
              item.matched
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : selectedIdx === idx
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
            }`}
          >
            {item.matched ? `${item.label} ✓` : item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
