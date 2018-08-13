import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, navFactory, ResourceCog, SectionHeading, ResourceLink, ResourceSummary } from './utils';
import { EnvironmentPage } from './environment';
import { ResourceEventStream } from './events';

const menuActions = [Cog.factory.EditEnvironment, ...Cog.factory.common];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-md-5 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-7 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
</ListHeader>;

const kind = 'StatefulSet';
const Row = ({obj: ss}) => <div className="row co-resource-list__item">
  <div className="col-md-5 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind={kind} resource={ss} />
    <ResourceLink kind={kind} name={ss.metadata.name} namespace={ss.metadata.namespace} title={ss.metadata.name} />
  </div>
  <div className="col-md-7 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={ss.metadata.namespace} title={ss.metadata.namespace} />
  </div>
</div>;

const Details = ({obj: ss}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="StatefulSet Overview" />
    <ResourceSummary resource={ss} showNodeSelector={false} />
  </div>
</React.Fragment>;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec.containers}
  envPath={envPath}
  readOnly={false}
/>;

export const StatefulSetsList = props => <List {...props} Header={Header} Row={Row} />;
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
