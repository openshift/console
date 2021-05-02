export { ResolvedExtension } from '../types';

// Type for extension hook
export type ExtensionHook<T, R = any> = (options: R) => ExtensionHookResult<T>;

// Type for extension hook result that returns [data, resolved, error]
export type ExtensionHookResult<T> = [T, boolean, any];

export type ExtensionK8sModel = {
  group: string;
  version: string;
  kind: string;
};

export type ExtensionK8sGroupModel = {
  group: string;
  version?: string;
  kind?: string;
};

export type K8sKind = {
  abbr: string;
  kind: string;
  label: string;
  labelKey?: string;
  labelPlural: string;
  labelPluralKey?: string;
  plural: string;
  propagationPolicy?: 'Foreground' | 'Background';

  id?: string;
  crd?: boolean;
  apiVersion: string;
  apiGroup?: string;
  namespaced?: boolean;
  selector?: Selector;
  labels?: { [key: string]: string };
  annotations?: { [key: string]: string };
  verbs?: K8sVerb[];
  shortNames?: string[];
  badge?: BadgeType;
  color?: string;

  // Legacy option for supporing plural names in URL paths when `crd: true`.
  // This should not be set for new models, but is needed to avoid breaking
  // existing links as we transition to using the API group in URL paths.
  legacyPluralURL?: boolean;
};

type MatchExpression = {
  key: string;
  operator: 'Exists' | 'DoesNotExist' | 'In' | 'NotIn' | 'Equals' | 'NotEqual';
  values?: string[];
  value?: string;
};

type MatchLabels = {
  [key: string]: string;
};

type Selector = {
  matchLabels?: MatchLabels;
  matchExpressions?: MatchExpression[];
};

type K8sVerb =
  | 'create'
  | 'get'
  | 'list'
  | 'update'
  | 'patch'
  | 'delete'
  | 'deletecollection'
  | 'watch';

enum BadgeType {
  DEV = 'Dev Preview',
  TECH = 'Tech Preview',
}
