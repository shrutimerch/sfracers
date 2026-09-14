import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBuildSteps, finishBuildSteps } from '../game/loading/build-steps.ts';

function* exampleBuild() {
  let result = 0;
  for (let i = 0; i < 4; i++) {
    const until = performance.now() + 10;
    while (performance.now() < until) {}
    result += i;
    yield;
  }
  return result;
}

test('background construction yields to input and returns the same world result', async () => {
  let inputHandled = false;
  setTimeout(() => { inputHandled = true; }, 0);
  assert.equal(await runBuildSteps(exampleBuild()), finishBuildSteps(exampleBuild()));
  assert.ok(inputHandled);
});

test('navigation cancels remaining build steps and runs cleanup', async () => {
  const controller = new AbortController();
  let cleaned = false, steps = 0;
  function* build() {
    try {
      for (;;) {
        steps++;
        const until = performance.now() + 10;
        while (performance.now() < until) {}
        yield;
      }
    } finally { cleaned = true; }
  }
  setTimeout(() => controller.abort(), 0);
  await assert.rejects(runBuildSteps(build(), controller.signal), { name: 'AbortError' });
  assert.ok(cleaned);
  assert.equal(steps, 1);
});
