import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedDeploymentModel } from '../../models';

export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedDeploymentModel), EditHealthChecks, ...Kebab.factory.common];

const kind = FederatedDeploymentModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedDeploymentTableHeader = () => {
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
      sortFunc: 'deploymentNumScheduled',
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
      title: 'Pod Selector',
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
FederatedDeploymentTableHeader.displayName = 'FederatedDeploymentTableHeader';

const FederatedDeploymentTableRow: RowFunction<K8sResourceKind> = ({ obj: deployment, index, key, style }) => {
  return (
    <TableRow id={deployment.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={deployment.metadata.name} namespace={deployment.metadata.namespace} title={deployment.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={deployment.metadata.namespace} title={deployment.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link to={`/k8s/ns/${deployment.metadata.namespace}/deployments/${deployment.metadata.name}/pods`} title="pods">
          {deployment.status.currentNumberScheduled} of {deployment.status.desiredNumberScheduled} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={deployment.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={deployment.spec.selector} namespace={deployment.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={deployment} />
      </TableData>
    </TableRow>
  );
};

export const FederatedDeploymentDetailsList: React.FC<FederatedDeploymentDetailsListProps> = ({ ds }) => (
  <dl className="co-m-pane__details">
    <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
    <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
  </dl>
);

const FederatedDeploymentDetails: React.FC<FederatedDeploymentDetailsProps> = ({ obj: deployment }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Deployment Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={deployment} showPodSelector showNodeSelector showTolerations />
        </div>
        <div className="col-lg-6">
          <FederatedDeploymentDetailsList ds={deployment} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
    </div>
  </>
);

const { details, editYaml, events } = navFactory;
export const FederatedDeployments: React.FC = props => <Table {...props} aria-label="Federated Deployments" Header={FederatedDeploymentTableHeader} Row={FederatedDeploymentTableRow} virtualize />;

export const FederatedDeploymentsPage: React.FC<FederatedDeploymentsPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedDeployments} kind={kind} {...props} />;

export const FederatedDeploymentsDetailsPage: React.FC<FederatedDeploymentsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedDeploymentDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedDeploymentDetailsListProps = {
  ds: K8sResourceKind;
};

type FederatedDeploymentDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedDeploymentsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedDeploymentsDetailsPageProps = {
  match: any;
};
