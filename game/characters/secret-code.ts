export const SECRET_CODES = [
  [
    'arrowup',
    'arrowup',
    'arrowdown',
    'arrowdown',
    'arrowleft',
    'arrowright',
    'arrowleft',
    'arrowright',
    'b',
    'a',
  ],
  ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'a', 'b'],
];
export function createSecretCode() {
  let history: string[] = [];
  let last = 0;
  return {
    reset() {
      history = [];
      last = 0;
    },
    press(key: string, repeat = false, now = Date.now()) {
      if (repeat) return false;
      if (now - last > 5000) history = [];
      last = now;
      history.push(key.toLowerCase());
      history = history.slice(-10);
      const matched = SECRET_CODES.some((code) =>
        code.every((value, index) => history[history.length - code.length + index] === value),
      );
      if (matched) history = [];
      return matched;
    },
  };
}
