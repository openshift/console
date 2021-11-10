// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { UseK8sModel } from '@console/dynamic-plugin-sdk';
import { transformGroupVersionKindToReference } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { K8sKind, kindForReference } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';

// Hook that retrieves the k8s model for provided groupVersionKind reference. Hook version of
// `connectToModel`.
export const useK8sModel: UseK8sModel = (groupVersionKind) => {
  const kindReference = transformGroupVersionKindToReference(groupVersionKind);
  return [
    useSelector<RootState, K8sKind>(({ k8s }) =>
      kindReference
        ? k8s.getIn(['RESOURCES', 'models', kindReference]) ??
          k8s.getIn(['RESOURCES', 'models', kindForReference(kindReference)])
        : undefined,
    ),
    useSelector<RootState, boolean>(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight']) ?? false),
  ];
};
