import * as React from 'react';

import { ResourceEventStream } from './events';
import { connectToModel } from '../kinds';
import {
  DetailsPage,
  List,
  ListPage,
  WorkloadListHeader,
  WorkloadListRow
} from './factory';
import {
  AsyncComponent,
  Cog,
  ContainerTable,
  ResourceOverviewHeading,
  ResourceSummary,
  SectionHeading,
  navFactory
} from './utils';

const menuActions = [Cog.factory.EditEnvironment, ...Cog.factory.common];

const kind = 'StatefulSet';
const Row = props => <WorkloadListRow {...props} kind={kind} actions={menuActions} />;

const Details = ({obj: ss}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="StatefulSet Overview" />
    <ResourceSummary resource={ss} showNodeSelector={false} />
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Containers" />
    <ContainerTable containers={ss.spec.template.spec.containers} />
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

export const StatefulSetsList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
export const StatefulSetsPage = props => <ListPage {...props} ListComponent={StatefulSetsList} kind={kind} canCreate={true} />;

const pages = [
  navFactory.details(Details),
  navFactory.editYaml(),
  navFactory.pods(),
  navFactory.envEditor(environmentComponent),
  navFactory.events(ResourceEventStream)
];

export const StatefulSetsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={pages}
/>;

export const StatefulSetOverview = connectToModel(({kindObj, resource: ss}) =>
  <div className="overview__sidebar-pane resource-overview">
    <ResourceOverviewHeading
      actions={menuActions}
      kindObj={kindObj}
      resource={ss}
    />
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__summary">
        <ResourceSummary resource={ss} />
      </div>
    </div>
  </div>);
