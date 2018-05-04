/**
 * @fileOverview
 * WebSocket factory and utility wrapper.
 *
 */
/* eslint-disable no-console */

function createURL(host, path) {
  let url;

  if (host === 'auto') {
    if (location.protocol === 'https:') {
      url = 'wss://';
    } else {
      url = 'ws://';
    }
    url += location.host;
  } else {
    url = host;
  }

  if (path) {
    url += path;
  }
  return url;
}

export function WSFactory(id, options) {
  this.id = id;
  this.options = options;
  this.url = createURL(options.host, options.path);
  this._paused = false;
  this._handlers = {
    open: [],
    close: [],
    error: [],
    message: [],
    destroy: [],
  };

  this._connect();

  if (this.options.bufferEnabled) {
    this.flushCanceler = setInterval(this.flushBuffer.bind(this), this.options.bufferFlushInterval);
  }
}

WSFactory.prototype._reconnect = function() {
  if (this._connectionAttempt || this._state === 'destroyed') {
    return;
  }

  let delay = 1000;

  const attempt = () => {
    if (!this.options.reconnect || this._state === 'open') {
      clearTimeout(this._connectionAttempt);
      this._connectionAttempt = null;
      return;
    }
    if (this.options.timeout && delay > this.options.timeout) {
      clearTimeout(this._connectionAttempt);
      this._connectionAttempt = null;
      this.destroy(true);
      return;
    }

    this._connect();
    delay = Math.round(Math.min(1.5 * delay, 60000));
    this._connectionAttempt = setTimeout(attempt, delay);
    console.log(`attempting reconnect in ${delay / 1000} seconds...`);
  };

  this._connectionAttempt = setTimeout(attempt, delay);
};

WSFactory.prototype._connect = function() {
  const that = this;
  this._state = 'init';
  this._buffer = [];
  try {
    this.ws = new WebSocket(this.url, this.options.subProtocols);
  } catch (e) {
    console.error('Error creating websocket:', e);
    this._reconnect();
    return;
  }

  this.ws.onopen = function() {
    console.log(`websocket open: ${that.id}`);
    that._state = 'open';
    that._triggerEvent({ type: 'open' });
    if (that._connectionAttempt) {
      clearTimeout(that._connectionAttempt);
      that._connectionAttempt = null;
    }
  };
  this.ws.onclose = function (evt) {
    console.log(`websocket closed: ${that.id}`, evt);
    that._state = 'closed';
    that._triggerEvent({ type: 'close', args: [evt] });
    that._reconnect();
  };
  this.ws.onerror = function (evt) {
    console.log(`websocket error: ${that.id}`);
    that._state = 'error';
    that._triggerEvent({ type: 'error', args: [evt] });
  };
  this.ws.onmessage = function(evt) {
    const msg = (that.options && that.options.jsonParse) ? JSON.parse(evt.data) : evt.data;
    // In some browsers, onmessage can fire after onclose/error. Don't update state to be incorrect.
    if (that._state !== 'destroyed' && that._state !== 'closed'){
      that._state = 'open';
    }
    that._triggerEvent({ type: 'message', args: [msg] });
  };
};

WSFactory.prototype._registerHandler = function(type, fn) {
  if (this._state === 'destroyed') {
    return;
  }
  this._handlers[type].push(fn);
};

// Addds an event to the buffer.
WSFactory.prototype._bufferEvent = function(evt) {
  this._buffer.unshift(evt);
  // If max is reached, remove oldest mevents.
  if (this.options.bufferMax) {
    while(this._buffer.length > this.options.bufferMax) {
      this._buffer.pop();
    }
  }
};

// Invoke all registered handler callbacks for a given event type.
WSFactory.prototype._invokeHandlers = function(evt) {
  const handlers = this._handlers[evt.type];
  if (!handlers) {
    return;
  }
  handlers.forEach(function(h) {
    try {
      h.apply(null, evt.args || []);
    } catch(e) {
      console.error(e);
    }
  });
};

// Triggers event to be buffered or invoked depending on config.
WSFactory.prototype._triggerEvent = function(evt) {
  if (this._state === 'destroyed') {
    return;
  }
  // Only bufer "message" events, so "error" and "close" etc can pass thru.
  if (this.options.bufferEnabled && evt.type === 'message') {
    this._bufferEvent(evt);
  } else {
    this._invokeHandlers(evt);
  }
};

WSFactory.prototype.onmessage = function(fn) {
  this._registerHandler('message', fn);
  return this;
};

WSFactory.prototype.onerror = function(fn) {
  this._registerHandler('error', fn);
  return this;
};

WSFactory.prototype.onopen = function(fn) {
  this._registerHandler('open', fn);
  return this;
};

WSFactory.prototype.onclose = function(fn) {
  this._registerHandler('close', fn);
  return this;
};

WSFactory.prototype.ondestroy = function(fn) {
  this._registerHandler('destroy', fn);
  return this;
};

WSFactory.prototype.flushBuffer = function() {
  if (this._paused) {
    return;
  }
  while (this._buffer.length) {
    this._invokeHandlers(this._buffer.pop());
  }
};

// Pausing prevents any buffer flushing until unpaused.
WSFactory.prototype.pause = function() {
  this._paused = true;
};

WSFactory.prototype.unpause = function() {
  this._paused = false;
  this.flushBuffer();
};

WSFactory.prototype.isPaused = function() {
  return this._paused;
};

WSFactory.prototype.state = function() {
  return this._state;
};

WSFactory.prototype.bufferSize = function() {
  return this._buffer.length;
};

WSFactory.prototype.destroy = function(timedout) {
  console.log(`destroying websocket: ${this.id}`);
  if (this._state === 'destroyed') {
    return;
  }

  try {
    this.ws.close();
  } catch (e) {
    console.error(e);
  }

  clearInterval(this.flushCanceler);
  clearTimeout(this._connectionAttempt);

  if (this.ws) {
    this.ws.onopen = null;
    this.ws.onclose = null;
    this.ws.onerror = null;
    this.ws.onmessage = null;
    delete this.ws;
  }

  try {
    this._triggerEvent({ type: 'destroy', args: [timedout]});
  } catch (e) {
    console.error(e);
  }

  this._state = 'destroyed';

  delete this.options;
  delete this._buffer;
};
