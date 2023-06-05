import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';
import { nodeStatus, volumeSnapshotStatus } from '@console/app/src/status';
import { getNodeRoles, getLabelsAsString } from '@console/shared';
import { Alert, FilterValue, RowFilter, Rule } from '@console/dynamic-plugin-sdk';
import { routeStatus } from '../routes';
import { secretTypeFilterReducer } from '../secret';
import { roleType } from '../RBAC';
import {
  K8sResourceKind,
  MachineKind,
  getClusterOperatorStatus,
  getTemplateInstanceStatus,
  VolumeSnapshotKind,
  CustomResourceDefinitionKind,
} from '../../module/k8s';
import { alertDescription } from '../monitoring/utils';

import { Target } from '../monitoring/types';
import { requesterFilter } from '@console/shared/src/components/namespace';

export const fuzzyCaseInsensitive = (a: string, b: string): boolean =>
  fuzzy(_.toLower(a), _.toLower(b));

export const exactMatch = (a: string, b: string): boolean => !a || b?.includes(a);

const clusterServiceVersionDisplayName = (csv: K8sResourceKind): string =>
  csv?.spec?.displayName || csv?.metadata?.name;

// TODO: Table filters are undocumented, stringly-typed, and non-obvious. We can change that.
export const tableFilters = (isExactSearch: boolean): FilterMap => {
  const matchFn: Function = isExactSearch ? exactMatch : fuzzyCaseInsensitive;
  return {
    name: (filter, obj) => matchFn(filter.selected?.[0], obj.metadata.name),

    'catalog-source-name': (filter, obj) => matchFn(filter.selected?.[0], obj.name),
    requester: requesterFilter,

    'resource-list-text': (filter, resource: Rule | Alert) => {
      if (matchFn(filter.selected?.[0], resource.labels?.alertname || (resource as Rule)?.name)) {
        return true;
      }

      // Search in alert description. Ignore case and whitespace, but don't use fuzzy since the
      // description can be long and will often match fuzzy searches that are not really relevant.
      const needle = _.toLower(filter.selected?.[0]?.replace(/\s/g, ''));
      const haystack = _.toLower(alertDescription(resource)?.replace(/\s/g, ''));
      return haystack.includes(needle);
    },

    alerts: (values, alert: Alert) => {
      if (!values.all) {
        return true;
      }
      const labels = getLabelsAsString(alert, 'labels');
      return !!values.all.every((v) => labels.includes(v));
    },

    'observe-rules': (values, rule: Rule) => {
      if (!values.all) {
        return true;
      }
      const labels = getLabelsAsString(rule, 'labels');
      return !!values.all.every((v) => labels.includes(v));
    },

    'observe-target-labels': (values, target: Target) =>
      !values.all || values.all.every((v) => getLabelsAsString(target, 'labels').includes(v)),

    // Filter role by role kind
    'role-kind': (filter, role) =>
      filter.selected?.includes(roleType(role)) || filter.selected?.length === 0,

    // Filter role bindings by text match
    'role-binding': (str, { metadata, roleRef, subject }) => {
      const isMatch = (val) => matchFn(str.selected?.[0], val);
      return [metadata.name, roleRef.name, subject.kind, subject.name].some(isMatch);
    },

    // Filter role bindings by roleRef name
    'role-binding-roleRef-name': (name, binding) => binding.roleRef.name === name,

    // Filter role bindings by roleRef kind
    'role-binding-roleRef-kind': (kind, binding) => binding.roleRef.kind === kind,

    // Filter role bindings by user name
    'role-binding-user': (userName, { subject }) => subject.name === userName,

    // Filter role bindings by group name
    'role-binding-group': (groupName, { subject }) => subject.name === groupName,

    labels: (values, obj) => {
      if (!values.all) {
        return true;
      }
      const labels = getLabelsAsString(obj);
      return !!values.all.every((v) => labels.includes(v));
    },

    'node-status': (statuses, node) => {
      if (!statuses || !statuses.selected || !statuses.selected.length) {
        return true;
      }

      const status = nodeStatus(node);
      return statuses.selected.includes(status) || !_.includes(statuses.all, status);
    },

    'node-role': (roles, node) => {
      if (!roles || !roles.selected || !roles.selected.length) {
        return true;
      }

      const roleList = getNodeRoles(node);
      return roles.selected.filter((elem) => roleList.includes(elem)).length > 0;
    },

    'clusterserviceversion-resource-kind': (filters, resource) => {
      if (!filters || !filters.selected || !filters.selected.length) {
        return true;
      }
      return filters.selected.includes(resource.kind);
    },

    'packagemanifest-name': (filter, pkg) =>
      matchFn(
        filter.selected?.[0],
        (pkg.status.defaultChannel
          ? pkg.status.channels.find((ch) => ch.name === pkg.status.defaultChannel)
          : pkg.status.channels[0]
        ).currentCSVDesc.displayName,
      ),

    'build-status': (phases, build) => {
      if (!phases || !phases.selected || !phases.selected.length) {
        return true;
      }

      const phase = build.status.phase;
      return phases.selected.includes(phase) || !_.includes(phases.all, phase);
    },

    'build-strategy': (strategies, buildConfig) => {
      if (!strategies || !strategies.selected || !strategies.selected.length) {
        return true;
      }

      const strategy = buildConfig.spec.strategy.type;
      return strategies.selected.includes(strategy) || !_.includes(strategies.all, strategy);
    },

    'route-status': (statuses, route) => {
      if (!statuses || !statuses.selected || !statuses.selected.length) {
        return true;
      }

      const status = routeStatus(route);
      return statuses.selected.includes(status) || !_.includes(statuses.all, status);
    },

    'secret-type': (types, secret) => {
      if (!types || !types.selected || !types.selected.length) {
        return true;
      }
      const type = secretTypeFilterReducer(secret);
      return types.selected.includes(type) || !_.includes(types.all, type);
    },

    'project-name': (str, project: K8sResourceKind) => {
      const displayName = _.get(project, ['metadata', 'annotations', 'openshift.io/display-name']);
      return (
        matchFn(str.selected?.[0], project.metadata.name) || matchFn(str.selected?.[0], displayName)
      );
    },

    'pvc-status': (phases, pvc) => {
      if (!phases || !phases.selected || !phases.selected.length) {
        return true;
      }

      const phase = pvc.status.phase;
      return phases.selected.includes(phase) || !_.includes(phases.all, phase);
    },

    'cluster-operator-status': (statuses, operator) => {
      if (!statuses || !statuses.selected || !statuses.selected.length) {
        return true;
      }

      const status = getClusterOperatorStatus(operator);
      return statuses.selected.includes(status) || !_.includes(statuses.all, status);
    },

    'template-instance-status': (statuses, instance) => {
      if (!statuses || !statuses.selected || !statuses.selected.length) {
        return true;
      }

      const status = getTemplateInstanceStatus(instance);
      return statuses.selected.includes(status) || !_.includes(statuses.all, status);
    },

    machine: (str, machine: MachineKind): boolean => {
      const node: string = _.get(machine, 'status.nodeRef.name');
      return (
        matchFn(str.selected?.[0], machine.metadata.name) ||
        (node && matchFn(str.selected?.[0], node))
      );
    },

    'snapshot-status': (statuses, snapshot: VolumeSnapshotKind) => {
      if (!statuses || !statuses.selected || !statuses.selected.length) {
        return true;
      }

      const status = volumeSnapshotStatus(snapshot);
      return statuses.selected.includes(status) || !_.includes(statuses.all, status);
    },
    'node-disk-name': (name, disks) => matchFn(name.selected?.[0], disks?.path),
    'image-name': (str, imageManifestVuln) =>
      matchFn(str.selected?.[0], imageManifestVuln.spec.image),
    vulnerability: (str, imageVulnerability) =>
      matchFn(str.selected?.[0], imageVulnerability.vulnerability.name),

    // Filter cluster service version by displayName or name text match
    'cluster-service-version': (str, csv) => {
      const value = clusterServiceVersionDisplayName(csv);
      return matchFn(str.selected?.[0], value);
    },
    'custom-resource-definition-name': (str, crd: CustomResourceDefinitionKind) => {
      const displayName = _.get(crd, 'spec.names.kind');
      return (
        matchFn(str.selected?.[0], crd.metadata.name) || matchFn(str.selected?.[0], displayName)
      );
    },
  };
};
const rowFiltersToFilterFuncs = (rowFilters: RowFilter[]): FilterMap => {
  return (rowFilters || [])
    .filter((f) => f.type && _.isFunction(f.filter))
    .reduce((acc, f) => ({ ...acc, [f.type]: f.filter }), {} as FilterMap);
};

export const getAllTableFilters = (rowFilters: RowFilter[], isExactMatch?: boolean): FilterMap => ({
  ...tableFilters(isExactMatch),
  ...rowFiltersToFilterFuncs(rowFilters),
});

export type FilterMap = {
  [key: string]: (value: FilterValue, obj: any) => boolean;
};
