import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { OperatorHubKind } from '../components/operator-hub';
import { referenceForModel } from '@console/internal/module/k8s';
import { OperatorHubModel } from '../models';

const useOperatorHubConfig = () =>
  useK8sWatchResource<OperatorHubKind>({
    kind: referenceForModel(OperatorHubModel),
    name: 'cluster',
    isList: false,
  });

export default useOperatorHubConfig;
