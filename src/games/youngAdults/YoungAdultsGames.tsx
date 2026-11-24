import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeGameStage, ThreeStageContext } from '../shared/ThreeGameStage';
import { buildChessPiece3D, buildPedestal3D, buildShape3D } from '../shared/models3d';
import { ActiveGameProps, pickCorrectMessage, pickTryAgainMessage, shuffleArray } from '../shared/gameHelpers';
import { createCanvasLabelTexture } from '../../components/three/threeUtils';
import { soundEngine } from '../../utils/sound';

// 1. IQ Challenge — Progressive Raven-style Matrix & 3D Transform Logic
export const GameA1IQChallenge: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const puzzles = useMemo(
    () => [
      {
        title: 'Matritsa qonuniyati: har qatorda qirralar soni va burilish +90° ga oshadi',
        grid: ['●', '▲', '■', '▲', '■', '⬟', '■', '⬟', '?'],
        opts: [
          { label: '⬢ (Oltiburchak)', val: '⬢' },
          { label: '● (Doira)', val: '●' },
          { label: '▲ (Uchburchak)', val: '▲' },
        ],
        ans: '⬢',
      },
      {
        title: 'Sonli matritsa: ustunlar yig‘indisi o‘zgarmas (30)',
        grid: ['8', '12', '10', '14', '6', '10', '8', '12', '?'],
        opts: [
          { label: '10', val: '10' },
          { label: '14', val: '14' },
          { label: '12', val: '12' },
        ],
        ans: '10',
      },
      {
        title: 'Mantiqiy operator: (A × B) - A qoidasi bo‘yicha 3-qatorni toping',
        grid: ['3, 4 → 9', '5, 3 → 10', '6, 5 → ?'],
        opts: [
          { label: '24', val: '24' },
          { label: '25', val: '25' },
          { label: '30', val: '30' },
        ],
        ans: '24',
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
    if (val === cur.ans) {
      const ns = score + 65;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(65, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
      if (round >= puzzles.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: puzzles.length }), 600);
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
        <div className="text-xs text-amber-400">IQ Test {round}/{puzzles.length}</div>
        <div className="text-lg font-bold text-white">{cur.title}</div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="arena"
          cameraPosition={[0, 5.2, 5.8]}
          setupKey={`iq-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const cols = cur.grid.length === 9 ? 3 : 1;
            cur.grid.forEach((cell, idx) => {
              const r = Math.floor(idx / cols);
              const c = idx % cols;
              const x = cols === 3 ? (c - 1) * 1.6 : 0;
              const z = (r - (cur.grid.length / cols - 1) / 2) * 1.45;
              const isQ = cell.includes('?');
              const tex = createCanvasLabelTexture(cell, {
                bg: isQ ? '#422006' : '#0f172a',
                fg: isQ ? '#facc15' : '#e2e8f0',
                border: isQ ? '#eab308' : '#334155',
                fontSize: cell.length > 4 ? 36 : 95,
                maxAnisotropy: ctx.maxAnisotropy,
              });
              const box = new THREE.Mesh(
                new THREE.BoxGeometry(cols === 1 ? 3.8 : 1.35, 0.35, 1.2),
                new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 })
              );
              box.position.set(x, 0.25, z);
              ctx.scene.add(box);
            });
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shuffleArray(cur.opts).map((o) => (
          <button
            key={o.val}
            onClick={() => choose(o.val)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// 2. Murakkab sudoku — Full 9x9 Interactive Sudoku with 3D holographic board
export const GameA2ComplexSudoku: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const solution = useMemo(
    () => [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
    []
  );

  // Leave 12 strategic empty cells for satisfying 9x9 gameplay
  const initialBoard = useMemo(
    () => [
      [5, 3, 0, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 0, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 0, 6, 7],
      [8, 0, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 0, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 0, 6],
      [9, 6, 1, 5, 0, 7, 2, 8, 4],
      [2, 8, 0, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 0, 7, 9],
    ],
    []
  );

  const [board, setBoard] = useState<number[][]>(() => initialBoard.map((r) => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>([0, 2]);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    setBoard(initialBoard.map((r) => [...r]));
    setSelected([0, 2]);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, 1);
  }, [restartNonce, initialBoard, onLevelChange]);

  const enterNumber = (num: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (initialBoard[r][c] !== 0) return;
    setAttempts((a) => a + 1);
    if (solution[r][c] === num) {
      soundEngine.playSuccess();
      const next = board.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? num : v)));
      setBoard(next);
      setCorrects((x) => x + 1);
      onScore(25, true, `(${r + 1}, ${c + 1}) katak to‘ldirildi!`);
      stageRef.current?.triggerBurst(new THREE.Vector3((c - 4) * 0.7, 0.9, (r - 4) * 0.7));

      let nextEmpty: [number, number] | null = null;
      for (let rr = 0; rr < 9 && !nextEmpty; rr++) {
        for (let cc = 0; cc < 9; cc++) {
          if (next[rr][cc] === 0) {
            nextEmpty = [rr, cc];
            break;
          }
        }
      }
      setSelected(nextEmpty);
      if (!nextEmpty) {
        setTimeout(() => onComplete({ score: 250, correctCount: corrects + 1, totalQuestions: attempts + 1, levelReached: 1 }), 600);
      }
    } else {
      onAttempt(false, `${num} raqami ushbu qator, ustun yoki 3×3 blok qoidasiga zid!`);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex items-center justify-between">
        <div className="text-base sm:text-lg font-bold text-white">9×9 Sudoku: bo‘sh katakni tanlang va 1–9 raqamini kiriting</div>
        <div className="text-xs font-mono-num text-teal-400">
          Bo‘sh kataklar: {board.flat().filter((v) => v === 0).length}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[280px]">
        <div className="min-h-[240px]">
          <ThreeGameStage
            theme="arena"
            cameraPosition={[0, 7.6, 5.4]}
            setupKey={`sud9-${board.flat().join('')}-${selected?.join(',')}`}
            onSetup={(ctx) => {
              stageRef.current = ctx;
              for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                  const v = board[r][c];
                  const isSel = selected?.[0] === r && selected?.[1] === c;
                  const isFixed = initialBoard[r][c] !== 0;
                  const tex = createCanvasLabelTexture(v === 0 ? '' : String(v), {
                    bg: isSel ? '#eab308' : isFixed ? '#0f172a' : '#064e3b',
                    fg: isSel ? '#0f172a' : isFixed ? '#94a3b8' : '#34d399',
                    border: isSel ? '#fef08a' : '#334155',
                    size: 128,
                    maxAnisotropy: ctx.maxAnisotropy,
                  });
                  const tile = new THREE.Mesh(
                    new THREE.BoxGeometry(0.62, isSel ? 0.35 : 0.18, 0.62),
                    new THREE.MeshStandardMaterial({ map: tex })
                  );
                  tile.position.set((c - 4) * 0.68, isSel ? 0.18 : 0.09, (r - 4) * 0.68);
                  ctx.scene.add(tile);
                  if (!isFixed) {
                    ctx.registerClickable(tile, `s9-${r}-${c}`, () => setSelected([r, c]));
                  }
                }
              }
            }}
          />
        </div>

        <div className="flex flex-col justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="grid grid-cols-9 gap-1 max-w-sm mx-auto w-full">
            {board.map((row, r) =>
              row.map((v, c) => {
                const isSel = selected?.[0] === r && selected?.[1] === c;
                const isFixed = initialBoard[r][c] !== 0;
                const rightBorder = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-amber-500/40' : '';
                const botBorder = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-amber-500/40' : '';
                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={isFixed}
                    onClick={() => setSelected([r, c])}
                    className={`aspect-square rounded text-xs sm:text-sm font-mono-num font-bold border cursor-pointer ${rightBorder} ${botBorder} ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : isFixed
                        ? 'bg-slate-950 text-slate-400 border-slate-800'
                        : v > 0
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    }`}
                  >
                    {v === 0 ? '' : v}
                  </button>
                );
              })
            )}
          </div>
          <div className="grid grid-cols-9 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => enterNumber(n)}
                className="py-2.5 rounded-lg bg-slate-800 hover:bg-teal-500 hover:text-slate-950 border border-slate-700 font-mono-num font-bold text-white cursor-pointer"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Shaxmat strategiyasi — 3D Chess Tactical Puzzles (Mate-in-1)
export const GameA3ChessStrategy: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  type PieceSpec = { kind: 'shoh' | 'farzin' | 'rux' | 'fil' | 'ot' | 'piyoda'; white: boolean; r: number; c: number };
  const puzzles = useMemo(
    () => [
      {
        prompt: 'Oqlar yurishi (1 yurishda MOT): Oq Ruxni qayerga qo‘ysak Qora Shoh mot bo‘ladi?',
        pieces: [
          { kind: 'shoh', white: false, r: 0, c: 6 },
          { kind: 'piyoda', white: false, r: 1, c: 5 },
          { kind: 'piyoda', white: false, r: 1, c: 6 },
          { kind: 'piyoda', white: false, r: 1, c: 7 },
          { kind: 'rux', white: true, r: 3, c: 2 },
          { kind: 'shoh', white: true, r: 7, c: 6 },
        ] as PieceSpec[],
        opts: [
          { label: 'Rux → c8 (8-qatorga mot)', target: [0, 2] as [number, number], ok: true },
          { label: 'Rux → c7 (shohsiz)', target: [1, 2] as [number, number], ok: false },
          { label: 'Rux → g3', target: [5, 6] as [number, number], ok: false },
        ],
      },
      {
        prompt: 'Oqlar yurishi (1 yurishda MOT): Oq Farzin bilan mot hujumini tanlang!',
        pieces: [
          { kind: 'shoh', white: false, r: 0, c: 7 },
          { kind: 'piyoda', white: false, r: 1, c: 6 },
          { kind: 'piyoda', white: false, r: 1, c: 7 },
          { kind: 'farzin', white: true, r: 2, c: 4 },
          { kind: 'fil', white: true, r: 4, c: 4 },
          { kind: 'shoh', white: true, r: 7, c: 4 },
        ] as PieceSpec[],
        opts: [
          { label: 'Farzin → g7 (Fil himoyasida MOT)', target: [1, 6] as [number, number], ok: true },
          { label: 'Farzin → h6', target: [2, 7] as [number, number], ok: false },
          { label: 'Farzin → e8', target: [0, 4] as [number, number], ok: false },
        ],
      },
      {
        prompt: 'Taktik sanchqi (Vilka): Oq Ot bilan ham Shohga, ham Farzinga bir vaqtda hujum qiling!',
        pieces: [
          { kind: 'shoh', white: false, r: 0, c: 4 },
          { kind: 'farzin', white: false, r: 0, c: 6 },
          { kind: 'ot', white: true, r: 4, c: 4 },
          { kind: 'shoh', white: true, r: 7, c: 4 },
        ] as PieceSpec[],
        opts: [
          { label: 'Ot → f6 (Shoh va Farzinga sanchqi)', target: [2, 5] as [number, number], ok: true },
          { label: 'Ot → d6', target: [2, 3] as [number, number], ok: false },
          { label: 'Ot → g5', target: [3, 6] as [number, number], ok: false },
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

  const choose = (ok: boolean, target: [number, number]) => {
    setAttempts((a) => a + 1);
    if (ok) {
      const ns = score + 70;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(70, true, 'Ajoyib taktik yurish!');
      stageRef.current?.triggerBurst(new THREE.Vector3((target[1] - 3.5) * 0.85, 1.0, (target[0] - 3.5) * 0.85));
      if (round >= puzzles.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: puzzles.length }), 650);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, puzzles.length);
      }
    } else {
      onAttempt(false, 'Bu yurishda raqib qochib ketadi yoki mot bo‘lmaydi!');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-amber-400">Shaxmat etyudi {round}/{puzzles.length}</div>
        <div className="text-lg font-bold text-white">{cur.prompt}</div>
      </div>

      <div className="flex-1 min-h-[270px]">
        <ThreeGameStage
          theme="arena"
          cameraPosition={[0, 6.2, 6.2]}
          setupKey={`chess-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                const isLight = (r + c) % 2 === 0;
                const sq = new THREE.Mesh(
                  new THREE.BoxGeometry(0.84, 0.14, 0.84),
                  new THREE.MeshStandardMaterial({
                    color: isLight ? 0x475569 : 0x0f172a,
                    roughness: 0.45,
                    metalness: 0.25,
                  })
                );
                sq.position.set((c - 3.5) * 0.85, 0.07, (r - 3.5) * 0.85);
                sq.receiveShadow = true;
                ctx.scene.add(sq);
              }
            }
            cur.pieces.forEach((p) => {
              const mesh = buildChessPiece3D(p.kind, p.white);
              mesh.scale.set(0.78, 0.78, 0.78);
              mesh.position.set((p.c - 3.5) * 0.85, 0.14, (p.r - 3.5) * 0.85);
              ctx.scene.add(mesh);
            });
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shuffleArray(cur.opts).map((o) => (
          <button
            key={o.label}
            onClick={() => choose(o.ok, o.target)}
            className="py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 font-bold text-white cursor-pointer"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// 4. 3D Rubik kubi — Real interactive 3x3x3 3D Rubik's Cube with U/D/L/R/F/B rotations!
interface CubieState {
  id: number;
  x: number; // -1, 0, 1
  y: number;
  z: number;
  // Face colors: [+x, -x, +y, -y, +z, -z]
  colors: number[];
}

const FACE_COLORS = {
  px: 0xef4444, // Red
  nx: 0xf97316, // Orange
  py: 0xf8fafc, // White
  ny: 0xfacc15, // Yellow
  pz: 0x22c55e, // Green
  nz: 0x3b82f6, // Blue
  core: 0x0f172a,
};

function createSolvedCube(): CubieState[] {
  const list: CubieState[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        list.push({
          id: id++,
          x,
          y,
          z,
          colors: [
            x === 1 ? FACE_COLORS.px : FACE_COLORS.core,
            x === -1 ? FACE_COLORS.nx : FACE_COLORS.core,
            y === 1 ? FACE_COLORS.py : FACE_COLORS.core,
            y === -1 ? FACE_COLORS.ny : FACE_COLORS.core,
            z === 1 ? FACE_COLORS.pz : FACE_COLORS.core,
            z === -1 ? FACE_COLORS.nz : FACE_COLORS.core,
          ],
        });
      }
    }
  }
  return list;
}

function rotateFaceColors(c: number[], axis: 'x' | 'y' | 'z', dir: 1 | -1): number[] {
  // [px=0, nx=1, py=2, ny=3, pz=4, nz=5]
  const [px, nx, py, ny, pz, nz] = c;
  if (axis === 'y') {
    return dir === 1 ? [pz, nz, py, ny, nx, px] : [nz, pz, py, ny, px, nx];
  }
  if (axis === 'x') {
    return dir === 1 ? [px, nx, pz, nz, ny, py] : [px, nx, nz, pz, py, ny];
  }
  // axis === 'z'
  return dir === 1 ? [py, ny, nx, px, pz, nz] : [ny, py, px, nx, pz, nz];
}

function applyCubeMove(cubies: CubieState[], axis: 'x' | 'y' | 'z', layer: -1 | 1, dir: 1 | -1): CubieState[] {
  return cubies.map((cub) => {
    if (cub[axis] !== layer) return cub;
    let { x, y, z } = cub;
    if (axis === 'y') {
      const nx = dir === 1 ? z : -z;
      const nz = dir === 1 ? -x : x;
      x = nx;
      z = nz;
    } else if (axis === 'x') {
      const ny = dir === 1 ? -z : z;
      const nz = dir === 1 ? y : -y;
      y = ny;
      z = nz;
    } else {
      const nx = dir === 1 ? -y : y;
      const ny = dir === 1 ? x : -x;
      x = nx;
      y = ny;
    }
    return {
      ...cub,
      x,
      y,
      z,
      colors: rotateFaceColors(cub.colors, axis, dir),
    };
  });
}

function isCubeSolved(cubies: CubieState[]): boolean {
  const checkFace = (filterFn: (c: CubieState) => boolean, colorIdx: number) => {
    const faceCubies = cubies.filter(filterFn);
    const target = faceCubies[0]?.colors[colorIdx];
    return faceCubies.every((c) => c.colors[colorIdx] === target && target !== FACE_COLORS.core);
  };
  return (
    checkFace((c) => c.x === 1, 0) &&
    checkFace((c) => c.x === -1, 1) &&
    checkFace((c) => c.y === 1, 2) &&
    checkFace((c) => c.y === -1, 3) &&
    checkFace((c) => c.z === 1, 4) &&
    checkFace((c) => c.z === -1, 5)
  );
}

export const GameA4RubikCube3D: React.FC<ActiveGameProps> = ({
  onScore,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const scrambleMoves = useMemo(
    () => [
      { axis: 'y' as const, layer: 1 as const, dir: 1 as const, label: 'U' },
      { axis: 'x' as const, layer: 1 as const, dir: 1 as const, label: 'R' },
      { axis: 'z' as const, layer: 1 as const, dir: 1 as const, label: 'F' },
      { axis: 'y' as const, layer: -1 as const, dir: -1 as const, label: "D'" },
    ],
    []
  );

  const [cubies, setCubies] = useState<CubieState[]>(() => {
    let c = createSolvedCube();
    scrambleMoves.forEach((m) => {
      c = applyCubeMove(c, m.axis, m.layer, m.dir);
    });
    return c;
  });
  const [movesCount, setMovesCount] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  useEffect(() => {
    let c = createSolvedCube();
    scrambleMoves.forEach((m) => {
      c = applyCubeMove(c, m.axis, m.layer, m.dir);
    });
    setCubies(c);
    setMovesCount(0);
    onLevelChange(1, 1);
  }, [restartNonce, scrambleMoves, onLevelChange]);

  const doMove = (axis: 'x' | 'y' | 'z', layer: -1 | 1, dir: 1 | -1) => {
    soundEngine.playClick();
    const next = applyCubeMove(cubies, axis, layer, dir);
    const nm = movesCount + 1;
    setCubies(next);
    setMovesCount(nm);
    if (isCubeSolved(next)) {
      onScore(180, true, `Barakalla! Rubik kubini ${nm} yurishda yig‘dingiz!`);
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 2.2, 0));
      setTimeout(
        () =>
          onComplete({
            score: Math.max(100, 240 - nm * 8),
            correctCount: 1,
            totalQuestions: 1,
            levelReached: 1,
          }),
        650
      );
    }
  };

  const controlsList: { label: string; axis: 'x' | 'y' | 'z'; layer: -1 | 1; dir: 1 | -1 }[] = [
    { label: 'U (Tepa)', axis: 'y', layer: 1, dir: 1 },
    { label: "U'", axis: 'y', layer: 1, dir: -1 },
    { label: 'D (Past)', axis: 'y', layer: -1, dir: 1 },
    { label: "D'", axis: 'y', layer: -1, dir: -1 },
    { label: "R (O'ng)", axis: 'x', layer: 1, dir: 1 },
    { label: "R'", axis: 'x', layer: 1, dir: -1 },
    { label: 'L (Chap)', axis: 'x', layer: -1, dir: 1 },
    { label: "L'", axis: 'x', layer: -1, dir: -1 },
    { label: 'F (Old)', axis: 'z', layer: 1, dir: 1 },
    { label: "F'", axis: 'z', layer: 1, dir: -1 },
    { label: 'B (Orqa)', axis: 'z', layer: -1, dir: 1 },
    { label: "B'", axis: 'z', layer: -1, dir: -1 },
  ];

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs text-amber-400">3D Rubik Kubi · Yurishlar: {movesCount}</div>
          <div className="text-base font-bold text-white">Kubni aylantirib barcha 6 ta tomonni bir xil rangga keltiring (4 yurishli boshlang‘ich aralashtirish: U → R → F → D&apos;)</div>
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        <ThreeGameStage
          theme="arena"
          cameraPosition={[4.2, 3.8, 4.6]}
          cameraTarget={[0, 1.4, 0]}
          setupKey={`rubik-${movesCount}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const cubeGroup = new THREE.Group();
            cubies.forEach((cub) => {
              const mats = cub.colors.map(
                (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.22, metalness: 0.15 })
              );
              const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.68), mats);
              mesh.position.set(cub.x * 0.74, 1.4 + cub.y * 0.74, cub.z * 0.74);
              mesh.castShadow = true;
              cubeGroup.add(mesh);
            });
            ctx.scene.add(cubeGroup);
          }}
        />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {controlsList.map((btn) => (
          <button
            key={btn.label}
            onClick={() => doMove(btn.axis, btn.layer, btn.dir)}
            className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 font-mono-num font-bold text-xs sm:text-sm text-white cursor-pointer"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// 5. Algoritm ustasi — Binary Search, Sorting & Graph Algorithm Challenges
export const GameA5AlgorithmMaster: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const problems = useMemo(
    () => [
      {
        title: 'Binar qidiruv (Binary Search): [2, 5, 8, 12, 16, 23, 38] massividan 23 ni topish uchun 1-taqqoslanadigan o‘rta element qaysi?',
        arr: [2, 5, 8, 12, 16, 23, 38],
        opts: ['12', '16', '23', '8'],
        ans: '12',
      },
      {
        title: 'Asimptotik murakkablik: n ta elementli saralangan massivda Binar qidiruvning eng yomon holatdagi murakkabligi?',
        arr: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        opts: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'],
        ans: 'O(log n)',
      },
      {
        title: 'Pufakchali saralash (Bubble Sort): [5, 1, 4, 2] massivining birinchi to‘liq o‘tishidan keyingi holati?',
        arr: [5, 1, 4, 2],
        opts: ['[1, 4, 2, 5]', '[1, 2, 4, 5]', '[1, 5, 4, 2]', '[4, 1, 2, 5]'],
        ans: '[1, 4, 2, 5]',
      },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const stageRef = useRef<ThreeStageContext | null>(null);

  const cur = problems[round - 1];

  useEffect(() => {
    setRound(1);
    setScore(0);
    setCorrects(0);
    setAttempts(0);
    onLevelChange(1, problems.length);
  }, [restartNonce, problems.length, onLevelChange]);

  const choose = (val: string) => {
    setAttempts((a) => a + 1);
    if (val === cur.ans) {
      const ns = score + 65;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(65, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
      if (round >= problems.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: problems.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, problems.length);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-cyan-400">Algoritm tahlili {round}/{problems.length}</div>
        <div className="text-base sm:text-lg font-bold text-white">{cur.title}</div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="arena"
          setupKey={`alg-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            cur.arr.forEach((v, idx) => {
              const x = (idx - (cur.arr.length - 1) / 2) * 1.25;
              const h = typeof v === 'number' ? 0.35 + Math.min(2.2, v * 0.055) : 0.6 + idx * 0.4;
              const tex = createCanvasLabelTexture(String(v), {
                bg: '#0f172a',
                fg: '#38bdf8',
                border: '#0284c7',
                fontSize: String(v).length > 3 ? 42 : 95,
                maxAnisotropy: ctx.maxAnisotropy,
              });
              const col = new THREE.Mesh(
                new THREE.BoxGeometry(0.95, h, 0.95),
                new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 })
              );
              col.position.set(x, h / 2, 0);
              col.castShadow = true;
              ctx.scene.add(col);
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cur.opts.map((o) => (
          <button
            key={o}
            onClick={() => choose(o)}
            className="py-3.5 px-3 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 font-mono-num font-bold text-white cursor-pointer"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

// 6. Matematik arena — Advanced Calculus, Logarithms, Vectors & Combinatorics
export const GameA6MathArena: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const tasks = useMemo(
    () => [
      { q: 'f(x) = 3x² + 4x funksiyaning x = 2 nuqtadagi hosilasi f′(2) nechiga teng?', opts: ['12', '16', '20', '10'], ans: '16' },
      { q: 'log₂(32) + log₃(27) = ?', opts: ['7', '8', '9', '10'], ans: '8' },
      { q: 'a = (3, 4, 0) vektorning uzunligi |a| nechiga teng?', opts: ['5', '7', '12', '25'], ans: '5' },
      { q: 'C(6, 2) — 6 ta elementdan 2 tasini tanlash usullari soni:', opts: ['12', '15', '20', '30'], ans: '15' },
      { q: 'sin²(30°) + cos²(30°) + tg(45°) = ?', opts: ['1.5', '2', '2.5', '1'], ans: '2' },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const waveRef = useRef<THREE.Mesh[]>([]);
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
      const ns = score + 55;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(55, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
      if (round >= tasks.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: tasks.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, tasks.length);
      }
    } else {
      onAttempt(false, pickTryAgainMessage(attempts));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-sky-400">Oliy matematika {round}/{tasks.length}</div>
        <div className="text-lg font-bold text-white">{cur.q}</div>
      </div>
      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="arena"
          setupKey={`ma-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            waveRef.current = [];
            for (let x = -3; x <= 3; x++) {
              for (let z = -2; z <= 2; z++) {
                const bar = new THREE.Mesh(
                  new THREE.BoxGeometry(0.45, 0.8, 0.45),
                  new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.25, metalness: 0.6 })
                );
                bar.position.set(x * 0.85, 0.5, z * 0.85);
                ctx.scene.add(bar);
                waveRef.current.push(bar);
              }
            }
          }}
          onFrame={(_, elapsed) => {
            waveRef.current.forEach((b) => {
              const y = 0.65 + Math.sin(b.position.x * 0.9 + elapsed * 2) * Math.cos(b.position.z * 0.9 + elapsed) * 0.45;
              b.scale.y = Math.max(0.25, y);
              b.position.y = b.scale.y * 0.4;
            });
          }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cur.opts.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="py-3.5 rounded-xl bg-slate-900 hover:bg-blue-600 border border-slate-700 font-mono-num font-bold text-xl text-white cursor-pointer"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

// 7. Kriptografiya laboratoriyasi — Vigenere, XOR & Affine Encryption Puzzles
export const GameA7CryptographyLab: React.FC<ActiveGameProps> = ({
  onScore,
  onAttempt,
  onLevelChange,
  onComplete,
  restartNonce,
}) => {
  const puzzles = useMemo(
    () => [
      {
        title: 'XOR shifrlash: 10110 XOR 01101 ikkilik natijasini toping:',
        opts: ['11011', '10011', '01011', '11101'],
        ans: '11011',
      },
      {
        title: 'Vijener shifri (A=0, B=1...): "KOD" so‘zini "ABC" kaliti (+0, +1, +2) bilan shifrlang:',
        opts: ['KPF', 'KPE', 'LPF', 'KOE'],
        ans: 'KPF',
      },
      {
        title: 'Affin shifri E(x) = (3x + 1) mod 26: x = 4 (E harfi) qaysi indeksga o‘tadi?',
        opts: ['13 (N)', '11 (L)', '15 (P)', '9 (J)'],
        ans: '13 (N)',
      },
    ],
    []
  );

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const rotorRef = useRef<THREE.Group | null>(null);
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
    if (val === cur.ans) {
      const ns = score + 65;
      const nc = corrects + 1;
      setScore(ns);
      setCorrects(nc);
      onScore(65, true, pickCorrectMessage(round));
      stageRef.current?.triggerBurst(new THREE.Vector3(0, 1.5, 0));
      if (round >= puzzles.length) {
        setTimeout(() => onComplete({ score: ns, correctCount: nc, totalQuestions: attempts + 1, levelReached: puzzles.length }), 600);
      } else {
        const nr = round + 1;
        setRound(nr);
        onLevelChange(nr, puzzles.length);
      }
    } else {
      onAttempt(false, 'Formulani va mod arifmetikasini qayta tekshiring!');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-5 py-3">
        <div className="text-xs text-violet-400">Kriptotahlil {round}/{puzzles.length}</div>
        <div className="text-lg font-bold text-white">{cur.title}</div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ThreeGameStage
          theme="arena"
          setupKey={`cry-${round}`}
          onSetup={(ctx) => {
            stageRef.current = ctx;
            const drum = new THREE.Group();
            for (let i = 0; i < 3; i++) {
              const disc = new THREE.Mesh(
                new THREE.CylinderGeometry(1.1, 1.1, 0.55, 24),
                new THREE.MeshStandardMaterial({ color: [0x6366f1, 0x8b5cf6, 0xa855f7][i], metalness: 0.75, roughness: 0.2 })
              );
              disc.rotation.z = Math.PI / 2;
              disc.position.x = (i - 1) * 0.72;
              drum.add(disc);
            }
            drum.position.y = 1.3;
            ctx.scene.add(drum);
            rotorRef.current = drum;

            const ped = buildPedestal3D(0x8b5cf6, 1.4, 0.25);
            ctx.scene.add(ped);
          }}
          onFrame={(delta) => {
            if (rotorRef.current) {
              rotorRef.current.children.forEach((d, idx) => {
                d.rotation.x += delta * (0.6 + idx * 0.35);
              });
            }
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {shuffleArray(cur.opts).map((o) => (
          <button
            key={o}
            onClick={() => choose(o)}
            className="py-3.5 px-3 rounded-xl bg-slate-900 hover:bg-violet-600 border border-slate-700 font-mono-num font-bold text-white cursor-pointer"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};
