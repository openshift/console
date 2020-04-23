import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { knativeServingResourcesServices } from '../../utils/get-knative-resources';

interface NoKnativeServiceAlertProps {
  namespace: string;
}

const NoKnativeServiceAlert: React.FC<NoKnativeServiceAlertProps> = ({ namespace }) => {
  const knServiceResource = React.useMemo(
    () => ({ ...knativeServingResourcesServices(namespace)[0], limit: 1 }),
    [namespace],
  );
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>(knServiceResource);
  const showAlert = loaded && !loadError && !data?.length;
  return showAlert ? (
    <Alert variant="default" title="Event Source can not be created" isInline>
      An event source must sink to Knative Service, but no Knative Service exist in this project
    </Alert>
  ) : null;
};

export default NoKnativeServiceAlert;
