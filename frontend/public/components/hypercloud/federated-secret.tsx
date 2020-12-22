import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedSecretModel } from '../../models';

export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedSecretModel), EditHealthChecks, ...Kebab.factory.common];

const kind = FederatedSecretModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedSecretTableHeader = () => {
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
      sortFunc: 'secretNumScheduled',
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
FederatedSecretTableHeader.displayName = 'FederatedSecretTableHeader';

const FederatedSecretTableRow: RowFunction<K8sResourceKind> = ({ obj: secret, index, key, style }) => {
  return (
    <TableRow id={secret.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={secret.metadata.name} namespace={secret.metadata.namespace} title={secret.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={secret.metadata.namespace} title={secret.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link to={`/k8s/ns/${secret.metadata.namespace}/secrets/${secret.metadata.name}/pods`} title="pods">
          {secret.status.currentNumberScheduled} of {secret.status.desiredNumberScheduled} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={secret.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={secret.spec.selector} namespace={secret.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={secret} />
      </TableData>
    </TableRow>
  );
};

export const FederatedSecretDetailsList: React.FC<FederatedSecretDetailsListProps> = ({ ds }) => (
  <dl className="co-m-pane__details">
    <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
    <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
  </dl>
);

const FederatedSecretDetails: React.FC<FederatedSecretDetailsProps> = ({ obj: secret }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Secret Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={secret} showPodSelector showNodeSelector showTolerations />
        </div>
        <div className="col-lg-6">
          <FederatedSecretDetailsList ds={secret} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
    </div>
  </>
);

const { details, editYaml, events } = navFactory;
export const FederatedSecrets: React.FC = props => <Table {...props} aria-label="Federated Secrets" Header={FederatedSecretTableHeader} Row={FederatedSecretTableRow} virtualize />;

export const FederatedSecretsPage: React.FC<FederatedSecretsPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedSecrets} kind={kind} {...props} />;

export const FederatedSecretsDetailsPage: React.FC<FederatedSecretsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedSecretDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedSecretDetailsListProps = {
  ds: K8sResourceKind;
};

type FederatedSecretDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedSecretsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedSecretsDetailsPageProps = {
  match: any;
};
