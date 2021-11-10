// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { UseK8sModels } from '@console/dynamic-plugin-sdk';

// Hook to retrieve all current k8s models from redux.
export const useK8sModels: UseK8sModels = () => [
  useSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'models']))?.toJS() ?? {},
  useSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight'])) ?? false,
];
