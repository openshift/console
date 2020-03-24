import * as _ from 'lodash-es';
import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, ResourceKebab, ResourceLink, Selector } from './utils';
import { ServiceMonitorModel } from '../models';
import { referenceForModel } from '../module/k8s';

const { Edit, Delete } = Kebab.factory;
const menuActions = [Edit, Delete];

const namespaceSelectorLinks = ({ spec }) => {
  const namespaces = _.get(spec, 'namespaceSelector.matchNames', []);
  if (namespaces.length) {
    return _.map(namespaces, (n) => (
      <span key={n}>
        <ResourceLink kind="Namespace" name={n} title={n} />
        &nbsp;&nbsp;
      </span>
    ));
  }
  return <span className="text-muted">--</span>;
};

const serviceSelectorLinks = ({ spec }) => {
  const namespaces = _.get(spec, 'namespaceSelector.matchNames', []);
  if (namespaces.length) {
    return _.map(namespaces, (n) => (
      <span key={n}>
        <Selector selector={spec.selector} kind="Service" namespace={n} />
        &nbsp;&nbsp;
      </span>
    ));
  }
  return <Selector selector={spec.selector} kind="Service" />;
};

const tableColumnClasses = [
  classNames('col-md-3', 'col-sm-3', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-3', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-6', 'hidden-xs'),
  classNames('col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const ServiceMonitorTableRow = ({ obj: sm, index, key, style }) => {
  const { metadata } = sm;
  return (
    <TableRow id={sm.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(ServiceMonitorModel)}
          name={metadata.name}
          namespace={metadata.namespace}
          title={metadata.uid}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{serviceSelectorLinks(sm)}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <p>{namespaceSelectorLinks(sm)}</p>
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab
          actions={menuActions}
          kind={referenceForModel(ServiceMonitorModel)}
          resource={sm}
        />
      </TableData>
    </TableRow>
  );
};

const ServiceMonitorTableHeader = () => {
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
      title: 'Service Selector',
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Monitoring Namespace',
      sortField: 'spec.namespaceSelector',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};
ServiceMonitorTableHeader.displayName = 'ServiceMonitorTableHeader';

export const ServiceMonitorsList = (props) => (
  <Table
    {...props}
    aria-label="Service Monitors"
    Header={ServiceMonitorTableHeader}
    Row={ServiceMonitorTableRow}
    virtualize
  />
);

export const ServiceMonitorsPage = (props) => (
  <ListPage
    {...props}
    canCreate={true}
    kind={referenceForModel(ServiceMonitorModel)}
    ListComponent={ServiceMonitorsList}
  />
);
