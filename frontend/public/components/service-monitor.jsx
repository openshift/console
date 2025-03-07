import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { ListPage, Table, TableData } from './factory';
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
  '',
  '',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-md',
  Kebab.columnClass,
];

const ServiceMonitorTableRow = ({ obj: sm }) => {
  const { metadata } = sm;
  return (
    <>
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
    </>
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
