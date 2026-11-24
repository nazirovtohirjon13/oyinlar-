import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeGameStage, ThreeStageContext } from '../shared/ThreeGameStage';
import { buildPedestal3D, buildShape3D } from '../shared/models3d';
import { ActiveGameProps, pickCorrectMessage, pickTryAgainMessage, shuffleArray } from '../shared/gameHelpers';
import { createCanvasLabelTexture } from '../../components/three/threeUtils';
import { soundEngine } from '../../utils/sound';

// 8. Fizika simulyatori — Orbital Mechanics & Gravitational Calibration
export const GameA8PhysicsSimulator: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const levels = useMemo(
    () => [
      { targetRadius: 2.8, optimalSpeed: 6.2, planetMass: 'Yer (1.0 M)' },
      { targetRadius: 3.4, optimalSpeed: 7.4, planetMass: 'Super-Yer (1.4 M)' },
      { targetRadius: 2.2, optimalSpeed: 5.0, planetMass: 'Mars (0.6 M)' },
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [orbitalSpeed, setOrbitalSpeed] = useState(4.5);
  const [testing, setTesting] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const satRef = useRef<THREE.Mesh | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = levels[level - 1];

  useEffect(() => {
    setLevel(1);
    setOrbitalSpeed(4.5);
    setTesting(false);
    setScore(0);
    setAttempts(0);
    onLevelChange(1, levels.length);
  }, [restartNonce, levels.length, onLevelChange]);

  const testOrbit = () => {
    if (testing) return;
    setTesting(true);
    setAttempts((a) => a + 1);
    soundEngine.playLaunch();

    setTimeout(() => {
      setTesting(false);
      const diff = Math.abs(orbitalSpeed - cur.optimalSpeed);
      if (diff <= 0.45) {
        const ns = score + 70;
        setScore(ns);
        onScore(70, true, `Barakalla! Barqaror orbita ta’minlandi (${orbitalSpeed.toFixed(1)} km/s)!`);
        stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.4, 0));
        if (level >= levels.length) {
          setTimeout(() => onComplete({ score: ns, correctCount: levels.length, totalQuestions: attempts + 1, levelReached: levels.length }), 600);
        } else {
          const nl = level + 1;
          setLevel(nl);
          onLevelChange(nl, levels.length);
        }
      } else if (orbitalSpeed < cur.optimalSpeed) {
        onAttempt(false, 'Tezlik past! Sun’iy yo‘ldosh sayyoraga qulaydi. Tezlikni oshiring!');
      } else {
        onAttempt(false, 'Tezlik juda yuqori! Yo‘ldosh orbitadan chiqib ketadi. Tezlikni kamaytiring!');
      }
    }, 900);
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-emerald-400">Orbita {level}/{levels.length} · {cur.planetMass}</div>
          <div className="text-lg font-bold text-white">
            Yo‘ldoshni <span className="font-mono-num text-cyan-400">r = {cur.targetRadius}</span> halqa orbitasiga barqaror chiqaring!
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="arena"
          cameraPosition={[0, 6.2, 6.2]}
          setupKey={`orb-${level}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const planet = new THREE.Mesh(
              new THREE.SphereGeometry(0.95, 24, 24),
              new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.2 })
            );
            planet.position.y = 1.0;
            ctx.scene.add(planet);

            const ring = new THREE.Mesh(
              new THREE.TorusGeometry(cur.targetRadius, 0.04, 10, 48),
              new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6 })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 1.0;
            ctx.scene.add(ring);

            const sat = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.24, 0),
              new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.5 })
            );
            sat.position.set(cur.targetRadius, 1.0, 0);
            ctx.scene.add(sat);
            satRef.current = sat;
          }}
          onFrame={(_, elapsed) => {
            if (satRef.current) {
              const speedFactor = orbitalSpeed * 0.32;
              const radiusDrift = (orbitalSpeed - cur.optimalSpeed) * 0.35;
              const r = Math.max(1.2, cur.targetRadius + radiusDrift);
              satRef.current.position.x = Math.cos(elapsed * speedFactor) * r;
              satRef.current.position.z = Math.sin(elapsed * speedFactor) * r;
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-300 flex justify-between mb-1">
            <span>Orbital tezlik (v)</span>
            <span className="font-mono-num text-emerald-400">{orbitalSpeed.toFixed(1)} km/s</span>
          </label>
          <input
            type="range"
            min={3.0}
            max={9.5}
            step={0.1}
            value={orbitalSpeed}
            onChange={(e) => setOrbitalSpeed(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>
        <button
          disabled={testing}
          onClick={testOrbit}
          className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold cursor-pointer"
        >
          {testing ? 'Sinovdan o‘tmoqda...' : 'Orbitani sinash'}
        </button>
      </div>
    </div>
  );
};

// 9. Strategik imperiya — Turn-based 3D Civilization Management
export const GameA9StrategicEmpire: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const [epoch, setEpoch] = useState(1);
  const maxEpochs = 6;
  const [res, setRes] = useState({ resurs: 45, fan: 35, mudofaa: 35, diplomatiya: 40 });
  const [score, setScore] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setEpoch(1);
    setRes({ resurs: 45, fan: 35, mudofaa: 35, diplomatiya: 40 });
    setScore(0);
    onLevelChange(1, maxEpochs);
  }, [restartNonce, onLevelChange]);

  const act = (choice: 'iqtisod' | 'akademiya' | 'armiya' | 'ittifoq') => {
    soundEngine.playClick();
    let next = { ...res };
    if (choice === 'iqtisod') {
      next.resurs += 22;
      next.mudofaa -= 5;
    } else if (choice === 'akademiya') {
      next.fan += 22;
      next.resurs -= 8;
    } else if (choice === 'armiya') {
      next.mudofaa += 20;
      next.resurs -= 10;
    } else {
      next.diplomatiya += 20;
      next.fan += 5;
      next.resurs -= 5;
    }

    if (next.resurs <= 5 || next.mudofaa <= 5) {
      onAttempt(false, 'Imperiya resursi yoki mudofaasi juda pasayib ketdi! Muvozanatni saqlang.');
      return;
    }

    setRes(next);
    const ns = score + 35;
    setScore(ns);
    onScore(35, true, `${epoch}-davr qarori muvaffaqiyatli amalga oshirildi!`);
    stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));

    if (epoch >= maxEpochs) {
      const totalStat = next.resurs + next.fan + next.mudofaa + next.diplomatiya;
      setTimeout(
        () =>
          onComplete({
            score: ns + Math.round(totalStat / 2),
            correctCount: maxEpochs,
            totalQuestions: maxEpochs,
            levelReached: maxEpochs,
          }),
        600
      );
    } else {
      const ne = epoch + 1;
      setEpoch(ne);
      onLevelChange(ne, maxEpochs);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-amber-400">Davr {epoch}/{maxEpochs}</div>
          <div className="text-base font-bold text-white">Imperiya ko‘rsatkichlarini muvozanatda rivojlantiring</div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-num">
          <span className="text-amber-400">Resurs: {res.resurs}</span>
          <span className="text-cyan-400">Ilm-fan: {res.fan}</span>
          <span className="text-rose-400">Mudofaa: {res.mudofaa}</span>
          <span className="text-emerald-400">Diplomatiya: {res.diplomatiya}</span>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="arena"
          cameraPosition={[4.6, 4.8, 5.2]}
          setupKey={`emp-${epoch}-${res.resurs}-${res.fan}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const pillars = [
              { val: res.resurs, x: -2.1, hex: 0xeab308 },
              { val: res.fan, x: -0.7, hex: 0x06b6d4 },
              { val: res.mudofaa, x: 0.7, hex: 0xef4444 },
              { val: res.diplomatiya, x: 2.1, hex: 0x10b981 },
            ];
            pillars.forEach((p) => {
              const ped = buildPedestal3D(p.hex, 0.58, 0.2);
              ped.position.set(p.x, 0, 0);
              ctx.scene.add(ped);
              const h = Math.max(0.4, (p.val / 100) * 2.5);
              const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(0.32, 0.4, h, 8),
                new THREE.MeshStandardMaterial({ color: p.hex, roughness: 0.25, metalness: 0.6 })
              );
              tower.position.set(p.x, 0.2 + h / 2, 0);
              tower.castShadow = true;
              ctx.scene.add(tower);
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => act('iqtisod')} className="p-3 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 text-left cursor-pointer">
          <div className="font-bold text-sm text-amber-400">Savdo va Iqtisod</div>
          <div className="text-xs text-slate-400">+22 Resurs, -5 Mudofaa</div>
        </button>
        <button onClick={() => act('akademiya')} className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 text-left cursor-pointer">
          <div className="font-bold text-sm text-cyan-400">Ilmiy Akademiya</div>
          <div className="text-xs text-slate-400">+22 Ilm-fan, -8 Resurs</div>
        </button>
        <button onClick={() => act('armiya')} className="p-3 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-400 text-left cursor-pointer">
          <div className="font-bold text-sm text-rose-400">Qal’a va Mudofaa</div>
          <div className="text-xs text-slate-400">+20 Mudofaa, -10 Resurs</div>
        </button>
        <button onClick={() => act('ittifoq')} className="p-3 rounded-xl bg-slate-900 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-400 text-left cursor-pointer">
          <div className="font-bold text-sm text-emerald-400">Tinchlik Ittifoqi</div>
          <div className="text-xs text-slate-400">+20 Diplomatiya, +5 Fan</div>
        </button>
      </div>
    </div>
  );
};

