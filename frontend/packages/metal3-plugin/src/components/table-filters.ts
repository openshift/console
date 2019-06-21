import * as _ from 'lodash';

import { Filter } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getSimpleHostStatus } from '../utils/host-status';
import {
  HOST_REGISTERING_STATES,
  HOST_PROVISIONING_STATES,
  HOST_STATUS_READY,
  HOST_ERROR_STATES,
  HOST_STATUS_TITLES,
  HOST_STATUS_PROVISIONED,
} from '../constants';

const hostStatesToFilterMap = Object.freeze({
  registering: {
    title: 'Registering',
    states: HOST_REGISTERING_STATES,
  },
  ready: {
    title: 'Ready',
    states: [HOST_STATUS_READY],
  },
  provisioning: {
    title: 'Provisioning',
    states: HOST_PROVISIONING_STATES,
  },
  provisioned: {
    title: 'Provisioned',
    states: [HOST_STATUS_PROVISIONED],
  },
  error: {
    title: 'Error',
    states: HOST_ERROR_STATES,
  },
  other: {
    title: 'Other',
    states: Object.keys(HOST_STATUS_TITLES),
  },
});

const getHostFilterStatus = (host: K8sResourceKind): string => {
  const status = getSimpleHostStatus(host);
  return _.findKey(hostStatesToFilterMap, ({ states }) => states.includes(status));
};

export const hostStatusFilter: Filter = {
  type: 'host-status',
  selected: Object.keys(hostStatesToFilterMap),
  reducer: getHostFilterStatus,
  items: _.map(hostStatesToFilterMap, ({ title }, id) => ({ id, title })),
  filter: (groups, host: K8sResourceKind) => {
    const status = getHostFilterStatus(host);
    return groups.selected.has(status) || !_.includes(groups.all, status);
  },
};
