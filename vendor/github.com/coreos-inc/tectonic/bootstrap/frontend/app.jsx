// Polyfills, imported for side effects
import 'babel-polyfill'; // Required for `new Promise()`
import 'whatwg-fetch'; // Required for `fetch()`

import { List } from 'immutable';
import React from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'react-redux';
import { browserHistory, Router } from 'react-router';

import { store, DEBUG_PREFILL } from './modules/store';
import { Routes } from './modules/routes';
import { bindServerToStore } from './modules/server';

bindServerToStore(store);

const routes = new Routes(store);

window.onbeforeunload = function() {
  if (!store.getState().flags.ALL_DONE) {
    return 'Changes you made may not be saved.';
  }
};

store.subscribe(() => {
  const state = store.getState();
  if (state.flags.ALL_DONE) {
    const wizInstance = state.cluster.status.tectonic.find(n => n.ready);
    window.location = `http://${wizInstance.instance}:32002`;
  }
});

ReactDom.render(
  <Provider store={store}>
    <Router history={browserHistory} routes={routes} />
  </Provider>,
  document.getElementById('application')
);

window.DEBUG_prefill = function(config) {
  if (!config) {
    config = {};
  }

  const defaultConfig = {
    bootcfgHTTP: "172.15.0.2:8080",
    bootcfgRPC: "172.15.0.2:8081",
    bootcfgCA: "-----BEGIN CERTIFICATE-----\nTHIS CERT WON'T WORK\n-----END CERTIFICATE-----\n",
    bootcfgClientCert: "-----BEGIN CERTIFICATE-----\nTHIS CERT WON'T WORK EITHER\n-----END CERTIFICATE-----\n",
    bootcfgClientKey: "-----BEGIN RSA PRIVATE KEY-----\nNOT A REAL KEY\n-----END RSA PRIVATE KEY-----\n",
    clusterName: "my-cluster",
    directoryType: 'ldap',
    tectonicLicense: "THIS LICENSE IS FAKE",
    pullSecret: "THIS PULL SECRET IS FAKE",
    mastersCount: 1,
    masters: List.of(
      {
        ip: "172.15.0.21",
        mac: "52:54:00:a1:9c:ae",
      }
    ),
    workersCount: 2,
    workers: List.of(
      {
        ip: "172.15.0.22",
        mac: "52:54:00:b2:2f:86",
      },
      {
        ip: "172.15.0.23",
        mac: "52:54:00:c3:61:77",
      }
    ),
    networkGateway: "172.15.0.1",
    networkDNS: "172.15.0.3",
    sshAuthorizedKeys: List.of(
      {
        key: "ssh-rsa NOT A REAL KEY",
        id: 'pretend-key',
      }
    ),
    subnet: '172.15.0.0/16',
    skipNetwork: false,
    userLocalSettings: {
      adminEmail: 'fake@fake',
      adminPassword: 'ADMIN PASSWORD',
      smtpAddress: 'FAKE:25',
      smtpUsername: 'SMTP ADMIN',
      smtpPassword: 'SMTP PASSWORD',
      smtpFrom: 'fakeFROM@fake',
    },
    userLDAPSettings: {
      address: 'FAKE:2345',
      baseDN: 'FAKE baseDN',
      emailAttribute: 'FAKE EMAIL ATTR',
      nameAttribute: 'FAKE NAME ATTR',
      password: 'FAKE LDAP PASSWORD',
      searchFilter: 'FAKE FILTER',
      security: 'unencrypted',
      username: 'FAKE LDAP USER',
    },
  };

  store.dispatch({
    type: DEBUG_PREFILL,
    payload: Object.assign({}, defaultConfig, config),
  });
};
