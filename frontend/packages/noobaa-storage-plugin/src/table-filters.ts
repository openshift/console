import * as _ from 'lodash';
import { Filter } from '@console/shared';
import { getPhase } from './utils';

const allPhases = ['Pending', 'Bound', 'Lost'];

export const obcStatusFilter: Filter = {
  type: 'obc-status',
  selected: allPhases,
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
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },
};

export const obStatusFilter: Filter = {
  type: 'ob-status',
  selected: allPhases,
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
    return phases.selected.has(phase) || !_.includes(phases.all, phase);
  },
};
