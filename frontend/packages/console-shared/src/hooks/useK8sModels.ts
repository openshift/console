// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { K8sKind } from 'public/module/k8s';

// Hook to retrieve all current k8s models from redux.
export const useK8sModels = (): [{ [key: string]: K8sKind }, boolean] => [
  useSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'models']))?.toJS() ?? {},
  useSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight'])) ?? false,
];
