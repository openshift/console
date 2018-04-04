import * as React from 'react';

import { ResourceEventStream } from './events';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { replicaSetMenuActions } from './replicaset';
import { navFactory, Heading, ResourceSummary, ResourcePodCount } from './utils';
import { registerTemplate } from '../yaml-templates';
import { modelFor, referenceForOwnerRef } from '../module/k8s/k8s-models';

registerTemplate('v1.ReplicationController', `apiVersion: v1
kind: ReplicationController
metadata:
  name: example
spec:
  replicas: 2
  selector:
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


const Details = ({obj: replicationController}) => <div>
  <Heading text="Replication Controller Overview" />
  <div className="co-m-pane__body-group">
    <div className="co-m-pane__body-section--bordered">
      <div className="row no-gutter">
        <div className="col-md-6">
          <ResourceSummary resource={replicationController} />
        </div>
        <div className="col-md-6">
          <ResourcePodCount resource={replicationController} />
        </div>
      </div>
    </div>
  </div>
</div>;

const {details, editYaml, pods, events} = navFactory;

export const ReplicationControllersDetailsPage = props => <DetailsPage
  {...props}
  breadcrumbsFor={(obj) => (obj.metadata.ownerReferences || []).map(ref => ({
    name: ref.name, path: `/k8s/ns/${obj.metadata.namespace}/${modelFor(referenceForOwnerRef(ref)).plural}/${ref.name}`
  })).concat([{name: 'ReplicationController Details', path: props.match.url}])}
  menuActions={replicaSetMenuActions}
  pages={[details(Details), editYaml(), pods(), events(ResourceEventStream)]}
/>;

const Row = props => <WorkloadListRow {...props} kind="ReplicationController" actions={replicaSetMenuActions} />;
export const ReplicationControllersList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
export const ReplicationControllersPage = props => <ListPage canCreate={true} ListComponent={ReplicationControllersList} {...props} />;
