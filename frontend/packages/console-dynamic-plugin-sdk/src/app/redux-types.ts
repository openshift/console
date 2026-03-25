import type { Map as ImmutableMap } from 'immutable';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { UserKind } from '@console/internal/module/k8s/types';
import type { UserInfo } from '../extensions/console-types';

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
  groups?: string[];
};

export type CoreState = {
  user?: UserInfo;
  userResource?: UserKind;
  impersonate?: ImpersonateKind;
  admissionWebhookWarnings?: ImmutableMap<string, AdmissionWebhookWarning>;
};

export type SDKStoreState = {
  sdkCore: CoreState;
  k8s: K8sState;
};

export type SDKDispatch = ThunkDispatch<SDKStoreState, undefined, AnyAction>;
