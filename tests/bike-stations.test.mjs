import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stationBikes, stationDocks } from '../game/scenery/bike-stations.ts';
const course = JSON.parse(readFileSync(new URL('../public/race-course.json', import.meta.url)));
const source = JSON.parse(
  readFileSync(new URL('../reference/bay-wheels-station-information.json', import.meta.url)),
);

test('every physical Lyft station within 50m of the route is included at its published coordinate', () => {
  const near = (s) => {
    const x = (s.lon + 122.395) * 87900,
      z = (37.786 - s.lat) * 111200;
    return course.route.slice(1).some((b, i) => {
      const a = course.route[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
      );
      return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) <= 50;
    });
  };
  const expected = source.data.stations.filter(
    (s) => !s.is_virtual_station && s.capacity > 0 && near(s),
  );
  assert.deepEqual(
    course.bikeStations.map((s) => s.id).sort(),
    expected.map((s) => s.station_id).sort(),
  );
  assert.equal(new Set(course.bikeStations.map((s) => s.id)).size, course.bikeStations.length);
  for (const s of course.bikeStations) {
    const original = expected.find((o) => o.station_id === s.id);
    assert.equal(s.capacity, original.capacity);
    assert.ok(Math.abs(s.position[0] - (original.lon + 122.395) * 87900) < 0.001);
    assert.ok(Math.abs(s.position[1] - (37.786 - original.lat) * 111200) < 0.001);
    const bikes = stationBikes([s]);
    const docks = stationDocks([s]);
    assert.equal(docks.length, s.capacity);
    assert.equal(bikes.length, Math.round(s.capacity * 0.4));
    assert.ok(Math.abs(docks.reduce((n, b) => n + b.x, 0) / docks.length - s.position[0]) < 0.001);
    assert.ok(docks.some((dock) => !dock.occupied));
    assert.deepEqual(stationDocks([s]), docks);
  }
});
