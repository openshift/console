import { clusterReadyActionTypes, serverActionTypes, commitPhases } from './actions';

function commitToServer(dispatch, msg) {
  const mask = parseInt(msg.subnet.split('/')[1], 10);
  const body = {
    bootcfgCA: msg.bootcfgCA,
    bootcfgClientCert: msg.bootcfgClientCert,
    bootcfgClientKey: msg.bootcfgClientKey,
    bootcfgRPC: msg.bootcfgRPC,
    clusterKind: 'bootkube',
    cluster: {
      bootcfgHTTP: msg.bootcfgHTTP,
      masters: msg.masters.map((m) => {
        return {mac: m.mac, ip: m.ip};
      }).toJS(),
      workers: msg.workers.map((m) => {
        return {mac: m.mac, ip: m.ip};
      }).toJS(),
      networkGateway: msg.networkGateway,
      networkDNS: msg.networkDNS,
      networkMask: mask,
      sshAuthorizedKeys: msg.sshAuthorizedKeys.map(k => k.key).filter(k => k && k.length).toJS(),
      skipNetwork: msg.skipNetwork,
    },
  };

  fetch('/cluster/create', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  .then(response => {
    return response.text().then(text => {
      if (response.ok) {
        return text;
      }

      return Promise.reject(text);
    });
  })
  .then(text => {
    dispatch({
      type: serverActionTypes.COMMIT_SUCCESSFUL,
      payload: text,
    });
  })
  .catch(err => {
    dispatch({
      type: serverActionTypes.COMMIT_FAILED,
      payload: err,
    });
  });

  dispatch({
    type: serverActionTypes.COMMIT_SENT,
    payload: body,
  });
}

function observeServerStatus(dispatch) {
  fetch('/cluster/status?kind=bootkube')
  .then(response => {
    if (response.status === 404) {
      dispatch({
        type: clusterReadyActionTypes.NOT_READY,
      });
      return;
    }

    if (response.ok) {
      return response.json().then(status => {
        dispatch({
          type: clusterReadyActionTypes.STATUS,
          payload: status,
        });
      });
    }

    return response.text().then(text => {
      return Promise.reject(text);
    });
  })
  .catch(err => {
    dispatch({
      type: clusterReadyActionTypes.ERROR,
      payload: err,
    });
  })
  .then(() => {
    setTimeout(() => { observeServerStatus(dispatch); }, 10000);
  });
}

export function bindServerToStore(store) {
  const dispatch = store.dispatch.bind(store);
  store.subscribe(() => {
    if (store.getState().commitState.phase === commitPhases.REQUESTED) {
      commitToServer(dispatch, store.getState().clusterConfig);
    }
  });

  observeServerStatus(dispatch);
}
