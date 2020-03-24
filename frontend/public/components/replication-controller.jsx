import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { Status } from '@console/shared';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, Table, TableData, TableRow } from './factory';
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
  resourcePath,
  ResourceKebab,
  asAccessReview,
  OwnerReferences,
} from './utils';

import { VolumesTable } from './volumes-table';
import { confirmModal } from './modals';
import { k8sPatch } from '../module/k8s';
import { fromNow } from './utils/datetime';

const Details = ({ obj: replicationController }) => {
  const revision = _.get(replicationController, [
    'metadata',
    'annotations',
    'openshift.io/deployment-config.latest-version',
  ]);
  const phase = _.get(replicationController, [
    'metadata',
    'annotations',
    'openshift.io/deployment.phase',
  ]);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Replication Controller Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary
              resource={replicationController}
              showPodSelector
              showNodeSelector
              showTolerations
            >
              {revision && (
                <>
                  <dt>Deployment Revision</dt>
                  <dd>{revision}</dd>
                </>
              )}
            </ResourceSummary>
          </div>
          <div className="col-md-6">
            {phase && (
              <>
                <dt>Phase</dt>
                <dd>
                  <Status status={phase} />
                </dd>
              </>
            )}
            <ResourcePodCount resource={replicationController} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
        <ContainerTable containers={replicationController.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={replicationController} heading="Volumes" />
      </div>
    </>
  );
};

const EnvironmentPage = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'template', 'spec', 'containers'];
const environmentComponent = (props) => (
  <EnvironmentPage
    obj={props.obj}
    rawEnvData={props.obj.spec.template.spec}
    envPath={envPath}
    readOnly={false}
  />
);

const { details, editYaml, pods, envEditor, events } = navFactory;

const CancelAction = (kind, obj) => ({
  label: 'Cancel Rollout',
  hidden: !_.includes(
    ['New', 'Pending', 'Running'],
    _.get(obj, ['metadata', 'annotations', 'openshift.io/deployment.phase']),
  ),
  callback: () =>
    confirmModal({
      title: 'Cancel Rollout',
      message: 'Are you sure you want to cancel this rollout?',
      btnText: 'Yes, cancel',
      cancelText: "No, don't cancel",
      executeFn: () =>
        k8sPatch(kind, obj, [
          {
            op: 'add',
            path: '/metadata/annotations/openshift.io~1deployment.cancelled',
            value: 'true',
          },
          {
            op: 'add',
            path: '/metadata/annotations/openshift.io~1deployment.status-reason',
            value: 'cancelled by the user',
          },
        ]),
    }),
  accessReview: asAccessReview(kind, obj, 'patch'),
});

const menuActions = [CancelAction, ...replicaSetMenuActions];

export const ReplicationControllersDetailsPage = (props) => (
  <DetailsPage
    {...props}
    getResourceStatus={(resource) =>
      _.get(resource, ['metadata', 'annotations', 'openshift.io/deployment.phase'], null)
    }
    menuActions={menuActions}
    pages={[
      details(Details),
      editYaml(),
      pods(),
      envEditor(environmentComponent),
      events(ResourceEventStream),
    ]}
  />
);

const kind = 'ReplicationController';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const ReplicationControllerTableRow = ({ obj, index, key, style }) => {
  const phase = _.get(obj, ['metadata', 'annotations', 'openshift.io/deployment.phase']);

  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.uid}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link
          to={`${resourcePath(kind, obj.metadata.name, obj.metadata.namespace)}/pods`}
          title="pods"
        >
          {obj.status.replicas || 0} of {obj.spec.replicas} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Status status={phase} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <OwnerReferences resource={obj} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {fromNow(obj.metadata.creationTimestamp)}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ReplicationControllerTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortFunc: 'numReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Phase',
      sortField: 'metadata.annotations["openshift.io/deployment.phase"]',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Owner',
      sortField: 'metadata.ownerReferences[0].name',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
ReplicationControllerTableHeader.displayName = 'ReplicationControllerTableHeader';

export const ReplicationControllersList = (props) => (
  <Table
    {...props}
    aria-label="Replication Controllers"
    Header={ReplicationControllerTableHeader}
    Row={ReplicationControllerTableRow}
    virtualize
  />
);

export const ReplicationControllersPage = (props) => {
  const { canCreate = true } = props;
  return (
    <ListPage
      canCreate={canCreate}
      kind="ReplicationController"
      ListComponent={ReplicationControllersList}
      {...props}
    />
  );
};
