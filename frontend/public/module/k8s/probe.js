import * as _ from 'lodash-es';

const HookAction = {
  exec: {
    id: 'exec',
    label: 'Exec Command',
  },
  httpGet: {
    id: 'httpGet',
    label: 'HTTP Get',
  },
  tcpSocket: {
    id: 'tcpSocket',
    label: 'TCP Socket (Port)',
  },
};

const parsers = {
  exec: function(str) {
    return {
      command: str.split(' '),
    };
  },

  httpGet: function(str) {
    if (!str) {
      return null;
    }
    // XXX: Kubernetes allows for named ports, but the URL spec says ports must be digits.
    let scheme, path, port, host, hostname, rest;
    [scheme, ...rest] = str.split('://');
    if (!scheme) {
      return null;
    }
    str = rest.join();
    [host, ...rest] = str.split('/');
    path = `/${rest.join()}`;
    [hostname, port] = host.split(':');
    if (_.isUndefined(port)) {
      if (scheme === 'http') {
        port = 80;
      } else if (scheme === 'https') {
        port = 443;
      }
    }
    if (_.isUndefined(port)) {
      return null;
    }
    return {
      host: [scheme, '://', hostname].join(''),
      path: path,
      port: parseInt(port, 10) || port,
    };
  },

  tcpSocket: function(str) {
    if (str == null || str === '') {
      return null;
    }

    return {
      // as per http://kubernetes.io/docs/api-reference/v1/definitions/#_v1_tcpsocketaction
      // port can be either number or IANA name
      port: /^\d+$/.test(str) ? (+str) : str,
    };
  },
};

const flatteners = {
  exec: function(cmd) {
    if (_.isEmpty(cmd) || _.isEmpty(cmd.command)) {
      return '';
    }
    return cmd.command.join(' ');
  },

  httpGet: function(cmd, podIP) {
    let c = '';
    if (_.isEmpty(cmd)) {
      return c;
    }

    c += cmd.host || podIP;
    if (cmd.port) {
      c += `:${cmd.port}`;
    }

    if (cmd.path) {
      c += cmd.path;
    }
    return c;
  },

  tcpSocket: function(cmd) {
    if (!cmd || !cmd.port) {
      return '';
    }
    return `${cmd.port}`;
  },
};

function inferAction(obj) {
  if (_.isEmpty(obj)) {
    return;
  }
  const keys = _.keys(obj);
  if (_.isEmpty(keys)) {
    return;
  }
  return HookAction[keys[0]];
}

export function flattenCmd(type, cmd, podIP) {
  return flatteners[type](cmd, podIP);
}

export function parseCmd(type, cmd) {
  return parsers[type](cmd);
}

function getActionLabel(action) {
  if (action) {
    return action.label;
  }
  return '';
}

export function getActionLabelFromObject(obj) {
  const a = inferAction(obj);
  return getActionLabel(a);
}

export const getLifecycleHookLabel = function(lifecycle, stage) {
  if (!lifecycle || !stage || !lifecycle[stage]) {
    return '';
  }
  return getActionLabelFromObject(lifecycle[stage]);
};

// Maps an api config object to a simple flattened type and command field.
export const mapLifecycleConfigToFields = function(c) {
  const f = {
    postStart: {
      type: 'exec',
      cmd: '',
    },
    preStop: {
      type: 'exec',
      cmd: '',
    },
  };

  if (!c) {
    return f;
  }

  if (!_.isEmpty(c.postStart)) {
    const k = _.keys(c.postStart);
    f.postStart.type = k[0];
    f.postStart.cmd = flattenCmd(k[0], c.postStart[k[0]]);
  }

  if (!_.isEmpty(c.preStop)) {
    const k = _.keys(c.preStop);
    f.preStop.type = k[0];
    f.preStop.cmd = flattenCmd(k[0], c.preStop[k[0]]);
  }

  return f;
};

export const mapProbeToFields = function(c, podIP) {
  const f = {
    initialDelaySeconds: '',
    type: 'exec',
    cmd: '',
  };

  if (_.isEmpty(c)) {
    return f;
  }

  if (_.isNumber(parseInt(c.initialDelaySeconds, 10))) {
    f.initialDelaySeconds = c.initialDelaySeconds;
  }

  const k = _.keys(c);
  if (!_.isEmpty(k)) {
    f.type = k[0];
    f.cmd = flattenCmd(k[0], c[k[0]], podIP);
  }

  return f;
};
