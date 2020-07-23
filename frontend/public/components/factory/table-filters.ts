import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';
import { nodeStatus, volumeSnapshotStatus } from '@console/app/src/status';
import { getNodeRole, getLabelsAsString } from '@console/shared';
import { routeStatus } from '../routes';
import { secretTypeFilterReducer } from '../secret';
import { bindingType, roleType } from '../RBAC';
import {
  K8sResourceKind,
  MachineKind,
  podPhaseFilterReducer,
  serviceCatalogStatus,
  serviceClassDisplayName,
  servicePlanDisplayName,
  getClusterOperatorStatus,
  getTemplateInstanceStatus,
  VolumeSnapshotKind,
} from '../../module/k8s';
import {
  alertDescription,
  alertingRuleIsActive,
  alertingRuleSource,
  alertSource,
  alertState,
  silenceState,
} from '../../reducers/monitoring';
import { Alert, Rule, Silence } from '../monitoring/types';

export const fuzzyCaseInsensitive = (a: string, b: string): boolean =>
  fuzzy(_.toLower(a), _.toLower(b));

// TODO: Table filters are undocumented, stringly-typed, and non-obvious. We can change that.
export const tableFilters: TableFilterMap = {
  name: (filter, obj) => fuzzyCaseInsensitive(filter, obj.metadata.name),

  'catalog-source-name': (filter, obj) => fuzzyCaseInsensitive(filter, obj.name),

  'resource-list-text': (filter, resource: Rule | Alert) => {
    if (fuzzyCaseInsensitive(filter, resource.labels?.alertname || (resource as Rule)?.name)) {
      return true;
    }

    // Search in alert description. Ignore case and whitespace, but don't use fuzzy since the
    // description can be long and will often match fuzzy searches that are not really relevant.
    const needle = _.toLower(filter.replace(/\s/g, ''));
    const haystack = _.toLower(alertDescription(resource)?.replace(/\s/g, ''));
    return haystack.includes(needle);
  },

  alerts: (values, alert: Alert) => {
    const labels = getLabelsAsString(alert, 'labels');
    if (!values.all) {
      return true;
    }
    return !!values.all.every((v) => labels.includes(v));
  },

  'alert-severity': (filter, { labels }: Alert | Rule) =>
    filter.selected.has(labels?.severity) || _.isEmpty(filter.selected),

  'alert-source': (filter, alert: Alert) =>
    filter.selected.has(alertSource(alert)) || _.isEmpty(filter.selected),

  'alert-state': (filter, alert: Alert) =>
    filter.selected.has(alertState(alert)) || _.isEmpty(filter.selected),

  'alerting-rule-active': (filter, rule: Rule) =>
    filter.selected.has(alertingRuleIsActive(rule)) || _.isEmpty(filter.selected),

  'alerting-rule-name': (filter, rule: Rule) => fuzzyCaseInsensitive(filter, rule.name),

  'alerting-rule-source': (filter, rule: Rule) =>
    filter.selected.has(alertingRuleSource(rule)) || _.isEmpty(filter.selected),

  'silence-name': (filter, silence: Silence) => fuzzyCaseInsensitive(filter, silence.name),

  'silence-state': (filter, silence: Silence) =>
    filter.selected.has(silenceState(silence)) || _.isEmpty(filter.selected),

  // Filter role by role kind
  'role-kind': (filter, role) => filter.selected.has(roleType(role)) || filter.selected.size === 0,

  // Filter role bindings by role kind
  'role-binding-kind': (filter, binding) =>
    filter.selected.has(bindingType(binding)) || filter.selected.size === 0,

  // Filter role bindings by text match
  'role-binding': (str, { metadata, roleRef, subject }) => {
    const isMatch = (val) => fuzzyCaseInsensitive(str, val);
    return [metadata.name, roleRef.name, subject.kind, subject.name].some(isMatch);
  },

  // Filter role bindings by roleRef name
  'role-binding-roleRef-name': (name: string, binding) => binding.roleRef.name === name,

  // Filter role bindings by roleRef kind
  'role-binding-roleRef-kind': (kind: string, binding) => binding.roleRef.kind === kind,

  // Filter role bindings by user name
  'role-binding-user': (userName, binding) =>
    _.some(binding.subjects, {
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
      name: userName,
    }),

  // Filter role bindings by group name
  'role-binding-group': (groupName, binding) =>
    _.some(binding.subjects, {
      kind: 'Group',
      apiGroup: 'rbac.authorization.k8s.io',
      name: groupName,
    }),

  selector: (selector, obj) => {
    if (!selector || !selector.values || !selector.values.size) {
      return true;
    }
    return selector.values.has(_.get(obj, selector.field));
  },

  labels: (values, obj) => {
    const labels = getLabelsAsString(obj);
    if (!values.all) {
      return true;
    }
    return !!values.all.every((v) => labels.includes(v));
  },

  'pod-status': (phases, pod) => {
    if (!phases || !phases.selected || !phases.selected.size) {
      return true;
    }

    const phase = podPhaseFilterReducer(pod);
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },

  'node-status': (statuses, node) => {
    if (!statuses || !statuses.selected || !statuses.selected.size) {
      return true;
    }

    const status = nodeStatus(node);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },

  'node-role': (roles, node) => {
    if (!roles || !roles.selected || !roles.selected.size) {
      return true;
    }
    const role = getNodeRole(node);
    return roles.selected.has(role);
  },

  'clusterserviceversion-resource-kind': (filters, resource) => {
    if (!filters || !filters.selected || !filters.selected.size) {
      return true;
    }
    return filters.selected.has(resource.kind);
  },

  'packagemanifest-name': (filter, pkg) =>
    fuzzyCaseInsensitive(
      filter,
      (pkg.status.defaultChannel
        ? pkg.status.channels.find((ch) => ch.name === pkg.status.defaultChannel)
        : pkg.status.channels[0]
      ).currentCSVDesc.displayName,
    ),

  'build-status': (phases, build) => {
    if (!phases || !phases.selected || !phases.selected.size) {
      return true;
    }

    const phase = build.status.phase;
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },

  'build-strategy': (strategies, buildConfig) => {
    if (!strategies || !strategies.selected || !strategies.selected.size) {
      return true;
    }

    const strategy = buildConfig.spec.strategy.type;
    return strategies.selected.has(strategy) || !_.includes(strategies.all, strategy);
  },

  'route-status': (statuses, route) => {
    if (!statuses || !statuses.selected || !statuses.selected.size) {
      return true;
    }

    const status = routeStatus(route);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },

  'catalog-status': (statuses, catalog) => {
    if (!statuses || !statuses.selected || !statuses.selected.size) {
      return true;
    }

    const status = serviceCatalogStatus(catalog);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },

  'secret-type': (types, secret) => {
    if (!types || !types.selected || !types.selected.size) {
      return true;
    }
    const type = secretTypeFilterReducer(secret);
    return types.selected.has(type) || !_.includes(types.all, type);
  },

  'project-name': (str: string, project: K8sResourceKind) => {
    const displayName = _.get(project, ['metadata', 'annotations', 'openshift.io/display-name']);
    return (
      fuzzyCaseInsensitive(str, project.metadata.name) || fuzzyCaseInsensitive(str, displayName)
    );
  },

  'pvc-status': (phases, pvc) => {
    if (!phases || !phases.selected || !phases.selected.size) {
      return true;
    }

    const phase = pvc.status.phase;
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },

  // Filter service classes by text match
  'service-class': (str, serviceClass) => {
    const displayName = serviceClassDisplayName(serviceClass);
    return fuzzyCaseInsensitive(str, displayName);
  },

  'service-plan': (str, servicePlan) => {
    const displayName = servicePlanDisplayName(servicePlan);
    return fuzzyCaseInsensitive(str, displayName);
  },

  'cluster-operator-status': (statuses, operator) => {
    if (!statuses || !statuses.selected || !statuses.selected.size) {
      return true;
    }

    const status = getClusterOperatorStatus(operator);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },

  'template-instance-status': (statuses, instance) => {
    if (!statuses || !statuses.selected || !statuses.selected.size) {
      return true;
    }

    const status = getTemplateInstanceStatus(instance);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },

  machine: (str: string, machine: MachineKind): boolean => {
    const node: string = _.get(machine, 'status.nodeRef.name');
    return (
      fuzzyCaseInsensitive(str, machine.metadata.name) || (node && fuzzyCaseInsensitive(str, node))
    );
  },

  'snapshot-status': (statuses, snapshot: VolumeSnapshotKind) => {
    if (!statuses || !statuses.selected || !statuses.selected.size) {
      return true;
    }

    const status = volumeSnapshotStatus(snapshot);
    return statuses.selected.has(status) || !_.includes(statuses.all, status);
  },
  'node-disk-name': (name, disks) => fuzzyCaseInsensitive(name, disks?.path),
};

export interface TableFilterGroups {
  selected: Set<string>;
  all: string[];
  values: Set<string>;
  field: string;
}

export type TableFilter = (groups: TableFilterGroups, obj: any) => boolean;
export type TextFilter = (text: string, obj: any) => boolean;

type TableFilterMap = {
  [key: string]: TableFilter | TextFilter;
};
