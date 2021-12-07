import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';

import { ListPage, Table, TableData } from './factory';
import { Kebab, LabelList, ResourceKebab, ResourceLink, Selector } from './utils';
import { PrometheusModel } from '../models';
import { referenceForModel } from '../module/k8s';

const { Edit, Delete, ModifyCount } = Kebab.factory;
const menuActions = [ModifyCount, Edit, Delete];

const tableColumnClasses = [
  'pf-u-w-25-on-xl',
  'pf-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-8-on-xl',
  'pf-m-hidden pf-m-visible-on-xl pf-u-w-16-on-xl',
  Kebab.columnClass,
];

const PrometheusTableRow = ({ obj: instance }) => {
  const { metadata, spec } = instance;
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(PrometheusModel)}
          name={metadata.name}
          namespace={metadata.namespace}
          title={metadata.uid}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={PrometheusModel.kind} labels={metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{spec.version}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector
          selector={spec.serviceMonitorSelector}
          kind="ServiceMonitor"
          namespace={metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab
          actions={menuActions}
          kind={referenceForModel(PrometheusModel)}
          resource={instance}
        />
      </TableData>
    </>
  );
};

const PrometheusInstancesList = (props) => {
  const { t } = useTranslation();

  const PrometheusTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Labels'),
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Version'),
        sortField: 'spec.version',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Service monitor selector'),
        sortField: 'spec.serviceMonitorSelector',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };

  return (
    <Table
      {...props}
      aria-label={t('public~Promethesuses')}
      Header={PrometheusTableHeader}
      Row={PrometheusTableRow}
      virtualize
    />
  );
};

export const PrometheusInstancesPage = (props) => (
  <ListPage
    {...props}
    ListComponent={PrometheusInstancesList}
    canCreate={true}
    kind={referenceForModel(PrometheusModel)}
  />
);
