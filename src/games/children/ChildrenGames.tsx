import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeGameStage, ThreeStageContext } from '../shared/ThreeGameStage';
import { buildAnimal3D, buildPedestal3D, buildRobot3D, buildShape3D } from '../shared/models3d';
import { ActiveGameProps, pickCorrectMessage, pickTryAgainMessage, shuffleArray } from '../shared/gameHelpers';
import { createCanvasLabelTexture } from '../../components/three/threeUtils';
import { soundEngine } from '../../utils/sound';

// 1. Matematik sarguzasht — Cross 3D island stepping stones by solving addition/subtraction
export const GameC1MathAdventure: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const totalSteps = 6;
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [question, setQuestion] = useState({ text: '7 + 5 = ?', answer: 12, options: [11, 12, 13, 14] });
  const robotRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const genQuestion = (s: number) => {
    const isAdd = Math.random() > 0.4;
    const maxN = 10 + s * 6;
    let a = 3 + Math.floor(Math.random() * maxN);
    let b = 2 + Math.floor(Math.random() * (maxN - 2));
    if (!isAdd && a < b) [a, b] = [b, a];
    const ans = isAdd ? a + b : a - b;
    const opts = new Set<number>([ans]);
    while (opts.size < 4) {
      const delta = (Math.floor(Math.random() * 7) - 3) || 1;
      if (ans + delta >= 0) opts.add(ans + delta);
    }
    setQuestion({
      text: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
      answer: ans,
      options: shuffleArray(Array.from(opts)),
    });
  };

  useEffect(() => {
    setStep(0);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    genQuestion(0);
    onLevelChange(1, totalSteps);
  }, [restartNonce, onLevelChange]);

  const answer = (val: number) => {
    setAttempts((a) => a + 1);
    if (val === question.answer) {
      const ns = score + 35;
      const nc = corrects + 1;
      const nextStep = step + 1;
      setScore(ns);
      setCorrects(nc);
      setStep(nextStep);
      onScore(35, true, pickCorrectMessage(nextStep));
      stageRef.current?.triggerBurst(new THREE.Vector3((nextStep - 3) * 1.3, 1.1, 0));

      if (nextStep >= totalSteps) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: totalSteps }), 600);
      } else {
        onLevelChange(nextStep + 1, totalSteps);
        genQuestion(nextStep);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Ko‘prik qadami {Math.min(step + 1, totalSteps)}/{totalSteps}</div>
          <div className="text-2xl font-bold font-mono-num text-cyan-400">{question.text}</div>
        </div>
        <div className="text-sm text-slate-300">To‘g‘ri javobni tanlab robotni marra tomon yuriting</div>
      </div>
      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="island"
          cameraPosition={[0, 4.6, 8.2]}
          setupKey={`c1-${step}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let i = 0; i <= totalSteps; i++) {
              const x = (i - totalSteps / 2) * 1.35;
              const stone = new THREE.Mesh(
                new THREE.CylinderGeometry(0.55, 0.62, 0.35, 16),
                new THREE.MeshStandardMaterial({
                  color: i === totalSteps ? 0xfacc15 : i <= step ? 0x06b6d4 : 0x334155,
                  roughness: 0.4,
                })
              );
              stone.position.set(x, 0.175, 0);
              stone.receiveShadow = true;
              ctx.scene.add(stone);
            }
            const flag = buildShape3D('yulduz', 0xfacc15);
            flag.scale.set(0.7, 0.7, 0.7);
            flag.position.set((totalSteps / 2) * 1.35, 0.38, 0);
            ctx.scene.add(flag);

            const robot = buildRobot3D(0x06b6d4);
            robot.scale.set(0.8, 0.8, 0.8);
            robot.rotation.y = Math.PI / 2;
            robot.position.set((step - totalSteps / 2) * 1.35, 0.36, 0);
            ctx.scene.add(robot);
            robotRef.current = robot;
          }}
          onFrame={(delta) => {
            if (robotRef.current) {
              const tx = (step - totalSteps / 2) * 1.35;
              robotRef.current.position.x = THREE.MathUtils.damp(robotRef.current.position.x, tx, 8, delta);
            }
          }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {question.options.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="py-4 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 font-bold text-2xl font-mono-num text-white transition-colors cursor-pointer"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

// 2. Mantiqiy shakllar — Complete 3D shape sequences
export const GameC2LogicShapes: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  type ShapeType = 'kub' | 'shar' | 'konus' | 'piramida' | 'silindr';
  const shapeMeta: Record<ShapeType, { label: string; color: number }> = useMemo(
    () => ({
      kub: { label: 'Kub', color: 0x3b82f6 },
      shar: { label: 'Shar', color: 0xf59e0b },
      konus: { label: 'Konus', color: 0x10b981 },
      piramida: { label: 'Piramida', color: 0xa855f7 },
      silindr: { label: 'Silindr', color: 0xef4444 },
    }),
    []
  );

  const puzzles = useMemo(
    () => [
      { seq: ['kub', 'shar', 'kub', 'shar'] as ShapeType[], answer: 'kub' as ShapeType, opts: ['kub', 'shar', 'konus'] as ShapeType[] },
      { seq: ['konus', 'konus', 'shar', 'konus', 'konus'] as ShapeType[], answer: 'shar' as ShapeType, opts: ['kub', 'shar', 'konus'] as ShapeType[] },
      { seq: ['kub', 'piramida', 'silindr', 'kub', 'piramida'] as ShapeType[], answer: 'silindr' as ShapeType, opts: ['silindr', 'kub', 'piramida'] as ShapeType[] },
      { seq: ['shar', 'konus', 'piramida', 'shar', 'konus'] as ShapeType[], answer: 'piramida' as ShapeType, opts: ['piramida', 'shar', 'kub'] as ShapeType[] },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);
  const meshesRef = useRef<THREE.Group[]>([]);

  const cur = puzzles[round - 1];

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, puzzles.length);
  }, [restartNonce, puzzles.length, onLevelChange]);

  const choose = (ans: ShapeType) => {
    setAttempts((a) => a + 1);
    if (ans === cur.answer) {
      const ns = score + 40;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(40, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(2.5, 1.3, 0));
      if (round >= puzzles.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: puzzles.length }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, puzzles.length);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Ketma-ketlik {round}/{puzzles.length}</div>
        <div className="text-lg font-bold text-white">Qonuniyatni toping: so‘roq o‘rniga qaysi 3D shakl keladi?</div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="island"
          cameraPosition={[0, 4.4, 8.6]}
          setupKey={`seq-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            meshesRef.current = [];
            const total = cur.seq.length + 1;
            cur.seq.forEach((sType, idx) => {
              const x = (idx - (total - 1) / 2) * 1.45;
              const ped = buildPedestal3D(shapeMeta[sType].color, 0.55, 0.24);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const sh = buildShape3D(sType, shapeMeta[sType].color);
              sh.scale.set(0.72, 0.72, 0.72);
              sh.position.set(x, 0.28, 0);
              ctx.scene.add(sh);
              meshesRef.current.push(sh);
            });
            // Question mark pedestal at the end
            const qx = ((total - 1) - (total - 1) / 2) * 1.45;
            const qPed = buildPedestal3D(0xfacc15, 0.58, 0.24);
            qPed.position.set(qx, 0, 0);
            ctx.scene.add(qPed);
            const qTex = createCanvasLabelTexture('?', { bg: '#0f172a', fg: '#facc15', border: '#facc15', maxAnisotropy: ctx.maxAnisotropy });
            const qBox = new THREE.Mesh(
              new THREE.BoxGeometry(0.65, 0.65, 0.65),
              new THREE.MeshStandardMaterial({ map: qTex })
            );
            qBox.position.set(qx, 0.65, 0);
            ctx.scene.add(qBox);
          }}
          onFrame={(delta) => {
            meshesRef.current.forEach((m) => {
              m.rotation.y += delta * 0.75;
            });
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cur.opts.map((opt) => (
          <button
            key={opt}
            onClick={() => choose(opt)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {shapeMeta[opt].label}
          </button>
        ))}
      </div>
    </div>
  );
};

