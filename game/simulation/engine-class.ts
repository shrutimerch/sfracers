export const ENGINE_CLASSES = {
  50: { label: 'Easy', description: 'Same kart speed · forgiving rivals', rivals: 0.55 },
  100: { label: 'Normal', description: 'Same kart speed · original rivals', rivals: 1 },
  150: { label: 'Hard', description: 'Same kart speed · relentless rivals', rivals: 1.5 },
} as const;
export type EngineClass = keyof typeof ENGINE_CLASSES;
export function isEngineClass(value: number): value is EngineClass {
  return value === 50 || value === 100 || value === 150;
}
