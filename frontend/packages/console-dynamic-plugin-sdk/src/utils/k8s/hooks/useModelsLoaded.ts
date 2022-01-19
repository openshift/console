import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
import { useSelector } from 'react-redux';
import { K8sModel } from '../../../api/common-types';
import { OpenShiftReduxRootState } from './k8s-watch-types';

export const useModelsLoaded = (): boolean => {
  const ref = React.useRef(false);
  const k8sModels = useSelector<OpenShiftReduxRootState, ImmutableMap<string, K8sModel>>(
    ({ k8s }) => k8s.getIn(['RESOURCES', 'models']),
  );
  const inFlight = useSelector<OpenShiftReduxRootState, boolean>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'inFlight']),
  );

  if (!ref.current && k8sModels.size && !inFlight) {
    ref.current = true;
  }
  return ref.current;
};
