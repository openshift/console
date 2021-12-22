import * as _ from 'lodash';
import { ActionType as Action, action } from 'typesafe-actions';
import { DiscoveryResources, K8sModel, MatchLabels, Selector } from '../../../api/common-types';
import { K8sResourceCommon, FilterValue } from '../../../extensions/console-types';
import { getReferenceForModel } from '../../../utils/k8s/k8s-ref';
import { k8sList, k8sGet } from '../../../utils/k8s/k8s-resource';
import { k8sWatch } from '../../../utils/k8s/k8s-utils';
import { getImpersonate } from '../../core/reducers/coreSelectors';

type K8sResourceKind = K8sResourceCommon & {
  spec?: {
    selector?: Selector | MatchLabels;
    [key: string]: any;
  };
  status?: { [key: string]: any };
  data?: { [key: string]: any };
};

export enum ActionType {
  ReceivedResources = 'resources',
  GetResourcesInFlight = 'getResourcesInFlight',
  StartWatchK8sObject = 'startWatchK8sObject',
  StartWatchK8sList = 'startWatchK8sList',
  ModifyObject = 'modifyObject',
  StopWatchK8s = 'stopWatchK8s',

  Errored = 'errored',
  Loaded = 'loaded',
  BulkAddToList = 'bulkAddToList',
  UpdateListFromWS = 'updateListFromWS',
  FilterList = 'filterList',
}

type K8sEvent = { type: 'ADDED' | 'DELETED' | 'MODIFIED'; object: K8sResourceKind };

export const updateListFromWS = (id: string, k8sObjects: K8sEvent[]) =>
  action(ActionType.UpdateListFromWS, { id, k8sObjects });
export const loaded = (id: string, k8sObjects: K8sResourceKind | K8sResourceKind[]) =>
  action(ActionType.Loaded, { id, k8sObjects });

export const bulkAddToList = (id: string, k8sObjects: K8sResourceKind[]) =>
  action(ActionType.BulkAddToList, { id, k8sObjects });

export const startWatchK8sObject = (id: string) => action(ActionType.StartWatchK8sObject, { id });
export const startWatchK8sList = (id: string, query: { [key: string]: string }) =>
  action(ActionType.StartWatchK8sList, { id, query });
export const modifyObject = (id: string, k8sObjects: K8sResourceKind) =>
  action(ActionType.ModifyObject, { id, k8sObjects });
export const stopWatchK8s = (id: string) => action(ActionType.StopWatchK8s, { id });

export const errored = (id: string, k8sObjects: any) =>
  action(ActionType.Errored, { id, k8sObjects });
export const filterList = (id: string, name: string, value: FilterValue) =>
  action(ActionType.FilterList, { id, name, value });

const WS = {} as { [id: string]: WebSocket & any };
const POLLs = {};
const REF_COUNTS = {};

const paginationLimit = 250;

