import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { CatalogServiceClaimModel } from '../../models';
import { CatalogServiceClaimKind, K8sResourceKindReference } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, ResourceKebab, Timestamp } from '../utils';

const catalogServiceClaimReference: K8sResourceKindReference = 'CatalogServiceClaim';
const { common } = Kebab.factory;

export const catalogServiceClaimMenuActions = [...Kebab.getExtensionsActionsForKind(CatalogServiceClaimModel), ...common];

const CatalogServiceClaimDetails: React.FC<CatalogServiceClaimDetailsProps> = ({ obj: catalogServiceClaim }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Catalog Service Claim Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={catalogServiceClaim} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>RESOURCENAME</dt>
              <dd>{catalogServiceClaim.resourceName}</dd>
              <dt>STATUS</dt>
              <dd>{catalogServiceClaim.status && catalogServiceClaim.status.status}</dd>
              {catalogServiceClaim.status && catalogServiceClaim.status.reason && <dt>REASON</dt>}
              {catalogServiceClaim.status && catalogServiceClaim.status.reason && <dd>{catalogServiceClaim.status.reason}</dd>}
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type CatalogServiceClaimDetailsProps = {
  obj: CatalogServiceClaimKind;
};

const { details, editYaml } = navFactory;
const CatalogServiceClaimsDetailsPage: React.FC<CatalogServiceClaimsDetailsPageProps> = props => <DetailsPage {...props} kind={catalogServiceClaimReference} menuActions={catalogServiceClaimMenuActions} pages={[details(CatalogServiceClaimDetails), editYaml()]} />;
CatalogServiceClaimsDetailsPage.displayName = 'CatalogServiceClaimsDetailsPage';

const kind = 'CatalogServiceClaim';
const tableColumnClasses = [
  '', // NAME
  '', // STATUS
  '', // CREATED
  Kebab.columnClass, // MENU ACTIONS
];

const CatalogServiceClaimTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={catalogServiceClaimReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{obj.status && obj.status.status}</TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={catalogServiceClaimMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const CatalogServiceClaimTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status',
      sortField: 'status',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};

CatalogServiceClaimTableHeader.displayName = 'CatalogServiceClaimTableHeader';

const CatalogServiceClaimsList: React.FC = props => <Table {...props} aria-label="Catalog Service Claim" Header={CatalogServiceClaimTableHeader} Row={CatalogServiceClaimTableRow} />;
CatalogServiceClaimsList.displayName = 'CatalogServiceClaimsList';

const CatalogServiceClaimsPage: React.FC<CatalogServiceClaimsPageProps> = props => {
  return <ListPage canCreate={true} kind={catalogServiceClaimReference} ListComponent={CatalogServiceClaimsList} {...props} />;
};
CatalogServiceClaimsPage.displayName = 'CatalogServiceClaimsPage';

export { CatalogServiceClaimsList, CatalogServiceClaimsPage, CatalogServiceClaimsDetailsPage };

type CatalogServiceClaimsPageProps = {};

type CatalogServiceClaimsDetailsPageProps = {
  match: any;
};
