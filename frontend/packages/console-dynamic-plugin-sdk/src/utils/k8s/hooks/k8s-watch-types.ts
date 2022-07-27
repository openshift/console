import { Dispatch } from 'redux';
import { K8sModel } from '../../../api/common-types';
import { SDKStoreState } from '../../../app/redux-types';
import { WatchK8sResource } from '../../../extensions/console-types';

/**
 * @deprecated this needs to be removed once we internalize all k8s redux state
 * @todo delete this and all references in the SDK. Favour SDKStoreState
 */
export type OpenShiftReduxRootState = any;

export type GetIDAndDispatch<StoreData extends SDKStoreState> = (
  resource: WatchK8sResource,
  k8sModel: K8sModel,
  cluster?: string,
) => { id: string; dispatch: (dispatch: Dispatch, getState: () => StoreData) => void };

export type Query = { [key: string]: any };

export type MakeQuery = (
  namespace: string,
  labelSelector?: any,
  fieldSelector?: any,
  name?: string,
  limit?: number,
) => Query;
