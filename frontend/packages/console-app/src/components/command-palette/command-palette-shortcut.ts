const IGNORED_TARGET_SELECTOR = '.xterm, .monaco-editor';

const MAC_COMMAND_KEY = String.fromCodePoint(0x2318);

export const isMacUserAgent = (userAgent: string): boolean =>
  /Mac|iPhone|iPad|iPod/.test(userAgent);

export const getCommandPaletteShortcutLabel = (isMac: boolean): string =>
  isMac ? `${MAC_COMMAND_KEY}K` : 'Ctrl+K';

const hasPlatformModifier = (event: KeyboardEvent, isMac: boolean): boolean =>
  isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;

const isInsideIgnoredTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(IGNORED_TARGET_SELECTOR) !== null;

export const isCommandPaletteShortcut = (event: KeyboardEvent, isMac: boolean): boolean =>
  !event.defaultPrevented &&
  !event.repeat &&
  event.key?.toLowerCase() === 'k' &&
  !event.altKey &&
  !event.shiftKey &&
  hasPlatformModifier(event, isMac) &&
  !isInsideIgnoredTarget(event.target);
