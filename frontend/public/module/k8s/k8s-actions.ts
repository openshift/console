/* eslint-disable no-unused-vars, no-undef */

import * as _ from 'lodash-es';

import { cacheResources, getResources as getResources_ } from './get-resources';
import { k8sList, k8sWatch, k8sGet } from './resource';
import { makeReduxID } from '../../components/utils/k8s-watcher';
import { APIServiceModel, CustomResourceDefinitionModel } from '../../models';
import { coFetchJSON } from '../../co-fetch';

const types = {
  resources: 'resources',
  getResourcesInFlight: 'getResourcesInFlight',
  setAPIGroups: 'setAPIGroups',

  watchK8sObject: 'watchK8sObject',
  stopK8sWatch: 'stopK8sWatch',
  modifyObject: 'modifyObject',

  loaded: 'loaded',
  errored: 'errored',

  watchK8sList: 'watchK8sList',
  bulkAddToList: 'bulkAddToList',
  filterList: 'filterList',
  updateListFromWS: 'updateListFromWS',

  setPrinterColumns: 'setPrinterColumns',
  clearPrinterColumns: 'clearPrinterColumns',
};

type Action = (type: string) => (id: string, k8sObjects: any) => {type: string, id: string, k8sObjects: any};
const action_: Action = (type) => (id, k8sObjects) => ({type, id, k8sObjects});

const WS = {} as {[id: string]: WebSocket & any};
const POLLs = {};
const REF_COUNTS = {};

const nop = () => {};
const paginationLimit = 250;
const apiGroups = 'apiGroups';

const actions = {
  [types.updateListFromWS]: action_(types.updateListFromWS),
  [types.bulkAddToList]: action_(types.bulkAddToList),
  [types.loaded]: action_(types.loaded),
  [types.errored]: action_(types.errored),
  [types.modifyObject]: action_(types.modifyObject),

  /**
   * Attempts to watch `APIServices` and fire API discovery to register new models when new API groups are added.
   * Falls back to polling `/apis` if RBAC restricts this resource.
   */
  watchAPIServices: () => (dispatch, getState) => {
    if (getState().k8s.has('apiservices') || POLLs[apiGroups]) {
      return;
    }
    dispatch({type: types.getResourcesInFlight});

    k8sList(APIServiceModel, {})
      .then(() => dispatch(actions.watchK8sList(makeReduxID(APIServiceModel, {}), {}, APIServiceModel, actions.getResources)))
      .catch(() => {
        const poller = () => coFetchJSON('api/kubernetes/apis').then(d => {
          if (d.length !== getState().k8s.getIn(['RESOURCES', apiGroups], 0)) {
            dispatch(actions.getResources());
          }
          dispatch({type: types.setAPIGroups, value: d.groups.length});
        });

        POLLs[apiGroups] = setInterval(poller, 30 * 1000);
        poller();
      });
  },

  setPrinterColumns: (model, name) => dispatch => {
    const kind = model.crd ? CustomResourceDefinitionModel : model;
    k8sGet(kind, name).then(obj => {
      const printerColumns = _.get(obj, 'spec.additionalPrinterColumns', []);
      if (model.namespaced && !_.some(printerColumns, {name: 'Namespace', JSONPath: '.metadata.namespace'})) {
        printerColumns.unshift({
          name: 'Namespace',
          type: 'string',
          JSONPath: '.metadata.namespace',
        });
      }
      if (!_.some(printerColumns, {name: 'Name', JSONPath: '.metadata.name'})) {
        printerColumns.unshift({
          name: 'Name',
          type: 'string',
          JSONPath: '.metadata.name',
        });
      }
      if (!_.some(printerColumns, {name: 'Created', JSONPath: '.metadata.creationTimestamp'}) && !_.some(printerColumns, {name: 'Age', JSONPath: '.metadata.creationTimestamp'})) {
        printerColumns.push({
          name: 'Created',
          type: 'string',
          JSONPath: '.metadata.creationTimestamp',
        });
      }
      dispatch({type: types.setPrinterColumns, printerColumns});
    });
  },

  clearPrinterColumns: () => dispatch =>{
    dispatch({type: types.clearPrinterColumns});
  },

  getResources: () => dispatch => {
    dispatch({type: types.getResourcesInFlight});
    getResources_()
      .then(resources => {
        // Cache the resources whenever discovery completes to improve console load times.
        cacheResources(resources);
        dispatch({type: types.resources, resources});
      })
      // eslint-disable-next-line no-console
      .catch(err => console.error(err));
  },

  filterList: (id, name, value) => {
    return {id, name, value, type: types.filterList};
  },

  watchK8sObject: (id, name, namespace, query, k8sType) => (dispatch, getState) => {
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

    const {subprotocols} = getState().UI.get('impersonate', {});

    WS[id] = k8sWatch(k8sType, {...query, subprotocols}).onbulkmessage(events =>
      events.forEach(e => dispatch(actions.modifyObject(id, e.object)))
    );
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

  watchK8sList: (id, query, k8skind, extraAction) => (dispatch, getState) => {
    // Only one watch per unique list ID
    if (id in REF_COUNTS) {
      REF_COUNTS[id] += 1;
      return nop;
    }

    dispatch({type: types.watchK8sList, id, query});
    REF_COUNTS[id] = 1;

    const incrementallyLoad = async(continueToken = ''): Promise<string> => {
      // the list may not still be around...
      if (!REF_COUNTS[id]) {
        // let .then handle the cleanup
        return;
      }

      const response = await k8sList(k8skind, {...query, limit: paginationLimit, ...(continueToken ? {continue: continueToken} : {})}, true);

      if (!REF_COUNTS[id]) {
        return;
      }

      if (!continueToken) {
        [actions.loaded, extraAction].forEach(f => f && dispatch(f(id, response.items)));
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
    const pollAndWatch = async () => {
      delete POLLs[id];

      try {
        const resourceVersion = await incrementallyLoad();
        // ensure this watch should still exist because pollAndWatch is recursiveish
        if (!REF_COUNTS[id]) {
          // eslint-disable-next-line no-console
          console.log(`stopped watching ${id} before finishing incremental loading.`);
          // call cleanup function out of abundance of caution...
          dispatch(actions.stopK8sWatch(id));
          return;
        }

        if (WS[id]) {
          // eslint-disable-next-line no-console
          console.warn(`Attempted to create multiple websockets for ${id}.  This should never happen.`);
          return;
        }

        const {subprotocols} = getState().UI.get('impersonate', {});
        WS[id] = k8sWatch(k8skind, {...query, resourceVersion}, {subprotocols, timeout: 60 * 1000});
      } catch (e) {
        if (!REF_COUNTS[id]) {
          // eslint-disable-next-line no-console
          console.log(`stopped watching ${id} before finishing incremental loading with error ${e}!`);
          // call cleanup function out of abundance of caution...
          dispatch(actions.stopK8sWatch(id));
          return;
        }

        dispatch(actions.errored(id, e));

        if (!POLLs[id]) {
          POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
        }
        return;
      }

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
        .onbulkmessage(events => [actions.updateListFromWS, extraAction].forEach(f => f && dispatch(f(id, events))));
    };
    pollAndWatch();
  },
} as {[type: string]: Function};

export {types};
export default actions;
