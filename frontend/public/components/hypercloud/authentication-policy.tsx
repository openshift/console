import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { AuthorizationPolicyModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(AuthorizationPolicyModel), ...Kebab.factory.common];

const kind = AuthorizationPolicyModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const AuthorizationPolicyTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortFunc: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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
AuthorizationPolicyTableHeader.displayName = 'AuthorizationPolicyTableHeader';

const AuthorizationPolicyTableRow: RowFunction<K8sResourceKind> = ({ obj: authorizationpolicy, index, key, style }) => {
  return (
    <TableRow id={authorizationpolicy.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={authorizationpolicy.metadata.name} namespace={authorizationpolicy.metadata.namespace} title={authorizationpolicy.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={authorizationpolicy.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={authorizationpolicy.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={authorizationpolicy} />
      </TableData>
    </TableRow>
  );
};

const AuthorizationPolicyDetails: React.FC<AuthorizationPolicyDetailsProps> = ({ obj: authorizationpolicy }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Authorization Policy Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={authorizationpolicy} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const AuthorizationPolicies: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Authorization Policies" Header={AuthorizationPolicyTableHeader.bind(null, t)} Row={AuthorizationPolicyTableRow} virtualize />;
};

export const AuthorizationPoliciesPage: React.FC<AuthorizationPoliciesPageProps> = props => <ListPage canCreate={true} ListComponent={AuthorizationPolicies} kind={kind} {...props} />;

export const AuthorizationPoliciesDetailsPage: React.FC<AuthorizationPoliciesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(AuthorizationPolicyDetails)), editYaml()]} />;

type AuthorizationPolicyDetailsProps = {
  obj: K8sResourceKind;
};

type AuthorizationPoliciesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type AuthorizationPoliciesDetailsPageProps = {
  match: any;
};