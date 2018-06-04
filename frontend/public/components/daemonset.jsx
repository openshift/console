import * as React from 'react';
import { Link } from 'react-router-dom';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, LabelList, ResourceCog, ResourceLink, ResourceSummary, Selector, navFactory, detailsPage } from './utils';
import { EnvironmentPage } from './environment';
import { registerTemplate } from '../yaml-templates';

registerTemplate('apps/v1.DaemonSet', `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: example
spec:
  selector:
    matchLabels:
      app: hello-openshift
  template:
    metadata:
      labels:
        app: hello-openshift
    spec:
      containers:
      - name: hello-openshift
        image: openshift/hello-openshift
        ports:
        - containerPort: 8080`);

const menuActions = [Cog.factory.ModifyNodeSelector, Cog.factory.EditEnvironment, ...Cog.factory.common];

const DaemonSetHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortFunc="daemonsetNumScheduled">Status</ColHead>
  <ColHead {...props} className="col-lg-3 hidden-md hidden-sm hidden-xs" sortField="spec.selector">Pod Selector</ColHead>
</ListHeader>;

const DaemonSetRow = ({obj: daemonset, style}) => <ResourceRow obj={daemonset} style={style}>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
    <ResourceCog actions={menuActions} kind="DaemonSet" resource={daemonset} />
    <ResourceLink kind="DaemonSet" name={daemonset.metadata.name} namespace={daemonset.metadata.namespace} title={daemonset.metadata.uid} />
  </div>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
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
    <Selector selector={daemonset.spec.selector} />
  </div>
</ResourceRow>;

const Details = ({obj: daemonset}) => <div className="co-m-pane__body">
  <div className="row">
    <div className="col-lg-6">
      <ResourceSummary resource={daemonset} />
    </div>
    <div className="col-lg-6">
      <dl className="co-m-pane__details">
        <dt>Current Count</dt>
        <dd>{daemonset.status.currentNumberScheduled || '-'}</dd>
        <dt>Desired Count</dt>
        <dd>{daemonset.status.desiredNumberScheduled || '-'}</dd>
      </dl>
    </div>
  </div>
</div>;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec.containers}
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
