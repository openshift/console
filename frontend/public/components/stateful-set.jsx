import * as React from 'react';

import { ResourceEventStream } from './events';
import {
  DetailsPage,
  ListPage,
  Table,
} from './factory';

import {
  WorkloadTableRow,
  WorkloadTableHeader,
} from './workload-table';

import {
  AsyncComponent,
  Kebab,
  ContainerTable,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { VolumesTable } from './volumes-table';

const { AddStorage, common } = Kebab.factory;
export const menuActions = [AddStorage, ...common];

const kind = 'StatefulSet';

const StatefulSetTableRow = ({obj, index, key, style}) => {
  return (
    <WorkloadTableRow obj={obj} index={index} key={key} style={style} menuActions={menuActions} kind={kind} />
  );
};
StatefulSetTableRow.displayName = 'StatefulSetTableRow';


const StatefulSetTableHeader = () => {
  return WorkloadTableHeader();
};
StatefulSetTableHeader.displayName = 'StatefulSetTableHeader';

const Details = ({obj: ss}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="StatefulSet Overview" />
    <ResourceSummary resource={ss} showPodSelector showNodeSelector showTolerations />
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Containers" />
    <ContainerTable containers={ss.spec.template.spec.containers} />
  </div>
  <div className="co-m-pane__body">
    <VolumesTable resource={ss} heading="Volumes" />
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

export const StatefulSetsList = props => <Table {...props} aria-label="Stateful Sets" Header={StatefulSetTableHeader} Row={StatefulSetTableRow} virtualize />;
export const StatefulSetsPage = props => <ListPage {...props} ListComponent={StatefulSetsList} kind={kind} canCreate={true} />;

const pages = [
  navFactory.details(Details),
  navFactory.editYaml(),
  navFactory.pods(),
  navFactory.envEditor(environmentComponent),
  navFactory.events(ResourceEventStream),
];

export const StatefulSetsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={pages}
/>;
