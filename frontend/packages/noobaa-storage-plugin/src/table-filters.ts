import * as _ from 'lodash';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { getPhase } from './utils';

const allPhases = ['Pending', 'Bound', 'Lost'];

export const obcStatusFilter: RowFilter = {
  type: 'obc-status',
  filterGroupName: 'Status',
  reducer: getPhase,
  items: _.map(allPhases, (phase) => ({
    id: phase,
    title: phase,
  })),
  filter: (phases, obc) => {
    if (!phases || !phases.selected) {
      return true;
    }
    const phase = getPhase(obc);
    return (
      phases.selected.has(phase) || !_.includes(phases.all, phase) || _.isEmpty(phases.selected)
    );
  },
};

export const obStatusFilter: RowFilter = {
  type: 'ob-status',
  filterGroupName: 'Status',
  reducer: getPhase,
  items: _.map(allPhases, (phase) => ({
    id: phase,
    title: phase,
  })),
  filter: (phases, ob) => {
    if (!phases || !phases.selected) {
      return true;
    }
    const phase = getPhase(ob);
    return (
      phases.selected.has(phase) || !_.includes(phases.all, phase) || _.isEmpty(phases.selected)
    );
  },
};
