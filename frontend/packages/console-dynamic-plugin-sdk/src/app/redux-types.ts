import { K8sResourceCommon } from '../extensions/console-types';

export type UserKind = K8sResourceCommon & { groups: string[] };
export type CoreState = {
  activeNamespace: string;
  user?: UserKind;
  impersonate?: { kind: string; name: string; subprotocols: string[] };
};

export type RootState = {
  core: CoreState;
};
