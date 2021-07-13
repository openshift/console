import { Map as ImmutableMap } from 'immutable';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { featureReducerName } from '../constants';

export const useFlag: UseFlag = (flag) =>
  useSelector<RootState, boolean>(({ FLAGS }) => FLAGS.get(flag));

type UseFlag = (flag: string) => boolean;

type Request<R> = {
  active: boolean;
  timeout: NodeJS.Timer;
  inFlight: boolean;
  data: R;
  error: any;
};

export type RequestMap<R> = ImmutableMap<string, Request<R>>;
export type K8sState = ImmutableMap<string, any>;
export type UIState = ImmutableMap<string, any>;
export type DashboardsState = ImmutableMap<string, RequestMap<any>>;
export type FeatureState = ImmutableMap<string, boolean>;

export type RootState = {
  k8s: K8sState;
  UI: UIState;
  [featureReducerName]: FeatureState;
  dashboards: DashboardsState;
  plugins?: {
    [namespace: string]: any;
  };
};
