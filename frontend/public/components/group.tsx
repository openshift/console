import * as React from 'react';
import { match } from 'react-router-dom';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { GroupModel, UserModel } from '../models';
import { referenceForModel, GroupKind, K8sKind } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { addUsersModal, removeUserModal } from './modals';
import { RoleBindingsPage } from './RBAC';
import {
  asAccessReview,
  EmptyBox,
  Kebab,
  KebabAction,
  KebabOption,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
} from './utils';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

const addUsers: KebabAction = (kind: K8sKind, group: GroupKind) => ({
  label: i18next.t('usermanagement-group~Add Users'),
  callback: () =>
    addUsersModal({
      group,
    }),
  accessReview: asAccessReview(kind, group, 'patch'),
});

const removeUser = (group: GroupKind, user: string): KebabOption => {
  return {
    label: i18next.t('usermanagement-group~Remove User'),
    callback: () =>
      removeUserModal({
        group,
        user,
      }),
    accessReview: asAccessReview(GroupModel, group, 'patch'),
  };
};

const menuActions = [addUsers, ...Kebab.factory.common];

const tableColumnClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const GroupTableRow: RowFunction<GroupKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={referenceForModel(GroupModel)} name={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{_.size(obj.users)}</TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={referenceForModel(GroupModel)} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export const GroupList: React.FC = (props) => {
  const { t } = useTranslation();
  const GroupTableHeader = () => {
    return [
      {
        title: t('usermanagement-group~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('usermanagement-group~Users'),
        sortField: 'users.length',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('usermanagement-group~Created'),
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
  GroupTableHeader.displayName = 'GroupTableHeader';
  return (
    <Table
      {...props}
      aria-label={t('usermanagement-group~Groups')}
      Header={GroupTableHeader}
      Row={GroupTableRow}
      virtualize
    />
  );
};

export const GroupPage: React.FC<GroupPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ListPage
      {...props}
      title={t('usermanagement-group~Groups')}
      kind={referenceForModel(GroupModel)}
      ListComponent={GroupList}
      canCreate
    />
  );
};

const UserKebab: React.FC<UserKebabProps> = ({ group, user }) => {
  const options: KebabOption[] = [removeUser(group, user)];
  return <Kebab options={options} />;
};

const UsersTable: React.FC<UsersTableProps> = ({ group, users }) => {
  const { t } = useTranslation();
  return _.isEmpty(users) ? (
    <EmptyBox label={t('usermanagement-group~Users')} />
  ) : (
    <table className="table">
      <thead>
        <tr>
          <th>{t('usermanagement-group~Name')}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {users.map((user: string) => (
          <tr key={user}>
            <td>
              <ResourceLink kind={referenceForModel(UserModel)} name={user} />
            </td>
            <td className="dropdown-kebab-pf pf-c-table__action">
              <UserKebab group={group} user={user} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const GroupDetails: React.FC<GroupDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const users: string[] = obj.users ? [...obj.users].sort() : [];
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('usermanagement-group~Group details')} />
        <ResourceSummary resource={obj} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('usermanagement-group~Users')} />
        <UsersTable group={obj} users={users} />
      </div>
    </>
  );
};

const RoleBindingsTab: React.FC<RoleBindingsTabProps> = ({ obj }) => (
  <RoleBindingsPage
    showTitle={false}
    staticFilters={[{ 'role-binding-group': obj.metadata.name }]}
  />
);

export const GroupDetailsPage: React.FC<GroupDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={referenceForModel(GroupModel)}
    menuActions={menuActions}
    pages={[
      navFactory.details(GroupDetails),
      navFactory.editYaml(),
      navFactory.roles(RoleBindingsTab),
    ]}
  />
);

type UserKebabProps = {
  group: GroupKind;
  user: string;
};

type UsersTableProps = {
  group: GroupKind;
  users: string[];
};

type GroupPageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type GroupDetailsProps = {
  obj: GroupKind;
};

type RoleBindingsTabProps = {
  obj: GroupKind;
};

type GroupDetailsPageProps = {
  match: match<any>;
};
