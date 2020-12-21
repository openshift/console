import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { RequestAuthenticationModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(RequestAuthenticationModel), ...Kebab.factory.common];

const kind = RequestAuthenticationModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const RequestAuthenticationTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortFunc: 'metadata.namespace',
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
RequestAuthenticationTableHeader.displayName = 'RequestAuthenticationTableHeader';

const RequestAuthenticationTableRow: RowFunction<K8sResourceKind> = ({ obj: requestauthentication, index, key, style }) => {
  return (
    <TableRow id={requestauthentication.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={requestauthentication.metadata.name} namespace={requestauthentication.metadata.namespace} title={requestauthentication.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={requestauthentication.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={requestauthentication.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={requestauthentication} />
      </TableData>
    </TableRow>
  );
};

const RequestAuthenticationDetails: React.FC<RequestAuthenticationDetailsProps> = ({ obj: requestauthentication }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Request Authentication Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={requestauthentication} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const RequestAuthentications: React.FC = props => <Table {...props} aria-label="Request Authentications" Header={RequestAuthenticationTableHeader} Row={RequestAuthenticationTableRow} virtualize />;

export const RequestAuthenticationsPage: React.FC<RequestAuthenticationsPageProps> = props => <ListPage canCreate={true} ListComponent={RequestAuthentications} kind={kind} {...props} />;

export const RequestAuthenticationsDetailsPage: React.FC<RequestAuthenticationsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(RequestAuthenticationDetails)), editYaml()]} />;

type RequestAuthenticationDetailsProps = {
  obj: K8sResourceKind;
};

type RequestAuthenticationsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type RequestAuthenticationsDetailsPageProps = {
  match: any;
};