import { K8sResourceKindReference, Selector, K8sResourceKind } from '../../module/k8s';

export * from './line-buffer';
export * from './promise-component';
export * from './kebab';
export * from './selector';
export * from './selector-input';
export * from './label-list';
export * from './log-window';
export * from './resource-icon';
export * from './resource-link';
export * from './resource-log';
export * from './volume-icon';
export * from './timestamp';
export * from './horizontal-nav';
export * from './details-page';
export * from './inject';
export * from './disabled';
export * from './firehose';
export * from './dropdown';
export * from './status-box';
export * from './headings';
export * from './units';
export * from './toggle-play';
export * from './button-bar';
export * from './number-spinner';
export * from './cloud-provider';
export * from './documentation';
export * from './router';
export * from './operator-states';
export * from './link';
export * from './alerts';
export * from './async';
export * from './download-button';
export * from './error-boundary';
export * from './deployment-pod-counts';
export * from './entitlements';
export * from './build-strategy';
export * from './copy-to-clipboard';
export * from './build-hooks';
export * from './webhooks';
export * from './scroll-to-top-on-mount';
export * from './service-catalog-status';
export * from './close-button';
export * from './container-table';
export * from './simple-tab-nav';
export * from './request-size-input';
export * from './k8s-watcher';
export * from './workload-pause';
export * from './list-dropdown';
export * from './status-icon';
export * from './list-input';
export * from './rbac';
export * from './poll-hook';
export * from './ref-width-hook';
export * from './safe-fetch-hook';
export * from './camel-case-wrap';
export * from './truncate-middle';

/*
  Add the enum for NameValueEditorPair here and not in its namesake file because the editor should always be
  loaded asynchronously in order not to bloat the vendor file. The enum reference into the editor
  will cause it not to load asynchronously.
 */
export const enum NameValueEditorPair {
  Name = 0,
  Value,
  Index
}

export const enum EnvFromPair {
  Prefix = 0,
  Resource,
  Index
}

/**
 * The environment editor manages two types of env variables env and envFrom. This const distinguishes the two.
 */
export const enum EnvType {
  ENV = 0,
  ENV_FROM = 1
}

export type FirehoseResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  prop: string;
  namespaced?: boolean,
};

export type FirehoseResult<R extends K8sResourceKind | K8sResourceKind[] = K8sResourceKind[]> = {
  loaded: boolean;
  loadError: string;
  data: R;
};
