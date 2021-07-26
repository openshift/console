import { HelmRelease } from '../types/helm-types';

type HelmActionObj = { name: string; namespace: string; version: number | string };

export type HelmActionsScope = {
  release: HelmRelease | HelmActionObj;
  actionOrigin?: string;
  redirect?: boolean;
};
