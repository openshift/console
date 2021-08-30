// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { UseK8sModel } from '@console/dynamic-plugin-sdk';
import { K8sKind, kindForReference } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';

// Hook that retrieves the k8s model for provided groupVersionKind reference. Hook version of
// `connectToModel`.
export const useK8sModel: UseK8sModel = (groupVersionKind) => [
  useSelector<RootState, K8sKind>(({ k8s }) =>
    groupVersionKind
      ? k8s.getIn(['RESOURCES', 'models', groupVersionKind]) ??
        k8s.getIn(['RESOURCES', 'models', kindForReference(groupVersionKind)])
      : undefined,
  ),
  useSelector<RootState, boolean>(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight']) ?? false),
];
