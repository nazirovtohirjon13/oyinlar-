import * as THREE from 'three';

function mat(color: number, roughness = 0.45, metalness = 0.1, emissive = 0x000000): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity: emissive ? 0.35 : 0,
  });
}

// Composite 3D Pedestal with trim ring and glowing indicator
export function buildPedestal3D(accentColor: number, radius = 0.72, height = 0.34): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.12, height, 24),
    mat(0x1e293b, 0.55, 0.3)
  );
  base.position.y = height / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.96, 0.04, 12, 32),
    mat(accentColor, 0.25, 0.65, accentColor)
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = height - 0.02;
  g.add(ring);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.86, radius * 0.86, 0.04, 24),
    mat(0x334155, 0.3, 0.5)
  );
  cap.position.y = height + 0.01;
  cap.receiveShadow = true;
  g.add(cap);

  return g;
}

// Composite 3-8 part 3D Animals (mushuk, kuchuk, sigir, qoy, ordak, arslon)
export function buildAnimal3D(kind: 'mushuk' | 'kuchuk' | 'sigir' | 'qoy' | 'ordak' | 'arslon'): THREE.Group {
  const g = new THREE.Group();
  const colors: Record<typeof kind, { body: number; accent: number }> = {
    mushuk: { body: 0xf97316, accent: 0xffedd5 },
    kuchuk: { body: 0xb45309, accent: 0xfef3c7 },
    sigir: { body: 0xf8fafc, accent: 0x1e293b },
    qoy: { body: 0xf1f5f9, accent: 0x334155 },
    ordak: { body: 0xfacc15, accent: 0xf97316 },
    arslon: { body: 0xd97706, accent: 0x92400e },
  };
  const pal = colors[kind];
  const bodyMat = mat(pal.body, 0.55, 0.05);
  const accentMat = mat(pal.accent, 0.7, 0.05);
  const eyeMat = mat(0x0f172a, 0.15, 0.2);

  // Body (bottom-center grounded)
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.36, 8, 16), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0.46, 0);
  body.castShadow = true;
  g.add(body);

  // 4 legs (or 2 for duck)
  if (kind === 'ordak') {
    [-0.14, 0.14].forEach((zOff) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 10), accentMat);
      leg.position.set(0, 0.13, zOff);
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.14), accentMat);
      foot.position.set(0.06, 0.02, zOff);
      g.add(foot);
    });
  } else {
    [
      [-0.22, -0.16],
      [-0.22, 0.16],
      [0.22, -0.16],
      [0.22, 0.16],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.32, 10), bodyMat);
      leg.position.set(x, 0.16, z);
      leg.castShadow = true;
      g.add(leg);
    });
  }

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 16), bodyMat);
  head.position.set(0.38, 0.72, 0);
  head.castShadow = true;
  g.add(head);

  // Eyes
  [-0.11, 0.11].forEach((zOff) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), eyeMat);
    eye.position.set(0.6, 0.78, zOff);
    g.add(eye);
  });

  // Distinct species features
  if (kind === 'mushuk') {
    [-0.14, 0.14].forEach((zOff) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 4), bodyMat);
      ear.position.set(0.38, 0.98, zOff);
      g.add(ear);
    });
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), bodyMat);
    tail.rotation.z = -0.7;
    tail.position.set(-0.46, 0.65, 0);
    g.add(tail);
  } else if (kind === 'kuchuk') {
    [-0.22, 0.22].forEach((zOff) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.08), accentMat);
      ear.position.set(0.34, 0.7, zOff);
      g.add(ear);
    });
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.16), accentMat);
    snout.position.set(0.63, 0.67, 0);
    g.add(snout);
  } else if (kind === 'sigir') {
    [-0.15, 0.15].forEach((zOff) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 8), mat(0xfde68a, 0.3, 0.2));
      horn.position.set(0.36, 0.98, zOff);
      g.add(horn);
    });
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), accentMat);
    spot.position.set(-0.08, 0.56, 0.2);
    g.add(spot);
  } else if (kind === 'qoy') {
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), bodyMat);
      puff.position.set(-0.2 + i * 0.13, 0.62, i % 2 === 0 ? 0.14 : -0.14);
      g.add(puff);
    }
    head.material = accentMat;
  } else if (kind === 'ordak') {
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 6), accentMat);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.7, 0.68, 0);
    g.add(beak);
    [-0.3, 0.3].forEach((zOff) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.06), bodyMat);
      wing.position.set(0, 0.5, zOff);
      g.add(wing);
    });
  } else if (kind === 'arslon') {
    const mane = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.12, 10, 18), accentMat);
    mane.rotation.y = Math.PI / 2;
    mane.position.set(0.35, 0.72, 0);
    g.add(mane);
  }

  return g;
}

