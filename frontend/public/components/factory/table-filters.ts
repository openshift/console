import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';

import { routeStatus } from '../routes';
import { secretTypeFilterReducer } from '../secret';
import { bindingType, roleType } from '../RBAC';

import {
  nodeStatus,
  podPhaseFilterReducer,
  serviceCatalogStatus,
  serviceClassDisplayName,
  getClusterOperatorStatus,
  getTemplateInstanceStatus,
} from '../../module/k8s';

import {
  alertState,
  silenceState,
} from '../../reducers/monitoring';

export const fuzzyCaseInsensitive = (a, b) => fuzzy(_.toLower(a), _.toLower(b));

// TODO: Table filters are undocumented, stringly-typed, and non-obvious. We can change that.
export const tableFilters: TableFilterMap = {
  'name': (filter, obj) => fuzzyCaseInsensitive(filter, obj.metadata.name),

  'alert-name': (filter, alert) => fuzzyCaseInsensitive(filter, _.get(alert, 'labels.alertname')),

  'alert-state': (filter, alert) => filter.selected.has(alertState(alert)),

  'silence-name': (filter, silence) => fuzzyCaseInsensitive(filter, silence.name),

  'silence-state': (filter, silence) => filter.selected.has(silenceState(silence)),

  // Filter role by role kind
  'role-kind': (filter, role) => filter.selected.has(roleType(role)),

  // Filter role bindings by role kind
  'role-binding-kind': (filter, binding) => filter.selected.has(bindingType(binding)),

  // Filter role bindings by text match
  'role-binding': (str, {metadata, roleRef, subject}) => {
    const isMatch = val => fuzzyCaseInsensitive(str, val);
    return [metadata.name, roleRef.name, subject.kind, subject.name].some(isMatch);
  },

  // Filter role bindings by roleRef name
  'role-binding-roleRef': (roleRef, binding) => binding.roleRef.name === roleRef,

  'selector': (selector, obj) => {
    if (!selector || !selector.values || !selector.values.size) {
      return true;
    }
    return selector.values.has(_.get(obj, selector.field));
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

  'clusterserviceversion-resource-kind': (filters, resource) => {
    if (!filters || !filters.selected || !filters.selected.size) {
      return true;
    }
    return filters.selected.has(resource.kind);
  },

  'packagemanifest-name': (filter, pkg) => fuzzyCaseInsensitive(filter, (pkg.status.defaultChannel
    ? pkg.status.channels.find(ch => ch.name === pkg.status.defaultChannel)
    : pkg.status.channels[0]).currentCSVDesc.displayName),

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
};

interface TableFilterGroups {
  selected: Set<string>;
  all: string[];
  values: Set<string>;
  field: string;
}

export type TableFilter = (groups: TableFilterGroups, obj: any) => boolean;

type TableFilterMap = {
  [key: string]: TableFilter;
}

export const rowFiltersToFilterFuncs = (rowFilters) => {
  return (rowFilters || [])
    .filter(f => f.type && _.isFunction(f.filter))
    .reduce((acc, f) => ({ ...acc, [f.type]: f.filter }), {});
};

export const getAllTableFilters = (rowFilters) => ({
  ...tableFilters,
  ...rowFiltersToFilterFuncs(rowFilters),
});

export const getFilteredRows = (_filters, rowFilters, objects) => {
  if (_.isEmpty(_filters)) {
    return objects;
  }

  const allTableFilters = getAllTableFilters(rowFilters);
  let filteredObjects = objects;
  _.each(_filters, (value, name) => {
    const filter = allTableFilters[name];
    if (_.isFunction(filter)) {
      filteredObjects = _.filter(filteredObjects, o => filter(value, o));
    }
  });

  return filteredObjects;
};

export const filterPropType = (props, propName, componentName) => {
  if (!props) {
    return;
  }

  const allTableFilters = getAllTableFilters(props.rowFilters);
  for (const key of _.keys(props[propName])) {
    if (key in allTableFilters || key === 'loadTest') {
      continue;
    }
    return new Error(`Invalid prop '${propName}' in '${componentName}'. '${key}' is not a valid filter type!`);
  }
};
