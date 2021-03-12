import * as React from 'react';
import * as classNames from 'classnames';

import { sortable } from '@patternfly/react-table';
import { fromNow } from '@console/internal/components/utils/datetime';
import { K8sResourceKind, K8sClaimResourceKind, modelFor } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, navFactory, ResourceSummary, SectionHeading, ResourceLink, ResourceKebab } from '../utils';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
// import { WorkloadTableRow, WorkloadTableHeader } from '../workload-table';

const { common } = Kebab.factory;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

export const menuActions = [...Kebab.getExtensionsActionsForKind(modelFor('NamespaceClaim')), ...common, Kebab.factory.ModifyStatus];

const kind = 'NamespaceClaim';

const NamespaceClaimTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'resourceName',
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
      title: 'UserName',
      sortField: 'metadata.annotations.owner',
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
NamespaceClaimTableHeader.displayName = 'NamespaceClaimTableHeader';

const NamespaceClaimTableRow: RowFunction<K8sClaimResourceKind> = ({ obj: namespaceclaims, index, key, style }) => {
  return (
    <TableRow id={namespaceclaims.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={namespaceclaims.metadata.name} namespace={namespaceclaims.metadata.namespace} title={namespaceclaims.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={namespaceclaims?.resourceName} title={namespaceclaims?.resourceName} />
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

export const NamespaceClaimsList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="NamespaceClaims" Header={NamespaceClaimTableHeader.bind(null, t)} Row={NamespaceClaimTableRow} virtualize />;
};
NamespaceClaimsList.displayName = 'NamespaceClaimsList';

export const NamespaceClaimsPage: React.FC<NamespaceClaimsPageProps> = props => <ListPage kind={'NamespaceClaim'} canCreate={true} ListComponent={NamespaceClaimsList} {...props} />;
NamespaceClaimsPage.displayName = 'NamespaceClaimsPage';
const NamespaceClaimsDetails: React.FC<NamespaceClaimDetailsProps> = ({ obj: namespaceclaims }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t('COMMON:MSG_LNB_MENU_103') })} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={namespaceclaims} showOwner={false}></ResourceSummary>
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_44')}</dt>
              <dd>{namespaceclaims.metadata.annotations.owner}</dd>
            </div>
            <div className="col-md-6">
              <dl className="co-m-pane__details">
                <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_45')}</dt>
                <dd>{namespaceclaims?.status?.status}</dd>
                <dt>{t('SINGLE:MSG_NAMESPACECLAIMS_NAMESPACEDETAILS_TABDETAILS_1')}</dt>
                <dd>{namespaceclaims?.status?.reason}</dd>
                <dt>{t('SINGLE:MSG_NAMESPACECLAIMS_NAMESPACEDETAILS_TABDETAILS_2')}</dt>
                <dd>{namespaceclaims?.specLimit?.limitCpu}</dd>
                <dt>{t('SINGLE:MSG_NAMESPACECLAIMS_NAMESPACEDETAILS_TABDETAILS_3')}</dt>
                <dd>{namespaceclaims?.specLimit?.limitMemory}</dd>
                <dt>{t('SINGLE:MSG_NAMESPACECLAIMS_NAMESPACEDETAILS_TABDETAILS_4')}</dt>
                <dd>{namespaceclaims?.resourceName}</dd>
              </dl>
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
  obj: K8sResourceKind;
};

type NamespaceClaimsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type NamespaceClaimsDetailsPageProps = {
  match: any;
};
