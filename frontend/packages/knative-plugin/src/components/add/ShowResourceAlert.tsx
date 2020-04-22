import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { FirehoseResource } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';

interface ShowResourceAlertProps {
  title: string;
  resource: FirehoseResource;
  message?: string;
}

const ShowResourceAlert: React.FC<ShowResourceAlertProps> = ({ title, message, resource }) => {
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>(resource);
  const showAlert = loaded && !loadError && !data?.length;
  return showAlert ? (
    <Alert variant="default" title={title} isInline>
      {message}
    </Alert>
  ) : null;
};

export default ShowResourceAlert;
