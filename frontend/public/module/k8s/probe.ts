import * as _ from 'lodash';

import {
  ContainerLifecycle,
  ContainerLifecycleStage,
  ContainerProbe,
  ExecProbe,
  Handler,
  HTTPGetProbe,
  TCPSocketProbe,
} from './';

const HookAction = Object.freeze({
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
});

const parsers = {
  exec: function(str: string) {
    return {
      command: str.split(' '),
    };
  },

  httpGet: function(str: string) {
    if (!str) {
      return null;
    }
    // XXX: Kubernetes allows for named ports, but the URL spec says ports must be digits.
    let scheme: string, port: string, host: string, hostname: string, rest: string[];
    [scheme, ...rest] = str.split('://');
    if (!scheme) {
      return null;
    }
    str = rest.join();
    [host, ...rest] = str.split('/');
    const path = `/${rest.join()}`;
    [hostname, port] = host.split(':');
    if (_.isUndefined(port)) {
      if (scheme === 'http') {
        port = '80';
      } else if (scheme === 'https') {
        port = '443';
      }
    }
    if (_.isUndefined(port)) {
      return null;
    }
    return {
      host: [scheme, '://', hostname].join(''),
      path,
      port: parseInt(port, 10) || port,
    };
  },

  tcpSocket: function(str: string) {
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
  exec: function(cmd: ExecProbe): string {
    if (_.isEmpty(cmd) || _.isEmpty(cmd.command)) {
      return '';
    }
    return cmd.command.join(' ');
  },

  httpGet: function(cmd: HTTPGetProbe, podIP: string): string {
    let c = '';
    if (_.isEmpty(cmd)) {
      return c;
    }

    c += cmd.host || podIP;
    if (cmd.port) {
      c += `:${cmd.port}`;
    }

    if (cmd.path) {
      if (cmd.path.startsWith('/')) {
        c += cmd.path;
      } else {
        c += `/${cmd.path}`;
      }
    }
    return c;
  },

  tcpSocket: function(cmd: TCPSocketProbe): string {
    if (!cmd || !cmd.port) {
      return '';
    }
    return `${cmd.port}`;
  },
};

function inferAction(obj: Handler) {
  if (_.isEmpty(obj)) {
    return;
  }
  const keys = _.keys(obj);
  if (_.isEmpty(keys)) {
    return;
  }
  return HookAction[keys[0]];
}

export function flattenCmd(type: string, cmd: any, podIP?: string) {
  return flatteners[type](cmd, podIP);
}

export function parseCmd(type: string, cmd: any) {
  return parsers[type](cmd);
}

function getActionLabel(action): string {
  if (action) {
    return action.label;
  }
  return '';
}

export function getActionLabelFromObject(obj: Handler): string {
  const a = inferAction(obj);
  return getActionLabel(a);
}

export const getLifecycleHookLabel = function(lifecycle: ContainerLifecycle, stage: ContainerLifecycleStage) {
  if (!lifecycle || !stage || !lifecycle[stage]) {
    return '';
  }
  return getActionLabelFromObject(lifecycle[stage]);
};

// Maps an api config object to a simple flattened type and command field.
export const mapLifecycleConfigToFields = function(lifecycle: ContainerLifecycle) {
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

  if (!lifecycle) {
    return f;
  }

  if (!_.isEmpty(lifecycle.postStart)) {
    const k = _.keys(lifecycle.postStart);
    f.postStart.type = k[0];
    f.postStart.cmd = flattenCmd(k[0], lifecycle.postStart[k[0]]);
  }

  if (!_.isEmpty(lifecycle.preStop)) {
    const k = _.keys(lifecycle.preStop);
    f.preStop.type = k[0];
    f.preStop.cmd = flattenCmd(k[0], lifecycle.preStop[k[0]]);
  }

  return f;
};

export const mapProbeToFields = function(probe: ContainerProbe, podIP: string) {
  const f = {
    type: 'exec',
    cmd: '',
  };

  if (_.isEmpty(probe)) {
    return f;
  }

  const k = _.keys(probe);
  if (!_.isEmpty(k)) {
    f.type = k[0];
    f.cmd = flattenCmd(k[0], probe[k[0]], podIP);
  }

  return f;
};
