import * as _ from 'lodash-es';
import { Dispatch } from 'react-redux';
import { ActionType as Action, action } from 'typesafe-actions';
import { checkAccess } from '@console/internal/components/utils/rbac';

import {
  cacheResources,
  getResources as getResources_,
  DiscoveryResources,
} from '../module/k8s/get-resources';
import { K8sResourceKind, fetchSwagger } from '../module/k8s';
import { makeReduxID } from '../components/utils/k8s-watcher';
import { CustomResourceDefinitionModel } from '../models';
import { watchK8sList } from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';

export {
  watchK8sObject,
  watchK8sList,
  stopK8sWatch,
} from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';

export enum ActionType {
  ReceivedResources = 'resources',
  GetResourcesInFlight = 'getResourcesInFlight',
}

export const API_DISCOVERY_POLL_INTERVAL = 60000;

const POLLs = {};
const apiDiscovery = 'apiDiscovery';

type K8sEvent = { type: 'ADDED' | 'DELETED' | 'MODIFIED'; object: K8sResourceKind };

export const receivedResources = (resources: DiscoveryResources) =>
  action(ActionType.ReceivedResources, { resources });
export const getResourcesInFlight = () => action(ActionType.GetResourcesInFlight);

export const getResources = () => (dispatch: Dispatch) => {
  dispatch(getResourcesInFlight());

  getResources_()
    .then((resources) => {
      // Cache the resources whenever discovery completes to improve console load times.
      cacheResources(resources);
      dispatch(receivedResources(resources));
    })
    // eslint-disable-next-line no-console
    .catch((err) => console.error('Fetching resource failed:', err))
    .finally(() => {
      setTimeout(() => {
        fetchSwagger().catch((e) => {
          // eslint-disable-next-line no-console
          console.error('Could not fetch OpenAPI yaml after fetching all resources.', e);
        });
      }, 10000);
    });
};

export const startAPIDiscovery = () => (dispatch) => {
  const reduxID = makeReduxID(CustomResourceDefinitionModel, {});
  checkAccess({
    group: CustomResourceDefinitionModel.apiGroup,
    resource: CustomResourceDefinitionModel.plural,
    verb: 'list',
  })
    .then((res) => {
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
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('Error while start API discovery', e);
    });
};

const k8sActions = {
  receivedResources,
  getResourcesInFlight,
  startAPIDiscovery,
};

export type K8sAction = Action<typeof k8sActions>;
