import { K8sResourceCommon } from '../extensions/console-types';

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
  user?: UserKind;
  impersonate?: ImpersonateKind;
};

export type SDKStoreState = {
  sdkCore: CoreState;
};
