import * as React from 'react';

import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { Cog, navFactory, Heading, ResourceSummary, ResourcePodCount } from './utils';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { registerTemplate } from '../yaml-templates';
import { EnvironmentPage, envVarsToArrayForArray } from './environment';

registerTemplate('apps/v1.ReplicaSet', `apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: example
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

const {ModifyCount, ModifyNodeSelector, EditEnvironment, common} = Cog.factory;
export const replicaSetMenuActions = [ModifyCount, ModifyNodeSelector, EditEnvironment, ...common];

const Details = ({obj: replicaSet}) => <React.Fragment>
  <div className="co-m-pane__body">
    <Heading text="Replica Set Overview" />
    <div className="row">
      <div className="col-md-6">
        <ResourceSummary resource={replicaSet} />
      </div>
      <div className="col-md-6">
        <ResourcePodCount resource={replicaSet} />
      </div>
    </div>
  </div>
</React.Fragment>;

const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec.containers}
  envPath="/spec/template/spec/containers"
  readOnly={false}
  isBuildObject={false}
  toArrayFn={envVarsToArrayForArray}
/>;

const {details, editYaml, pods, envEditor} = navFactory;
const ReplicaSetsDetailsPage = props => <DetailsPage
  {...props}
  breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
    name: 'ReplicaSet Details',
    path: props.match.url,
  })}
  menuActions={replicaSetMenuActions}
  pages={[details(Details), editYaml(), pods(), envEditor(environmentComponent)]}
/>;

const Row = props => <WorkloadListRow {...props} kind="ReplicaSet" actions={replicaSetMenuActions} />;
const ReplicaSetsList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
const ReplicaSetsPage = props => <ListPage canCreate={true} ListComponent={ReplicaSetsList} {...props} />;

export {ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage};