// 3. Xotira ustasi — 3D Crystal Simon-says sequence memory
export const GameC3MemoryMaster: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const crystals = useMemo(
    () => [
      { id: 0, name: 'Moviy', hex: 0x06b6d4, css: '#06B6D4', freq: 392 },
      { id: 1, name: 'Oltin', hex: 0xf59e0b, css: '#F59E0B', freq: 440 },
      { id: 2, name: 'Zumrad', hex: 0x10b981, css: '#10B981', freq: 523.25 },
      { id: 3, name: 'Yoqut', hex: 0xec4899, css: '#EC4899', freq: 659.25 },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const maxLevels = 4;
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [showing, setShowing] = useState(true);
  const [litIdx, setLitIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const crystalMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const playSequence = (seq: number[]) => {
    setShowing(true);
    setUserStep(0);
    seq.forEach((cid, i) => {
      setTimeout(() => {
        setLitIdx(cid);
        soundEngine.playNote(crystals[cid].freq, 0.25);
        setTimeout(() => setLitIdx(null), 380);
      }, 500 + i * 620);
    });
    setTimeout(() => {
      setShowing(false);
    }, 550 + seq.length * 620);
  };

  const startLevel = (lvl: number) => {
    const len = lvl + 2;
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
    setSequence(seq);
    playSequence(seq);
  };

  useEffect(() => {
    setLevel(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, maxLevels);
    startLevel(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

  const handleCrystalClick = (id: number) => {
    if (showing) return;
    soundEngine.playNote(crystals[id].freq, 0.18);
    setLitIdx(id);
    setTimeout(() => setLitIdx(null), 220);

    if (id === sequence[userStep]) {
      const nextStep = userStep + 1;
      setUserStep(nextStep);
      if (nextStep >= sequence.length) {
        setAttempts((a) => a + 1);
        const ns = score + 45;
        const nc = corrects + 1;
        setScore(ns);
        setCorrects(nc);
        onScore(45, true, 'Barakalla! Ketma-ketlikni aniq eslab qoldingiz!');
        stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
        if (level >= maxLevels) {
          setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: maxLevels }), 650);
        } else {
          const nl = level + 1;
          setLevel(nl);
          onLevelChange(nl, maxLevels);
          setTimeout(() => startLevel(nl), 800);
        }
      }
    } else {
      setAttempts((a) => a + 1);
      onAttempt(false, "Adashdingiz! Tartibni qayta ko'rsatamiz.");
      setTimeout(() => playSequence(sequence), 650);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Bosqich {level}/{maxLevels} · Uzunlik: {sequence.length}</div>
          <div className="text-lg font-bold text-white">
            {showing ? 'Diqqat bilan kuzating...' : `Endi takrorlang (${userStep}/${sequence.length})`}
          </div>
        </div>
        <button
          disabled={showing}
          onClick={() => playSequence(sequence)}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200 cursor-pointer"
        >
          Qayta ko‘rish
        </button>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="island"
          setupKey={`memc-${level}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            crystalMats.current = [];
            crystals.forEach((c, idx) => {
              const x = (idx - 1.5) * 2.15;
              const ped = buildPedestal3D(c.hex, 0.72, 0.28);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);

              const mat = new THREE.MeshStandardMaterial({
                color: c.hex,
                roughness: 0.15,
                metalness: 0.35,
                emissive: c.hex,
                emissiveIntensity: 0.15,
              });
              crystalMats.current.push(mat);
              const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), mat);
              gem.position.set(x, 0.98, 0);
              gem.castShadow = true;
              ctx.scene.add(gem);
              ctx.registerClickable(gem, `crys-${c.id}`, () => handleCrystalClick(c.id));
            });
          }}
          onFrame={(delta) => {
            crystalMats.current.forEach((m, idx) => {
              const targetEmissive = litIdx === idx ? 1.8 : 0.15;
              m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, targetEmissive, 14, delta);
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {crystals.map((c) => (
          <button
            key={c.id}
            disabled={showing}
            onClick={() => handleCrystalClick(c.id)}
            className={`py-3.5 rounded-xl border font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
              litIdx === c.id ? 'scale-105 border-white' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
            }`}
            style={litIdx === c.id ? { backgroundColor: c.css, color: '#0f172a' } : undefined}
          >
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.css }} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 4. So'z topuvchi — Build Uzbek words from 3D letter cubes
export const GameC4WordFinder: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const words = useMemo(
    () => [
      { word: 'KITOB', hint: "O'qish va bilim olish uchun sahifali manba." },
      { word: 'QUYOSH', hint: 'Osmonimizni yoritib turuvchi issiq yulduz.' },
      { word: 'MAKTAB', hint: "Bolalar ilm o'rganadigan maskan." },
      { word: 'VATAN', hint: "Tug'ilib o'sgan ona yurtimiz." },
      { word: 'OLMA', hint: 'Bog‘da o‘sadigan mazali qizil yoki yashil meva.' },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [typed, setTyped] = useState<string>('');
  const [letters, setLetters] = useState<{ uid: number; ch: string; used: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = words[round - 1];

  const setupWord = (r: number) => {
    const w = words[r - 1].word;
    const extra = ['A', 'R', 'N', 'L'];
    const pool = shuffleArray([...w.split(''), extra[r % extra.length], extra[(r + 1) % extra.length]]);
    setLetters(pool.map((ch, uid) => ({ uid, ch, used: false })));
    setTyped('');
  };

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    setupWord(1);
    onLevelChange(1, words.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

  const pickLetter = (uid: number) => {
    const item = letters.find((l) => l.uid === uid);
    if (!item || item.used) return;
    const expectedChar = cur.word[typed.length];
    if (item.ch === expectedChar) {
      soundEngine.playNote(480 + typed.length * 60);
      const nextTyped = typed + item.ch;
      setTyped(nextTyped);
      setLetters((prev) => prev.map((l) => (l.uid === uid ? { ...l, used: true } : l)));
      if (nextTyped === cur.word) {
        setAttempts((a) => a + 1);
        const ns = score + 45;
        const nc = corrects + 1;
        setScore(ns);
        setCorrects(nc);
        onScore(45, true, `Barakalla! "${cur.word}" so'zi tuzildi!`);
        stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.4, 0));
        if (round >= words.length) {
          setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: words.length }), 650);
        } else {
          const nr = round + 1;
          setTimeout(() => {
            setRound(nr);
            onLevelChange(nr, words.length);
            setupWord(nr);
          }, 700);
        }
      }
    } else {
      setAttempts((a) => a + 1);
      onAttempt(false, `Keyingi harf "${expectedChar}" bo'lishi kerak!`);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">So‘z {round}/{words.length}</div>
          <div className="text-base sm:text-lg font-bold text-white">{cur.hint}</div>
        </div>
        <div className="flex items-center gap-1.5 font-mono-num">
          {cur.word.split('').map((ch, i) => (
            <span
              key={i}
              className={`w-9 h-10 rounded-lg border flex items-center justify-center font-bold text-lg ${
                i < typed.length
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {i < typed.length ? ch : '_'}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="island"
          setupKey={`word-${round}-${typed}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const cols = Math.ceil(letters.length / 2);
            letters.forEach((l, idx) => {
              const row = Math.floor(idx / cols);
              const col = idx % cols;
              const x = (col - (cols - 1) / 2) * 1.6;
              const z = (row - 0.5) * 1.65;
              const tex = createCanvasLabelTexture(l.ch, {
                bg: l.used ? '#15803d' : '#0f172a',
                fg: l.used ? '#ffffff' : '#38bdf8',
                border: l.used ? '#22c55e' : '#0284c7',
                maxAnisotropy: ctx.maxAnisotropy,
              });
              const cube = new THREE.Mesh(
                new THREE.BoxGeometry(0.95, 0.95, 0.95),
                new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 })
              );
              cube.position.set(x, l.used ? 0.65 : 0.48, z);
              cube.castShadow = true;
              ctx.scene.add(cube);
              if (!l.used) {
                ctx.registerClickable(cube, `let-${l.uid}`, () => pickLetter(l.uid));
              }
            });
          }}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2.5">
        {letters.map((l) => (
          <button
            key={l.uid}
            disabled={l.used}
            onClick={() => pickLetter(l.uid)}
            className={`w-12 h-12 rounded-xl border font-bold text-xl cursor-pointer transition-colors ${
              l.used
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 opacity-50'
                : 'bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 border-slate-700 text-white'
            }`}
          >
            {l.ch}
          </button>
        ))}
      </div>
    </div>
  );
};

