import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { NODE_STATUS_TITLE_KEYS } from '../../constants';
import { BareMetalNodeListBundle, isCSRBundle } from '../types';

const statesToFilterMap = Object.freeze({
  ready: {
    // t('metal3-plugin~Ready')
    titleKey: 'metal3-plugin~Ready',
    states: ['Ready'],
  },
  notReady: {
    // t('metal3-plugin~Not Ready')
    titleKey: 'metal3-plugin~Not Ready',
    states: ['Not Ready'],
  },
  maintenance: {
    // t('metal3-plugin~Maintenance')
    titleKey: 'metal3-plugin~Maintenance',
    states: Object.keys(NODE_STATUS_TITLE_KEYS),
  },
  approval: {
    // t('metal3-plugin~Approval Required')
    titleKey: 'metal3-plugin~Approval Required',
    states: ['approval'],
  },
});

export const getBareMetalNodeFilterStatus = (bundle: BareMetalNodeListBundle): string =>
  bundle.csr
    ? 'approval'
    : _.findKey(statesToFilterMap, ({ states }) => states.includes(bundle.status.status));

export const bareMetalNodeStatusFilter = (t: TFunction): RowFilter<BareMetalNodeListBundle> => ({
  filterGroupName: 'Status',
  type: 'bare-metal-node-status',
  reducer: getBareMetalNodeFilterStatus,
  items: _.map(statesToFilterMap, ({ titleKey }, id) => ({ id, title: t(titleKey) })),
  filter: (groups, bundle: BareMetalNodeListBundle) => {
    const status = isCSRBundle(bundle) ? 'approval' : getBareMetalNodeFilterStatus(bundle);
    return (
      groups.selected.has(status) || !_.includes(groups.all, status) || _.isEmpty(groups.selected)
    );
  },
});
