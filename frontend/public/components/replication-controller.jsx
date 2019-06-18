import * as React from 'react';
import * as _ from 'lodash';

import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, Table } from './factory';
import { replicaSetMenuActions } from './replicaset';
import {
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

import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { VolumesTable } from './volumes-table';

const Details = ({obj: replicationController}) => {
  const revision = _.get(replicationController, ['metadata', 'annotations', 'openshift.io/deployment-config.latest-version']);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Replication Controller Overview" />
      <div className="row">
        <div className="col-md-6">
          <ResourceSummary resource={replicationController} showPodSelector showNodeSelector showTolerations>
            {revision && <React.Fragment>
              <dt>Deployment Revision</dt>
              <dd>{revision}</dd>
            </React.Fragment>}
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <ResourcePodCount resource={replicationController} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
      <ContainerTable containers={replicationController.spec.template.spec.containers} />
    </div>
    <div className="co-m-pane__body">
      <VolumesTable podTemplate={replicationController.spec.template} heading="Volumes" />
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

export const ReplicationControllersDetailsPage = props => <DetailsPage
  {...props}
  breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
    name: 'ReplicationController Details',
    path: props.match.url,
  })}
  menuActions={replicaSetMenuActions}
  pages={[details(Details), editYaml(), pods(), envEditor(environmentComponent), events(ResourceEventStream)]}
/>;

const kind = 'ReplicationController';

const ReplicationControllerTableRow = ({obj, index, key, style}) => {
  return (
    <WorkloadTableRow obj={obj} index={index} key={key} style={style} menuActions={replicaSetMenuActions} kind={kind} />
  );
};
ReplicationControllerTableRow.displayName = 'ReplicationControllerTableRow';


const ReplicationControllerTableHeader = () => {
  return WorkloadTableHeader();
};
ReplicationControllerTableHeader.displayName = 'ReplicationControllerTableHeader';

export const ReplicationControllersList = props => <Table {...props} aria-label="Replication Controllers" Header={ReplicationControllerTableHeader} Row={ReplicationControllerTableRow} virtualize />;

export const ReplicationControllersPage = props => <ListPage canCreate={true} ListComponent={ReplicationControllersList} {...props} />;
