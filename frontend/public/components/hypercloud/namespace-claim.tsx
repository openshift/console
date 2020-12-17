import * as React from 'react';
import * as classNames from 'classnames';

import { sortable } from '@patternfly/react-table';
import { fromNow } from '@console/internal/components/utils/datetime';
import { K8sResourceKind } from '../../module/k8s';
import { NamespaceClaimKind } from '../../module/k8s';
import { modelFor } from '@console/internal/module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, navFactory, ResourceSummary, SectionHeading, ResourceLink, ResourceKebab } from '../utils';
// import { WorkloadTableRow, WorkloadTableHeader } from '../workload-table';

const { common } = Kebab.factory;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

export const menuActions = [...Kebab.getExtensionsActionsForKind(modelFor('NamespaceClaim')), ...common];

const kind = 'NamespaceClaim';

const NamespaceClaimTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'resourceName',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortFunc: 'status.status',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'UserName',
      sortField: 'metadata.annotations.owner',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
NamespaceClaimTableHeader.displayName = 'NamespaceClaimTableHeader';

const NamespaceClaimTableRow: RowFunction<K8sResourceKind> = ({ obj: namespaceclaims, index, key, style }) => {
  return (
    <TableRow id={namespaceclaims.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={namespaceclaims.metadata.name} namespace={namespaceclaims.metadata.namespace} title={namespaceclaims.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        type을 어떻게 정해야할지.. metadata, spec, status안에 없음.
        {/* <ResourceLink kind="Namespace" name={namespaceclaims?.resourceName} title={namespaceclaims?.resourceName} /> */}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{namespaceclaims?.status?.status}</TableData>
      <TableData className={tableColumnClasses[3]}>{namespaceclaims.metadata?.annotations?.owner}</TableData>
      <TableData className={tableColumnClasses[4]}>{fromNow(namespaceclaims?.metadata?.creationTimestamp)}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={namespaceclaims} />
      </TableData>
    </TableRow>
  );
};

export const NamespaceClaimsList: React.FC = props => <Table {...props} aria-label="NamespaceClaims" Header={NamespaceClaimTableHeader} Row={NamespaceClaimTableRow} virtualize />;
NamespaceClaimsList.displayName = 'NamespaceClaimsList';

export const NamespaceClaimsPage: React.FC<NamespaceClaimsPageProps> = props => <ListPage kind={'NamespaceClaim'} canCreate={true} ListComponent={NamespaceClaimsList} {...props} />;
NamespaceClaimsPage.displayName = 'NamespaceClaimsPage';
const NamespaceClaimsDetails: React.FC<NamespaceClaimDetailsProps> = ({ obj: namespaceclaims }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Namespace Claim Details" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={namespaceclaims}></ResourceSummary>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
NamespaceClaimsDetails.displayName = 'NamespaceClaimsDetails';

const { details, editYaml } = navFactory;
export const NamespaceClaimsDetailsPage: React.FC<NamespaceClaimsDetailsPageProps> = props => <DetailsPage {...props} kind={'NamespaceClaim'} menuActions={menuActions} pages={[details(NamespaceClaimsDetails), editYaml()]} />;
NamespaceClaimsDetailsPage.displayName = 'NamespaceClaimsDetailsPage';

type NamespaceClaimDetailsProps = {
  obj: NamespaceClaimKind;
};

type NamespaceClaimsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type NamespaceClaimsDetailsPageProps = {
  match: any;
};
