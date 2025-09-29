import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';

import { ListPage, Table, TableData, TableProps, ListPageProps } from './factory';
import { LabelList, ResourceLink, Selector } from './utils';
import { PrometheusModel } from '../models';
import { referenceForModel, referenceFor, K8sResourceKind } from '../module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

const tableColumnClasses = [
  'pf-v6-u-w-25-on-xl',
  'pf-v6-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-md pf-v6-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-v6-u-w-8-on-xl',
  'pf-m-hidden pf-m-visible-on-xl pf-v6-u-w-16-on-xl',
  'pf-v6-c-table__action',
];

interface PrometheusTableRowProps {
  obj: K8sResourceKind;
}

const PrometheusTableRow: React.FCC<PrometheusTableRowProps> = ({ obj: instance }) => {
  const { metadata, spec } = instance;
  const resourceKind = referenceFor(instance);
  const context = { [resourceKind]: instance };
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
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

const PrometheusInstancesList = (props: Partial<TableProps>) => {
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

export const PrometheusInstancesPage = (props: Partial<ListPageProps<never>>) => (
  <ListPage
    {...props}
    ListComponent={PrometheusInstancesList}
    canCreate={true}
    kind={referenceForModel(PrometheusModel)}
  />
);
