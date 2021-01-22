import * as React from 'react';
import * as classNames from 'classnames';

import { K8sResourceCommon, K8sClaimResourceKind, modelFor } from '../../module/k8s';
import { fromNow } from '@console/internal/components/utils/datetime';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, navFactory, ResourceSummary, SectionHeading, ResourceLink, ResourceKebab } from '../utils';

const { common } = Kebab.factory;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

export const menuActions = [...Kebab.getExtensionsActionsForKind(modelFor('ResourceQuotaClaim')), ...common, Kebab.factory.ModifyStatus];

const kind = 'ResourceQuotaClaim';

const ResourceQuotaClaimTableHeader = () => {
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
      sortFunc: 'status.status',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'ResourceName',
      sortField: 'resourceName',
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
ResourceQuotaClaimTableHeader.displayName = 'ResourceQuotaClaimTableHeader';

const ResourceQuotaClaimTableRow: RowFunction<K8sClaimResourceKind> = ({ obj: resourcequotaclaims, index, key, style }) => {
  return (
    <TableRow id={resourcequotaclaims.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={resourcequotaclaims.metadata.name} namespace={resourcequotaclaims.metadata.namespace} title={resourcequotaclaims.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={resourcequotaclaims.metadata.namespace} title={resourcequotaclaims.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{resourcequotaclaims?.status?.status}</TableData>
      <TableData className={tableColumnClasses[3]}>{resourcequotaclaims.resourceName}</TableData>
      <TableData className={tableColumnClasses[4]}>{fromNow(resourcequotaclaims?.metadata?.creationTimestamp)}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={resourcequotaclaims} />
      </TableData>
    </TableRow>
  );
};
export const ResourceQuotaClaimsList: React.FC = props => <Table {...props} aria-label="ResourceQuotaClaims" Header={ResourceQuotaClaimTableHeader} Row={ResourceQuotaClaimTableRow} virtualize />;
ResourceQuotaClaimsList.displayName = 'ResourceQuotaClaimsList';

export const ResourceQuotaClaimsPage: React.FC<ResourceQuotaClaimsPageProps> = props => <ListPage kind={'ResourceQuotaClaim'} canCreate={true} ListComponent={ResourceQuotaClaimsList} {...props} />;
ResourceQuotaClaimsPage.displayName = 'ResourceQuotaClaimsPage';
const ResourceQuotaClaimsDetails: React.FC<ResourceQuotaClaimDetailsProps> = ({ obj: resourcequotaclaims }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Namespace Claim Details" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={resourcequotaclaims}></ResourceSummary>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
ResourceQuotaClaimsDetails.displayName = 'ResourceQuotaClaimsDetails';

const { details, editYaml } = navFactory;
export const ResourceQuotaClaimsDetailsPage: React.FC<ResourceQuotaClaimsDetailsPageProps> = props => <DetailsPage {...props} kind={'ResourceQuotaClaim'} menuActions={menuActions} pages={[details(ResourceQuotaClaimsDetails), editYaml()]} />;
ResourceQuotaClaimsDetailsPage.displayName = 'ResourceQuotaClaimsDetailsPage';

type ResourceQuotaClaimDetailsProps = {
  obj: K8sResourceCommon;
};

type ResourceQuotaClaimsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type ResourceQuotaClaimsDetailsPageProps = {
  match: any;
};