// Composite 3D Fruits
export function buildFruit3D(fruit: 'olma' | 'banan' | 'uzum' | 'apelsin' | 'nok'): THREE.Group {
  const g = new THREE.Group();
  const leafMat = mat(0x22c55e, 0.5, 0.05);
  const stemMat = mat(0x78350f, 0.8, 0.0);

  if (fruit === 'olma') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 20), mat(0xef4444, 0.3, 0.08));
    body.scale.set(1, 0.92, 1);
    body.position.y = 0.36;
    body.castShadow = true;
    g.add(body);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.18, 8), stemMat);
    stem.position.y = 0.74;
    g.add(stem);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.1), leafMat);
    leaf.rotation.z = 0.4;
    leaf.position.set(0.1, 0.78, 0);
    g.add(leaf);
  } else if (fruit === 'banan') {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.35, 0.25, 0),
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(0.38, 0.42, 0)
    );
    const banana = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.11, 10, false), mat(0xfacc15, 0.4, 0.05));
    banana.position.y = 0.15;
    banana.castShadow = true;
    g.add(banana);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.1, 8), stemMat);
    tip.position.set(0.39, 0.58, 0);
    g.add(tip);
  } else if (fruit === 'uzum') {
    const grapeMat = mat(0x9333ea, 0.25, 0.1);
    const coords = [
      [0, 0.22, 0],
      [-0.14, 0.4, 0.08],
      [0.14, 0.4, 0.08],
      [0, 0.42, -0.14],
      [-0.16, 0.6, -0.05],
      [0.16, 0.6, -0.05],
      [0, 0.62, 0.15],
    ];
    coords.forEach(([x, y, z]) => {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), grapeMat);
      berry.position.set(x, y, z);
      berry.castShadow = true;
      g.add(berry);
    });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), stemMat);
    stem.position.y = 0.82;
    g.add(stem);
  } else if (fruit === 'apelsin') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 20), mat(0xf97316, 0.45, 0.05));
    body.position.y = 0.38;
    body.castShadow = true;
    g.add(body);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), leafMat);
    leaf.scale.set(1.6, 0.3, 0.8);
    leaf.position.set(0.1, 0.77, 0);
    g.add(leaf);
  } else {
    // nok (pear)
    const pearMat = mat(0x84cc16, 0.35, 0.05);
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), pearMat);
    bot.position.y = 0.32;
    bot.castShadow = true;
    g.add(bot);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16), pearMat);
    top.position.y = 0.62;
    top.castShadow = true;
    g.add(top);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), stemMat);
    stem.position.y = 0.88;
    g.add(stem);
  }
  return g;
}

// Composite Geometric 3D Shapes with beveled/ring accents
export function buildShape3D(
  shape: 'kub' | 'shar' | 'konus' | 'silindr' | 'piramida' | 'yulduz',
  colorHex: number
): THREE.Group {
  const g = new THREE.Group();
  const mainMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.25,
    metalness: 0.15,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
  });
  const trimMat = mat(0xf8fafc, 0.2, 0.6);

  let core: THREE.Mesh;
  if (shape === 'kub') {
    core = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mainMat);
    core.position.y = 0.35;
  } else if (shape === 'shar') {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), mainMat);
    core.position.y = 0.42;
  } else if (shape === 'konus') {
    core = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.85, 24), mainMat);
    core.position.y = 0.425;
  } else if (shape === 'silindr') {
    core = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.78, 24), mainMat);
    core.position.y = 0.39;
  } else if (shape === 'piramida') {
    core = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.82, 4), mainMat);
    core.rotation.y = Math.PI / 4;
    core.position.y = 0.41;
  } else {
    // yulduz (5-point extruded star)
    const starShape = new THREE.Shape();
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? 0.46 : 0.2;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const extrude = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    extrude.center();
    core = new THREE.Mesh(extrude, mainMat);
    core.position.y = 0.48;
  }
  core.castShadow = true;
  core.receiveShadow = true;
  g.add(core);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.025, 10, 32), trimMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.04;
  g.add(halo);

  return g;
}

