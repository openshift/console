import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { NODE_STATUS_TITLES } from '../../constants';
import { BareMetalNodeListBundle, isCSRBundle } from '../types';

const statesToFilterMap = Object.freeze({
  ready: {
    title: 'Ready',
    states: ['Ready'],
  },
  notReady: {
    title: 'Not Ready',
    states: ['Not Ready'],
  },
  maintenance: {
    title: 'Maintenance',
    states: Object.keys(NODE_STATUS_TITLES),
  },
  approval: {
    title: 'Approval Required',
    states: ['approval'],
  },
});

export const getBareMetalNodeFilterStatus = (bundle: BareMetalNodeListBundle): string =>
  bundle.csr
    ? 'approval'
    : _.findKey(statesToFilterMap, ({ states }) => states.includes(bundle.status.status));

export const bareMetalNodeStatusFilter: RowFilter<BareMetalNodeListBundle> = {
  filterGroupName: 'Status',
  type: 'bare-metal-node-status',
  reducer: getBareMetalNodeFilterStatus,
  items: _.map(statesToFilterMap, ({ title }, id) => ({ id, title })),
  filter: (groups, bundle: BareMetalNodeListBundle) => {
    const status = isCSRBundle(bundle) ? 'approval' : getBareMetalNodeFilterStatus(bundle);
    return (
      groups.selected.has(status) || !_.includes(groups.all, status) || _.isEmpty(groups.selected)
    );
  },
};
