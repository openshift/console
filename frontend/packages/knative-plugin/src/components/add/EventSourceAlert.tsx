import * as React from 'react';
import * as _ from 'lodash';
import { Alert } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { knativeServingResourcesServices } from '../../utils/get-knative-resources';
import { EventSourceListData } from './import-types';

interface EventSourceAlertProps {
  namespace: string;
  eventSourceStatus: EventSourceListData | null;
}

const EventSourceAlert: React.FC<EventSourceAlertProps> = ({ namespace, eventSourceStatus }) => {
  const knServiceResource = React.useMemo(
    () => ({ ...knativeServingResourcesServices(namespace)[0], limit: 1 }),
    [namespace],
  );
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>(knServiceResource);

  const noEventSources = eventSourceStatus === null;
  const noEventSourceAccess =
    !noEventSources && eventSourceStatus.loaded && _.isEmpty(eventSourceStatus.eventSourceList);
  const noKnativeService = loaded && !loadError && !data?.length;
  const showAlert = noKnativeService || noEventSources || noEventSourceAccess;

  return showAlert ? (
    <Alert variant="default" title="Event Source can not be created" isInline>
      {noEventSourceAccess &&
        'You do not have write access in this namespace due to cluster policy'}
      {noEventSources && 'There are no Event Sources present in the cluster'}
      {noKnativeService &&
        !noEventSourceAccess &&
        !noEventSources &&
        'An event source must sink to Knative Service, but no Knative Service exist in this project'}
    </Alert>
  ) : null;
};

export default EventSourceAlert;
