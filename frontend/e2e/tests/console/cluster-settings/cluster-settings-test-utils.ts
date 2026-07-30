import type { Page } from '@playwright/test';

/**
 * Stub WebSocket watches whose URL contains any of the given substrings.
 * This prevents real watch data from overwriting mocked GET responses.
 * Must be called before any navigation (uses addInitScript).
 */
export async function stubWebSocketWatches(page: Page, urlSubstrings: string[]): Promise<void> {
  await page.addInitScript((patterns: string[]) => {
    const OriginalWebSocket = window.WebSocket;
    (window as any).WebSocket = function (url: string | URL, protocols?: string | string[]) {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (patterns.some((p) => urlString.includes(p))) {
        return {
          close: () => {},
          send: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
          readyState: 3,
          url: urlString,
          protocol: '',
          extensions: '',
          bufferedAmount: 0,
          binaryType: 'blob' as BinaryType,
          onopen: null,
          onerror: null,
          onclose: null,
          onmessage: null,
          CONNECTING: 0,
          OPEN: 1,
          CLOSING: 2,
          CLOSED: 3,
        };
      }
      return new OriginalWebSocket(url, protocols);
    };
    (window as any).WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    (window as any).WebSocket.OPEN = OriginalWebSocket.OPEN;
    (window as any).WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    (window as any).WebSocket.CLOSED = OriginalWebSocket.CLOSED;
  }, urlSubstrings);
}
