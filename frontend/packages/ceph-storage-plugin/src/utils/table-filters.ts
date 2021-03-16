import * as _ from 'lodash';
import { TFunction } from 'i18next';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { getPhase } from './noobaa-utils';

const allPhases = ['Pending', 'Bound', 'Lost'];

export const obcStatusFilter = (t: TFunction): RowFilter => ({
  type: 'obc-status',
  filterGroupName: t('ceph-storage-plugin~Status'),
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
});

export const obStatusFilter = (t: TFunction): RowFilter => ({
  type: 'ob-status',
  filterGroupName: t('ceph-storage-plugin~Status'),
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
});
