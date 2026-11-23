import { WSFactory } from '../ws-factory';

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

const createMockWS = () => ({
  readyState: CONNECTING,
  close: jest.fn(),
  send: jest.fn(),
  onopen: null,
  onclose: null,
  onerror: null,
  onmessage: null,
});

let lastMockWS: ReturnType<typeof createMockWS>;

const MockWebSocket = Object.assign(
  jest.fn().mockImplementation(() => {
    lastMockWS = createMockWS();
    return lastMockWS;
  }),
  { CONNECTING, OPEN, CLOSING, CLOSED },
);

(global as any).WebSocket = MockWebSocket;

const createWSFactory = () =>
  new WSFactory('test', {
    host: 'wss://localhost',
    path: '/test',
    subprotocols: [],
  });

describe('WSFactory', () => {
  beforeEach(() => {
    MockWebSocket.mockClear();
  });

  describe('send', () => {
    it('should send data when readyState is OPEN', () => {
      const ws = createWSFactory();
      lastMockWS.readyState = OPEN;

      ws.send('test-data');

      expect(lastMockWS.send).toHaveBeenCalledWith('test-data');
    });

    it('should not send data when readyState is CONNECTING', () => {
      const ws = createWSFactory();
      lastMockWS.readyState = CONNECTING;

      ws.send('test-data');

      expect(lastMockWS.send).not.toHaveBeenCalled();
    });

    it('should not send data when readyState is CLOSING', () => {
      const ws = createWSFactory();
      lastMockWS.readyState = CLOSING;

      ws.send('test-data');

      expect(lastMockWS.send).not.toHaveBeenCalled();
    });

    it('should not send data when readyState is CLOSED', () => {
      const ws = createWSFactory();
      lastMockWS.readyState = CLOSED;

      ws.send('test-data');

      expect(lastMockWS.send).not.toHaveBeenCalled();
    });

    it('should not throw when ws is destroyed', () => {
      const ws = createWSFactory();
      ws.destroy();

      expect(() => ws.send('test-data')).not.toThrow();
    });
  });
});
