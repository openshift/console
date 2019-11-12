import * as _ from 'lodash';
import { Filter } from '@console/shared/src/types';
import {
  HOST_REGISTERING_STATES,
  HOST_PROVISIONING_STATES,
  HOST_STATUS_READY,
  HOST_ERROR_STATES,
  HOST_STATUS_TITLES,
  HOST_STATUS_PROVISIONED,
  HOST_STATUS_EXTERNALLY_PROVISIONED,
  NODE_STATUS_TITLES,
  HOST_STATUS_AVAILABLE,
} from '../../constants';
import { BareMetalHostBundle } from '../types';

const hostStatesToFilterMap = Object.freeze({
  registering: {
    title: 'Registering',
    states: HOST_REGISTERING_STATES,
  },
  ready: {
    title: 'Available',
    states: [HOST_STATUS_READY, HOST_STATUS_AVAILABLE],
  },
  provisioning: {
    title: 'Provisioning',
    states: HOST_PROVISIONING_STATES,
  },
  provisioned: {
    title: 'Provisioned',
    states: [HOST_STATUS_PROVISIONED, HOST_STATUS_EXTERNALLY_PROVISIONED],
  },
  error: {
    title: 'Error',
    states: HOST_ERROR_STATES,
  },
  other: {
    title: 'Other',
    states: [...Object.keys(HOST_STATUS_TITLES), ...Object.keys(NODE_STATUS_TITLES)],
  },
});

export const getHostFilterStatus = (bundle: BareMetalHostBundle): string => {
  return _.findKey(hostStatesToFilterMap, ({ states }) => states.includes(bundle.status.status));
};

export const hostStatusFilter: Filter = {
  type: 'host-status',
  selected: Object.keys(hostStatesToFilterMap),
  reducer: getHostFilterStatus,
  items: _.map(hostStatesToFilterMap, ({ title }, id) => ({ id, title })),
  filter: (groups, bundle: BareMetalHostBundle) => {
    const status = getHostFilterStatus(bundle);
    return groups.selected.has(status) || !_.includes(groups.all, status);
  },
};
