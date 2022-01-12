import { K8sState } from '../../redux-types';

export const getReduxIdPayload = (state, reduxId) => state.k8s.get(reduxId);

export const getK8sDataById = (state: K8sState, id: string) => state.getIn([id, 'data']);
