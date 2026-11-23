import {
  getCommandPaletteShortcutLabel,
  isCommandPaletteShortcut,
  isMacUserAgent,
} from '../command-palette-shortcut';

const dispatchKeydown = (init: KeyboardEventInit, target: Element = document.body) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);

  return event;
};

const appendElement = (className: string): HTMLElement => {
  const container = document.createElement('div');
  container.className = className;

  const textarea = document.createElement('textarea');
  container.appendChild(textarea);
  document.body.appendChild(container);

  return textarea;
};

describe('isCommandPaletteShortcut', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it.each`
    isMac    | init                                           | expected
    ${true}  | ${{ key: 'k', metaKey: true }}                 | ${true}
    ${true}  | ${{ key: 'K', metaKey: true }}                 | ${true}
    ${true}  | ${{ key: 'k', ctrlKey: true }}                 | ${false}
    ${true}  | ${{ key: 'k', metaKey: true, ctrlKey: true }}  | ${false}
    ${true}  | ${{ key: 'k', metaKey: true, shiftKey: true }} | ${false}
    ${true}  | ${{ key: 'k', metaKey: true, altKey: true }}   | ${false}
    ${true}  | ${{ key: 'k', metaKey: true, repeat: true }}   | ${false}
    ${false} | ${{ key: 'k', ctrlKey: true }}                 | ${true}
    ${false} | ${{ key: 'K', ctrlKey: true }}                 | ${true}
    ${false} | ${{ key: 'k', metaKey: true }}                 | ${false}
    ${false} | ${{ key: 'k', ctrlKey: true, metaKey: true }}  | ${false}
    ${false} | ${{ key: 'k', ctrlKey: true, shiftKey: true }} | ${false}
    ${false} | ${{ key: 'k', ctrlKey: true, repeat: true }}   | ${false}
    ${false} | ${{ key: 'j', ctrlKey: true }}                 | ${false}
    ${false} | ${{ key: 'k' }}                                | ${false}
  `('should return $expected for $init when isMac is $isMac', ({ isMac, init, expected }) => {
    expect(isCommandPaletteShortcut(dispatchKeydown(init), isMac)).toBe(expected);
  });

  it('should ignore an event that another handler already prevented', () => {
    document.body.addEventListener('keydown', (event) => event.preventDefault(), { once: true });

    expect(isCommandPaletteShortcut(dispatchKeydown({ key: 'k', ctrlKey: true }), false)).toBe(
      false,
    );
  });

  it.each(['xterm', 'monaco-editor'])('should ignore an event from inside .%s', (className) => {
    const target = appendElement(className);

    expect(
      isCommandPaletteShortcut(dispatchKeydown({ key: 'k', ctrlKey: true }, target), false),
    ).toBe(false);
  });
});

describe('isMacUserAgent', () => {
  it.each`
    userAgent                                                                 | expected
    ${'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'} | ${true}
    ${'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'}   | ${true}
    ${'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}         | ${false}
    ${'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'}                   | ${false}
  `('should return $expected for $userAgent', ({ userAgent, expected }) => {
    expect(isMacUserAgent(userAgent)).toBe(expected);
  });
});

describe('getCommandPaletteShortcutLabel', () => {
  it('should use the command key on macOS and Ctrl elsewhere', () => {
    expect(getCommandPaletteShortcutLabel(true)).toBe(`${String.fromCodePoint(0x2318)}K`);
    expect(getCommandPaletteShortcutLabel(false)).toBe('Ctrl+K');
  });
});
