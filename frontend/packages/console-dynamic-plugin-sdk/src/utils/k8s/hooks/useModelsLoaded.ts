import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { K8sModel } from '../../../api/common-types';
import { OpenShiftReduxRootState } from './k8s-watch-types';

export const useModelsLoaded = (): boolean => {
  const ref = React.useRef(false);
  const k8sModels = useSelector<OpenShiftReduxRootState, K8sModel>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'models']),
  );
  const inFlight = useSelector<OpenShiftReduxRootState, K8sModel>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'inFlight']),
  );

  if (!ref.current && k8sModels.size && !inFlight) {
    ref.current = true;
  }
  return ref.current;
};
