import { getResources as getResources_ } from './get-resources';
import store from '../../redux';
import { k8sList, k8sWatch, k8sGet } from './resource';

const types = {
  resources: 'resources',
  swagger: 'swagger',

  watchK8sObject: 'watchK8sObject',
  stopK8sWatch: 'stopK8sWatch',
  modifyObject: 'modifyObject',

  loaded: 'loaded',
  errored: 'errored',

  watchK8sList: 'watchK8sList',
  bulkAddToList: 'bulkAddToList',
  filterList: 'filterList',
  updateListFromWS: 'updateListFromWS',
};

const action_ = (type) => (id, k8sObjects) => ({type, id, k8sObjects});

/** @type {{[id: string]: WebSocket}} */
const WS = {};
const POLLs = {};
const REF_COUNTS = {};

const nop = () => {};
const paginationLimit = 250;

const isImpersonateEnabled = () => !!store.getState().UI.get('impersonate');
const getImpersonateSubprotocols = () => {
  const {kind, name} = store.getState().UI.get('impersonate', {});
  if (!name) {
    return Promise.resolve();
  }

  let textEncoder;
  try {
    textEncoder = new TextEncoder('utf-8');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.info('Browser lacks TextEncoder. Falling back to polyfill.', e);
  }

  let promise;
  if (textEncoder) {
    promise = Promise.resolve(textEncoder);
  } else {
    promise = import('text-encoding').then(module => new module.TextEncoder('utf-8'));
  }

  return promise.then(encoder => {
    /* Subprotocols are comma-separated, so commas aren't allowed. Also "="
     * and "/" aren't allowed, so base64 but replace illegal chars.
     */
    let enc = encoder.encode(name);
    enc = window.btoa(String.fromCharCode.apply(String, enc));
    enc = enc.replace(/=/g, '_').replace(/\//g, '-');

    if (kind === 'User' ) {
      return [`Impersonate-User.${enc}`];
    }
    if (kind === 'Group') {
      return [`Impersonate-Group.${enc}`];
    }
  });
};

const actions = {
  [types.updateListFromWS]: action_(types.updateListFromWS),
  [types.bulkAddToList]: action_(types.bulkAddToList),
  [types.loaded]: action_(types.loaded),
  [types.errored]: action_(types.errored),
  [types.modifyObject]: action_(types.modifyObject),

  getResources: () => dispatch => {
    const type = types.resources;
    getResources_()
      .then(resources => dispatch({type, resources}))
      // try again or something?
      // eslint-disable-next-line no-console
      .catch(err => console.error(err));
  },

  filterList: (id, name, value) => {
    return {id, name, value, type: types.filterList};
  },

  watchK8sObject: (id, name, namespace, query, k8sType) => dispatch => {
    if (id in REF_COUNTS) {
      REF_COUNTS[id] += 1;
      return nop;
    }
    dispatch({id, type: types.watchK8sObject});
    REF_COUNTS[id] = 1;

    if (query.name) {
      query.fieldSelector = `metadata.name=${query.name}`;
      delete query.name;
    }

    const poller = () => {
      k8sGet(k8sType, name, namespace)
        .then(
          o => dispatch(actions.modifyObject(id, o)),
          e => dispatch(actions.errored(id, e))
        );
    };
    POLLs[id] = setInterval(poller, 30 * 1000);
    poller();

    if (isImpersonateEnabled()) {
      // WebSocket can't send impersonate HTTP header
      return;
    }
    if (k8sType.crd && name) {
      // You can't watch a CRD with a fieldSelector as of 1.8
      return;
    }

    const ws = k8sWatch(k8sType, query).onbulkmessage(events =>
      events.forEach(e => dispatch(actions.modifyObject(id, e.object)))
    );
    WS[id] = ws;
  },

  stopK8sWatch: id => {
    REF_COUNTS[id] -= 1;
    if (REF_COUNTS[id] > 0) {
      return nop;
    }

    const ws = WS[id];
    if (ws) {
      ws.destroy();
      delete WS[id];
    }
    const poller = POLLs[id];
    clearInterval(poller);
    delete POLLs[id];
    delete REF_COUNTS[id];
    return {type: types.stopK8sWatch, id};
  },

  watchK8sList: (id, query, k8skind) => dispatch => {
    if (id in REF_COUNTS) {
      REF_COUNTS[id] += 1;
      return nop;
    }

    dispatch({type: types.watchK8sList, id, query});
    REF_COUNTS[id] = 1;

    /** @type {(continueToken: string) => Promise<string>} */
    const incrementallyLoad = async(continueToken = '') => {
      // TODO: Check `REF_COUNTS[id]` here and throw special error if undefined
      const response = await k8sList(k8skind, {...query, limit: paginationLimit, ...(continueToken ? {continue: continueToken} : {})}, true);

      if (!continueToken) {
        dispatch(actions.loaded(id, response.items));
      }

      if (response.metadata.continue) {
        dispatch(actions.bulkAddToList(id, response.items));
        return incrementallyLoad(response.metadata.continue);
      }
      return response.metadata.resourceVersion;
    };

    /**
     * Incrementally fetch list (XHR) using k8s pagination then use its resourceVersion to
     *  start listening on a WS (?resourceVersion=$resourceVersion)
     *  start the process over when:
     *   1. the WS closes abnormally
     *   2. the WS can not establish a connection within $TIMEOUT
     */
    const pollAndWatch = () => (delete POLLs[id]) && Promise.all([
      getImpersonateSubprotocols(),
      incrementallyLoad(),
    ]).then(([subProtocols, resourceVersion]) => {
      // TODO: Check `REF_COUNTS[id]` here and throw special error if undefined
      WS[id] = WS[id] || k8sWatch(k8skind, {...query, resourceVersion}, {subProtocols, timeout: 60 * 1000});
      WS[id]
        .onclose(event => {
          // Close Frame Status Codes: https://tools.ietf.org/html/rfc6455#section-7.4.1
          if (event.code !== 1006) {
            return;
          }
          // eslint-disable-next-line no-console
          console.log('WS closed abnormally - starting polling loop over!');
          const ws = WS[id];
          const timedOut = true;
          ws && ws.destroy(timedOut);
        })
        .ondestroy(timedOut => {
          if (!timedOut) {
            return;
          }
          // If the WS is unsucessful for timeout duration, assume it is less work
          //  to update the entire list and then start the WS again

          // eslint-disable-next-line no-console
          console.log(`${id} timed out - restarting polling`);
          delete WS[id];

          if (POLLs[id]) {
            return;
          }

          POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
        })
        .onbulkmessage(events => dispatch(actions.updateListFromWS(id, events)));
    },
    e => {
      dispatch(actions.errored(id, e));
      if (POLLs[id]) {
        return;
      }
      POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
    });

    pollAndWatch();
  },
};

export {types};
export default actions;
