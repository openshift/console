import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { NODE_STATUS_TITLES } from '../../constants';
import { BareMetalNodeBundle } from '../types';

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
});

export const getBareMetalNodeFilterStatus = (bundle: BareMetalNodeBundle): string => {
  return _.findKey(statesToFilterMap, ({ states }) => states.includes(bundle.status.status));
};

export const bareMetalNodeStatusFilter: RowFilter = {
  filterGroupName: 'Status',
  type: 'bare-metal-node-status',
  reducer: getBareMetalNodeFilterStatus,
  items: _.map(statesToFilterMap, ({ title }, id) => ({ id, title })),
  filter: (groups, bundle: BareMetalNodeBundle) => {
    const status = getBareMetalNodeFilterStatus(bundle);
    return (
      groups.selected.has(status) || !_.includes(groups.all, status) || _.isEmpty(groups.selected)
    );
  },
};
