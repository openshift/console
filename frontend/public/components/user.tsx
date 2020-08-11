import * as React from 'react';
import { connect } from 'react-redux';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';

import * as UIActions from '../actions/ui';
import { OAuthModel, UserModel } from '../models';
import { K8sKind, referenceForModel, UserKind } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { RoleBindingsPage } from './RBAC';
import {
  Kebab,
  KebabAction,
  MsgBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  resourcePathFromModel,
} from './utils';

const tableColumnClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const UserTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Full Name',
      sortField: 'fullName',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Identities',
      sortField: 'identities[0]',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
UserTableHeader.displayName = 'UserTableHeader';

const UserKebab_: React.FC<UserKebabProps & UserKebabDispatchProps> = ({
  user,
  startImpersonate,
}) => {
  const impersonateAction: KebabAction = (kind: K8sKind, obj: UserKind) => ({
    label: `Impersonate User "${obj.metadata.name}"`,
    callback: () => startImpersonate('User', obj.metadata.name),
  });
  return (
    <ResourceKebab
      actions={[impersonateAction, ...Kebab.factory.common]}
      kind={referenceForModel(UserModel)}
      resource={user}
    />
  );
};

const UserKebab = connect<{}, UserKebabDispatchProps, UserKebabProps>(null, {
  startImpersonate: UIActions.startImpersonate,
})(UserKebab_);

const UserTableRow: RowFunction<UserKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={referenceForModel(UserModel)} name={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{obj.fullName || '-'}</TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.map(obj.identities, (identity: string) => (
          <div key={identity}>{identity}</div>
        ))}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <UserKebab user={obj} />
      </TableData>
    </TableRow>
  );
};

const EmptyMsg = () => <MsgBox title="No Users Found" />;
const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster');
const noDataDetail = (
  <>
    <p>Add identity providers (IDPs) to the OAuth configuration to allow others to log&nbsp;in.</p>
    <p>
      <Link to={oAuthResourcePath}>
        <Button variant="primary">Add IDP</Button>
      </Link>
    </p>
  </>
);
const NoDataEmptyMsg = () => <MsgBox title="No Users Found" detail={noDataDetail} />;

export const UserList: React.FC = (props) => (
  <Table
    {...props}
    aria-label="Users"
    Header={UserTableHeader}
    Row={UserTableRow}
    EmptyMsg={EmptyMsg}
    NoDataEmptyMsg={NoDataEmptyMsg}
    virtualize
  />
);

export const UserPage: React.FC<UserPageProps> = (props) => (
  <ListPage
    {...props}
    title="Users"
    helpText={<>Users are automatically added the first time they log&nbsp;in.</>}
    kind={referenceForModel(UserModel)}
    ListComponent={UserList}
    canCreate={false}
  />
);

const RoleBindingsTab: React.FC<RoleBindingsTabProps> = ({ obj }) => (
  <RoleBindingsPage
    showTitle={false}
    staticFilters={[{ 'role-binding-user': obj.metadata.name }]}
  />
);

const UserDetails: React.FC<UserDetailsProps> = ({ obj }) => {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="User Details" />
      <ResourceSummary resource={obj}>
        <dt>Full Name</dt>
        <dd>{obj.fullName || '-'}</dd>
        <dt>Identities</dt>
        <dd>
          {_.map(obj.identities, (identity: string) => (
            <div key={identity}>{identity}</div>
          ))}
        </dd>
      </ResourceSummary>
    </div>
  );
};

type UserKebabDispatchProps = {
  startImpersonate: (kind: string, name: string) => (dispatch, store) => Promise<void>;
};

type UserKebabProps = {
  user: UserKind;
};

const UserDetailsPage_: React.FC<UserDetailsPageProps & UserKebabDispatchProps> = ({
  startImpersonate,
  ...props
}) => {
  const impersonateAction: KebabAction = (kind: K8sKind, obj: UserKind) => ({
    label: `Impersonate User "${obj.metadata.name}"`,
    callback: () => startImpersonate('User', obj.metadata.name),
  });
  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(UserModel)}
      menuActions={[impersonateAction, ...Kebab.factory.common]}
      pages={[
        navFactory.details(UserDetails),
        navFactory.editYaml(),
        navFactory.roles(RoleBindingsTab),
      ]}
    />
  );
};

export const UserDetailsPage = connect<{}, UserKebabDispatchProps, UserDetailsPageProps>(null, {
  startImpersonate: UIActions.startImpersonate,
})(UserDetailsPage_);

type UserPageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type RoleBindingsTabProps = {
  obj: UserKind;
};

type UserDetailsProps = {
  obj: UserKind;
};

type UserDetailsPageProps = {
  match: match<any>;
};
