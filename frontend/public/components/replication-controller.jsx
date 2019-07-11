import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, VirtualTable, VirtualTableData, VirtualTableRow } from './factory';
import { replicaSetMenuActions } from './replicaset';
import {
  ContainerTable,
  navFactory,
  SectionHeading,
  ResourceSummary,
  ResourcePodCount,
  AsyncComponent,
  Kebab,
  ResourceLink,
  LabelList,
  resourcePath,
  Selector,
  ResourceKebab,
  asAccessReview,
} from './utils';

import { VolumesTable } from './volumes-table';
import { confirmModal } from './modals';
import { k8sPatch } from '../module/k8s';

const Details = ({obj: replicationController}) => {
  const revision = _.get(replicationController, ['metadata', 'annotations', 'openshift.io/deployment-config.latest-version']);
  const phase = _.get(replicationController, ['metadata', 'annotations', 'openshift.io/deployment.phase']);
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
          { phase &&
          <React.Fragment>
            <dt>Phase</dt>
            <dd>{ phase }</dd>
          </React.Fragment> }
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

const CancelAction = (kind, obj) => ({
  label: 'Cancel Rollout',
  hidden: !_.includes(['New', 'Pending', 'Running'], _.get(obj, ['metadata', 'annotations', 'openshift.io/deployment.phase'])),
  callback: () => confirmModal({
    title: 'Cancel Rollout',
    message: 'Are you sure you want to cancel this rollout?',
    btnText: 'Yes, cancel',
    cancelText: 'No, don\'t cancel',
    executeFn: () => k8sPatch(kind,
      obj,
      [{
        op: 'add',
        path: '/metadata/annotations/openshift.io~1deployment.cancelled',
        value: 'true',
      }, {
        op: 'add',
        path: '/metadata/annotations/openshift.io~1deployment.status-reason',
        value: 'cancelled by the user',
      }]
    ),
  }),
  accessReview: asAccessReview(kind, obj, 'patch'),
});

export const ReplicationControllersDetailsPage = props => <DetailsPage
  {...props}
  menuActions={[CancelAction, ...replicaSetMenuActions]}
  pages={[details(Details), editYaml(), pods(), envEditor(environmentComponent), events(ResourceEventStream)]}
/>;

const kind = 'ReplicationController';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-1', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-1', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-3', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const ReplicationControllerTableRow = ({obj, index, key, style}) => {
  const phase = _.get(obj, ['metadata', 'annotations', 'openshift.io/deployment.phase']);

  return (
    <VirtualTableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <VirtualTableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.uid} />
      </VirtualTableData>
      <VirtualTableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[3]}>
        <Link to={`${resourcePath(kind, obj.metadata.name, obj.metadata.namespace)}/pods`} title="pods">
          {obj.status.replicas || 0} of {obj.spec.replicas} pods
        </Link>
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[4]}>
        {phase}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[5]}>
        <Selector selector={obj.spec.selector} namespace={obj.metadata.namespace} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={replicaSetMenuActions} kind={kind} resource={obj} />
      </VirtualTableData>
    </VirtualTableRow>
  );
};
ReplicationControllerTableRow.displayName = 'ReplicationControllerTableRow';


const ReplicationControllerTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Status', sortFunc: 'numReplicas', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Phase', sortField: 'metadata.annotations["openshift.io/deployment.phase"]', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Pod Selector', sortField: 'spec.selector', transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '', props: { className: tableColumnClasses[6] },
    },
  ];
};
ReplicationControllerTableHeader.displayName = 'ReplicationControllerTableHeader';

export const ReplicationControllersList = props => <VirtualTable {...props} aria-label="Replication Controllers" Header={ReplicationControllerTableHeader} Row={ReplicationControllerTableRow} />;

export const ReplicationControllersPage = props => <ListPage canCreate={true} ListComponent={ReplicationControllersList} {...props} />;
