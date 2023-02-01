import { HelmRelease, HelmReleaseStatus } from '../types/helm-types';

type HelmActionObj = {
  name: string;
  namespace: string;
  version: number | string;
  info?: { status: HelmReleaseStatus };
};

export type HelmActionsScope = {
  release: HelmRelease | HelmActionObj;
  actionOrigin?: string;
  redirect?: boolean;
};
