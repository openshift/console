import { createStore, combineReducers } from 'redux';
import { List, Map, Set } from 'immutable';

import {
  DEPLOYMENT_TYPE_DEPLOY,
} from '../components/forms/database-configuration';

import {
  clusterReadyActionTypes,
  configActionTypes,
  csvActionTypes,
  flagActionTypes,
  serverActionTypes,
  sequenceActionTypes,
  commitPhases,
} from './actions';

export const DEBUG_PREFILL = 'DEBUG_PREFILL';

const reducer = combineReducers({

  // State machine associated with server submissions
  commitState: (state, action) => {
    if (!state) {
      return {
        phase: commitPhases.IDLE,
        request: null,
        result: null,
      };
    }

    switch(action.type) {
    case serverActionTypes.COMMIT_REQUESTED:
      return {
        phase: commitPhases.REQUESTED,
        request: action.payload,
        result: null,
      };
    case serverActionTypes.COMMIT_SENT:
      return {
        phase: commitPhases.WAITING,
        request: state.request,
        result: null,
      };
    case serverActionTypes.COMMIT_SUCCESSFUL:
      console.log('COMMIT SUCCESSFUL: bootcfg has been configured');
      console.dir(action.payload);
      return {
        phase: commitPhases.SUCCEEDED,
        request: state.request,
        response: action.payload,
      };
    case serverActionTypes.COMMIT_FAILED:
      console.log('COMMIT FAILED');
      console.dir(action.payload);
      return {
        phase: commitPhases.FAILED,
        request: state.request,
        response: action.payload,
      };
    default:
      return state;
    }
  },

  clusterConfig: (state, action) => {
    if (!state) {
      return {
        bootcfgCA: '',
        bootcfgClientCert: '',
        bootcfgClientKey: '',
        bootcfgHTTP: '',
        bootcfgRPC: '',
        directoryType: 'ldap',
        masters: List(),
        mastersCount: 3,
        networkDNS: '',
        networkGateway: '',
        skipNetwork: false,
        sshAuthorizedKeys: List(),
        subnet: '',
        workers: List(),
        workersCount: 1,
        clusterName: '',
        tectonicLicense: '',
        pullSecret: '',
        userLDAPSettings: {
          address: '',
          baseDN: '',
          ca: '', // TODO ???
          password: '',
          searchFilter: '',
          security: 'unencrypted',
          emailAttribute: '',
          nameAttribute: '',
          username: '',
        },
        userLocalSettings: {
        },
        databaseDeploymentType: DEPLOYMENT_TYPE_DEPLOY,
        databaseAddress: '',
        databaseUsername: '',
        databasePassword: '',
        databaseDatabase: '',
      };
    }
    switch (action.type) {
    case DEBUG_PREFILL:
      return Object.assign({}, state, action.payload); // TODO remove
    case configActionTypes.SET_BOOTCFG_RPC:
      return Object.assign({}, state, {
        bootcfgRPC: action.payload,
      });
    case configActionTypes.SET_BOOTCFG_HTTP:
      return Object.assign({}, state, {
        bootcfgHTTP: action.payload,
      });
    case configActionTypes.SET_CA_CERT:
      return Object.assign({}, state, {
        bootcfgCA: action.payload,
      });
    case configActionTypes.SET_CLIENT_CERT:
      return Object.assign({}, state, {
        bootcfgClientCert: action.payload,
      });
    case configActionTypes.SET_CLIENT_KEY:
      return Object.assign({}, state, {
        bootcfgClientKey: action.payload,
      });
    case configActionTypes.SET_MASTERS_COUNT: {
      return Object.assign({}, state, {
        mastersCount: action.payload,
        masters: state.masters.slice(0, action.payload),
      });
    }
    case configActionTypes.SET_WORKERS_COUNT:
      return Object.assign({}, state, {
        workersCount: action.payload,
        workers: state.workers.slice(0, action.payload),
      });
    case configActionTypes.SET_MASTERS_LIST:
      return Object.assign({}, state, {
        mastersCount: action.payload.count,
        masters: action.payload.nodes,
      });
    case configActionTypes.SET_WORKERS_LIST:
      return Object.assign({}, state, {
        workersCount: action.payload.count,
        workers: action.payload.nodes,
      });
    case configActionTypes.SET_SSH_AUTHORIZED_KEYS:
      return Object.assign({}, state, {
        sshAuthorizedKeys: state.sshAuthorizedKeys.set(action.payload.index, action.payload.value),
      });
    case configActionTypes.REMOVE_SSH_AUTHORIZED_KEYS: {
      return Object.assign({}, state, {
        sshAuthorizedKeys: state.sshAuthorizedKeys.delete(action.payload),
      });
    }
    case configActionTypes.SET_NETWORK_GATEWAY:
      return Object.assign({}, state, {
        networkGateway: action.payload,
      });
    case configActionTypes.SET_NETWORK_DNS:
      return Object.assign({}, state, {
        networkDNS: action.payload,
      });
    case configActionTypes.SET_SUBNET:
      return Object.assign({}, state, {
        subnet: action.payload,
      });
    case configActionTypes.SET_CLUSTER_NAME:
      return Object.assign({}, state, {
        clusterName: action.payload,
      });
    case configActionTypes.SET_TECTONIC_LICENSE:
      return Object.assign({}, state, {
        tectonicLicense: action.payload,
      });
    case configActionTypes.SET_PULL_SECRET:
      return Object.assign({}, state, {
        pullSecret: action.payload,
      });
    case configActionTypes.SET_USER_DIR_TYPE:
      return Object.assign({}, state, {
        directoryType: action.payload,
      });
    case configActionTypes.SET_USER_LDAP_SETTINGS:
      return Object.assign({}, state, {
        userLDAPSettings: action.payload,
      });
    case configActionTypes.SET_USER_LOCAL_SETTINGS:
      return Object.assign({}, state, {
        userLocalSettings: action.payload,
      });
    case configActionTypes.SET_CLUSTER_CONFIG:
      return Object.assign({}, state, {
        [action.payload.key]: action.payload.value,
      });
    default:
      return state;
    }
  },

  cluster: (state, action) => {
    if (!state) {
      return {
        ready: false,
        error: null,
        status: null,
      };
    }

    switch (action.type) {
    case clusterReadyActionTypes.NOT_READY:
      return Object.assign({}, state, {
        ready: false,
        status: null,
      });
    case clusterReadyActionTypes.STATUS:
      return Object.assign({}, state, {
        ready: true,
        status: action.payload,
        error: null,
      });
    case clusterReadyActionTypes.ERROR:
      return Object.assign({}, state, {
        error: action.payload,
      });
    default:
      return state;
    }
  },

  csvs: (state, action) => {
    if (!state) {
      return Map();
    }

    switch (action.type) {
    case csvActionTypes.SET:
      return state.set(action.payload.subject, action.payload.value);
    case csvActionTypes.DELETE:
      return state.delete(action.payload.subject);
    default:
      return state;
    }
  },

  flags: (state, action) => {
    if (!state) {
      return {};
    }

    switch (action.type) {
    case flagActionTypes.ADD: {
      const oldVal = state[action.payload.subject] || Set();
      return Object.assign({}, state, {
        [action.payload.subject]: oldVal.add(action.payload.value),
      });
    }
    case flagActionTypes.DELETE: {
      const oldVal = state[action.payload.subject] || Set();
      return Object.assign({}, state, {
        [action.payload.subject]: oldVal.delete(action.payload.value),
      });
    }
    case flagActionTypes.RESET:
      return Object.assign({}, state, {
        [action.payload.subject]: action.payload.value,
      });
    default:
      return state;
    }
  },

  sequence: (state, action) => {
    if (state === undefined) {
      return 0;
    }

    switch (action.type) {
    case sequenceActionTypes.INCREMENT:
      return state + 1;
    default:
      return state;
    }
  },
});

export const store = createStore(reducer);