export const stopK8sWatch = (id: string) => (dispatch) => {
  REF_COUNTS[id] -= 1;
  if (REF_COUNTS[id] > 0) {
    return _.noop;
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
  return dispatch(stopWatchK8s(id));
};

export const watchK8sList = (
  id: string,
  query: { [key: string]: string },
  k8skind: K8sModel,
  extraAction?,
) => (dispatch, getState) => {
  // Only one watch per unique list ID
  if (id in REF_COUNTS) {
    REF_COUNTS[id] += 1;
    return _.noop;
  }

  dispatch(startWatchK8sList(id, query));
  REF_COUNTS[id] = 1;

  const incrementallyLoad = async (continueToken = ''): Promise<string> => {
    // the list may not still be around...
    if (!REF_COUNTS[id]) {
      // let .then handle the cleanup
      return null;
    }

    const response = await k8sList(
      k8skind,
      {
        limit: paginationLimit,
        ...query,
        ...(continueToken ? { continue: continueToken } : {}),
      },
      true,
    );

    if (!REF_COUNTS[id]) {
      return null;
    }

    if (!continueToken) {
      [loaded, extraAction].forEach((f) => f && dispatch(f(id, response.items)));
    } else {
      dispatch(bulkAddToList(id, response.items));
    }

    if (response.metadata.continue) {
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
        dispatch(stopK8sWatch(id));
        return;
      }

      if (WS[id]) {
        // eslint-disable-next-line no-console
        console.warn(`Attempted to create multiple websockets for ${id}.`);
        return;
      }

      if (!_.get(k8skind, 'verbs', ['watch']).includes('watch')) {
        // eslint-disable-next-line no-console
        console.warn(
          `${getReferenceForModel(k8skind)} does not support watching, falling back to polling.`,
        );
        if (!POLLs[id]) {
          POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
        }
        return;
      }

      const { subprotocols } = getImpersonate(getState()) || {};
      WS[id] = k8sWatch(
        k8skind,
        { ...query, resourceVersion },
        { subprotocols, timeout: 60 * 1000 },
      );
    } catch (e) {
      if (!REF_COUNTS[id]) {
        // eslint-disable-next-line no-console
        console.log(`stopped watching ${id} before finishing incremental loading with error ${e}!`);
        // call cleanup function out of abundance of caution...
        dispatch(stopK8sWatch(id));
        return;
      }

      dispatch(errored(id, e));

      if (!POLLs[id]) {
        POLLs[id] = setTimeout(pollAndWatch, 15 * 1000);
      }
      return;
    }

    WS[id]
      .onclose((event) => {
        // Close Frame Status Codes: https://tools.ietf.org/html/rfc6455#section-7.4.1
        if (event.code !== 1006) {
          return;
        }
        // eslint-disable-next-line no-console
        console.log('WS closed abnormally - starting polling loop over!');
        const ws = WS[id];
        ws && ws.destroy();
      })
      .ondestroy((timedOut) => {
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
      .onbulkmessage((events) =>
        [updateListFromWS, extraAction].forEach((f) => f && dispatch(f(id, events))),
      );
  };
  return pollAndWatch();
};

export const watchK8sObject = (
  id: string,
  name: string,
  namespace: string,
  query: { [key: string]: string },
  k8sType: K8sModel,
) => (dispatch, getState) => {
  if (id in REF_COUNTS) {
    REF_COUNTS[id] += 1;
    return _.noop;
  }
  const watch = dispatch(startWatchK8sObject(id));
  REF_COUNTS[id] = 1;

  if (query.name) {
    query.fieldSelector = `metadata.name=${query.name}`;
    delete query.name;
  }

  const poller = () => {
    k8sGet(k8sType, name, namespace)
      .then(
        (o) => dispatch(modifyObject(id, o)),
        (e) => dispatch(errored(id, e)),
      )
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
      });
  };
  POLLs[id] = setInterval(poller, 30 * 1000);
  poller();

  if (!_.get(k8sType, 'verbs', ['watch']).includes('watch')) {
    // eslint-disable-next-line no-console
    console.warn(`${getReferenceForModel(k8sType)} does not support watching`);
    return _.noop;
  }

  const { subprotocols } = getImpersonate(getState()) || {};

  WS[id] = k8sWatch(k8sType, query, { subprotocols }).onbulkmessage((events) =>
    events.forEach((e) => dispatch(modifyObject(id, e.object))),
  );
  return watch;
};

export const receivedResources = (resources: DiscoveryResources) =>
  action(ActionType.ReceivedResources, { resources });
export const getResourcesInFlight = () => action(ActionType.GetResourcesInFlight);

const k8sActions = {
  startWatchK8sObject,
  startWatchK8sList,
  modifyObject,
  stopWatchK8s,
  errored,
  loaded,
  bulkAddToList,
  updateListFromWS,
  filterList,
  receivedResources,
  getResourcesInFlight,
};

export type K8sAction = Action<typeof k8sActions>;
