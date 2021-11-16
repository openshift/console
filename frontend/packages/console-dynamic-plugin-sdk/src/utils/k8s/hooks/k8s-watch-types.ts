import { Dispatch } from 'react-redux';
import { K8sModel } from '../../../api/common-types';
import { WatchK8sResource } from '../../../extensions/console-types';

export type RootState = any;

export type GetIDAndDispatch = (
  resource: WatchK8sResource,
  k8sModel: K8sModel,
) => { id: string; dispatch: (dispatch: Dispatch, getState: () => RootState) => void };

export type Query = { [key: string]: any };

export type MakeQuery = (
  namespace: string,
  labelSelector?: any,
  fieldSelector?: any,
  name?: string,
  limit?: number,
) => Query;
