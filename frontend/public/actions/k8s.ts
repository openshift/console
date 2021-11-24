import * as _ from 'lodash-es';
import { Dispatch } from 'react-redux';
import { ActionType as Action, action } from 'typesafe-actions';
import { FilterValue, getImpersonate } from '@console/dynamic-plugin-sdk';
import { checkAccess } from '@console/internal/components/utils/rbac';

import {
  cacheResources,
  getResources as getResources_,
  DiscoveryResources,
} from '../module/k8s/get-resources';
import {
  k8sList,
  k8sWatch,
  k8sGet,
  referenceForModel,
  K8sResourceKind,
  K8sKind,
  fetchSwagger,
} from '../module/k8s';
import { makeReduxID } from '../components/utils/k8s-watcher';
import { CustomResourceDefinitionModel } from '../models';

export enum ActionType {
  ReceivedResources = 'resources',
  GetResourcesInFlight = 'getResourcesInFlight',

  StartWatchK8sObject = 'startWatchK8sObject',
  StartWatchK8sList = 'startWatchK8sList',
  StopWatchK8s = 'stopWatchK8s',
  ModifyObject = 'modifyObject',

  Loaded = 'loaded',
  Errored = 'errored',

  BulkAddToList = 'bulkAddToList',
  FilterList = 'filterList',
  UpdateListFromWS = 'updateListFromWS',
}

export const API_DISCOVERY_POLL_INTERVAL = 60000;
const WS = {} as { [id: string]: WebSocket & any };
const POLLs = {};
const REF_COUNTS = {};

const nop = () => {};
const paginationLimit = 250;
const apiDiscovery = 'apiDiscovery';

type K8sEvent = { type: 'ADDED' | 'DELETED' | 'MODIFIED'; object: K8sResourceKind };

export const updateListFromWS = (id: string, k8sObjects: K8sEvent[]) =>
  action(ActionType.UpdateListFromWS, { id, k8sObjects });
export const bulkAddToList = (id: string, k8sObjects: K8sResourceKind[]) =>
  action(ActionType.BulkAddToList, { id, k8sObjects });
export const loaded = (id: string, k8sObjects: K8sResourceKind | K8sResourceKind[]) =>
  action(ActionType.Loaded, { id, k8sObjects });
export const errored = (id: string, k8sObjects: any) =>
  action(ActionType.Errored, { id, k8sObjects });
export const modifyObject = (id: string, k8sObjects: K8sResourceKind) =>
  action(ActionType.ModifyObject, { id, k8sObjects });

export const getResourcesInFlight = () => action(ActionType.GetResourcesInFlight);
export const receivedResources = (resources: DiscoveryResources) =>
  action(ActionType.ReceivedResources, { resources });

export const getResources = () => (dispatch: Dispatch) => {
  dispatch(getResourcesInFlight());
  getResources_()
    .then((resources) => {
      // Cache the resources whenever discovery completes to improve console load times.
      cacheResources(resources);
      dispatch(receivedResources(resources));
    })
    // eslint-disable-next-line no-console
    .catch((err) => console.error(err))
    .finally(() => {
      setTimeout(fetchSwagger, 10000);
    });
};

export const filterList = (id: string, name: string, value: FilterValue) =>
  action(ActionType.FilterList, { id, name, value });

export const startWatchK8sObject = (id: string) => action(ActionType.StartWatchK8sObject, { id });

export const watchK8sObject = (
  id: string,
  name: string,
  namespace: string,
  query: { [key: string]: string },
  k8sType: K8sKind,
) => (dispatch: Dispatch, getState) => {
  if (id in REF_COUNTS) {
    REF_COUNTS[id] += 1;
    return nop;
  }
  dispatch(startWatchK8sObject(id));
  REF_COUNTS[id] = 1;

  if (query.name) {
    query.fieldSelector = `metadata.name=${query.name}`;
    delete query.name;
  }

  const poller = () => {
    k8sGet(k8sType, name, namespace).then(
      (o) => dispatch(modifyObject(id, o)),
      (e) => dispatch(errored(id, e)),
    );
  };
  POLLs[id] = setInterval(poller, 30 * 1000);
  poller();

  if (!_.get(k8sType, 'verbs', ['watch']).includes('watch')) {
    // eslint-disable-next-line no-console
    console.warn(`${referenceForModel(k8sType)} does not support watching`);
    return;
  }

  const { subprotocols } = getImpersonate(getState()) || {};

  WS[id] = k8sWatch(k8sType, query, { subprotocols }).onbulkmessage((events) =>
    events.forEach((e) => dispatch(modifyObject(id, e.object))),
  );
};

export const stopWatchK8s = (id: string) => action(ActionType.StopWatchK8s, { id });

export const stopK8sWatch = (id: string) => (dispatch: Dispatch) => {
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
  dispatch(stopWatchK8s(id));
};

export const startWatchK8sList = (id: string, query: { [key: string]: string }) =>
  action(ActionType.StartWatchK8sList, { id, query });

export const watchK8sList = (
  id: string,
  query: { [key: string]: string },
  k8skind: K8sKind,
  extraAction?,
) => (dispatch, getState) => {
  // Only one watch per unique list ID
  if (id in REF_COUNTS) {
    REF_COUNTS[id] += 1;
    return nop;
  }

  dispatch(startWatchK8sList(id, query));
  REF_COUNTS[id] = 1;

  const incrementallyLoad = async (continueToken = ''): Promise<string> => {
    // the list may not still be around...
    if (!REF_COUNTS[id]) {
      // let .then handle the cleanup
      return;
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
      return;
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
          `${referenceForModel(k8skind)} does not support watching, falling back to polling.`,
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
        const timedOut = true;
        ws && ws.destroy(timedOut);
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
  pollAndWatch();
};

export const startAPIDiscovery = () => (dispatch) => {
  const reduxID = makeReduxID(CustomResourceDefinitionModel, {});
  checkAccess({
    group: CustomResourceDefinitionModel.apiGroup,
    resource: CustomResourceDefinitionModel.plural,
    verb: 'list',
  }).then((res) => {
    if (res.status.allowed) {
      // eslint-disable-next-line no-console
      console.log('API discovery method: Watching');
      // Watch CRDs and dispatch refreshAPI action whenever an event is received
      dispatch(
        watchK8sList(
          reduxID,
          {},
          CustomResourceDefinitionModel,
          // Only re-run API discovery on added or removed CRDs.
          (_id: string, events: K8sEvent[]) =>
            events.some((e) => e.type !== 'MODIFIED') ? getResources() : _.noop,
        ),
      );
    } else {
      // eslint-disable-next-line no-console
      console.log('API discovery method: Polling');
      // Poll API discovery every 30 seconds since we can't watch CRDs
      dispatch(getResources());
      if (POLLs[apiDiscovery]) {
        clearTimeout(POLLs[apiDiscovery]);
        delete POLLs[apiDiscovery];
      }
      POLLs[apiDiscovery] = setTimeout(
        () => dispatch(startAPIDiscovery()),
        API_DISCOVERY_POLL_INTERVAL,
      );
    }
  });
};

const k8sActions = {
  updateListFromWS,
  bulkAddToList,
  loaded,
  errored,
  modifyObject,
  getResourcesInFlight,
  receivedResources,
  filterList,
  startWatchK8sObject,
  startWatchK8sList,
  stopWatchK8s,
  startAPIDiscovery,
};

export type K8sAction = Action<typeof k8sActions>;