// 10. Xotira laboratoriyasi — 2-Back 3D Spatial Working Memory
export const GameA10MemoryLab: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const sequence = useMemo(() => [0, 2, 0, 1, 2, 1, 3, 2], []);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setStep(0);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, sequence.length);
  }, [restartNonce, sequence.length, onLevelChange]);

  const activeCell = sequence[step];
  const isTwoBackMatch = step >= 2 && sequence[step] === sequence[step - 2];

  const respond = (claimsMatch: boolean) => {
    if (step < 2) {
      soundEngine.playClick();
      const ns = step + 1;
      setStep(ns);
      onLevelChange(ns + 1, sequence.length);
      return;
    }

    setAttempts((a) => a + 1);
    const ok = claimsMatch === isTwoBackMatch;
    if (ok) {
      const nScore = score + 35;
      const nCorr = corrects + 1;
      setScore(nScore);
      setCorrects(nCorr);
      onScore(35, true, pickCorrectMessage(step));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.4, 0));
      if (step + 1 >= sequence.length) {
        setTimeout(() => onComplete({ score: nScore, correctCount: nCorr, totalQuestions: attempts + 1, levelReached: sequence.length }), 600);
        return;
      }
    } else {
      onAttempt(false, '2 qadam oldingi pozitsiyani eslab ko‘ring!');
      if (step + 1 >= sequence.length) {
        setTimeout(() => onComplete({ score, correctCount: corrects, totalQuestions: attempts + 1, levelReached: sequence.length }), 600);
        return;
      }
    }
    const ns = step + 1;
    setStep(ns);
    onLevelChange(ns + 1, sequence.length);
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-pink-400">2-Back N-qadam Xotira · Qadam {step + 1}/{sequence.length}</div>
          <div className="text-base sm:text-lg font-bold text-white">
            {step < 2
              ? `Pozitsiyani eslab qoling (#${activeCell + 1}) va "Keyingi"ni bosing`
              : `Joriy pozitsiya (#${activeCell + 1}) 2 qadam oldingisi bilan bir xilmi?`}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="arena"
          cameraPosition={[0, 5.2, 5.2]}
          setupKey={`nb-${step}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let i = 0; i < 4; i++) {
              const r = Math.floor(i / 2);
              const c = i % 2;
              const x = (c - 0.5) * 2.1;
              const z = (r - 0.5) * 2.1;
              const lit = i === activeCell;
              const tile = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, lit ? 0.55 : 0.2, 1.5),
                new THREE.MeshStandardMaterial({
                  color: lit ? 0xec4899 : 0x1e293b,
                  emissive: lit ? 0xbe185d : 0x000000,
                  emissiveIntensity: 0.8,
                })
              );
              tile.position.set(x, lit ? 0.28 : 0.1, z);
              ctx.scene.add(tile);
            }
          }}
        />
      </div>

      {step < 2 ? (
        <button onClick={() => respond(false)} className="py-4 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold text-lg cursor-pointer">
          Keyingi qadam →
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => respond(true)} className="py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-lg text-white cursor-pointer">
            Ha, 2 qadam oldingi bilan bir xil
          </button>
          <button onClick={() => respond(false)} className="py-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-lg text-white border border-slate-700 cursor-pointer">
            Yo‘q, boshqa pozitsiya
          </button>
        </div>
      )}
    </div>
  );
};

// 11. Fazoviy muhandis — 3D Structural Torque & Center-of-Mass Bridge Balance
export const GameA11SpatialEngineer: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const puzzles = useMemo(
    () => [
      { leftMass: 12, leftDist: 2, rightMass: 8, targetDist: 3 }, // 12*2 = 8*3
      { leftMass: 15, leftDist: 2, rightMass: 10, targetDist: 3 }, // 30 = 10*3
      { leftMass: 10, leftDist: 4, rightMass: 20, targetDist: 2 }, // 40 = 20*2
    ],
    []
  );

  const [level, setLevel] = useState(1);
  const [rightDist, setRightDist] = useState(1);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const beamRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = puzzles[level - 1];
  const leftTorque = cur.leftMass * cur.leftDist;
  const rightTorque = cur.rightMass * rightDist;

  useEffect(() => {
    setLevel(1);
    setRightDist(1);
    setScore(0);
    setAttempts(0);
    onLevelChange(1, puzzles.length);
  }, [restartNonce, puzzles.length, onLevelChange]);

  const checkBalance = () => {
    setAttempts((a) => a + 1);
    if (leftTorque === rightTorque) {
      const ns = score + 65;
      setScore(ns);
      onScore(65, true, `Barakalla! Muvozanat momenti teng: ${leftTorque} N·m = ${rightTorque} N·m!`);
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.8, 0));
      if (level >= puzzles.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: puzzles.length, totalQuestions: attempts + 1, levelReached: puzzles.length }), 600);
      } else {
        const nl = level + 1;
        setLevel(nl);
        setRightDist(1);
        onLevelChange(nl, puzzles.length);
      }
    } else {
      onAttempt(false, `Momentlar teng emas (${leftTorque} ≠ ${rightTorque})! Masofani o‘zgartiring.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-sky-400">Statika {level}/{puzzles.length} · M = F × d</div>
          <div className="text-base sm:text-lg font-bold text-white">
            Chapda: {cur.leftMass} kg ({cur.leftDist} m) · O‘ngda: {cur.rightMass} kg ({rightDist} m)
          </div>
        </div>
        <div className="font-mono-num text-sm text-amber-400">
          {leftTorque} N·m vs {rightTorque} N·m
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="arena"
          setupKey={`eng-${level}-${rightDist}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const fulcrum = new THREE.Mesh(
              new THREE.ConeGeometry(0.55, 1.0, 4),
              new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 })
            );
            fulcrum.rotation.y = Math.PI / 4;
            fulcrum.position.y = 0.5;
            ctx.scene.add(fulcrum);

            const beamGroup = new THREE.Group();
            const beam = new THREE.Mesh(
              new THREE.BoxGeometry(7.2, 0.2, 0.7),
              new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.6, roughness: 0.25 })
            );
            beamGroup.add(beam);

            const leftWeight = new THREE.Mesh(
              new THREE.BoxGeometry(0.75, 0.65, 0.65),
              new THREE.MeshStandardMaterial({ color: 0xf59e0b })
            );
            leftWeight.position.set(-cur.leftDist * 0.8, 0.42, 0);
            beamGroup.add(leftWeight);

            const rightWeight = new THREE.Mesh(
              new THREE.BoxGeometry(0.75, 0.65, 0.65),
              new THREE.MeshStandardMaterial({ color: 0x10b981 })
            );
            rightWeight.position.set(rightDist * 0.8, 0.42, 0);
            beamGroup.add(rightWeight);

            beamGroup.position.y = 1.05;
            ctx.scene.add(beamGroup);
            beamRef.current = beamGroup;
          }}
          onFrame={(delta) => {
            if (beamRef.current) {
              const tilt = THREE.MathUtils.clamp((leftTorque - rightTorque) * 0.015, -0.35, 0.35);
              beamRef.current.rotation.z = THREE.MathUtils.damp(beamRef.current.rotation.z, tilt, 8, delta);
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {[1, 2, 3, 4].map((d) => (
          <button
            key={d}
            onClick={() => { soundEngine.playClick(); setRightDist(d); }}
            className={`px-5 py-3 rounded-xl border font-mono-num font-bold cursor-pointer ${
              rightDist === d ? 'bg-sky-500 text-slate-950 border-sky-300' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
            }`}
          >
            {d} metr
          </button>
        ))}
        <button onClick={checkBalance} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer">
          Muvozanatni tekshirish
        </button>
      </div>
    </div>
  );
};

// 12. Mantiqiy detektiv PRO — Einstein-Zebra Multi-Variable Investigation
export const GameA12DetectivePro: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const cases = useMemo(
    () => [
      {
        title: "3 ta olim — Temur, Lola va Aziz — Fizika, Kimyo va Biologiya laboratoriyalarida ishlaydi. Kim Kimyo laboratoriyasida ishlaydi?",
        clues: [
          "1. Temur Fizika laboratoriyasida ham, Kimyo laboratoriyasida ham ishlamaydi.",
          "2. Lola Fizika laboratoriyasida ishlamaydi.",
          "3. Har bir olim faqat bitta laboratoriyada ishlaydi.",
        ],
        opts: ['Lola', 'Temur', 'Aziz'],
        ans: 'Lola',
      },
      {
        title: "4 ta server (A, B, C, D) ketma-ket ulangan. Qaysi serverda xavfsizlik kaliti saqlanadi?",
        clues: [
          "1. Kalit A dan o‘ngda, lekin D dan chapda.",
          "2. B serveri faqat zaxira nusxa saqlaydi (kalitsiz).",
          "3. Kalit eng chetdagi serverlarda emas.",
        ],
        opts: ['C serveri', 'B serveri', 'A serveri', 'D serveri'],
        ans: 'C serveri',
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

  const choose = (val: string) => {
    setAttempts((a) => a + 1);
    if (val === cur.ans) {
      const ns = score + 75;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(75, true, 'Barakalla! Mantiqiy zanjir to‘liq yechildi!');
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.4, 0));
      if (round >= cases.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: cases.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, cases.length);
      }
    } else {
      onAttempt(false, 'Shartlarni istisno usuli bilan qayta tekshiring!');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-rose-400 mb-1">Tergov PRO {round}/{cases.length}</div>
        <div className="text-base sm:text-lg font-bold text-white mb-2">{cur.title}</div>
        <div className="space-y-1 text-sm text-slate-300">
          {cur.clues.map((c) => <div key={c}>{c}</div>)}
        </div>
      </div>

      <div className="flex-1 min-h-[240px]">
        <ThreeGameStage
          theme="arena"
          setupKey={`dpro-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            cur.opts.forEach((opt, idx) => {
              const x = (idx - (cur.opts.length - 1) / 2) * 2.2;
              const ped = buildPedestal3D(0xf43f5e, 0.72, 0.25);
              ped.position.set(x, 0, 0);
              ctx.scene.add(ped);
              const tex = createCanvasLabelTexture(opt, {
                bg: '#111827',
                fg: '#fda4af',
                border: '#f43f5e',
                fontSize: opt.length > 5 ? 42 : 68,
                maxAnisotropy: ctx.maxAnisotropy,
              });
              const box = new THREE.Mesh(
                new THREE.BoxGeometry(1.0, 1.0, 1.0),
                new THREE.MeshStandardMaterial({ map: tex })
              );
              box.position.set(x, 0.85, 0);
              ctx.scene.add(box);
              ctx.registerClickable(box, opt, () => choose(opt));
            });
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cur.opts.map((o) => (
          <button
            key={o}
            onClick={() => choose(o)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-rose-600 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

// 13. AI Logic Arena — Adaptive Formal Logic, Syllogisms & Probability
export const GameA13AILogicArena: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const tiers = useMemo(
    () => [
      {
        diff: 1,
        q: 'Sillogizm: Barcha neyron tarmoqlar algoritmdir. Ba’zi algoritmlar tezdir. Qaysi xulosa albatta TO‘G‘RI?',
        opts: [
          'Barcha neyron tarmoqlar tezdir (albatta emas)',
          'Ba’zi algoritmlar neyron tarmoqlardir',
          'Hech bir algoritm neyron tarmoq emas',
        ],
        ans: 'Ba’zi algoritmlar neyron tarmoqlardir',
      },
      {
        diff: 2,
        q: 'Predikat mantiq: Agar (P = True, Q = False) bo‘lsa, (P ∧ ¬Q) → Q ifodasining qiymati nima?',
        opts: ['False (Yolg‘on)', 'True (Rost)', 'Aniqlab bo‘lmaydi'],
        ans: 'False (Yolg‘on)',
      },
      {
        diff: 3,
        q: 'Ehtimollar nazariyasi: Ikkita halol tanga bir vaqtda tashlanganda kamida bitta gerb tushish ehtimoli?',
        opts: ['1/2 (50%)', '3/4 (75%)', '1/4 (25%)'],
        ans: '3/4 (75%)',
      },
      {
        diff: 4,
        q: 'De Morgan qonuni: ¬(A ∨ B) mantiqiy ifodasi qaysi ifodaga teng kuchli?',
        opts: ['¬A ∧ ¬B', '¬A ∨ ¬B', 'A ∧ B'],
        ans: '¬A ∧ ¬B',
      },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const coreRef = useRef<THREE.Group | null>(null);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = tiers[round - 1];

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, tiers.length);
  }, [restartNonce, tiers.length, onLevelChange]);

  const choose = (val: string) => {
    setAttempts((a) => a + 1);
    if (val === cur.ans) {
      const ns = score + 65 + round * 10;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(65 + round * 10, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
      if (round >= tiers.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: tiers.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, tiers.length);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-teal-400">AI Moslashuvchan Daraja {cur.diff}/{tiers.length}</div>
        <div className="text-base sm:text-lg font-bold text-white">{cur.q}</div>
      </div>

      <div className="flex-1 min-h-[240px]">
        <ThreeGameStage
          theme="arena"
          setupKey={`ai-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const grp = new THREE.Group();
            const inner = buildShape3D('yulduz', 0x2dd4bf);
            inner.position.y = 0.8;
            grp.add(inner);
            const ring = new THREE.Mesh(
              new THREE.TorusGeometry(1.1 + round * 0.15, 0.04, 12, 40),
              new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
            );
            ring.position.y = 1.2;
            grp.add(ring);
            ctx.scene.add(grp);
            coreRef.current = grp;
          }}
          onFrame={(delta) => {
            if (coreRef.current) coreRef.current.rotation.y += delta * (0.5 + round * 0.2);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shuffleArray(cur.opts).map((o) => (
          <button
            key={o}
            onClick={() => choose(o)}
            className="py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-teal-500 hover:text-slate-950 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};
