angular.module('k8s')
.service('k8sLifecycle', function(_, k8sEnum, k8sUtil) {
  'use strict';

  var flatteners, parsers;

  parsers = {
    exec: function(str) {
      return {
        command: str.split(' '),
      };
    },

    httpGet: function(str) {
      var u = k8sUtil.parseURL(str);
      if (!u.valid) {
        return null;
      }
      return {
        host: [u.scheme, '://', u.host].join(''),
        path: u.path,
        port: u.port,
      };
    },

    tcpSocket: function(str) {
      if (_.isEmpty(str)) {
        return null;
      }
      return {
        port: str,
      };
    },
  };

  flatteners = {
    exec: function(cmd) {
      if (_.isEmpty(cmd) || _.isEmpty(cmd.command)) {
        return '';
      }
      return cmd.command.join(' ');
    },

    httpGet: function(cmd) {
      var c = '';
      if (_.isEmpty(cmd)) {
        return c;
      }
      c += cmd.host;
      if (cmd.port) {
        c += ':' + cmd.port;
      }
      c += cmd.path;
      return c;
    },

    tcpSocket: function(cmd) {
      if (!cmd || !cmd.port) {
        return '';
      }
      return cmd.port;
    },
  };

  function flattenCmd(type, cmd) {
    return flatteners[type](cmd);
  }

  function parseCmd(type, cmd) {
    return parsers[type](cmd);
  }

  function inferType(lifecycle) {
    var keys;
    if (_.isEmpty(lifecycle)) {
      return;
    }
    keys = _.keys(lifecycle);
    if (_.isEmpty(keys)) {
      return;
    }
    return k8sEnum.LifecycleHook[keys[0]];
  }

  this.inferType = inferType;
  this.flattenCmd = flattenCmd;
  this.parseCmd = parseCmd;

  this.getHookLabel = function(lifecycle, stage) {
    var type;
    if (!lifecycle || !stage || !lifecycle[stage]) {
      return '';
    }
    type = inferType(lifecycle[stage]);
    if (!type) {
      return '';
    }
    return type.label;
  };

  // Maps an api config object to a simple flattened type and command field.
  this.mapLifecycleConfigToFields = function(c) {
    var k, f;

    f = {
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
      k = _.keys(c.postStart);
      f.postStart.type = k[0];
      f.postStart.cmd = flattenCmd(k[0], c.postStart[k[0]]);
    }

    if (!_.isEmpty(c.preStop)) {
      k = _.keys(c.preStop);
      f.preStop.type = k[0];
      f.preStop.cmd = flattenCmd(k[0], c.preStop[k[0]]);
    }

    return f;
  };

  this.mapFieldsToLifecycleConfig = function(f) {
    var c = {};
    if (_.isEmpty(f.postStart.cmd) && _.isEmpty(f.preStop.cmd)) {
      return null;
    }

    if (!_.isEmpty(f.postStart.cmd)) {
      c.postStart = {};
      c.postStart[f.postStart.type] = parseCmd(f.postStart.type, f.postStart.cmd);
    }

    if (!_.isEmpty(f.preStop.cmd)) {
      c.preStop = {};
      c.preStop[f.preStop.type] = parseCmd(f.preStop.type, f.preStop.cmd);
    }

    if (_.isEmpty(c)) {
      return null;
    }

    return c;
  };

});
