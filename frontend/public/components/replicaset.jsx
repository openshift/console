// TODO file should be renamed replica-set.jsx to match convention

import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';

import { DetailsPage, ListPage, Table, TableData, TableRow } from './factory';
import {
  Kebab,
  ContainerTable,
  navFactory,
  SectionHeading,
  ResourceSummary,
  ResourcePodCount,
  AsyncComponent,
  ResourceLink,
  resourcePath,
  LabelList,
  ResourceKebab,
  OwnerReferences,
} from './utils';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { ReplicaSetModel } from '../models';
import { fromNow } from './utils/datetime';

const { ModifyCount, AddStorage, common } = Kebab.factory;

export const replicaSetMenuActions = [
  ModifyCount,
  AddStorage,
  ...Kebab.getExtensionsActionsForKind(ReplicaSetModel),
  ...common,
];

const Details = ({ obj: replicaSet }) => {
  const revision = _.get(replicaSet, [
    'metadata',
    'annotations',
    'deployment.kubernetes.io/revision',
  ]);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Replica Set Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={replicaSet} showPodSelector showNodeSelector showTolerations>
              {revision && (
                <>
                  <dt>Deployment Revision</dt>
                  <dd>{revision}</dd>
                </>
              )}
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
        <VolumesTable resource={replicaSet} heading="Volumes" />
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
const ReplicaSetsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={replicaSetMenuActions}
    pages={[
      details(Details),
      editYaml(),
      pods(),
      envEditor(environmentComponent),
      events(ResourceEventStream),
    ]}
  />
);

const kind = 'ReplicaSet';

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const ReplicaSetTableRow = ({ obj, index, key, style }) => {
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
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <OwnerReferences resource={obj} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {fromNow(obj.metadata.creationTimestamp)}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={replicaSetMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ReplicaSetTableHeader = () => {
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
      title: 'Labels',
      sortField: 'metadata.labels',
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

ReplicaSetTableHeader.displayName = 'ReplicaSetTableHeader';

const ReplicaSetsList = (props) => (
  <Table
    {...props}
    aria-label="Replica Sets"
    Header={ReplicaSetTableHeader}
    Row={ReplicaSetTableRow}
    virtualize
  />
);
const ReplicaSetsPage = (props) => {
  const { canCreate = true } = props;
  return (
    <ListPage canCreate={canCreate} kind="ReplicaSet" ListComponent={ReplicaSetsList} {...props} />
  );
};

export { ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage };
