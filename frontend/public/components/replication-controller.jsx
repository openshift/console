import * as React from 'react';

import { ResourceEventStream } from './events';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { replicaSetMenuActions } from './replicaset';
import { navFactory, SectionHeading, ResourceSummary, ResourcePodCount } from './utils';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { registerTemplate } from '../yaml-templates';
import { EnvironmentPage } from './environment';

registerTemplate('v1.ReplicationController', `apiVersion: v1
kind: ReplicationController
metadata:
  name: example
spec:
  replicas: 2
  selector:
    app: hello-openshift
  template:
    metadata:
      name: hello-openshift
      labels:
        app: hello-openshift
    spec:
      containers:
      - name: hello-openshift
        image: openshift/hello-openshift
        ports:
        - containerPort: 8080`);


const Details = ({obj: replicationController}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Replication Controller Overview" />
    <div className="row">
      <div className="col-md-6">
        <ResourceSummary resource={replicationController} />
      </div>
      <div className="col-md-6">
        <ResourcePodCount resource={replicationController} />
      </div>
    </div>
  </div>
</React.Fragment>;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec.containers}
  envPath={envPath}
  readOnly={false}
/>;

const {details, editYaml, pods, envEditor, events} = navFactory;

export const ReplicationControllersDetailsPage = props => <DetailsPage
  {...props}
  breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
    name: 'ReplicationController Details',
    path: props.match.url,
  })}
  menuActions={replicaSetMenuActions}
  pages={[details(Details), editYaml(), pods(), envEditor(environmentComponent), events(ResourceEventStream)]}
/>;

const Row = props => <WorkloadListRow {...props} kind="ReplicationController" actions={replicaSetMenuActions} />;
export const ReplicationControllersList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
export const ReplicationControllersPage = props => <ListPage canCreate={true} ListComponent={ReplicationControllersList} {...props} />;