// Composite 3D Toys & Everyday Objects
export function buildToyObject3D(kind: 'mashina' | 'raketa' | 'soyabon' | 'kitob' | 'toj' | 'samolyot', colorHex = 0x3b82f6): THREE.Group {
  const g = new THREE.Group();
  const primary = mat(colorHex, 0.3, 0.25);
  const metal = mat(0xe2e8f0, 0.2, 0.8);
  const dark = mat(0x0f172a, 0.6, 0.2);

  if (kind === 'mashina') {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.48), primary);
    chassis.position.y = 0.24;
    chassis.castShadow = true;
    g.add(chassis);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.42), metal);
    cabin.position.set(-0.05, 0.46, 0);
    g.add(cabin);
    [
      [-0.28, -0.26],
      [-0.28, 0.26],
      [0.28, -0.26],
      [0.28, 0.26],
    ].forEach(([x, z]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 16), dark);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.13, z);
      g.add(wheel);
    });
  } else if (kind === 'raketa') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.68, 16), metal);
    body.position.y = 0.45;
    body.castShadow = true;
    g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.32, 16), primary);
    nose.position.y = 0.95;
    g.add(nose);
    const windowMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), mat(0x38bdf8, 0.1, 0.2, 0x0284c7));
    windowMesh.rotation.z = Math.PI / 2;
    windowMesh.position.set(0.2, 0.56, 0);
    g.add(windowMesh);
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.05), primary);
      const a = (i * Math.PI * 2) / 3;
      fin.position.set(Math.cos(a) * 0.26, 0.2, Math.sin(a) * 0.26);
      fin.rotation.y = -a;
      g.add(fin);
    }
  } else if (kind === 'soyabon') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 10), dark);
    handle.position.y = 0.36;
    g.add(handle);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.32, 12), primary);
    canopy.position.y = 0.72;
    canopy.castShadow = true;
    g.add(canopy);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), metal);
    tip.position.y = 0.9;
    g.add(tip);
  } else if (kind === 'kitob') {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.8), primary);
    cover.position.y = 0.07;
    cover.castShadow = true;
    g.add(cover);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.74), mat(0xf8fafc, 0.8, 0.0));
    pages.position.set(0.03, 0.07, 0);
    g.add(pages);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.81), mat(0xfacc15, 0.3, 0.6));
    stripe.position.set(-0.18, 0.07, 0);
    g.add(stripe);
  } else if (kind === 'toj') {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.22, 18), mat(0xfacc15, 0.2, 0.85));
    band.position.y = 0.14;
    band.castShadow = true;
    g.add(band);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 6), mat(0xfacc15, 0.2, 0.85));
      spike.position.set(Math.cos(a) * 0.28, 0.36, Math.sin(a) * 0.28);
      g.add(spike);
    }
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), mat(0xef4444, 0.1, 0.3, 0xef4444));
    gem.position.set(0, 0.16, 0.33);
    g.add(gem);
  } else {
    // samolyot
    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.65, 8, 12), primary);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.position.y = 0.35;
    fuselage.castShadow = true;
    g.add(fuselage);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.96), metal);
    wing.position.set(0.05, 0.35, 0);
    g.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.05), primary);
    tail.position.set(-0.36, 0.48, 0);
    g.add(tail);
  }
  return g;
}

