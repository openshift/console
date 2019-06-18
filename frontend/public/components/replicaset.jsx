// TODO file should be renamed replica-set.jsx to match convention

import * as React from 'react';
import * as _ from 'lodash-es';

import { DetailsPage, ListPage, Table } from './factory';
import {
  Kebab,
  ContainerTable,
  navFactory,
  SectionHeading,
  ResourceSummary,
  ResourcePodCount,
  AsyncComponent,
} from './utils';

import {
  WorkloadTableRow,
  WorkloadTableHeader,
} from './workload-table';

import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';

const {ModifyCount, AddStorage, common} = Kebab.factory;

export const replicaSetMenuActions = [ModifyCount, AddStorage, ...common];

const Details = ({obj: replicaSet}) => {
  const revision = _.get(replicaSet, ['metadata', 'annotations', 'deployment.kubernetes.io/revision']);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Replica Set Overview" />
      <div className="row">
        <div className="col-md-6">
          <ResourceSummary resource={replicaSet} showPodSelector showNodeSelector showTolerations>
            {revision && <React.Fragment>
              <dt>Deployment Revision</dt>
              <dd>{revision}</dd>
            </React.Fragment>}
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <ResourcePodCount resource={replicaSet} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
      <ContainerTable containers={replicaSet.spec.template.spec.containers} />
    </div>
    <div className="co-m-pane__body">
      <VolumesTable podTemplate={replicaSet.spec.template} heading="Volumes" />
    </div>
  </React.Fragment>;
};

const EnvironmentPage = (props) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec}
  envPath={envPath}
  readOnly={false}
/>;

const {details, editYaml, pods, envEditor, events} = navFactory;
const ReplicaSetsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={replicaSetMenuActions}
  pages={[details(Details), editYaml(), pods(), envEditor(environmentComponent), events(ResourceEventStream)]}
/>;

const kind = 'ReplicaSet';

const ReplicaSetTableRow = ({obj, index, key, style}) => {
  return (
    <WorkloadTableRow obj={obj} index={index} key={key} style={style} menuActions={replicaSetMenuActions} kind={kind} />
  );
};
ReplicaSetTableRow.displayName = 'ReplicaSetTableRow';


const ReplicaSetTableHeader = () => {
  return WorkloadTableHeader();
};
ReplicaSetTableHeader.displayName = 'ReplicaSetTableHeader';

const ReplicaSetsList = props => <Table {...props} aria-label="Replicate Sets" Header={ReplicaSetTableHeader} Row={ReplicaSetTableRow} virtualize />;
const ReplicaSetsPage = props => <ListPage canCreate={true} ListComponent={ReplicaSetsList} {...props} />;

export {ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage};
