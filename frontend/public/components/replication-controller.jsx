import * as React from 'react';
import * as _ from 'lodash-es';

import { ResourceEventStream } from './events';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { replicaSetMenuActions } from './replicaset';
import { ContainerTable, navFactory, SectionHeading, ResourceSummary, ResourcePodCount, AsyncComponent} from './utils';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { MountedVolumes } from './mounted-vol';

const Details = ({obj: replicationController}) => {
  const revision = _.get(replicationController, ['metadata', 'annotations', 'openshift.io/deployment-config.latest-version']);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Replication Controller Overview" />
      <div className="row">
        <div className="col-md-6">
          <ResourceSummary resource={replicationController} showPodSelector showNodeSelector>
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
      <MountedVolumes podTemplate={replicationController.spec.template} heading="Mounted Volumes" />
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

const Row = props => <WorkloadListRow {...props} kind="ReplicationController" actions={replicaSetMenuActions} />;
export const ReplicationControllersList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
export const ReplicationControllersPage = props => <ListPage canCreate={true} ListComponent={ReplicationControllersList} {...props} />;
