import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { SignerPolicyModel } from '../../models';
import { Status } from '@console/shared';
import { ImageSignersPage } from './image-signer';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(SignerPolicyModel), ...Kebab.factory.common];

const kind = SignerPolicyModel.kind;

const tableColumnClasses = ['', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const SignerPolicyTableHeader = () => {
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
      title: 'Signer',
      sortField: 'status.imageSignResponse.result',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};

SignerPolicyTableHeader.displayName = 'SignerPolicyTableHeader';

const SignerPolicyTableRow: RowFunction<K8sResourceKind> = ({ obj: signerpolicy, index, key, style }) => {
  return (
    <TableRow id={signerpolicy.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={signerpolicy.metadata.name} namespace={signerpolicy.metadata.namespace} title={signerpolicy.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={signerpolicy.metadata.namespace} title={signerpolicy.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{signerpolicy?.spec?.signers?.length}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={signerpolicy.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={signerpolicy} />
      </TableData>
    </TableRow>
  );
};

export const SignerPolicyStatus: React.FC<SignerPolicyStatusStatusProps> = ({ result }) => <Status status={result} />;

const SignerPolicyDetails: React.FC<SignerPolicyDetailsProps> = ({ obj: signerpolicy }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Image Sign Request Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={signerpolicy} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body" style={{ paddingLeft: '0px' }}>
      <ImageSignersPage isDetailPage={true} />
    </div>
  </>
);

const { details, editYaml } = navFactory;

export const SignerPolicies: React.FC = props => <Table {...props} aria-label="SignerPolicies" Header={SignerPolicyTableHeader} Row={SignerPolicyTableRow} virtualize />;

export const SignerPoliciesPage: React.FC<SignerPoliciesPageProps> = props => <ListPage canCreate={true} ListComponent={SignerPolicies} kind={kind} {...props} />;

export const SignerPoliciesDetailsPage: React.FC<SignerPoliciesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(SignerPolicyDetails)), editYaml()]} />;

type SignerPoliciesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type SignerPolicyDetailsProps = {
  obj: K8sResourceKind;
};

type SignerPoliciesDetailsPageProps = {
  match: any;
};
type SignerPolicyStatusStatusProps = {
  result: string;
};
