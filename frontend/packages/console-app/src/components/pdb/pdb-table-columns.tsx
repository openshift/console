import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import i18next from 'i18next';
import { TableColumn } from '@console/dynamic-plugin-sdk';
import { Kebab } from '@console/internal/components/utils';
import { PodDisruptionBudgetKind } from './types';

export const tableColumnInfo = [
  { className: '', id: 'name' },
  { className: '', id: 'namespace' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-sm'), id: 'selector' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-md'), id: 'minAvailable' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'disruptionsAllowed' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-xl'), id: 'creationTimestamp' },
  { className: Kebab.columnClass, id: '' },
];

export const getPDBTableColumns = (): TableColumn<PodDisruptionBudgetKind>[] => [
  {
    title: i18next.t('console-app~Name'),
    sort: 'metadata.name',
    transforms: [sortable],
    props: { className: tableColumnInfo[0].className },
    id: tableColumnInfo[0].id,
  },
  {
    title: i18next.t('console-app~Namespace'),
    sort: 'metadata.namespace',
    transforms: [sortable],
    props: { className: tableColumnInfo[1].className },
    id: tableColumnInfo[1].id,
  },
  {
    title: i18next.t('console-app~Selector'),
    sort: 'spec.selector',
    transforms: [sortable],
    props: { className: tableColumnInfo[2].className },
    id: tableColumnInfo[2].id,
  },
  {
    title: i18next.t('console-app~Availability'),
    sort: 'spec.minAvailable',
    transforms: [sortable],
    props: { className: tableColumnInfo[3].className },
    id: tableColumnInfo[3].id,
  },
  {
    title: i18next.t('console-app~Allowed disruptions'),
    sort: 'status.disruptionsAllowed',
    transforms: [sortable],
    props: { className: tableColumnInfo[4].className },
    id: tableColumnInfo[4].id,
  },
  {
    title: i18next.t('console-app~Created'),
    sort: 'metadata.creationTimestamp',
    transforms: [sortable],
    props: { className: tableColumnInfo[5].className },
    id: tableColumnInfo[5].id,
  },
  {
    title: '',
    props: { className: tableColumnInfo[6].className },
    id: tableColumnInfo[6].id,
  },
];
