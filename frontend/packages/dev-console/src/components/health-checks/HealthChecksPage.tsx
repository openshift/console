import type { FC } from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import AddHealthChecksForm from './AddHealthChecksForm';

const HealthChecksPage: FC = () => {
  const { ns, kind, name, containerName } = useParams();

  const [resourceData, loaded, loadError] = useK8sWatchResource<K8sResourceKind>({
    kind,
    namespace: ns,
    isList: false,
    name,
  });

  const resource = {
    data: resourceData,
    loaded,
    loadError,
  };

  return <AddHealthChecksForm resource={resource} currentContainer={containerName} />;
};

export default HealthChecksPage;
