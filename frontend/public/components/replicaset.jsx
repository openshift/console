import React from 'react';

import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { Cog, navFactory, Heading, ResourceSummary, ResourcePodCount } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1beta1.ReplicaSet', `apiVersion: extensions/v1beta1
kind: ReplicaSet
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      name: nginx
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80`);

const {ModifyCount, ModifyPodSelector, ModifyNodeSelector, common} = Cog.factory;
export const replicaSetMenuActions = [ModifyCount, ModifyPodSelector, ModifyNodeSelector, ...common];

const Details = (replicaSet) => <div>
  <Heading text="Replica Set Overview" />
  <div className="co-m-pane__body-group">
    <div className="co-m-pane__body-section--bordered">
      <div className="row no-gutter">
        <div className="col-md-6">
          <ResourceSummary resource={replicaSet} />
        </div>
        <div className="col-md-6">
          <ResourcePodCount resource={replicaSet} />
        </div>
      </div>
    </div>
  </div>
</div>;

const {details, editYaml, pods} = navFactory;
const ReplicaSetsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={replicaSetMenuActions}
  pages={[details(Details), editYaml(), pods()]}
/>;

const Row = props => <WorkloadListRow {...props} kind="ReplicaSet" actions={replicaSetMenuActions} />;
const ReplicaSetsList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
const ReplicaSetsPage = props => <ListPage canCreate={true} ListComponent={ReplicaSetsList} {...props} />;

export {ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage};
