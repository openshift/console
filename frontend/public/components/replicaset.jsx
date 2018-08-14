import * as React from 'react';

import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { Cog, navFactory, SectionHeading, ResourceSummary, ResourcePodCount } from './utils';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { EnvironmentPage } from './environment';
import { ResourceEventStream } from './events';

const {ModifyCount, EditEnvironment, common} = Cog.factory;
export const replicaSetMenuActions = [ModifyCount, EditEnvironment, ...common];

const Details = ({obj: replicaSet}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Replica Set Overview" />
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

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec.containers}
  envPath={envPath}
  readOnly={false}
/>;

const {details, editYaml, pods, envEditor, events} = navFactory;
const ReplicaSetsDetailsPage = props => <DetailsPage
  {...props}
  breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
    name: 'ReplicaSet Details',
    path: props.match.url,
  })}
  menuActions={replicaSetMenuActions}
  pages={[details(Details), editYaml(), pods(), envEditor(environmentComponent), events(ResourceEventStream)]}
/>;

const Row = props => <WorkloadListRow {...props} kind="ReplicaSet" actions={replicaSetMenuActions} />;
const ReplicaSetsList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
const ReplicaSetsPage = props => <ListPage canCreate={true} ListComponent={ReplicaSetsList} {...props} />;

export {ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage};
