import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  DetailsPage,
  ListPage,
  Table,
  TableRow,
  TableData,
} from './factory';
import {
  AsyncComponent,
  Kebab,
  ContainerTable,
  detailsPage,
  LabelList,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
} from './utils';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';

export const menuActions = [Kebab.factory.AddStorage, Kebab.factory.EditEnvironment, ...Kebab.factory.common];

const kind = 'DaemonSet';

const tableColumnClasses = [
  classNames('pf-m-2-col-on-xl', 'pf-m-3-col-on-lg', 'pf-m-4-col-on-md', 'pf-m-6-col-on-sm'),
  classNames('pf-m-2-col-on-xl', 'pf-m-3-col-on-lg', 'pf-m-4-col-on-md', 'pf-m-6-col-on-sm'),
  classNames('pf-m-3-col-on-xl', 'pf-m-4-col-on-lg', 'pf-m-4-col-on-md', 'pf-m-hidden', 'pf-m-visible-on-md'),
  classNames('pf-m-2-col-on-xl', 'pf-m-2-col-on-lg', 'pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-3-col-on-xl', 'pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const DaemonSetTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Status', sortFunc: 'daemonsetNumScheduled', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Pod Selector', sortField: 'spec.selector', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '', props: { className: tableColumnClasses[5] },
    },
  ];
};
DaemonSetTableHeader.displayName = 'DaemonSetTableHeader';

const DaemonSetTableRow = ({obj: daemonset, index, key, style}) => {
  return (
    <TableRow id={daemonset.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={daemonset.metadata.name} namespace={daemonset.metadata.namespace} title={daemonset.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={daemonset.metadata.namespace} title={daemonset.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={daemonset.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Link to={`/k8s/ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/pods`} title="pods">
          {daemonset.status.currentNumberScheduled} of {daemonset.status.desiredNumberScheduled} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={daemonset.spec.selector} namespace={daemonset .metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={daemonset} />
      </TableData>
    </TableRow>
  );
};
DaemonSetTableRow.displayName = 'DaemonSetTableRow';

export const DaemonSetDetailsList = ({ds}) =>
  <dl className="co-m-pane__details">
    <dt>Current Count</dt>
    <dd>{ds.status.currentNumberScheduled || '-'}</dd>
    <dt>Desired Count</dt>
    <dd>{ds.status.desiredNumberScheduled || '-'}</dd>
  </dl>;

const Details = ({obj: daemonset}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Daemon Set Overview" />
    <div className="row">
      <div className="col-lg-6">
        <ResourceSummary resource={daemonset} showPodSelector showNodeSelector showTolerations />
      </div>
      <div className="col-lg-6">
        <DaemonSetDetailsList ds={daemonset} />
      </div>
    </div>
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Containers" />
    <ContainerTable containers={daemonset.spec.template.spec.containers} />
  </div>
  <div className="co-m-pane__body">
    <VolumesTable podTemplate={daemonset.spec.template} heading="Volumes" />
  </div>
</React.Fragment>;

const EnvironmentPage = (props) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec}
  envPath={envPath}
  readOnly={false}
/>;
const {details, pods, editYaml, envEditor, events} = navFactory;
const DaemonSets = props => <Table {...props} aria-label="Daemon Sets" Header={DaemonSetTableHeader} Row={DaemonSetTableRow} virtualize />;

const DaemonSetsPage = props => <ListPage canCreate={true} ListComponent={DaemonSets} {...props} />;
const DaemonSetsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(detailsPage(Details)), editYaml(), pods(), envEditor(environmentComponent), events(ResourceEventStream)]}
/>;
export {DaemonSets, DaemonSetsPage, DaemonSetsDetailsPage};
