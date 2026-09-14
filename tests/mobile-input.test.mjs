import test from 'node:test';
import assert from 'node:assert/strict';
import { createRaceSimulation } from '../game/simulation/simulation.ts';
const track = { roads: [{ name: 'Straight', points: [[0,0],[10000,0]], width: 100 }], route: [[0,0],[10000,0],[0,0]], buildings: [] };
const controls = (steer = 0) => ({ steer, brake: false, drift: false, boost: false });
function racing() { const sim = createRaceSimulation(track); sim.start(); sim.step(3); return sim; }
function step(sim, frames) { for (let i=0;i<frames;i++) sim.step(1/60); }
test('mobile accelerates automatically and brake slows then reverses', () => {
 const sim=racing(); sim.setMobileInput(controls()); step(sim,120); const speed=sim.state.speed; assert.ok(speed>0);
 sim.setMobileInput({...controls(), brake:true}); step(sim,30); assert.ok(sim.state.speed<speed); step(sim,600); assert.ok(sim.state.speed<0);
});
test('analog steering allows gentler turns than full steering', () => {
 const partial=racing(), full=racing();
 for(const sim of [partial,full]) { sim.setMobileInput(controls()); step(sim,120); }
 const angle=partial.state.angle;
 partial.setMobileInput(controls(.25)); full.setMobileInput(controls(1)); step(partial,15);step(full,15);
 assert.ok(Math.abs(partial.state.angle-angle)>0);
 assert.ok(Math.abs(partial.state.angle-angle)<Math.abs(full.state.angle-angle));
});
test('blur and reset clear mobile throttle and steering', () => {
 const sim=racing(); sim.setMobileInput(controls(1)); step(sim,30); sim.blur(); assert.equal(sim.state.mode,'paused');
 sim.start(); sim.step(3); step(sim,60); assert.equal(sim.state.speed,0);
 sim.setMobileInput(controls(NaN)); step(sim,10); assert.ok(Number.isFinite(sim.state.angle));
 sim.setMobileInput(null); const speed=sim.state.speed; step(sim,30); assert.ok(sim.state.speed<speed);
});
