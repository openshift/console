// TODO file should be renamed replica-set.jsx to match convention

import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
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
  Timestamp,
  PodsComponent,
  RuntimeClass,
} from './utils';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import {
  DeploymentConfigModel,
  DeploymentModel,
  ReplicaSetModel,
  ReplicationControllerModel,
} from '../models';
import { getOwnerNameByKind } from '@console/shared/src';
import { rollbackModal } from './modals';

const { ModifyCount, AddStorage, common } = Kebab.factory;

const INACTIVE_STATUSES = ['New', 'Pending', 'Running'];

const RollbackAction = (kind, obj) => {
  if (kind.kind === ReplicationControllerModel.kind) {
    const deploymentPhase = obj?.metadata?.annotations?.['openshift.io/deployment.phase'];
    const dcName = getOwnerNameByKind(obj, DeploymentConfigModel);
    return {
      // t('public~Rollback')
      labelKey: 'public~Rollback',
      // disabled if the DC is not Active
      isDisabled: INACTIVE_STATUSES.includes(deploymentPhase),
      // Hidden if RC is active or does not belong to a deployment config
      hidden: !deploymentPhase || obj?.status?.replicas > 0 || !dcName,
      callback: () =>
        rollbackModal({
          resourceKind: kind,
          resource: obj,
        }),
      accessReview: {
        group: DeploymentConfigModel.apiGroup,
        resource: DeploymentConfigModel.plural,
        name: dcName,
        namespace: obj?.metadata?.namespace,
        verb: 'update',
      },
    };
  }

  const deploymentName = getOwnerNameByKind(obj, DeploymentModel);
  return {
    // t('public~Rollback')
    labelKey: 'public~Rollback',
    // Hidden if RS is active or does not belong to a deployment
    hidden: obj?.status?.replicas > 0 || !deploymentName,
    callback: () =>
      rollbackModal({
        resourceKind: kind,
        resource: obj,
      }),
    accessReview: {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      name: deploymentName,
      namespace: obj?.metadata?.namespace,
      verb: 'patch',
    },
  };
};

export const replicaSetMenuActions = [
  RollbackAction,
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
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~ReplicaSet details')} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={replicaSet} showPodSelector showNodeSelector showTolerations>
              {revision && (
                <>
                  <dt>{t('public~Deployment revision')}</dt>
                  <dd>{revision}</dd>
                </>
              )}
            </ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <ResourcePodCount resource={replicaSet} />
              <RuntimeClass obj={replicaSet} />
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={replicaSet.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={replicaSet} heading={t('public~Volumes')} />
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

const ReplicaSetPods = (props) => <PodsComponent {...props} customData={{ showNodes: true }} />;

const { details, editYaml, pods, envEditor, events } = navFactory;
const ReplicaSetsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={replicaSetMenuActions}
    pages={[
      details(Details),
      editYaml(),
      pods(ReplicaSetPods),
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

const ReplicaSetsList = (props) => {
  const { t } = useTranslation();
  const ReplicaSetTableHeader = () => [
    {
      title: t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('public~Status'),
      sortFunc: 'numReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Labels'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('public~Owner'),
      sortField: 'metadata.ownerReferences[0].name',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('public~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];

  const ReplicaSetTableRow = ({ obj, index, key, style }) => {
    return (
      <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
        </TableData>
        <TableData
          className={classNames(tableColumnClasses[1], 'co-break-word')}
          columnID="namespace"
        >
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Link
            to={`${resourcePath(kind, obj.metadata.name, obj.metadata.namespace)}/pods`}
            title="pods"
          >
            {t('public~{{count1}} of {{count2}} pods', {
              count1: obj.status.replicas || 0,
              count2: obj.spec.replicas,
            })}
          </Link>
        </TableData>
        <TableData className={tableColumnClasses[3]}>
          <LabelList kind={kind} labels={obj.metadata.labels} />
        </TableData>
        <TableData className={tableColumnClasses[4]}>
          <OwnerReferences resource={obj} />
        </TableData>
        <TableData className={tableColumnClasses[5]}>
          <Timestamp timestamp={obj.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[6]}>
          <ResourceKebab actions={replicaSetMenuActions} kind={kind} resource={obj} />
        </TableData>
      </TableRow>
    );
  };

  return (
    <Table
      {...props}
      aria-label={t('public~ReplicaSets')}
      Header={ReplicaSetTableHeader}
      Row={ReplicaSetTableRow}
      virtualize
    />
  );
};
const ReplicaSetsPage = (props) => {
  const { canCreate = true } = props;
  return (
    <ListPage canCreate={canCreate} kind="ReplicaSet" ListComponent={ReplicaSetsList} {...props} />
  );
};

export { ReplicaSetsList, ReplicaSetsPage, ReplicaSetsDetailsPage };
