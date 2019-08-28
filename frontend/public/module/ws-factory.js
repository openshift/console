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
  this.bufferMax = options.bufferMax || 0;
  this.url = createURL(options.host, options.path);
  this._paused = false;
  this._handlers = {
    open: [],
    close: [],
    error: [],
    message: [],
    destroy: [],
    // psuedo event :-/
    bulkmessage: [],
  };

  this._connect();

  if (this.bufferMax) {
    this.flushCanceler = setInterval(this.flushMessageBuffer.bind(this), this.options.bufferFlushInterval || 500);
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
  this._messageBuffer = [];
  try {
    this.ws = new WebSocket(this.url, this.options.subprotocols);
  } catch (e) {
    console.error('Error creating websocket:', e);
    this._reconnect();
    return;
  }

  this.ws.onopen = function() {
    console.log(`websocket open: ${that.id}`);
    that._state = 'open';
    that._triggerEvent('open');
    if (that._connectionAttempt) {
      clearTimeout(that._connectionAttempt);
      that._connectionAttempt = null;
    }
  };
  this.ws.onclose = function (evt) {
    console.log(`websocket closed: ${that.id}`, evt);
    that._state = 'closed';
    that._triggerEvent('close', evt);
    that._reconnect();
  };
  this.ws.onerror = function (evt) {
    console.log(`websocket error: ${that.id}`);
    that._state = 'error';
    that._triggerEvent('error', evt);
  };
  this.ws.onmessage = function(evt) {
    const msg = (that.options && that.options.jsonParse) ? JSON.parse(evt.data) : evt.data;
    // In some browsers, onmessage can fire after onclose/error. Don't update state to be incorrect.
    if (that._state !== 'destroyed' && that._state !== 'closed'){
      that._state = 'open';
    }
    that._triggerEvent('message', msg);
  };
};

WSFactory.prototype._registerHandler = function(type, fn) {
  if (this._state === 'destroyed') {
    return;
  }
  this._handlers[type].push(fn);
};

// Invoke all registered handler callbacks for a given event type.
WSFactory.prototype._invokeHandlers = function(type, data) {
  const handlers = this._handlers[type];
  if (!handlers) {
    return;
  }
  handlers.forEach(function(h) {
    try {
      h(data);
    } catch (e) {
      console.error(e);
    }
  });
};

// Triggers event to be buffered or invoked depending on config.
WSFactory.prototype._triggerEvent = function(type, event) {
  if (this._state === 'destroyed') {
    return;
  }

  // Only buffer "message" events, so "error" and "close" etc can pass thru.
  if (this.bufferMax && type === 'message') {
    this._messageBuffer.push(event);

    if (this._messageBuffer.length > this.bufferMax) {
      this._messageBuffer.shift();
    }

    return;
  }

  this._invokeHandlers(type, event);
};

WSFactory.prototype.onmessage = function(fn) {
  this._registerHandler('message', fn);
  return this;
};

WSFactory.prototype.onbulkmessage = function(fn) {
  this._registerHandler('bulkmessage', fn);
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

WSFactory.prototype.flushMessageBuffer = function() {
  if (this._paused) {
    return;
  }

  if (!this._messageBuffer.length) {
    return;
  }

  if (this._handlers.bulkmessage.length) {
    this._invokeHandlers('bulkmessage', this._messageBuffer);
  } else {
    this._messageBuffer.forEach(e => this._invokeHandlers('message', e));
  }

  this._messageBuffer = [];
};

// Pausing prevents any buffer flushing until unpaused.
WSFactory.prototype.pause = function() {
  this._paused = true;
};

WSFactory.prototype.unpause = function() {
  this._paused = false;
  this.flushMessageBuffer();
};

WSFactory.prototype.isPaused = function() {
  return this._paused;
};

WSFactory.prototype.state = function() {
  return this._state;
};

WSFactory.prototype.bufferSize = function() {
  return this._messageBuffer.length;
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
    this._triggerEvent('destroy', timedout);
  } catch (e) {
    console.error(e);
  }

  this._state = 'destroyed';

  delete this.options;
  this._messageBuffer = [];
};

WSFactory.prototype.send = function (data) {
  this.ws && this.ws.send(data);
};
