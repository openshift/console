const createURL = (host: string, path: string): string => {
  let url;

  if (host === 'auto') {
    if (window.location.protocol === 'https:') {
      url = 'wss://';
    } else {
      url = 'ws://';
    }
    url += window.location.host;
  } else {
    url = host;
  }

  if (path) {
    url += path;
  }

  return url;
};

export type WSOptions = {
  host: string;
  path: string;
  subprotocols: string[];
  reconnect?: boolean;
  jsonParse?: boolean;
  bufferMax?: number;
  bufferFlushInterval?: number;
  timeout?: number;
};

type GenericHandler<T = any> = (data: T) => void;
export type OpenHandler = GenericHandler<undefined>; // nothing is sent
export type CloseHandler = GenericHandler<CloseEvent>;
export type ErrorHandler = GenericHandler<Event>;
/**
 * The WebSocket can send JSON that is parsed, or we just send it through as-is
 */
export type MessageDataType = object | any;
export type MessageHandler = GenericHandler<MessageDataType>;
export type DestroyHandler = GenericHandler<undefined>;
export type BulkMessageHandler = GenericHandler<MessageDataType>;

type WSHandlers = {
  open: OpenHandler[];
  close: CloseHandler[];
  error: ErrorHandler[];
  message: MessageHandler[];
  destroy: DestroyHandler[];
  bulkmessage: BulkMessageHandler[];
};

type WSHandlerType = keyof WSHandlers;

/**
 * @class WebSocket factory and utility wrapper.
 */
export class WSFactory {
  private readonly id: string;

  private readonly url: string;

  private paused: boolean;

  private handlers: WSHandlers;

  private state: string;

  private messageBuffer: MessageDataType[];

  private connectionAttempt: ReturnType<typeof setTimeout>;

  private readonly flushCanceler: ReturnType<typeof setInterval>;

  private options: WSOptions;

  private bufferMax: number;

  private ws: WebSocket;

  /**
   * @param id - unique id for the WebSocket.
   * @param options - websocket options to initate the WebSocket with.
   */
  constructor(id: string, options: WSOptions) {
    this.id = id;
    this.options = options;
    this.bufferMax = options.bufferMax || 0;
    this.url = createURL(options.host, options.path);
    this.paused = false;
    this.handlers = {
      open: [],
      close: [],
      error: [],
      message: [],
      destroy: [],
      bulkmessage: [],
    };
    this.connect();

    if (this.bufferMax) {
      this.flushCanceler = setInterval(
        this.flushMessageBuffer.bind(this),
        this.options.bufferFlushInterval || 500,
      );
    }
  }

  private reconnect() {
    if (this.connectionAttempt || this.state === 'destroyed') {
      return;
    }

    let delay = 1000;

    const attempt = () => {
      if (!this.options.reconnect || this.state === 'open') {
        clearTimeout(this.connectionAttempt);
        this.connectionAttempt = null;
        return;
      }
      if (this.options.timeout && delay > this.options.timeout) {
        clearTimeout(this.connectionAttempt);
        this.connectionAttempt = null;
        this.destroy();
        return;
      }

      this.connect();
      delay = Math.round(Math.min(1.5 * delay, 60000));
      this.connectionAttempt = setTimeout(attempt, delay);
      // eslint-disable-next-line no-console
      console.log(`attempting reconnect in ${delay / 1000} seconds...`);
    };

    this.connectionAttempt = setTimeout(attempt, delay);
  }

  private connect() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.state = 'init';
    this.messageBuffer = [];
    try {
      this.ws = new WebSocket(this.url, this.options.subprotocols);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error creating websocket:', e);
      this.reconnect();
      return;
    }

