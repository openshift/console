import * as React from 'react';
import * as classNames from 'classnames';

import { K8sResourceCommon, K8sClaimResourceKind, modelFor } from '../../module/k8s';
import { fromNow } from '@console/internal/components/utils/datetime';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, navFactory, ResourceSummary, SectionHeading, ResourceLink, ResourceKebab } from '../utils';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
const { common } = Kebab.factory;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

export const menuActions = [...Kebab.getExtensionsActionsForKind(modelFor('RoleBindingClaim')), ...common, Kebab.factory.ModifyStatus];

const kind = 'RoleBindingClaim';

const RoleBindingClaimTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortFunc: 'status.status',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_98'),
      sortField: 'resourceName',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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
RoleBindingClaimTableHeader.displayName = 'RoleBindingClaimTableHeader';

const RoleBindingClaimTableRow: RowFunction<K8sClaimResourceKind> = ({ obj: rolebindingclaims, index, key, style }) => {
  return (
    <TableRow id={rolebindingclaims.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={rolebindingclaims.metadata.name} namespace={rolebindingclaims.metadata.namespace} title={rolebindingclaims.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={rolebindingclaims.metadata.namespace} title={rolebindingclaims.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{rolebindingclaims?.status?.status}</TableData>
      <TableData className={tableColumnClasses[3]}>{rolebindingclaims.resourceName}</TableData>
      <TableData className={tableColumnClasses[4]}>{fromNow(rolebindingclaims?.metadata?.creationTimestamp)}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={rolebindingclaims} />
      </TableData>
    </TableRow>
  );
};
export const RoleBindingClaimsList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="RoleBindingClaims" Header={RoleBindingClaimTableHeader.bind(null, t)} Row={RoleBindingClaimTableRow} virtualize />;
};
RoleBindingClaimsList.displayName = 'RoleBindingClaimsList';

export const RoleBindingClaimsPage: React.FC<RoleBindingClaimsPageProps> = props => <ListPage kind={'RoleBindingClaim'} canCreate={true} ListComponent={RoleBindingClaimsList} {...props} />;
RoleBindingClaimsPage.displayName = 'RoleBindingClaimsPage';
const RoleBindingClaimsDetails: React.FC<RoleBindingClaimDetailsProps> = ({ obj: rolebindingclaims }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t('COMMON:MSG_LNB_MENU_101') })} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={rolebindingclaims}></ResourceSummary>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
RoleBindingClaimsDetails.displayName = 'RoleBindingClaimsDetails';

const { details, editYaml } = navFactory;
export const RoleBindingClaimsDetailsPage: React.FC<RoleBindingClaimsDetailsPageProps> = props => <DetailsPage {...props} kind={'RoleBindingClaim'} menuActions={menuActions} pages={[details(RoleBindingClaimsDetails), editYaml()]} />;
RoleBindingClaimsDetailsPage.displayName = 'RoleBindingClaimsDetailsPage';

type RoleBindingClaimDetailsProps = {
  obj: K8sResourceCommon;
};

type RoleBindingClaimsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type RoleBindingClaimsDetailsPageProps = {
  match: any;
};
