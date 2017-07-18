import React from 'react';
import { Link } from 'react-router';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, LabelList, ResourceCog, ResourceLink, ResourceSummary, Selector, navFactory, detailsPage } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1beta1.DaemonSet', `apiVersion: extensions/v1beta1
kind: Daemonset
metadata:
  name: nginx-daemonset
spec:
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80`);

const menuActions = [Cog.factory.ModifyPodSelector, Cog.factory.ModifyNodeSelector, ...Cog.factory.common];

const DaemonSetHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-5 col-xs-6" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 hidden-xs" sortFunc="daemonsetNumScheduled">Status</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="spec.selector.matchLabels">Node Selector</ColHead>
</ListHeader>;

const DaemonSetRow = ({obj: daemonset}) => <ResourceRow obj={daemonset}>
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
    <ResourceCog actions={menuActions} kind="DaemonSet" resource={daemonset} />
    <ResourceLink kind="DaemonSet" name={daemonset.metadata.name} namespace={daemonset.metadata.namespace} title={daemonset.metadata.uid} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">
    <LabelList kind="DaemonSet" labels={daemonset.metadata.labels} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
    <Link to={`ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/pods`} title="pods">
      {daemonset.status.currentNumberScheduled} of {daemonset.status.desiredNumberScheduled} pods
    </Link>
  </div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
    <Selector selector={daemonset.spec.selector.matchLabels} />
  </div>
</ResourceRow>;

const Details = (daemonset) => <div>
  <div className="col-lg-6">
    <div className="co-m-pane">
      <div className="co-m-pane__body">
        <ResourceSummary resource={daemonset} />
      </div>
    </div>
  </div>
  <div className="col-lg-6">
    <div className="co-m-pane">
      <div className="co-m-pane__body">
        <dl>
          <dt>Current Count</dt>
          <dd>{daemonset.status.currentNumberScheduled || '-'}</dd>
          <dt>Desired Count</dt>
          <dd>{daemonset.status.desiredNumberScheduled || '-'}</dd>
        </dl>
      </div>
    </div>
  </div>
</div>;

const {details, pods, editYaml} = navFactory;

const DaemonSets = props => <List {...props} Header={DaemonSetHeader} Row={DaemonSetRow} />;
const DaemonSetsPage = props => <ListPage canCreate={true} ListComponent={DaemonSets} {...props} />;
const DaemonSetsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(detailsPage(Details)), editYaml(), pods()]}
/>;

export {DaemonSets, DaemonSetsPage, DaemonSetsDetailsPage};
