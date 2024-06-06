import { Map as ImmutableMap } from 'immutable';
import { UserInfo } from '../extensions/console-types';

export type K8sState = ImmutableMap<string, any>;

export type AdmissionWebhookWarning = {
  kind: string;
  name: string;
  warning: string;
};
export type ImpersonateKind = {
  kind: string;
  name: string;
  subprotocols: string[];
};

export type CoreState = {
  user?: UserInfo;
  impersonate?: ImpersonateKind;
  admissionWebhookWarnings?: ImmutableMap<string, AdmissionWebhookWarning>;
};

export type SDKStoreState = {
  sdkCore: CoreState;
  k8s: K8sState;
};
