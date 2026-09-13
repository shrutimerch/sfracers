import { buildCybertruck } from './cybertruck.ts';
import { createBrandBadge } from './brand-badge.ts';
import { HUMAN_STYLES } from './human-styles.ts';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CHARACTERS, type CharacterId } from './roster.ts';
import { KART_SCALE } from '../simulation/race-laps.ts';

// Original, smoothly shaded character sculptures. Local +X is forward.
// Static sculpture pieces are baked by material; wheels and drivers remain articulated.
export function createRacer(id: CharacterId, environment?: T.Texture) {
  const root = new T.Group();
  root.name = `Racer: ${id}`;
  root.userData.character = id;
  root.scale.setScalar(KART_SCALE);
  const chassis = new T.Group(),
    driver = new T.Group();
  root.add(chassis, driver);
  driver.name = 'Animated character';
  const materials = new Map<string, T.MeshPhysicalMaterial>();
  const mat = (color: string, roughness = 0.4, metalness = 0) => {
    const key = `${color}/${roughness}/${metalness}`;
    let m = materials.get(key);
    if (!m) {
      m = new T.MeshPhysicalMaterial({
        color,
        envMap: environment ?? null,
        envMapIntensity: 0.75,
        roughness,
        metalness,
        clearcoat: roughness < 0.35 ? 0.8 : 0,
        clearcoatRoughness: 0.22,
      });
      materials.set(key, m);
    }
    return m;
  };
  const paint = mat(CHARACTERS.find((c) => c.id === id)!.color, 0.25, 0.22);
  const navy = mat('#112c41', 0.4),
    rubber = mat('#192630', 0.8);
  const chrome = mat('#c1d6e0', 0.24, 0.72),
    cream = mat('#fff0cf', 0.48);
  const white = mat('#f6fbff', 0.3),
    black = mat('#101b27', 0.22);
  const mesh = (
    parent: T.Group,
    g: T.BufferGeometry,
    m: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const part = new T.Mesh(g, m);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  };
  const egg = (
    parent: T.Group,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const part = mesh(parent, new T.SphereGeometry(1, 24, 16), m, x, y, z);
    part.scale.set(sx, sy, sz);
    return part;
  };
  const rounded = (
    parent: T.Group,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    radius = 0.12,
  ) => mesh(parent, new RoundedBoxGeometry(w, h, d, 3, radius), m, x, y, z);
  const tube = (parent: T.Group, m: T.Material, points: number[][], radius: number) =>
    mesh(
      parent,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
        Math.max(8, points.length * 6),
        radius,
        8,
        false,
      ),
      m,
      0,
      0,
      0,
    );
  const ring = (
    parent: T.Group,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    radius: number,
    thickness: number,
  ) => mesh(parent, new T.TorusGeometry(radius, thickness, 10, 32), m, x, y, z);

  if (id !== 'elon') {
    // A low sculpted tub, inset cockpit, wraparound bumpers and curved side pods.
    rounded(chassis, navy, 0, 0.46, 0, 3.18, 0.26, 1.56, 0.12);
    egg(chassis, paint, 0.38, 0.68, 0, 1.27, 0.32, 0.79);
    rounded(chassis, navy, -0.37, 0.82, 0, 1.32, 0.22, 1.19, 0.1);
    rounded(chassis, navy, -0.82, 1.03, 0, 0.3, 0.64, 0.99, 0.12).rotation.z = -0.12;
    egg(chassis, cream, 1.22, 0.86, 0, 0.34, 0.035, 0.3);
    for (const side of [-1, 1]) {
      egg(chassis, paint, -0.06, 0.66, side * 0.81, 0.96, 0.27, 0.2);
      tube(
        chassis,
        chrome,
        [
          [1.4, 0.48, side * 0.75],
          [1.66, 0.49, side * 0.54],
          [1.73, 0.5, 0],
        ],
        0.065,
      );
      rounded(chassis, chrome, -1.45, 0.63, side * 0.57, 0.46, 0.15, 0.19, 0.07);
      rounded(chassis, black, -1.69, 0.63, side * 0.57, 0.025, 0.1, 0.13, 0.01);
      rounded(chassis, navy, -1.2, 0.95, side * 0.6, 0.12, 0.45, 0.1, 0.04);
    }
    rounded(chassis, paint, -1.26, 1.15, 0, 0.42, 0.12, 1.9, 0.06);
    rounded(chassis, cream, -1.27, 1.22, 0, 0.35, 0.018, 0.3, 0.008);
  }
  const truck = id === 'elon' ? buildCybertruck(chassis, environment) : null;
  if (truck) root.userData.vehicle = 'Tesla Cybertruck';

  const wheels: { pivot: T.Group; spin: T.Group; front: boolean }[] = [];
  for (const x of [-1.02, 1.02])
    for (const side of [-1, 1]) {
      const pivot = new T.Group(),
        spin = new T.Group();
      pivot.position.set(x, 0.45, side * 0.98);
      pivot.name = x > 0 ? 'Front steering pivot' : 'Rear axle';
      spin.name = 'Spinning wheel';
      pivot.add(spin);
      root.add(pivot);
      const tire = ring(spin, rubber, 0, 0, 0, 0.32, 0.13);
      tire.scale.z = 1.25;
      const rim = mesh(spin, new T.CylinderGeometry(0.255, 0.255, 0.25, 32), chrome, 0, 0, 0);
      rim.rotation.x = Math.PI / 2;
      ring(spin, id === 'elon' ? navy : paint, 0, 0, side * 0.143, 0.21, 0.023);
      egg(spin, navy, 0, 0, side * 0.15, 0.11, 0.11, 0.035);
      for (let k = 0; k < 5; k++) {
        const a = (k * Math.PI * 2) / 5;
        tube(
          spin,
          navy,
          [
            [Math.cos(a) * 0.09, Math.sin(a) * 0.09, side * 0.152],
            [Math.cos(a + 0.2) * 0.21, Math.sin(a + 0.2) * 0.21, side * 0.152],
          ],
          0.018,
        );
      }
      if (id === 'elon')
        for (let k = 0; k < 20; k++) {
          const a = (k * Math.PI) / 10;
          const tread = mesh(
            spin,
            new T.BoxGeometry(0.06, 0.018, 0.28),
            rubber,
            Math.cos(a) * 0.438,
            Math.sin(a) * 0.438,
            0,
          );
          tread.rotation.z = a - Math.PI / 2;
        }
      wheels.push({ pivot, spin, front: x > 0 });
    }
  const steering = new T.Group();
  steering.position.set(0.5, 1.12, 0);
  steering.rotation.y = Math.PI / 2;
  steering.rotation.x = 0.3;
  const steeringRim = ring(steering, navy, 0, 0, 0, 0.25, 0.042);
  steeringRim.name = 'Steering rim';
  tube(
    steering,
    chrome,
    [
      [-0.2, 0, 0],
      [0, 0, 0],
      [0.2, 0, 0],
    ],
    0.022,
  );
  chassis.add(steering);

  let sensor: T.Group | null = null;
  if (id === 'chonkers') {
    const fur = mat('#8e5639', 0.48),
      darkFur = mat('#633924', 0.53),
      muzzle = mat('#d4a06b', 0.6);
    // Pear-shaped belly, arched neck, heavy cheeks and unmistakable sea-lion flippers.
    egg(driver, fur, -0.43, 1.25, 0, 0.69, 0.66, 0.57);
    egg(driver, muzzle, -0.02, 1.25, 0, 0.34, 0.48, 0.44);
    egg(driver, fur, -0.27, 1.93, 0, 0.49, 0.65, 0.44).rotation.z = -0.13;
    egg(driver, fur, -0.07, 2.25, 0, 0.53, 0.46, 0.46);
    for (const side of [-1, 1]) {
      egg(driver, darkFur, -0.39, 2.27, side * 0.43, 0.12, 0.19, 0.1).rotation.x = side * 0.3;
      egg(driver, muzzle, 0.33, 2.1, side * 0.17, 0.31, 0.2, 0.23);
      egg(driver, cream, 0.24, 2.38, side * 0.31, 0.115, 0.14, 0.115);
      egg(driver, black, 0.328, 2.37, side * 0.335, 0.066, 0.087, 0.074);
      egg(driver, white, 0.37, 2.414, side * 0.352, 0.023, 0.028, 0.025);
      const flipper = egg(driver, darkFur, 0.05, 1.33, side * 0.52, 0.48, 0.13, 0.2);
      flipper.rotation.y = side * 0.32;
      egg(driver, darkFur, -1.04, 0.96, side * 0.27, 0.37, 0.09, 0.2).rotation.y = side * 0.4;
      for (let k = 0; k < 3; k++)
        tube(
          driver,
          cream,
          [
            [0.48, 2.1 - k * 0.055, side * 0.2],
            [0.56, 2.11 - k * 0.07, side * 0.42],
            [0.52 - k * 0.05, 2.16 - k * 0.13, side * (0.66 + k * 0.035)],
          ],
          0.009,
        );
    }
    egg(driver, black, 0.59, 2.21, 0, 0.09, 0.068, 0.12);
    tube(
      driver,
      darkFur,
      [
        [0.57, 2.04, -0.11],
        [0.59, 2.0, 0],
        [0.57, 2.04, 0.11],
      ],
      0.012,
    );
    // Teal scarf reads clearly from the rear chase camera.
    const scarf = mat('#28c4b6', 0.48);
    const collar = ring(driver, scarf, -0.29, 1.87, 0, 0.4, 0.065);
    collar.rotation.x = Math.PI / 2;
    tube(
      driver,
      scarf,
      [
        [-0.65, 1.87, 0.18],
        [-0.97, 1.78, 0.22],
        [-1.15, 1.9, 0.27],
      ],
      0.085,
    );
  } else if (id === 'karl') {
    const mist = mat('#f2fbff', 0.87),
      shade = mat('#beddeb', 0.82);
    egg(driver, shade, -0.25, 1.7, 0, 0.72, 0.32, 0.62);
    for (const [x, y, z, size] of [
      [-0.35, 2.13, 0, 0.58],
      [0.13, 2.08, 0, 0.47],
      [-0.63, 1.96, -0.38, 0.4],
      [-0.59, 1.99, 0.4, 0.41],
      [0.0, 1.91, -0.46, 0.37],
      [0.02, 1.9, 0.45, 0.38],
      [-0.76, 2.18, 0.02, 0.35],
    ])
      egg(driver, mist, x, y, z, size, size * 0.85, size);
    for (const side of [-1, 1]) {
      egg(driver, black, 0.526, 2.12, side * 0.18, 0.039, 0.102, 0.057);
      egg(driver, white, 0.559, 2.15, side * 0.18, 0.013, 0.025, 0.02);
      egg(driver, mat('#ffbfca', 0.7), 0.46, 1.97, side * 0.33, 0.055, 0.052, 0.1);
      tube(
        driver,
        shade,
        [
          [0.05, 1.71, side * 0.48],
          [0.25, 1.51, side * 0.49],
          [0.5, 1.36, side * 0.22],
        ],
        0.085,
      );
      egg(driver, mist, 0.51, 1.35, side * 0.2, 0.12, 0.09, 0.13);
    }
    tube(
      driver,
      navy,
      [
        [0.54, 1.99, -0.09],
        [0.56, 1.94, 0],
        [0.54, 1.99, 0.09],
      ],
      0.015,
    );
    for (let i = 0; i < 3; i++)
      egg(
        driver,
        shade,
        -0.85 - i * 0.22,
        1.63 - i * 0.12,
        0,
        0.18 - i * 0.035,
        0.1,
        0.16 - i * 0.025,
      );
  } else if (id !== 'waymo') {
    const style = HUMAN_STYLES[id];
    const suit = mat(style.suit, 0.65),
      skin = mat(style.skin, 0.6),
      hair = mat(style.hair, 0.8);
    egg(driver, suit, -0.43, 1.32, 0, 0.35, 0.43, 0.38);
    rounded(driver, id === 'pejman' ? navy : white, -0.13, 1.46, 0, 0.07, 0.42, 0.23, 0.035);
    const tie = rounded(
      driver,
      mat(id === 'sam' ? '#234262' : '#639bda', 0.5),
      -0.085,
      1.43,
      0,
      0.035,
      0.3,
      0.075,
      0.017,
    );
    tie.rotation.z = -0.1;
    if (!style.tie) {
      driver.remove(tie);
      tie.geometry.dispose();
    }
    if (!style.tie && id !== 'pejman' && id !== 'aditya')
      rounded(driver, paint, -0.07, 1.48, 0, 0.035, 0.12, 0.16, 0.016);
    egg(driver, skin, -0.4, 1.84, 0, 0.14, 0.21, 0.16);
    egg(
      driver,
      skin,
      -0.32,
      2.2,
      0,
      id === 'sam' ? 0.32 : 0.34,
      id === 'sam' ? 0.46 : 0.43,
      id === 'sam' ? 0.285 : 0.31,
    );
    egg(
      driver,
      skin,
      -0.03,
      2.16,
      0,
      id === 'sam' ? 0.145 : 0.12,
      id === 'sam' ? 0.13 : 0.1,
      0.083,
    );
    egg(driver, hair, -0.44, 2.47, 0, 0.29, 0.17, 0.29);
    egg(driver, hair, -0.58, 2.3, 0, 0.11, 0.25, 0.28);
    for (const side of [-1, 1]) {
      egg(driver, skin, -0.37, 2.2, side * 0.31, 0.09, 0.13, 0.068);
      if (style.gray)
        egg(driver, mat('#b9b4aa', 0.8), -0.49, 2.36, side * 0.253, 0.11, 0.12, 0.055);
      egg(driver, white, -0.047, 2.3, side * 0.143, 0.058, 0.067, 0.067);
      if (id === 'sam') {
        egg(driver, mat('#718e9b', 0.35), 0.004, 2.3, side * 0.145, 0.029, 0.041, 0.037);
        egg(driver, black, 0.027, 2.3, side * 0.145, 0.013, 0.025, 0.02);
        egg(driver, white, 0.038, 2.316, side * 0.139, 0.008, 0.009, 0.009);
      } else egg(driver, black, 0.002, 2.3, side * 0.145, 0.026, 0.037, 0.033);
      tube(
        driver,
        hair,
        [
          [-0.065, 2.4, side * 0.09],
          [-0.058, 2.414, side * 0.15],
          [-0.09, 2.39, side * 0.2],
        ],
        0.022,
      );
      tube(
        driver,
        suit,
        [
          [-0.38, 1.55, side * 0.34],
          [-0.06, 1.21, side * 0.43],
          [0.42, 1.26, side * 0.2],
        ],
        0.105,
      );
      egg(driver, skin, 0.43, 1.28, side * 0.2, 0.12, 0.09, 0.095);
      tube(
        driver,
        suit,
        [
          [-0.3, 0.95, side * 0.2],
          [0.18, 0.86, side * 0.23],
          [0.48, 0.66, side * 0.28],
        ],
        0.13,
      );
      egg(driver, black, 0.57, 0.66, side * 0.28, 0.23, 0.1, 0.12);
    }
    tube(
      driver,
      mat('#a85d4e', 0.6),
      [
        [-0.019, 2.04, -0.1],
        [0.008, 2.015, 0],
        [-0.019, 2.04, 0.1],
      ],
      0.012,
    );
    if (id === 'aditya') {
      // Supplied portrait: clean-shaven smile, short black waves and an open
      // light-gray button-down, with no glasses or jacket.
      for (const [x, y, z, tilt] of [
        [-0.23, 2.55, -0.18, -0.35],
        [-0.3, 2.58, -0.06, -0.25],
        [-0.42, 2.57, 0.08, 0.25],
        [-0.35, 2.52, 0.23, 0.4],
      ]) {
        const wave = egg(driver, hair, x, y, z, 0.135, 0.085, 0.09);
        wave.rotation.y = tilt;
      }
      egg(driver, mat('#724734', 0.6), 0.012, 2.035, 0, 0.037, 0.075, 0.158);
      egg(driver, white, 0.045, 2.058, 0, 0.018, 0.029, 0.13);
      for (const side of [-1, 1]) {
        const collar = rounded(driver, suit, -0.07, 1.68, side * 0.092, 0.038, 0.16, 0.095, 0.016);
        collar.rotation.x = side * 0.42;
        egg(driver, white, -0.044, 1.64, side * 0.11, 0.007, 0.012, 0.012);
      }
      rounded(driver, suit, -0.088, 1.43, 0, 0.024, 0.42, 0.05, 0.01);
      for (const y of [1.28, 1.39, 1.5]) egg(driver, white, -0.068, y, 0, 0.008, 0.012, 0.012);
    }
    if (id === 'sam') {
      // User's suit portrait: lifted, uneven brown quiff with subtle gray
      // strands, blue-gray eyes, white collar and navy dotted tie.
      for (const [x, y, z, tilt] of [
        [-0.21, 2.59, -0.17, -0.45],
        [-0.31, 2.64, -0.05, -0.28],
        [-0.4, 2.61, 0.1, 0.25],
        [-0.23, 2.58, 0.22, 0.35],
        [-0.55, 2.55, -0.16, -0.2],
        [-0.56, 2.56, 0.14, 0.3],
      ]) {
        const tuft = egg(driver, hair, x, y, z, 0.12, 0.15, 0.095);
        tuft.rotation.z = tilt;
        tuft.rotation.x = tilt * 0.7;
      }
      const highlight = mat('#8b8072', 0.85);
      for (const z of [-0.17, -0.04, 0.13])
        tube(
          driver,
          highlight,
          [
            [-0.16, 2.55, z],
            [-0.26, 2.66, z - 0.035],
            [-0.4, 2.67, z - 0.05],
          ],
          0.013,
        );
      for (const side of [-1, 1]) {
        const collar = rounded(driver, white, -0.07, 1.68, side * 0.09, 0.035, 0.13, 0.09, 0.015);
        collar.rotation.x = side * 0.4;
        const lapel = egg(driver, suit, -0.095, 1.48, side * 0.2, 0.045, 0.24, 0.07);
        lapel.rotation.x = side * 0.25;
      }
      rounded(driver, mat('#234262', 0.5), -0.058, 1.61, 0, 0.035, 0.08, 0.085, 0.014);
      tie.updateMatrix();
      for (let row = 0; row < 6; row++)
        for (const side of [-1, 1]) {
          const dot = new T.Vector3(0.021, -0.12 + row * 0.045, side * 0.019).applyMatrix4(
            tie.matrix,
          );
          egg(driver, white, dot.x, dot.y, dot.z, 0.004, 0.006, 0.006);
        }
    }
    if (id === 'pejman') {
      // Wide smile, blue windowpane blazer, dark shirt and yellow watch strap.
      egg(driver, mat('#743e30', 0.65), 0.012, 2.035, 0, 0.037, 0.07, 0.155);
      egg(driver, cream, 0.044, 2.06, 0, 0.018, 0.026, 0.127);
      const check = mat('#7094b4', 0.75);
      for (const latitude of [0.55, 0.9, 1.25, 1.6, 1.95, 2.3, 2.65]) {
        const points = Array.from({ length: 33 }, (_, k) => {
          const a = (k * Math.PI) / 16;
          return [
            -0.43 + Math.cos(a) * Math.sin(latitude) * 0.354,
            1.32 + Math.cos(latitude) * 0.434,
            Math.sin(a) * Math.sin(latitude) * 0.384,
          ];
        });
        tube(driver, check, points, 0.006);
      }
      for (let longitude = 0; longitude < 12; longitude++) {
        const a = (longitude * Math.PI) / 6;
        const points = Array.from({ length: 17 }, (_, k) => {
          const latitude = 0.2 + (k * 2.7) / 16;
          return [
            -0.43 + Math.cos(a) * Math.sin(latitude) * 0.354,
            1.32 + Math.cos(latitude) * 0.434,
            Math.sin(a) * Math.sin(latitude) * 0.384,
          ];
        });
        tube(driver, check, points, 0.006);
      }
      for (const side of [-1, 1]) {
        const lapel = egg(driver, suit, -0.102, 1.51, side * 0.16, 0.05, 0.19, 0.06);
        lapel.rotation.x = side * 0.25;
      }
      const strap = ring(driver, mat('#f5cc49', 0.55), 0.32, 1.27, 0.24, 0.105, 0.026);
      strap.rotation.y = Math.PI / 2;
      rounded(driver, chrome, 0.32, 1.38, 0.24, 0.13, 0.035, 0.11, 0.015);
      rounded(driver, black, 0.32, 1.4, 0.24, 0.09, 0.014, 0.077, 0.006);
    }
    if (id === 'daniel')
      egg(driver, mat('#efc871', 0.3, 0.55), -0.07, 1.58, -0.23, 0.024, 0.043, 0.043);
    if (style.beard) egg(driver, hair, -0.09, 2.005, 0, 0.2, 0.17, 0.255);
    if (style.glasses) {
      for (const side of [-1, 1]) {
        const lens = ring(driver, navy, 0.016, 2.3, side * 0.155, 0.105, 0.016);
        lens.rotation.y = Math.PI / 2;
        tube(
          driver,
          navy,
          [
            [0, 2.33, side * 0.255],
            [-0.25, 2.36, side * 0.32],
            [-0.42, 2.33, side * 0.32],
          ],
          0.014,
        );
      }
      tube(
        driver,
        navy,
        [
          [0.023, 2.32, -0.05],
          [0.04, 2.34, 0],
          [0.023, 2.32, 0.05],
        ],
        0.014,
      );
    }
    if (style.curls)
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        egg(driver, hair, -0.4 + Math.cos(a) * 0.2, 2.49, Math.sin(a) * 0.23, 0.12, 0.12, 0.12);
      }
  } else {
    // The vehicle IS the character: white crossover shell, panoramic glass,
    // turquoise sensor halo and friendly headlamp eyes. No human driver.
    steering.visible = false;
    rounded(driver, white, -0.1, 1.04, 0, 2.62, 0.64, 1.52, 0.26);
    rounded(driver, navy, -0.38, 1.51, 0, 1.56, 0.7, 1.3, 0.23);
    rounded(driver, white, -0.46, 1.88, 0, 1.3, 0.1, 1.24, 0.049);
    for (const side of [-1, 1]) {
      rounded(driver, white, -0.36, 1.46, side * 0.652, 0.09, 0.6, 0.035, 0.016);
      egg(driver, chrome, 0.48, 1.25, side * 0.77, 0.14, 0.06, 0.1);
      rounded(driver, mat('#bcecff', 0.2), 1.219, 1.16, side * 0.49, 0.035, 0.14, 0.31, 0.017);
      rounded(driver, black, 1.241, 1.16, side * 0.49, 0.018, 0.075, 0.11, 0.008);
      rounded(driver, paint, -1.4, 1.13, side * 0.48, 0.04, 0.11, 0.31, 0.019);
      tube(
        driver,
        paint,
        [
          [0.32, 1.15, side * 0.775],
          [0.06, 0.92, side * 0.79],
          [-0.19, 1.13, side * 0.79],
          [-0.41, 0.92, side * 0.79],
          [-0.63, 1.15, side * 0.775],
        ],
        0.035,
      );
    }
    rounded(driver, black, 1.225, 0.91, 0, 0.035, 0.11, 0.55, 0.017);
    sensor = new T.Group();
    sensor.position.set(-0.4, 2.05, 0);
    driver.add(sensor);
    mesh(sensor, new T.CylinderGeometry(0.26, 0.3, 0.19, 32), white, 0, 0, 0);
    const halo = ring(sensor, paint, 0, 0.08, 0, 0.245, 0.035);
    halo.rotation.x = Math.PI / 2;
    egg(sensor, black, 0.255, 0, 0, 0.018, 0.05, 0.075);
  }
  // Batch stationary meshes without losing the separately animated assemblies.
  function batch(group: T.Group) {
    const buckets = new Map<T.Material, T.BufferGeometry[]>();
    const oldGeometries = new Set<T.BufferGeometry>();
    for (const child of [...group.children]) {
      if (!(child instanceof T.Mesh) || Array.isArray(child.material)) continue;
      child.updateMatrix();
      const g = (
        child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()
      ).applyMatrix4(child.matrix);
      const bucket = buckets.get(child.material) || [];
      bucket.push(g);
      buckets.set(child.material, bucket);
      oldGeometries.add(child.geometry);
      group.remove(child);
    }
    oldGeometries.forEach((g) => g.dispose());
    for (const [material, pieces] of buckets) {
      const merged = mergeGeometries(pieces, false);
      if (!merged) throw new Error(`Could not build ${id}`);
      mesh(group, merged, material, 0, 0, 0);
      pieces.forEach((g) => g.dispose());
    }
  }
  if (id === 'elon') {
    driver.scale.setScalar(0.62);
    driver.position.set(0.15, 0.36, 0);
  }
  batch(chassis);
  batch(driver);
  wheels.forEach(({ spin }) => batch(spin));
  const badge = createBrandBadge(id);
  if (badge) chassis.add(badge.mesh);
  let wheelAngle = 0;
  return {
    root,
    update(dt: number, speed: number, steer: number, drifting: boolean, elapsed: number) {
      wheelAngle = (wheelAngle - (speed * dt) / (0.45 * KART_SCALE)) % (Math.PI * 2);
      for (const wheel of wheels) {
        wheel.spin.rotation.z = wheelAngle;
        wheel.pivot.rotation.y = wheel.front ? -steer * 0.3 : 0;
      }
      steering.rotation.z = steer * 0.45;
      driver.rotation.x = -steer * (drifting ? 0.13 : 0.055);
      driver.position.y =
        id === 'karl'
          ? Math.sin(elapsed * 2.2) * 0.09
          : (id === 'elon' ? 0.36 : 0) +
            Math.sin(elapsed * 7) * Math.min(Math.abs(speed) / 30, 1) * 0.022;
      chassis.rotation.x = -steer * Math.min(Math.abs(speed) / 20, 1) * 0.025;
      if (sensor) sensor.rotation.y = elapsed * 1.6;
    },
    dispose() {
      const geometries = new Set<T.BufferGeometry>();
      root.traverse((part) => {
        if (part instanceof T.Mesh) geometries.add(part.geometry);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      truck?.materials.forEach((m) => m.dispose());
      badge?.material.dispose();
      badge?.texture?.dispose();
    },
  };
}
export type RacerModel = ReturnType<typeof createRacer>;