// Composite 3D Explorer Robot
export function buildRobot3D(accentHex = 0x06b6d4): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(0xe2e8f0, 0.3, 0.55);
  const accentMat = mat(accentHex, 0.25, 0.4, accentHex);
  const visorMat = mat(0x0f172a, 0.1, 0.8);

  const treads = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.58), mat(0x334155, 0.6, 0.3));
  treads.position.y = 0.09;
  treads.castShadow = true;
  g.add(treads);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.42), bodyMat);
  torso.position.y = 0.38;
  torso.castShadow = true;
  g.add(torso);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), accentMat);
  chest.rotation.x = Math.PI / 2;
  chest.position.set(0, 0.4, 0.21);
  g.add(chest);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.34), bodyMat);
  head.position.y = 0.74;
  head.castShadow = true;
  g.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), visorMat);
  visor.position.set(0, 0.74, 0.17);
  g.add(visor);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), bodyMat);
  antenna.position.y = 0.96;
  g.add(antenna);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), accentMat);
  bulb.position.y = 1.06;
  g.add(bulb);

  return g;
}

// Composite 3D Chess Pieces
export function buildChessPiece3D(
  piece: 'shoh' | 'farzin' | 'rux' | 'fil' | 'ot' | 'piyoda',
  isWhite: boolean
): THREE.Group {
  const g = new THREE.Group();
  const pieceMat = isWhite
    ? mat(0xfbbf24, 0.22, 0.85)
    : mat(0x334155, 0.35, 0.65);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 20), pieceMat);
  base.position.y = 0.06;
  base.castShadow = true;
  g.add(base);

  const h = piece === 'shoh' ? 0.88 : piece === 'farzin' ? 0.8 : piece === 'piyoda' ? 0.45 : 0.65;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, h, 18), pieceMat);
  stem.position.y = 0.12 + h / 2;
  stem.castShadow = true;
  g.add(stem);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 10, 20), pieceMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.14 + h * 0.72;
  g.add(collar);

  const topY = 0.14 + h;
  if (piece === 'shoh') {
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.07), pieceMat);
    crossV.position.y = topY + 0.12;
    g.add(crossV);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.07), pieceMat);
    crossH.position.y = topY + 0.15;
    g.add(crossH);
  } else if (piece === 'farzin') {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 8), pieceMat);
    crown.rotation.x = Math.PI;
    crown.position.y = topY + 0.06;
    g.add(crown);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), pieceMat);
    orb.position.y = topY + 0.18;
    g.add(orb);
  } else if (piece === 'rux') {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.18, 8), pieceMat);
    turret.position.y = topY + 0.06;
    g.add(turret);
  } else if (piece === 'fil') {
    const miter = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.28, 14), pieceMat);
    miter.position.y = topY + 0.1;
    g.add(miter);
  } else if (piece === 'ot') {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.34), pieceMat);
    head.rotation.x = -0.3;
    head.position.set(0, topY + 0.08, 0.06);
    g.add(head);
  } else {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), pieceMat);
    orb.position.y = topY + 0.08;
    g.add(orb);
  }

  return g;
}

// Composite 3D Sky Elements (Quyosh, Oy, Bulut, Yulduz)
export function buildSkyObject3D(kind: 'quyosh' | 'oy' | 'bulut' | 'yulduz'): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'quyosh') {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 20), mat(0xfacc15, 0.2, 0.1, 0xf59e0b));
    core.position.y = 0.52;
    g.add(core);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), mat(0xf97316, 0.3, 0.1, 0xea580c));
      ray.position.set(Math.cos(a) * 0.48, 0.52 + Math.sin(a) * 0.48, 0);
      ray.rotation.z = a - Math.PI / 2;
      g.add(ray);
    }
  } else if (kind === 'oy') {
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.11, 14, 24, Math.PI * 1.25), mat(0xe2e8f0, 0.25, 0.3, 0x94a3b8));
    crescent.rotation.z = Math.PI * 0.35;
    crescent.position.y = 0.52;
    g.add(crescent);
  } else if (kind === 'bulut') {
    const cloudMat = mat(0xf8fafc, 0.75, 0.05);
    [
      [-0.24, 0.44, 0, 0.24],
      [0, 0.54, 0, 0.3],
      [0.26, 0.44, 0, 0.23],
    ].forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 14), cloudMat);
      puff.position.set(x, y, z);
      g.add(puff);
    });
  } else {
    return buildShape3D('yulduz', 0x38bdf8);
  }
  return g;
}
