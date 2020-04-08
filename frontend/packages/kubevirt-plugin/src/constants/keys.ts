export const KEY_CODES = {
  BACKSPACE: 8,
  TAB: 9,
  SHIFT: 16,
  LEFT_KEY: 37,
  RIGHT_KEY: 39,
  DELETE_KEY: 46,
  0: 48,
  1: 49,
  9: 57,
  NUMPAD: {
    0: 96,
    1: 97,
    9: 105,
    SUBTRACT: 109,
  },
  HYPHEN_MINUS: 173,
  MINUS: 189,
  A: 65,
  C: 67,
  V: 86,
  X: 88,
};

export const INPUT_CTRL_COMBINATIONS_KEYS = [KEY_CODES.A, KEY_CODES.C, KEY_CODES.V, KEY_CODES.X];

export const INPUT_NAVIGATION_KEYS = [
  KEY_CODES.BACKSPACE,
  KEY_CODES.TAB,
  KEY_CODES.SHIFT,
  KEY_CODES.LEFT_KEY,
  KEY_CODES.RIGHT_KEY,
  KEY_CODES.DELETE_KEY,
];

export const isMinus = (keyCode) => {
  switch (keyCode) {
    case KEY_CODES.HYPHEN_MINUS:
    case KEY_CODES.MINUS:
    case KEY_CODES.NUMPAD.SUBTRACT:
      return true;
    default:
      return false;
  }
};
