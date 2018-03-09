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
const getImpersonateSubprotocols = () => {
  const {kind, name} = store.getState().UI.get('impersonate', {});
  if (!name) {
    return;
  }
  /* Subprotocols are comma-separated, so commas aren't allowed. Also "="
   * isn't allowed, so base64/32 encoding won't work. To work around these
   * constraints, use underscore-delimited char codes.
   */
  let enc;
  try {
    enc = new TextEncoder('utf-8').encode(name).toString();
    enc = enc.replace(/,/g, '_');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.info('Error using TextEncoder on impersonation subprotocol:', e);
    enc = [];
    // Edge & old Safari lack TextEncoder. Fall back to charCodeAt
    for (let c of name) {
      const code = c.charCodeAt(0);
      if (code > 127) {
        // eslint-disable-next-line no-console
        console.error('non-ASCII charcode found:', code, '... bailing');
        break;
      }
      enc.push(code);
    }
    enc = enc.join('_');
  }
  if (kind === 'User' ) {
    return [`Impersonate-User.${enc}`];
  }
  if (kind === 'Group') {
    return [`Impersonate-Group.${enc}`];
  }
};

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

    // Fetch entire list then starting listening on WS...
    //  at the resource version of the list to avoid rendering churn
    const pollAndWatch = () => k8sList(k8skind, query, true)
      .then(res => {
        dispatch(actions.loaded(id, res.items));
        if (WS[id]) {
          return;
        }

        const subProtocols = getImpersonateSubprotocols();

        const resourceVersion = res.metadata.resourceVersion;
        WS[id] = k8sWatch(k8skind, {...query, resourceVersion}, {subProtocols, timeout: 60 * 1000})
          .ondestroy(timedout => {
            if (!timedout) {
              return;
            }
            // If the WS is unsucessful for timeout duration, assume it is less work
            //  to update the entire list and then start the WS again

            // eslint-disable-next-line no-console
            console.log('timed out. polling and watching');
            delete WS[id];
            pollAndWatch();
          })
          .onmessage(msg => {
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
                // eslint-disable-next-line no-console
                console.warn('unknown websocket action', msg.type);
                return;
            }
            dispatch(theAction(id, msg.object));
          });
      },
      e => {
        dispatch(actions.errored(id, e));
        POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
      });

    pollAndWatch();
  },
};

export {types};
export default actions;
