import { Map as ImmutableMap } from 'immutable';
import { K8sResourceCommon } from '../extensions/console-types';

export type K8sState = ImmutableMap<string, any>;

export type UserKind = {
  fullName?: string;
  identities: string[];
} & K8sResourceCommon;

export type ImpersonateKind = {
  kind: string;
  name: string;
  subprotocols: string[];
};

export type CoreState = {
  activeCluster?: string;
  user?: UserKind;
  impersonate?: ImpersonateKind;
};

export type SDKStoreState = {
  sdkCore: CoreState;
  sdkK8s: K8sState;
};
