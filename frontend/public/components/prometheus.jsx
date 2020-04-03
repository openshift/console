import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, LabelList, ResourceKebab, ResourceLink, Selector } from './utils';
import { PrometheusModel } from '../models';
import { referenceForModel } from '../module/k8s';

const { Edit, Delete, ModifyCount } = Kebab.factory;
const menuActions = [ModifyCount, Edit, Delete];

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-1', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const PrometheusTableRow = ({ obj: instance, index, key, style }) => {
  const { metadata, spec } = instance;
  return (
    <TableRow id={instance.metadata.uid} index={index} trKey={key} style={style}>
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
    </TableRow>
  );
};

const PrometheusTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Version',
      sortField: 'spec.version',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Service Monitor Selector',
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
PrometheusTableHeader.displayName = 'PrometheusTableHeader';

const PrometheusInstancesList = (props) => (
  <Table
    {...props}
    aria-label="Promethesuses"
    Header={PrometheusTableHeader}
    Row={PrometheusTableRow}
    virtualize
  />
);

export const PrometheusInstancesPage = (props) => (
  <ListPage
    {...props}
    ListComponent={PrometheusInstancesList}
    canCreate={true}
    kind={referenceForModel(PrometheusModel)}
  />
);
