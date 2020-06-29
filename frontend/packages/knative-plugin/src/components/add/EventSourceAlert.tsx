import * as React from 'react';
import * as _ from 'lodash';
import { Alert } from '@patternfly/react-core';
import {
  useK8sWatchResources,
  WatchK8sResults,
} from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  knativeServingResourcesServicesWatchers,
  knativeEventingResourcesBrokerWatchers,
} from '../../utils/get-knative-resources';
import { getDynamicEventingChannelWatchers } from '../../utils/fetch-dynamic-eventsources-utils';
import { EventSourceListData } from './import-types';

interface EventSourceAlertProps {
  namespace: string;
  eventSourceStatus: EventSourceListData | null;
}

type ResourcesObject = { [key: string]: K8sResourceKind[] };

const EventSourceAlert: React.FC<EventSourceAlertProps> = ({ namespace, eventSourceStatus }) => {
  const getKnResources = React.useMemo(
    () => ({
      ...knativeServingResourcesServicesWatchers(namespace),
      ...knativeEventingResourcesBrokerWatchers(namespace),
      ...getDynamicEventingChannelWatchers(namespace),
    }),
    [namespace],
  );
  const resourcesData: WatchK8sResults<ResourcesObject> = useK8sWatchResources<ResourcesObject>(
    getKnResources,
  );
  const resourcesDataList = Object.values(resourcesData);
  const { loaded, data } = _.reduce(
    resourcesDataList,
    (acm, resData) => {
      if (resData.loaded) {
        acm.loaded = true;
        acm.data = [...acm.data, ...resData.data];
      }
      return acm;
    },
    { loaded: false, data: [] },
  );

  const noEventSources = eventSourceStatus === null;
  const noEventSourceAccess =
    !noEventSources && eventSourceStatus.loaded && _.isEmpty(eventSourceStatus.eventSourceList);
  const noKnativeResources = loaded && _.isEmpty(data);
  const showAlert = noKnativeResources || noEventSources || noEventSourceAccess;

  return showAlert ? (
    <Alert variant="default" title="Event Source cannot be created" isInline>
      {noEventSourceAccess && 'You do not have write access in this project.'}
      {noEventSources && 'Creation of event sources are not currently supported on this cluster.'}
      {noKnativeResources &&
        !noEventSourceAccess &&
        !noEventSources &&
        'Event Sources can only sink to Channel, Broker or Knative services. No Channels, Brokers or Knative services exist in this project.'}
    </Alert>
  ) : null;
};

export default EventSourceAlert;
