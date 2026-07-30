/** Stub MCP list watch WebSockets only so intercepted GETs are not overwritten in Redux; other watches use the real WebSocket. */
export const stubMachineConfigPoolWatchWebSocket = (win: Window) => {
  const OriginalWebSocket = win.WebSocket;

  class StubWebSocket extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const urlString = url.toString();

      // MCP list watch URL only; all other sockets stay native.
      if (urlString.includes('machineconfiguration.openshift.io/v1/machineconfigpools')) {
        // eslint-disable-next-line no-constructor-return
        return ({
          close: () => {},
          send: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
          readyState: 3, // CLOSED
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
        } as unknown) as WebSocket;
      }

      return new OriginalWebSocket(url, protocols);
    }
  }

  // Replace the global WebSocket with our stub
  // eslint-disable-next-line no-param-reassign
  win.WebSocket = (StubWebSocket as unknown) as typeof WebSocket;
};
