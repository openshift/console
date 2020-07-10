import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
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
  HOST_STATUS_UNMANAGED,
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
  maintenance: {
    title: 'Maintenance',
    states: Object.keys(NODE_STATUS_TITLES),
  },
  unmanaged: {
    title: 'Unmanaged',
    states: [HOST_STATUS_UNMANAGED],
  },
  other: {
    title: 'Other',
    states: Object.keys(HOST_STATUS_TITLES),
  },
});

export const getHostFilterStatus = (bundle: BareMetalHostBundle): string => {
  return _.findKey(hostStatesToFilterMap, ({ states }) => states.includes(bundle.status.status));
};

export const hostStatusFilter: RowFilter = {
  filterGroupName: 'Status',
  type: 'host-status',
  reducer: getHostFilterStatus,
  items: _.map(hostStatesToFilterMap, ({ title }, id) => ({ id, title })),
  filter: (groups, bundle: BareMetalHostBundle) => {
    const status = getHostFilterStatus(bundle);
    return (
      groups.selected.has(status) || !_.includes(groups.all, status) || _.isEmpty(groups.selected)
    );
  },
};
