import React from 'react';
import { ActiveGameProps } from './shared/gameHelpers';
import {
  GameP1Colors,
  GameP2Shapes,
  GameP3AnimalSounds,
  GameP4SortFruits,
  GameP5CompareSizes,
  GameP6LearnNumbers,
  GameP7FindPairs,
} from './preschool/PreschoolGames';
import {
  GameP8MagicMaze,
  GameP9MemoryCards,
  GameP10ExploreSky,
  GameP11ChooseObject,
  GameP12ColorBuilder,
  GameP13CountSweets,
} from './preschool/PreschoolGamesPart2';
import {
  GameC1MathAdventure,
  GameC2LogicShapes,
  GameC3MemoryMaster,
  GameC4WordFinder,
  GameC5NumberMaze,
  GameC6GeoBuilder,
  GameC7AnimalWorld,
} from './children/ChildrenGames';
import {
  GameC8FastMath,
  GameC9ColorSudoku,
  GameC10SpatialThinking,
  GameC11CodingAdventure,
  GameC12PuzzleWorld,
  GameC13TreasureHunter,
} from './children/ChildrenGamesPart2';
import {
  GameT1MathDuel,
  GameT2LogicCube3D,
  GameT3PhysicsLab,
  GameT4StrategicCity,
  GameT5CodingMission,
  GameT6MemoryRecord,
  GameT7CipherMessage,
} from './teens/TeensGames';
import {
  GameT8GeoDiscovery,
  GameT9RobotControl,
  GameT10SpatialConstructor,
  GameT11LogicDetective,
  GameT12FastDecision,
  GameT13GalaxyStrategy,
} from './teens/TeensGamesPart2';
import {
  GameA1IQChallenge,
  GameA2ComplexSudoku,
  GameA3ChessStrategy,
  GameA4RubikCube3D,
  GameA5AlgorithmMaster,
  GameA6MathArena,
  GameA7CryptographyLab,
} from './youngAdults/YoungAdultsGames';
import {
  GameA8PhysicsSimulator,
  GameA9StrategicEmpire,
  GameA10MemoryLab,
  GameA11SpatialEngineer,
  GameA12DetectivePro,
  GameA13AILogicArena,
} from './youngAdults/YoungAdultsGamesPart2';

