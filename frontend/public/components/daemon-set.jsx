import * as React from 'react';
import { Link } from 'react-router-dom';

import {
  ColHead,
  DetailsPage,
  List,
  ListHeader,
  ListPage,
  ResourceRow
} from './factory';
import {
  AsyncComponent,
  Cog,
  ContainerTable,
  detailsPage,
  LabelList,
  navFactory,
  ResourceCog,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector
} from './utils';

export const menuActions = [Cog.factory.EditEnvironment, ...Cog.factory.common];

const DaemonSetHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortFunc="daemonsetNumScheduled">Status</ColHead>
  <ColHead {...props} className="col-lg-3 hidden-md hidden-sm hidden-xs" sortField="spec.selector">Pod Selector</ColHead>
</ListHeader>;

const DaemonSetRow = ({obj: daemonset}) => <ResourceRow obj={daemonset}>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind="DaemonSet" resource={daemonset} />
    <ResourceLink kind="DaemonSet" name={daemonset.metadata.name} namespace={daemonset.metadata.namespace} title={daemonset.metadata.uid} />
  </div>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={daemonset.metadata.namespace} title={daemonset.metadata.namespace} />
  </div>
  <div className="col-lg-3 col-md-4 col-sm-4 hidden-xs">
    <LabelList kind="DaemonSet" labels={daemonset.metadata.labels} />
  </div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
    <Link to={`/k8s/ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/pods`} title="pods">
      {daemonset.status.currentNumberScheduled} of {daemonset.status.desiredNumberScheduled} pods
    </Link>
  </div>
  <div className="col-lg-3 hidden-md hidden-sm hidden-xs">
    <Selector selector={daemonset.spec.selector} namespace={daemonset.metadata.namespace} />
  </div>
</ResourceRow>;

export const DaemonSetDetailsList = ({ds}) =>
  <dl className="co-m-pane__details">
    <dt>Current Count</dt>
    <dd>{ds.status.currentNumberScheduled || '-'}</dd>
    <dt>Desired Count</dt>
    <dd>{ds.status.desiredNumberScheduled || '-'}</dd>
  </dl>;

const Details = ({obj: daemonset}) => <div className="co-m-pane__body">
  <SectionHeading text="Daemon Set Overview" />
  <div className="row">
    <div className="col-lg-6">
      <ResourceSummary resource={daemonset} />
    </div>
    <div className="col-lg-6">
      <DaemonSetDetailsList ds={daemonset} />
    </div>
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Containers" />
    <ContainerTable containers={daemonset.spec.template.spec.containers} />
  </div>
</div>;

const EnvironmentPage = (props) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec}
  envPath={envPath}
  readOnly={false}
/>;

const {details, pods, editYaml, envEditor} = navFactory;

const DaemonSets = props => <List {...props} Header={DaemonSetHeader} Row={DaemonSetRow} />;
const DaemonSetsPage = props => <ListPage canCreate={true} ListComponent={DaemonSets} {...props} />;
const DaemonSetsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(detailsPage(Details)), editYaml(), pods(), envEditor(environmentComponent)]}
/>;

export {DaemonSets, DaemonSetsPage, DaemonSetsDetailsPage};
