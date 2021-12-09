import { Dispatch } from 'react-redux';
import { K8sModel } from '../../../api/common-types';
import { SDKStoreState } from '../../../app/redux-types';
import { WatchK8sResource } from '../../../extensions/console-types';

export type GetIDAndDispatch<StoreData extends SDKStoreState> = (
  resource: WatchK8sResource,
  k8sModel: K8sModel,
) => { id: string; dispatch: (dispatch: Dispatch, getState: () => StoreData) => void };

export type Query = { [key: string]: any };

export type MakeQuery = (
  namespace: string,
  labelSelector?: any,
  fieldSelector?: any,
  name?: string,
  limit?: number,
) => Query;
