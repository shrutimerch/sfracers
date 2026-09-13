import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crossingStyle, bicycleSides } from '../app/road-marking-rules.ts';
import data from '../app/road-marking-data.ts';
test('unknown and explicitly unmarked crossings do not acquire painted crosswalks', () => {
  assert.equal(crossingStyle({ 'crossing:markings': 'no' }), null);
  assert.equal(crossingStyle({}), null);
  for (const style of ['zebra', 'ladder', 'lines'])
    assert.equal(crossingStyle({ 'crossing:markings': style }), style);
});
test('cycleway side restrictions and separately mapped tracks are respected', () => {
  assert.deepEqual(bicycleSides({ 'cycleway:both': 'lane', 'cycleway:left': 'no' }), [
    { side: 1, kind: 'lane' },
  ]);
  assert.deepEqual(bicycleSides({ cycleway: 'separate' }), []);
  assert.deepEqual(bicycleSides({ oneway: 'yes', cycleway: 'lane' }), [{ side: 1, kind: 'lane' }]);
  assert.deepEqual(bicycleSides({ cycleway: 'opposite_lane', oneway: 'yes' }), [
    { side: -1, kind: 'lane' },
  ]);
  assert.equal(bicycleSides({ cycleway: 'track' }).length, 2);
});
test('all projected crossing and bike geometry retains source feature IDs and tags', () => {
  for (const [key, file] of [
    ['crossings', 'route-crosswalks-osm'],
    ['bikeRoads', 'route-bike-lanes-osm'],
    ['cycleways', 'route-cycleways-osm'],
  ]) {
    const raw = JSON.parse(readFileSync(new URL(`../reference/${file}.json`, import.meta.url)));
    assert.equal(data[key].length, raw.elements.length);
    for (const f of data[key]) {
      const original = raw.elements.find((e) => e.id === f.id);
      assert.deepEqual(f.tags, original.tags);
      assert.equal(f.points.length, original.geometry.length);
      const g = original.geometry[0];
      assert.ok(
        Math.hypot(
          f.points[0][0] - (g.lon + 122.395) * 87900,
          f.points[0][1] - (37.786 - g.lat) * 111200,
        ) < 0.001,
      );
    }
  }
});