// 5. Raqamli labirint — Step only on numbers matching rule
export const GameC5NumberMaze: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const levels = useMemo(
    () => [
      {
        rule: 'Faqat JUFT sonlar (2 ga bo‘linadigan) orqali 20 ga yeting!',
        check: (n: number) => n % 2 === 0,
        grid: [
          [2, 4, 7, 9],
          [5, 6, 8, 11],
          [3, 13, 10, 14],
          [7, 15, 18, 20],
        ],
      },
      {
        rule: 'Faqat 3 ga bo‘linadigan sonlar orqali 24 ga yeting!',
        check: (n: number) => n % 3 === 0,
        grid: [
          [3, 6, 10, 14],
          [4, 9, 12, 17],
          [8, 11, 15, 18],
          [5, 19, 21, 24],
        ],
      },
      {
        rule: 'Faqat 5 ga karrali sonlar orqali 35 ga yeting!',
        check: (n: number) => n % 5 === 0,
        grid: [
          [5, 10, 12, 18],
          [7, 15, 20, 22],
          [9, 14, 25, 30],
          [11, 28, 31, 35],
        ],
      },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = levels[level - 1];

  useEffect(() => {
    setLevel(1);
    setPos({ r: 0, c: 0 });
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, levels.length);
  }, [restartNonce, levels.length, onLevelChange]);

  const tryStep = (r: number, c: number) => {
    const dist = Math.abs(r - pos.r) + Math.abs(c - pos.c);
    if (dist !== 1) return;
    setAttempts((a) => a + 1);
    const val = cur.grid[r][c];
    if (cur.check(val)) {
      soundEngine.playClick();
      setPos({ r, c });
      setCorrects((x) => x + 1);
      if (r === 3 && c === 3) {
        const ns = score + 60;
        setScore(ns);
        onScore(60, true, 'Barakalla! Raqamli labirintdan o‘tdingiz!');
        stageRef.current?.triggerBurst(new THREE.Vector3(2.2, 1.2, 2.2));
        if (level >= levels.length) {
          setTimeout(() => onComplete({ score: ns, correctCount: corrects + 1, totalQuestions: attempts + 1, levelReached: levels.length }), 600);
        } else {
          const nl = level + 1;
          setTimeout(() => {
            setLevel(nl);
            setPos({ r: 0, c: 0 });
            onLevelChange(nl, levels.length);
          }, 700);
        }
      }
    } else {
      onAttempt(false, `${val} soni qoidaga mos emas!`);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Bosqich {level}/{levels.length}</div>
        <div className="text-lg font-bold text-amber-400">{cur.rule}</div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="island"
          cameraPosition={[0, 6.4, 5.2]}
          setupKey={`nmaze-${level}-${pos.r}-${pos.c}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let r = 0; r < 4; r++) {
              for (let c = 0; c < 4; c++) {
                const x = (c - 1.5) * 1.4;
                const z = (r - 1.5) * 1.4;
                const isPlayer = r === pos.r && c === pos.c;
                const isGoal = r === 3 && c === 3;
                const isNeighbor = Math.abs(r - pos.r) + Math.abs(c - pos.c) === 1;
                const tex = createCanvasLabelTexture(String(cur.grid[r][c]), {
                  bg: isPlayer ? '#06b6d4' : isGoal ? '#eab308' : isNeighbor ? '#1e293b' : '#0f172a',
                  fg: isPlayer || isGoal ? '#0f172a' : '#f8fafc',
                  border: isNeighbor ? '#38bdf8' : '#334155',
                  maxAnisotropy: ctx.maxAnisotropy,
                });
                const tile = new THREE.Mesh(
                  new THREE.BoxGeometry(1.15, isPlayer ? 0.45 : 0.25, 1.15),
                  new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 })
                );
                tile.position.set(x, isPlayer ? 0.22 : 0.12, z);
                ctx.scene.add(tile);
                if (isNeighbor) {
                  ctx.registerClickable(tile, `nm-${r}-${c}`, () => tryStep(r, c));
                }
              }
            }
          }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto w-full">
        {cur.grid.flatMap((row, r) =>
          row.map((val, c) => {
            const isPlayer = r === pos.r && c === pos.c;
            const isNeighbor = Math.abs(r - pos.r) + Math.abs(c - pos.c) === 1;
            return (
              <button
                key={`${r}-${c}`}
                disabled={!isNeighbor}
                onClick={() => tryStep(r, c)}
                className={`py-2.5 rounded-lg border font-mono-num font-bold cursor-pointer ${
                  isPlayer
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                    : isNeighbor
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-sky-500/60'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
              >
                {val}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// 6. Geometrik quruvchi — Assemble 3D structure matching blueprint
export const GameC6GeoBuilder: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  type BlockKind = 'kub' | 'silindr' | 'konus';
  const blueprints = useMemo(
    () => [
      { title: 'Minora', target: ['kub', 'kub', 'konus'] as BlockKind[] },
      { title: 'Raketacha', target: ['silindr', 'silindr', 'konus'] as BlockKind[] },
      { title: 'Qal’a ustuni', target: ['kub', 'silindr', 'kub', 'konus'] as BlockKind[] },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [placed, setPlaced] = useState<BlockKind[]>([]);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = blueprints[level - 1];

  useEffect(() => {
    setLevel(1);
    setPlaced([]);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, blueprints.length);
  }, [restartNonce, blueprints.length, onLevelChange]);

  const place = (kind: BlockKind) => {
    if (placed.length >= cur.target.length) return;
    setAttempts((a) => a + 1);
    const expected = cur.target[placed.length];
    if (kind === expected) {
      const next = [...placed, kind];
      setPlaced(next);
      soundEngine.playNote(420 + next.length * 90);
      if (next.length === cur.target.length) {
        const ns = score + 50;
        const nc = corrects + 1;
        setScore(ns);
        setCorrects(nc);
        onScore(50, true, `Ajoyib! ${cur.title} qurildi!`);
        stageRef.current?.triggerBurst(new THREE.Vector3(1.6, 2.0, 0));
        if (level >= blueprints.length) {
          setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: blueprints.length }), 600);
        } else {
          const nl = level + 1;
          setTimeout(() => {
            setLevel(nl);
            setPlaced([]);
            onLevelChange(nl, blueprints.length);
          }, 700);
        }
      }
    } else {
      onAttempt(false, "Namuna bo'yicha keyingi geometrik qism boshqacha!");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Chizma {level}/{blueprints.length}: {cur.title}</div>
          <div className="text-lg font-bold text-white">Chapdagi namunani o‘ngda yig‘ing ({placed.length}/{cur.target.length})</div>
        </div>
      </div>

      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="island"
          setupKey={`gb-${level}-${placed.join(',')}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const buildTower = (items: BlockKind[], x: number, pedColor: number) => {
              const ped = buildPedestal3D(pedColor, 0.9, 0.25);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              items.forEach((b, idx) => {
                const m = buildShape3D(b, b === 'kub' ? 0x3b82f6 : b === 'silindr' ? 0x10b981 : 0xec4899);
                m.scale.set(0.85, 0.85, 0.85);
                m.position.set(x, 0.28 + idx * 0.72, 0);
                ctx.scene.add(m);
              });
            };
            buildTower(cur.target, -1.7, 0x64748b);
            buildTower(placed, 1.7, 0x06b6d4);
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => place('kub')} className="py-3.5 rounded-xl bg-slate-900 hover:bg-blue-600 border border-slate-700 font-bold text-white cursor-pointer">
          Kub qo‘yish
        </button>
        <button onClick={() => place('silindr')} className="py-3.5 rounded-xl bg-slate-900 hover:bg-emerald-600 border border-slate-700 font-bold text-white cursor-pointer">
          Silindr qo‘yish
        </button>
        <button onClick={() => place('konus')} className="py-3.5 rounded-xl bg-slate-900 hover:bg-pink-600 border border-slate-700 font-bold text-white cursor-pointer">
          Konus qo‘yish
        </button>
      </div>
    </div>
  );
};

// 7. Hayvonot olami — 3D Animal Encyclopedia Quiz
export const GameC7AnimalWorld: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const facts = useMemo(
    () => [
      {
        animal: 'arslon' as const,
        q: "Savannada yashaydigan bu hayvon nima bilan oziqlanadi?",
        opts: ['Faqat go‘sht bilan (yirtqich)', 'Faqat o‘t bilan', 'Faqat baliq bilan'],
        ans: 0,
      },
      {
        animal: 'sigir' as const,
        q: "Fermer xo‘jaligidagi bu uy hayvoni insonlarga nima beradi?",
        opts: ['Sut va qatiq', 'Asal', 'Ipak'],
        ans: 0,
      },
      {
        animal: 'ordak' as const,
        q: "Bu qush suvda yaxshi suzishi uchun oyoqlari qanday tuzilgan?",
        opts: ['Pardali oyoqlari bor', 'Toshdek og‘ir tirnog‘i bor', 'Oyoqlari yo‘q'],
        ans: 0,
      },
      {
        animal: 'qoy' as const,
        q: "Qishda issiq kiyimlar tikish uchun bu hayvondan nima olinadi?",
        opts: ['Yung (jun)', 'Pat', 'Tanga'],
        ans: 0,
      },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const animalRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = facts[round - 1];
  const shuffledOpts = useMemo(() => {
    const tagged = cur.opts.map((text, idx) => ({ text, isRight: idx === cur.ans }));
    return shuffleArray(tagged);
  }, [cur]);

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, facts.length);
  }, [restartNonce, facts.length, onLevelChange]);

  const answer = (isRight: boolean) => {
    setAttempts((a) => a + 1);
    if (isRight) {
      const ns = score + 40;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(40, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.4, 0));
      if (round >= facts.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: facts.length }), 550);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, facts.length);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">Savol {round}/{facts.length}</div>
        <div className="text-lg font-bold text-white">{cur.q}</div>
      </div>
      <div className="flex-1 min-h-[280px]">
        <ThreeGameStage
          theme="island"
          setupKey={`aw-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const ped = buildPedestal3D(0x22c55e, 1.05, 0.32);
            ctx.scene.add(ped);
            const anim = buildAnimal3D(cur.animal);
            anim.scale.set(1.5, 1.5, 1.5);
            anim.position.y = 0.35;
            ctx.scene.add(anim);
            animalRef.current = anim;
          }}
          onFrame={(delta) => {
            if (animalRef.current) animalRef.current.rotation.y += delta * 0.65;
          }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shuffledOpts.map((o) => (
          <button
            key={o.text}
            onClick={() => answer(o.isRight)}
            className="py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 border border-slate-700 font-semibold text-white cursor-pointer"
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
};