export function renderGameById(gameId: string, props: ActiveGameProps): React.ReactNode {
  const key = `${gameId}-${props.restartNonce}`;
  switch (gameId) {
    // 3-5 yosh (13 games)
    case 'p1-ranglarni-top':
      return <GameP1Colors key={key} {...props} />;
    case 'p2-shakllar-olami':
      return <GameP2Shapes key={key} {...props} />;
    case 'p3-hayvonlar-ovozi':
      return <GameP3AnimalSounds key={key} {...props} />;
    case 'p4-mevalarni-sarala':
      return <GameP4SortFruits key={key} {...props} />;
    case 'p5-katta-yoki-kichik':
      return <GameP5CompareSizes key={key} {...props} />;
    case 'p6-raqamlarni-organ':
      return <GameP6LearnNumbers key={key} {...props} />;
    case 'p7-juftini-top':
      return <GameP7FindPairs key={key} {...props} />;
    case 'p8-sehrli-labirint':
      return <GameP8MagicMaze key={key} {...props} />;
    case 'p9-xotira-kartalari':
      return <GameP9MemoryCards key={key} {...props} />;
    case 'p10-osmonni-organ':
      return <GameP10ExploreSky key={key} {...props} />;
    case 'p11-togri-predmetni-tanla':
      return <GameP11ChooseObject key={key} {...props} />;
    case 'p12-rangli-konstruktor':
      return <GameP12ColorBuilder key={key} {...props} />;
    case 'p13-shirinliklarni-sanash':
      return <GameP13CountSweets key={key} {...props} />;

    // 6-9 yosh (13 games)
    case 'c1-matematik-sarguzasht':
      return <GameC1MathAdventure key={key} {...props} />;
    case 'c2-mantiqiy-shakllar':
      return <GameC2LogicShapes key={key} {...props} />;
    case 'c3-xotira-ustasi':
      return <GameC3MemoryMaster key={key} {...props} />;
    case 'c4-soz-topuvchi':
      return <GameC4WordFinder key={key} {...props} />;
    case 'c5-raqamli-labirint':
      return <GameC5NumberMaze key={key} {...props} />;
    case 'c6-geometrik-quruvchi':
      return <GameC6GeoBuilder key={key} {...props} />;
    case 'c7-hayvonot-olami':
      return <GameC7AnimalWorld key={key} {...props} />;
    case 'c8-tezkor-hisob':
      return <GameC8FastMath key={key} {...props} />;
    case 'c9-rangli-sudoku':
      return <GameC9ColorSudoku key={key} {...props} />;
    case 'c10-fazoviy-fikrlash':
      return <GameC10SpatialThinking key={key} {...props} />;
    case 'c11-kodlash-sarguzashti':
      return <GameC11CodingAdventure key={key} {...props} />;
    case 'c12-puzzle-dunyosi':
      return <GameC12PuzzleWorld key={key} {...props} />;
    case 'c13-xazina-izlovchi':
      return <GameC13TreasureHunter key={key} {...props} />;

    // 10-15 yosh (13 games)
    case 't1-matematik-duel':
      return <GameT1MathDuel key={key} {...props} />;
    case 't2-3d-mantiqiy-kub':
      return <GameT2LogicCube3D key={key} {...props} />;
    case 't3-fizika-laboratoriyasi':
      return <GameT3PhysicsLab key={key} {...props} />;
    case 't4-strategik-shahar':
      return <GameT4StrategicCity key={key} {...props} />;
    case 't5-kodlash-missiyasi':
      return <GameT5CodingMission key={key} {...props} />;
    case 't6-xotira-rekordi':
      return <GameT6MemoryRecord key={key} {...props} />;
    case 't7-shifrlangan-xabar':
      return <GameT7CipherMessage key={key} {...props} />;
    case 't8-geometrik-kashfiyot':
      return <GameT8GeoDiscovery key={key} {...props} />;
    case 't9-robot-boshqaruvi':
      return <GameT9RobotControl key={key} {...props} />;
    case 't10-fazoviy-konstruktor':
      return <GameT10SpatialConstructor key={key} {...props} />;
    case 't11-mantiqiy-detektiv':
      return <GameT11LogicDetective key={key} {...props} />;
    case 't12-tezkor-qaror':
      return <GameT12FastDecision key={key} {...props} />;
    case 't13-galaktika-strategiyasi':
      return <GameT13GalaxyStrategy key={key} {...props} />;

    // 16-20 yosh (13 games)
    case 'a1-iq-challenge':
      return <GameA1IQChallenge key={key} {...props} />;
    case 'a2-murakkab-sudoku':
      return <GameA2ComplexSudoku key={key} {...props} />;
    case 'a3-shaxmat-strategiyasi':
      return <GameA3ChessStrategy key={key} {...props} />;
    case 'a4-3d-rubik-kubi':
      return <GameA4RubikCube3D key={key} {...props} />;
    case 'a5-algoritm-ustasi':
      return <GameA5AlgorithmMaster key={key} {...props} />;
    case 'a6-matematik-arena':
      return <GameA6MathArena key={key} {...props} />;
    case 'a7-kriptografiya-laboratoriyasi':
      return <GameA7CryptographyLab key={key} {...props} />;
    case 'a8-fizika-simulyatori':
      return <GameA8PhysicsSimulator key={key} {...props} />;
    case 'a9-strategik-imperiya':
      return <GameA9StrategicEmpire key={key} {...props} />;
    case 'a10-xotira-laboratoriyasi':
      return <GameA10MemoryLab key={key} {...props} />;
    case 'a11-fazoviy-muhandis':
      return <GameA11SpatialEngineer key={key} {...props} />;
    case 'a12-mantiqiy-detektiv-pro':
      return <GameA12DetectivePro key={key} {...props} />;
    case 'a13-ai-logic-arena':
    default:
      return <GameA13AILogicArena key={key} {...props} />;
  }
}
