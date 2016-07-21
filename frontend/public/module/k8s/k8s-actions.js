'use strict';

const types = {
  deleted: 'deleted',
  added: 'added',
  modified: 'modified',
  loaded: 'loaded',
  errored: 'errored',

  addList: 'addList',
  removeList: 'removeList',
};

const action_ = (type) => {
  return (id, k8sObjects) => ({type, id, k8sObjects});
}

const WS = {};
const POLLs = {};
const REF_COUNTS = {};

const nop = () => {};

const actions =  {
  [types.deleted]: action_(types.deleted),
  [types.added]: action_(types.added),
  [types.modified]: action_(types.modified),
  [types.loaded]: action_(types.loaded),
  [types.errored]: action_(types.errored),

  removeList: id => {
    REF_COUNTS[id] -= 1;
    if (REF_COUNTS[id] >= 1) {
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
    return {type: types.removeList, id};
  },
  addList: (id, query, k8sType) => dispatch => {
    if (id in REF_COUNTS) {
      REF_COUNTS[id] += 1;
      return nop;
    }

    dispatch({type: types.addList, id, query});
    REF_COUNTS[id] = 1;

    const ws = k8sType.watch(query).onmessage(msg => {
      let theAction;
      switch (msg.type) {
        case 'ADDED':
          theAction = actions.added;
          break;
        case 'MODIFIED':
          theAction = actions.modified;
          break;
        case 'DELETED':
          theAction = actions.deleted;
          break;
        default:
          return;
      }
      dispatch(theAction(id, msg.object));
    });

    WS[id] = ws;

    const poller = () => {
      k8sType.list(_.clone(query, true))
        .then(o => dispatch(actions.loaded(id, o)))
        .catch(e => dispatch(actions.errored(id, e)));
    };
    POLLs[id] = setInterval(poller, 30 * 1000);
    poller();
  },
};

export {types};
export default actions;
