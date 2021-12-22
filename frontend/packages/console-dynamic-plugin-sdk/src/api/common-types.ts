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

export type ExtensionK8sGroupKindModel = {
  group: string;
  version?: string;
  kind: string;
};

export type ExtensionK8sKindVersionModel = {
  group?: string;
  version: string;
  kind: string;
};

export type K8sModel = {
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

/**
 * @deprecated migrated to new type K8sModel, use K8sModel over K8sKind
 */
export type K8sKind = K8sModel;

export enum Operator {
  Exists = 'Exists',
  DoesNotExist = 'DoesNotExist',
  In = 'In',
  NotIn = 'NotIn',
  Equals = 'Equals',
  NotEqual = 'NotEqual',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  NotEquals = 'NotEquals',
}

export type MatchExpression = {
  key: string;
  operator: Operator | string;
  values?: string[];
  value?: string;
};

export type MatchLabels = {
  [key: string]: string;
};

export type Selector = {
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

export const enum AlertStates {
  Firing = 'firing',
  NotFiring = 'not-firing',
  Pending = 'pending',
  Silenced = 'silenced',
}

export const enum SilenceStates {
  Active = 'active',
  Expired = 'expired',
  Pending = 'pending',
}

export const enum AlertSeverity {
  Critical = 'critical',
  Info = 'info',
  None = 'none',
  Warning = 'warning',
}

export const enum RuleStates {
  Firing = 'firing',
  Inactive = 'inactive',
  Pending = 'pending',
  Silenced = 'silenced',
}

export type Silence = {
  comment: string;
  createdBy: string;
  endsAt: string;
  firingAlerts: Alert[];
  id?: string;
  matchers: { name: string; value: string; isRegex: boolean }[];
  name?: string;
  startsAt: string;
  status?: { state: SilenceStates };
  updatedAt?: string;
};

export type PrometheusAlert = {
  activeAt?: string;
  annotations: PrometheusLabels;
  labels: PrometheusLabels & {
    alertname: string;
    severity?: AlertSeverity | string;
  };
  state: AlertStates;
  value?: number | string;
};

export type Alert = PrometheusAlert & {
  rule: Rule;
  silencedBy?: Silence[];
};

export type PrometheusRule = {
  alerts: PrometheusAlert[];
  annotations: PrometheusLabels;
  duration: number;
  labels: PrometheusLabels & {
    severity?: string;
  };
  name: string;
  query: string;
  state: RuleStates;
  type: string;
};

export type Rule = PrometheusRule & {
  id: string;
  silencedBy?: Silence[];
};

export type PrometheusLabels = { [key: string]: string };
export type PrometheusValue = [number, string];

export type DiscoveryResources = {
  adminResources: string[];
  allResources: string[];
  configResources: K8sKind[];
  clusterOperatorConfigResources: K8sKind[];
  models: K8sKind[];
  namespacedSet: Set<string>;
  safeResources: string[];
  groupVersionMap: {
    [key: string]: {
      versions: string[];
      preferredVersion: string;
    };
  };
};
