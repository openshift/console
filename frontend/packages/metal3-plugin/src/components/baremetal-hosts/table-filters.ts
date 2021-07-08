import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import {
  HOST_REGISTERING_STATES,
  HOST_PROVISIONING_STATES,
  HOST_STATUS_READY,
  HOST_ERROR_STATES,
  HOST_STATUS_TITLE_KEYS,
  HOST_STATUS_PROVISIONED,
  HOST_STATUS_EXTERNALLY_PROVISIONED,
  NODE_STATUS_TITLE_KEYS,
  HOST_STATUS_AVAILABLE,
  HOST_STATUS_UNMANAGED,
} from '../../constants';
import { BareMetalHostBundle } from '../types';

// NOTE(yaacov): hostStatesToFilterMap titles translation keys.
// t('metal3-plugin~Registering')
// t('metal3-plugin~Available')
// t('metal3-plugin~Provisioning')
// t('metal3-plugin~Provisioned')
// t('metal3-plugin~Error')
// t('metal3-plugin~Maintenance')
// t('metal3-plugin~Unmanaged')
// t('metal3-plugin~Other')

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
    states: Object.keys(NODE_STATUS_TITLE_KEYS),
  },
  unmanaged: {
    title: 'Unmanaged',
    states: [HOST_STATUS_UNMANAGED],
  },
  other: {
    title: 'Other',
    states: Object.keys(HOST_STATUS_TITLE_KEYS),
  },
});

export const getHostFilterStatus = (bundle: BareMetalHostBundle): string => {
  return _.findKey(hostStatesToFilterMap, ({ states }) => states.includes(bundle.status.status));
};

export const hostStatusFilter = (t: TFunction): RowFilter => ({
  filterGroupName: 'Status',
  type: 'host-status',
  reducer: getHostFilterStatus,
  items: _.map(hostStatesToFilterMap, ({ title }, id) => ({ id, title: t(title) })),
  filter: (groups, bundle: BareMetalHostBundle) => {
    const status = getHostFilterStatus(bundle);
    return (
      groups.selected.has(status) || !_.includes(groups.all, status) || _.isEmpty(groups.selected)
    );
  },
});