    this.ws.onopen = function() {
      // eslint-disable-next-line no-console
      console.log(`websocket open: ${that.id}`);
      that.state = 'open';
      that.triggerEvent('open', undefined);
      if (that.connectionAttempt) {
        clearTimeout(that.connectionAttempt);
        that.connectionAttempt = null;
      }
    };
    this.ws.onclose = function(evt: CloseEvent) {
      // eslint-disable-next-line no-console
      console.log(`websocket closed: ${that.id}`, evt);
      that.state = 'closed';
      that.triggerEvent('close', evt);
      that.reconnect();
    };
    this.ws.onerror = function(evt: Event) {
      // eslint-disable-next-line no-console
      console.log(`websocket error: ${that.id}`);
      that.state = 'error';
      that.triggerEvent('error', evt);
    };
    this.ws.onmessage = function(evt: Parameters<typeof WebSocket.prototype.onmessage>[0]) {
      const msg = that.options?.jsonParse ? JSON.parse(evt.data) : evt.data;
      // In some browsers, onmessage can fire after onclose/error. Don't update state to be incorrect.
      if (that.state !== 'destroyed' && that.state !== 'closed') {
        that.state = 'open';
      }
      that.triggerEvent('message', msg);
    };
  }

  private registerHandler(type: WSHandlerType, fn: GenericHandler) {
    if (this.state === 'destroyed') {
      return;
    }
    this.handlers[type].push(fn);
  }

  /**
   * Invoke all registered handler callbacks for a given event type.
   */
  private invokeHandlers(type: WSHandlerType, data: MessageDataType) {
    const handlers = this.handlers[type];
    if (!handlers) {
      return;
    }
    handlers.forEach(function(h) {
      try {
        h(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('WS handling failed:', e);
      }
    });
  }

  /**
   * Triggers event to be buffered or invoked depending on config.
   */
  private triggerEvent(type: WSHandlerType, event?: MessageDataType) {
    if (this.state === 'destroyed') {
      return;
    }

    // Only buffer "message" events, so "error" and "close" etc can pass thru.
    if (this.bufferMax && type === 'message') {
      this.messageBuffer.push(event);

      if (this.messageBuffer.length > this.bufferMax) {
        this.messageBuffer.shift();
      }

      return;
    }

    this.invokeHandlers(type, event);
  }

  onmessage(fn: MessageHandler) {
    this.registerHandler('message', fn);
    return this;
  }

  onbulkmessage(fn: BulkMessageHandler) {
    this.registerHandler('bulkmessage', fn);
    return this;
  }

  onerror(fn: ErrorHandler) {
    this.registerHandler('error', fn);
    return this;
  }

  onopen(fn: OpenHandler) {
    this.registerHandler('open', fn);
    return this;
  }

  onclose(fn: CloseHandler) {
    this.registerHandler('close', fn);
    return this;
  }

  ondestroy(fn: DestroyHandler) {
    this.registerHandler('destroy', fn);
    return this;
  }

  flushMessageBuffer() {
    if (this.paused) {
      return;
    }

    if (!this.messageBuffer.length) {
      return;
    }

    if (this.handlers.bulkmessage.length) {
      this.invokeHandlers('bulkmessage', this.messageBuffer);
    } else {
      this.messageBuffer.forEach((e) => this.invokeHandlers('message', e));
    }

    this.messageBuffer = [];
  }

  /**
   *  Pausing prevents any buffer flushing until unpaused.
   */
  pause() {
    this.paused = true;
  }

  unpause() {
    this.paused = false;
    this.flushMessageBuffer();
  }

  isPaused() {
    return this.paused;
  }

  getState() {
    return this.state;
  }

  bufferSize() {
    return this.messageBuffer.length;
  }

  destroy() {
    // eslint-disable-next-line no-console
    console.log(`destroying websocket: ${this.id}`);
    if (this.state === 'destroyed') {
      return;
    }

    try {
      if (this.ws) {
        this.ws.close();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error while close WS socket', e);
    }

    clearInterval(this.flushCanceler);
    clearTimeout(this.connectionAttempt);

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      delete this.ws;
    }

    try {
      this.triggerEvent('destroy');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error while trigger destroy event for WS socket', e);
    }

    this.state = 'destroyed';

    delete this.options;
    this.messageBuffer = [];
  }

  send(data: Parameters<typeof WebSocket.prototype.send>[0]) {
    this.ws && this.ws.send(data);
  }
}
