import * as _ from 'lodash-es';
import { alertStateOrder, silenceStateOrder } from '../../reducers/monitoring';
import { ingressValidHosts } from '../ingress';
import {
  getJobTypeAndCompletions,
  K8sResourceKind,
  planExternalName,
  podPhase,
  podReadiness,
  serviceCatalogStatus,
  serviceClassDisplayName,
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getTemplateInstanceStatus,
  getNodeRoles,
} from '../../module/k8s';

import { SortByDirection } from '@patternfly/react-table';
import { getFilteredRows } from './table-filters';

export const tableSorts = {
  alertStateOrder,
  daemonsetNumScheduled: daemonset => _.toInteger(_.get(daemonset, 'status.currentNumberScheduled')),
  dataSize: resource => _.size(_.get(resource, 'data')),
  ingressValidHosts,
  serviceCatalogStatus,
  jobCompletions: job => getJobTypeAndCompletions(job).completions,
  jobType: job => getJobTypeAndCompletions(job).type,
  nodeReadiness: node => {
    let readiness = _.get(node, 'status.conditions');
    readiness = _.find(readiness, {type: 'Ready'});
    return _.get(readiness, 'status');
  },
  numReplicas: resource => _.toInteger(_.get(resource, 'status.replicas')),
  planExternalName,
  podPhase,
  podReadiness,
  serviceClassDisplayName,
  silenceStateOrder,
  string: val => JSON.stringify(val),
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getTemplateInstanceStatus,
  nodeRoles: (node: K8sResourceKind): string => {
    const roles = getNodeRoles(node);
    return roles.sort().join(', ');
  },
};

export const tableStateToProps = ({UI}, {data = [], defaultSortField = 'metadata.name', defaultSortFunc = undefined, filters = {}, loaded = false, reduxID = null, reduxIDs = null, staticFilters = [{}], rowFilters = []}) => {
  const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;
  let newData = getFilteredRows(allFilters, rowFilters, data);

  const listId = reduxIDs ? reduxIDs.join(',') : reduxID;
  // Only default to 'metadata.name' if no `defaultSortFunc`
  const currentSortField = UI.getIn(['listSorts', listId, 'field'], defaultSortFunc ? undefined : defaultSortField);
  const currentSortFunc = UI.getIn(['listSorts', listId, 'func'], defaultSortFunc);
  const currentSortOrder = UI.getIn(['listSorts', listId, 'orderBy'], SortByDirection.asc);

  if (loaded) {
    let sortBy: string | Function = 'metadata.name';
    if (currentSortField) {
      // Sort resources by one of their fields as a string
      sortBy = resource => tableSorts.string(_.get(resource, currentSortField, ''));
    } else if (currentSortFunc && tableSorts[currentSortFunc]) {
      // Sort resources by a function in the 'tableSorts' object
      sortBy = tableSorts[currentSortFunc];
    }

    // Always set the secondary sort criteria to ascending by name
    newData = _.orderBy(newData, [sortBy, 'metadata.name'], [currentSortOrder, SortByDirection.asc]);
  }

  return {
    currentSortField,
    currentSortFunc,
    currentSortOrder,
    data: newData,
    listId,
  };
};
