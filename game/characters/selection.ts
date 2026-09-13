import { DEFAULT_CHARACTER, type CharacterId } from './roster.ts';
import type { RaceSimulation } from '../simulation/simulation.ts';

// Keep the rendered driver and the physics roster together, including when a
// development refresh rebuilds the engine while React retains the garage choice.
export function createCharacterSelection(
  simulation: RaceSimulation,
  renderCharacter: (id: CharacterId) => void,
  initialCharacter: CharacterId = DEFAULT_CHARACTER,
) {
  const selectCharacter = (id: CharacterId) => {
    if (!simulation.selectCharacter(id)) return false;
    renderCharacter(simulation.state.character);
    return true;
  };
  selectCharacter(initialCharacter);
  return {
    selectCharacter,
    start(id: CharacterId = simulation.state.character) {
      if (id !== simulation.state.character && !selectCharacter(id)) return false;
      renderCharacter(simulation.state.character);
      simulation.start();
      return true;
    },
  };
}
