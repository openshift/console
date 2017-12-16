import { getResources as getResources_} from './get-resources';
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
  addToList: 'addToList',
  deleteFromList: 'deleteFromList',
  modifyList: 'modifyList',
  filterList: 'filterList',
};

const action_ = (type) => (id, k8sObjects) => ({type, id, k8sObjects});

const WS = {};
const POLLs = {};
const REF_COUNTS = {};

const nop = () => {};

const isImpersonateEnabled = () => !!store.getState().UI.get('impersonate');

// User impersonation can't use WebSockets, so let's poll more frequently
const pollInterval = () => (isImpersonateEnabled() ? 15 : 30) * 1000;

const actions = {
  [types.deleteFromList]: action_(types.deleteFromList),
  [types.addToList]: action_(types.addToList),
  [types.modifyList]: action_(types.modifyList),
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
    POLLs[id] = setInterval(poller, pollInterval());
    poller();

    if (isImpersonateEnabled()) {
      // WebSocket can't send impersonate HTTP header
      return;
    }
    if (k8sType.crd && name) {
      // You can't watch a CRD with a fieldSelector as of 1.8
      return;
    }

    const ws = k8sWatch(k8sType, query).onmessage(msg => dispatch(actions.modifyObject(id, msg.object)));
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

    // WebSocket can't send impersonate HTTP header
    if (!isImpersonateEnabled()) {
      const ws = k8sWatch(k8skind, query).onmessage(msg => {
        let theAction;
        switch (msg.type) {
          case 'ADDED':
            theAction = actions.addToList;
            break;
          case 'MODIFIED':
            theAction = actions.modifyList;
            break;
          case 'DELETED':
            theAction = actions.deleteFromList;
            break;
          default:
            return;
        }
        dispatch(theAction(id, msg.object));
      });

      WS[id] = ws;
    }
    const poller = () => k8sList(k8skind, query)
      .then(
        o => dispatch(actions.loaded(id, o)),
        e => dispatch(actions.errored(id, e))
      );

    POLLs[id] = setInterval(poller, pollInterval());
    poller();
  },
};

export {types};
export default actions;
