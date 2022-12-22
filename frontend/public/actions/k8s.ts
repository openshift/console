import * as _ from 'lodash-es';
import { Dispatch } from 'react-redux';
import { ActionType as Action } from 'typesafe-actions';
import { checkAccess } from '@console/internal/components/utils/rbac';

import { cacheResources, getResources as getResources_ } from '../module/k8s/get-resources';
import { fetchSwagger, CustomResourceDefinitionKind, K8sResourceKind } from '../module/k8s';
import { makeReduxID } from '../components/utils/k8s-watcher';
import { CustomResourceDefinitionModel } from '../models';
import {
  watchK8sList,
  getResourcesInFlight,
  receivedResources,
} from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';

export {
  watchK8sObject,
  watchK8sList,
  stopK8sWatch,
  getResourcesInFlight,
  receivedResources,
} from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';

export const API_DISCOVERY_POLL_INTERVAL = 60000;

const POLLs = {};
const apiDiscovery = 'apiDiscovery';

type K8sEvent = { type: 'ADDED' | 'DELETED' | 'MODIFIED'; object: K8sResourceKind };

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
        // Always dispatch an initial call
        dispatch(getResources());
        // Watch CRDs and dispatch refreshAPI action whenever an event is received
        dispatch(
          watchK8sList(
            reduxID,
            {},
            CustomResourceDefinitionModel,
            // Re-run API discovery on added or removed CRDs.
            // Note: This extraAction callback is initially called with all items (CRD resources),
            // and later with all changes (K8ssEvents).
            (_id: string, crdsOrEvents: CustomResourceDefinitionKind[] | K8sEvent[]) => {
              if (crdsOrEvents.some((e) => e.type === 'ADDED' || e.type === 'DELETED')) {
                return getResources();
              }
              return _.noop;
            },
          ),
        );
      } else {
        // eslint-disable-next-line no-console
        console.log('API discovery method: Polling');
        // Always dispatch an initial call
        dispatch(getResources());
        // Poll API discovery every 30 seconds since we can't watch CRDs
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
  startAPIDiscovery,
};

export type K8sAction = Action<typeof k8sActions>;
