import * as T from 'three';
import { buildingGeometry, type Building } from './geometry/building-geometry.ts';
import { batchFacade } from './geometry/batch-facade.ts';

export const DELANCEY_RESTAURANT_ID = 125401316;
export const DELANCEY_EMBARCADERO_ID = 125401320;
// Kept as the exclusion ID used by world.ts; this footprint is the corner building.
export const DELANCEY_PATIO_ID = 125401311;
const CORNER_POINTS = [
  [547.3, 186.5],
  [571.7, 162.8],
  [574.0, 161.3],
  [576.6, 160.9],
  [579.2, 161.4],
  [581.4, 163.0],
  [582.8, 165.3],
  [583.1, 168.0],
  [580.8, 203.5],
  [555.0, 201.8],
  [555.4, 194.3],
  [547.3, 186.5],
];

// Matched to the supplied May 2025 view at 160 Brannan: terracotta stucco,
// forest-green / cream awning, burgundy doors and brick-and-glass patio enclosure.
export function buildDelanceyStreet(scene: T.Scene, building: Building) {
  const material = (color: string) => new T.MeshStandardMaterial({ color, roughness: 0.88 });
  const green = material('#245f50'),
    cream = material('#dfd5b7');
  green.side = cream.side = T.DoubleSide;
  const iron = material('#273b37'),
    burgundy = material('#593133');
  const windowGlass = material('#455653'),
    shadow = material('#423a32');
  const brick = material('#9b5845'),
    mortar = material('#bd9d80');
  const patioGlass = new T.MeshStandardMaterial({
    color: '#b4d0c9',
    transparent: true,
    opacity: 0.22,
    roughness: 0.15,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const textures: T.Texture[] = [];
  const cleanups: (() => void)[] = [];
  const corner = building.id === DELANCEY_PATIO_ID;
  if (corner) {
    const shell = new T.Group();
    shell.name = 'Delancey rounded corner building';
    // The top floor has an open colonnade in front of a recessed dark wall.
    const lower = buildingGeometry({ ...building, height: 9.1 });
    shell.add(new T.Mesh(lower.walls, material('#ad745b')));
    shell.add(new T.Mesh(lower.roof, cream));
    const center = new T.Vector2(568, 184);
    const recessed = building.points.map(([x, z]) => [
      center.x + (x - center.x) * 0.91,
      center.y + (z - center.y) * 0.91,
    ]);
    const upper = buildingGeometry({ points: recessed, height: 2.65 });
    upper.walls.translate(0, 9.1, 0);
    upper.roof.translate(0, 9.1, 0);
    shell.add(new T.Mesh(upper.walls, shadow));
    shell.add(new T.Mesh(upper.roof, shadow));
    const roofVertices: number[] = [];
    for (let i = 1; i < building.points.length; i++) {
      const a = building.points[i - 1],
        b = building.points[i];
      const outer = (p: number[]) => [
        center.x + (p[0] - center.x) * 1.035,
        12.0,
        center.y + (p[1] - center.y) * 1.035,
      ];
      roofVertices.push(...outer(a), center.x, 14.0, center.y, ...outer(b));
    }
    const roofGeometry = new T.BufferGeometry();
    roofGeometry.setAttribute('position', new T.Float32BufferAttribute(roofVertices, 3));
    roofGeometry.computeVertexNormals();
    const roof = new T.Mesh(
      roofGeometry,
      new T.MeshStandardMaterial({
        color: '#77503a',
        roughness: 1,
        side: T.DoubleSide,
      }),
    );
    roof.name = 'rounded terracotta hip roof';
    shell.add(roof);
    // Narrow raised courses give the roof a tiled silhouette without a bitmap asset.
    for (let course = 1; course < 9; course++) {
      const t = course / 10;
      const points = building.points.map(
        ([x, z]) =>
          new T.Vector3(
            center.x + (x - center.x) * 1.035 * (1 - t),
            12 + 2 * t + 0.025,
            center.y + (z - center.y) * 1.035 * (1 - t),
          ),
      );
      const line = new T.Line(
        new T.BufferGeometry().setFromPoints(points),
        new T.LineBasicMaterial({ color: '#a07857' }),
      );
      line.name = 'roof tile course';
      shell.add(line);
    }
    scene.add(shell);
  }
  const cx = building.points.reduce((n, p) => n + p[0], 0) / building.points.length;
  const cz = building.points.reduce((n, p) => n + p[1], 0) / building.points.length;
  const box = (
    group: T.Group,
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    mesh.name = name;
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  for (let i = 1; i < building.points.length; i++) {
    const a = building.points[i - 1],
      b = building.points[i];
    const width = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (width < (corner ? 2 : 7)) continue;
    const mx = (a[0] + b[0]) / 2,
      mz = (a[1] + b[1]) / 2;
    let nx = -(b[1] - a[1]) / width,
      nz = (b[0] - a[0]) / width;
    if ((mx - cx) * nx + (mz - cz) * nz < 0) {
      nx = -nx;
      nz = -nz;
    }
    const front = new T.Group();
    front.name = 'Delancey Street restaurant facade';
    front.position.set(mx, 0, mz);
    front.rotation.y = Math.atan2(nx, nz);
    scene.add(front);
    const bays = Math.max(1, Math.round(width / 4.5)),
      step = width / bays;
    for (let j = 0; j < bays; j++) {
      const x = -width / 2 + (j + 0.5) * step,
        w = step * 0.75;
      box(front, 'cream upper window surround', x, 6.8, 0.12, w + 0.18, 3.05, 0.18, cream);
      box(front, 'upper window', x, 6.8, 0.24, w, 2.85, 0.1, windowGlass);
      box(front, 'upper mullion', x, 6.8, 0.32, 0.07, 2.85, 0.06, cream);
      box(front, 'upper transom', x, 6.3, 0.32, w, 0.065, 0.06, cream);
      if (!corner) box(front, 'recessed top loggia', x, 10.25, 0.06, w + 0.1, 2.4, 0.13, shadow);
      for (const dx of [-w / 2, w / 2]) {
        const column = new T.Mesh(new T.CylinderGeometry(0.14, 0.16, 2.4, 10), cream);
        column.position.set(x + dx, 10.3, 0.36);
        column.name = 'cream loggia column';
        front.add(column);
      }
      box(front, 'balcony handrail', x, 9.8, 0.55, w, 0.075, 0.08, iron);
      for (let dx = -w / 2; dx <= w / 2; dx += 0.28) {
        const curve = new T.CatmullRomCurve3([
          new T.Vector3(x + dx, 9.05, 0.35),
          new T.Vector3(x + dx, 9.38, 0.65),
          new T.Vector3(x + dx, 9.8, 0.55),
        ]);
        const railing = new T.Mesh(new T.TubeGeometry(curve, 5, 0.025, 4, false), iron);
        railing.name = 'curved balcony baluster';
        front.add(railing);
      }
      const door = j === Math.floor(bays / 2);
      box(
        front,
        door ? 'burgundy entry' : 'ground window frame',
        x,
        1.75,
        0.2,
        w,
        door ? 3.1 : 2,
        0.18,
        door ? burgundy : cream,
      );
      box(
        front,
        'restaurant glazing',
        x,
        door ? 1.9 : 1.8,
        0.32,
        w - 0.3,
        door ? 2.2 : 1.7,
        0.1,
        windowGlass,
      );
      box(front, 'restaurant window transom', x, 2.2, 0.39, w - 0.3, 0.06, 0.06, cream);
      if (door) box(front, 'door divider', x, 1.75, 0.42, 0.12, 3.1, 0.08, burgundy);
    }
    box(front, 'cream roof cornice', 0, 11.8, 0.28, width + 0.2, 0.32, 0.8, cream);
    // Short Brannan frontage, with a longer canopy on the separate Embarcadero wing.
    const cornerDistance = Math.min(
      Math.hypot(a[0] - 542.55, a[1] - 190.29),
      Math.hypot(b[0] - 542.55, b[1] - 190.29),
    );
    const brannanEnd =
      building.id === DELANCEY_RESTAURANT_ID && nx < -0.4 && nz < -0.4 && cornerDistance < 5;
    const waterfrontFront = building.id === DELANCEY_EMBARCADERO_ID && nx > 0.8 && width > 30;
    const patioReturn = building.id === DELANCEY_EMBARCADERO_ID && nz < -0.8 && width > 12;
    if (!(corner || brannanEnd || waterfrontFront || patioReturn)) {
      batchFacade(front);
      continue;
    }
    const canopyWidth = corner
      ? width
      : Math.min(waterfrontFront ? 34 : patioReturn ? width - 1 : 11.5, width - 1);
    const cornerLocalX = (542.55 - mx) * nz - (190.29 - mz) * nx;
    const canopyCenter = corner
      ? 0
      : waterfrontFront
        ? width / 2 - canopyWidth / 2 - 0.5
        : patioReturn
          ? 0
          : Math.sign(cornerLocalX) * (width / 2 - canopyWidth / 2 - 0.5);
    const stripes = Math.ceil(canopyWidth / 0.85),
      stripeWidth = canopyWidth / stripes;
    const outerPoint = (index: number) => {
      const points = building.points.slice(0, -1),
        n = points.length;
      const p = points[index % n],
        prev = points[(index - 1 + n) % n],
        next = points[(index + 1) % n];
      const normal = (a: number[], b: number[]) => {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        let x = -(b[1] - a[1]) / len,
          z = (b[0] - a[0]) / len;
        if (((a[0] + b[0]) / 2 - cx) * x + ((a[1] + b[1]) / 2 - cz) * z < 0) {
          x = -x;
          z = -z;
        }
        return [x, z];
      };
      const u = normal(prev, p),
        v = normal(p, next);
      const scale = 2.43 / Math.max(0.25, 1 + u[0] * v[0] + u[1] * v[1]);
      return [p[0] + (u[0] + v[0]) * scale, p[1] + (u[1] + v[1]) * scale];
    };
    for (let j = 0; j < stripes; j++) {
      if (corner) {
        const oa = outerPoint(i - 1),
          ob = outerPoint(i);
        const point = (a: number[], b: number[], t: number, y: number) => {
          const x = a[0] + (b[0] - a[0]) * t - mx,
            z = a[1] + (b[1] - a[1]) * t - mz;
          return [x * nz - z * nx, y, x * nx + z * nz];
        };
        const t0 = j / stripes,
          t1 = (j + 1) / stripes;
        const ia = point(a, b, t0, 4.45),
          ib = point(a, b, t1, 4.45);
        const ea = point(oa, ob, t0, 3.65),
          eb = point(oa, ob, t1, 3.65);
        const geom = new T.BufferGeometry();
        geom.setAttribute(
          'position',
          new T.Float32BufferAttribute([...ia, ...ea, ...ib, ...ib, ...ea, ...eb], 3),
        );
        geom.setAttribute(
          'uv',
          new T.Float32BufferAttribute([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1], 2),
        );
        geom.computeVertexNormals();
        const stripe = new T.Mesh(geom, j % 2 === 0 ? green : cream);
        stripe.name = 'continuous corner awning stripe';
        front.add(stripe);
        continue;
      }
      const stripe = box(
        front,
        'green and cream awning stripe',
        canopyCenter - canopyWidth / 2 + (j + 0.5) * stripeWidth,
        4.05,
        1.2,
        stripeWidth + 0.01,
        0.07,
        2.55,
        j % 2 === 0 ? green : cream,
      );
      stripe.rotation.x = 0.32;
    }
    if (corner) {
      const oa = outerPoint(i - 1),
        ob = outerPoint(i);
      const local = (p: number[]) => [
        (p[0] - mx) * nz - (p[1] - mz) * nx,
        (p[0] - mx) * nx + (p[1] - mz) * nz,
      ];
      const u = local(oa),
        v = local(ob);
      const fascia = box(
        front,
        'continuous corner fascia',
        (u[0] + v[0]) / 2,
        3.49,
        (u[1] + v[1]) / 2,
        Math.hypot(v[0] - u[0], v[1] - u[1]),
        0.36,
        0.09,
        iron,
      );
      fascia.rotation.y = -Math.atan2(v[1] - u[1], v[0] - u[0]);
    } else {
      box(front, 'dark restaurant fascia', canopyCenter, 3.59, 2.43, canopyWidth, 0.36, 0.09, iron);
    }
    if (width > 12) {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#20312e';
        ctx.fillRect(0, 0, 2048, 128);
        ctx.fillStyle = '#ede3c9';
        ctx.font = '58px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DELANCEY STREET RESTAURANT', 1024, 67);
        const texture = new T.CanvasTexture(canvas);
        texture.colorSpace = T.SRGBColorSpace;
        textures.push(texture);
        const signs = Math.max(1, Math.floor(canopyWidth / 14));
        const signMaterial = new T.MeshStandardMaterial({ map: texture, roughness: 0.85 });
        for (let k = 0; k < signs; k++) {
          const sign = new T.Mesh(
            new T.PlaneGeometry(canopyWidth / signs - 0.6, 0.35),
            signMaterial,
          );
          sign.position.set(
            canopyCenter - canopyWidth / 2 + ((k + 0.5) * canopyWidth) / signs,
            3.59,
            2.49,
          );
          sign.name = 'Delancey Street Restaurant lettering';
          front.add(sign);
        }
      }
    }
    batchFacade(front);
  }
  if (corner || building.id === DELANCEY_EMBARCADERO_ID)
    return () => textures.forEach((t) => t.dispose());
  cleanups.push(
    buildDelanceyStreet(scene, { points: CORNER_POINTS, height: 12, id: DELANCEY_PATIO_ID }),
  );
  // A shallow terrace hugs the rounded corner; the mapped footprint is the building.
  const patio = new T.Group();
  patio.name = 'Delancey brick and glass dining patio';
  scene.add(patio);
  const patioOutline = [
    [568.0, 166.4],
    [571.7, 162.8],
    [574.0, 161.3],
    [576.6, 160.9],
    [579.2, 161.4],
    [581.4, 163.0],
    [582.8, 165.3],
    [583.1, 168.0],
    [582.7, 174.0],
    [586.2, 174.2],
    [586.6, 167.6],
    [586.0, 164.0],
    [583.7, 160.3],
    [580.4, 158.1],
    [576.7, 157.4],
    [572.5, 158.1],
    [569.4, 160.2],
    [565.6, 164.0],
  ];
  const pavingGeometry = new T.ShapeGeometry(
    new T.Shape(patioOutline.map(([x, z]) => new T.Vector2(x, -z))),
  );
  pavingGeometry.rotateX(-Math.PI / 2);
  pavingGeometry.translate(0, 0.19, 0);
  const pavingMesh = new T.Mesh(pavingGeometry, material('#b8ab94'));
  pavingMesh.name = 'mapped patio paving';
  patio.add(pavingMesh);
  const outerPatio = [
    [565.6, 164.0],
    [569.4, 160.2],
    [572.5, 158.1],
    [576.7, 157.4],
    [580.4, 158.1],
    [583.7, 160.3],
    [586.0, 164.0],
    [586.6, 167.6],
    [586.2, 174.2],
  ];
  const edges = outerPatio.slice(1).map((p, i) => [...outerPatio[i], ...p]);
  for (const [ax, az, bx, bz] of edges) {
    const length = Math.hypot(bx - ax, bz - az),
      angle = Math.atan2(bz - az, bx - ax);
    const wall = new T.Group();
    wall.position.set((ax + bx) / 2, 0, (az + bz) / 2);
    wall.rotation.y = -angle;
    patio.add(wall);
    box(wall, 'brick patio wall', 0, 0.6, 0, length, 1.2, 0.4, brick);
    box(wall, 'brick coping', 0, 1.22, 0, length, 0.13, 0.5, mortar);
    for (let y = 0.2; y < 1.2; y += 0.2)
      box(wall, 'horizontal mortar joint', 0, y, -0.207, length, 0.015, 0.015, mortar);
    const panels = Math.ceil(length / 1.8),
      step = length / panels;
    for (let j = 0; j <= panels; j++)
      box(wall, 'glass enclosure post', -length / 2 + j * step, 2, 0, 0.06, 1.55, 0.07, iron);
    for (let j = 0; j < panels; j++)
      box(
        wall,
        'clear patio glass',
        -length / 2 + (j + 0.5) * step,
        2,
        0,
        step - 0.08,
        1.43,
        0.025,
        patioGlass,
      );
    box(wall, 'glass enclosure top rail', 0, 2.76, 0, length, 0.055, 0.075, iron);
    for (let u = -length / 2 + 0.8; u < length / 2; u += 1.8) {
      const planter = new T.Mesh(new T.BoxGeometry(1.5, 0.22, 0.34), iron);
      planter.position.set(u, 1.35, 0.07);
      planter.name = 'patio flower box';
      wall.add(planter);
      for (let k = 0; k < 5; k++) {
        const flower = new T.Mesh(
          new T.IcosahedronGeometry(0.09, 0),
          k % 3 === 0 ? cream : burgundy,
        );
        flower.position.set(u - 0.6 + k * 0.3, 1.54, 0.08);
        flower.name = 'patio flowers';
        wall.add(flower);
      }
    }
    batchFacade(wall);
  }
  for (const [x, z] of [
    [573.7, 159.5],
    [581.5, 161.1],
    [584.8, 170.5],
  ]) {
    box(patio, 'patio table', x, 0.95, z, 1.2, 0.08, 1.2, cream);
    box(patio, 'table pedestal', x, 0.6, z, 0.1, 0.7, 0.1, iron);
    for (const side of [-1, 1]) {
      box(patio, 'chair seat', x + side * 0.95, 0.65, z, 0.5, 0.08, 0.5, iron);
      box(patio, 'chair back', x + side * 1.18, 1, z, 0.06, 0.65, 0.5, iron);
    }
  }
  batchFacade(patio);
  return () => {
    textures.forEach((t) => t.dispose());
    cleanups.forEach((dispose) => dispose());
  };
}
