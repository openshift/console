import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { connect } from 'react-redux';
import { NavigateFunction, useNavigate } from 'react-router-dom-v5-compat';

import * as UIActions from '../actions/ui';
import { GroupModel, UserModel } from '../models';
import { referenceForModel, GroupKind, K8sKind } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
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
  label: i18next.t('public~Add Users'),
  callback: () =>
    addUsersModal({
      group,
    }),
  accessReview: asAccessReview(kind, group, 'patch'),
});

const removeUser = (group: GroupKind, user: string): KebabOption => {
  return {
    label: i18next.t('public~Remove User'),
    callback: () =>
      removeUserModal({
        group,
        user,
      }),
    accessReview: asAccessReview(GroupModel, group, 'patch'),
  };
};

const menuActions = [addUsers, ...Kebab.factory.common];

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

const getImpersonateAction = (
  startImpersonate: StartImpersonate,
  navigate: NavigateFunction,
): KebabAction => (kind: K8sKind, group: GroupKind) => ({
  label: i18next.t('public~Impersonate Group {{name}}', group.metadata),
  callback: () => {
    startImpersonate('Group', group.metadata.name);
    navigate(window.SERVER_FLAGS.basePath);
  },
  // Must use API group authorization.k8s.io, NOT user.openshift.io
  // See https://kubernetes.io/docs/reference/access-authn-authz/authentication/#user-impersonation
  accessReview: {
    group: 'authorization.k8s.io',
    resource: 'groups',
    name: group.metadata.name,
    verb: 'impersonate',
  },
});

const GroupKebab_: React.FC<GroupKebabProps & GroupKebabDispatchProps> = ({
  group,
  startImpersonate,
}) => {
  const navigate = useNavigate();
  return (
    <ResourceKebab
      actions={[getImpersonateAction(startImpersonate, navigate), ...menuActions]}
      kind={referenceForModel(GroupModel)}
      resource={group}
    />
  );
};

const GroupKebab = connect<{}, GroupKebabDispatchProps, GroupKebabProps>(null, {
  startImpersonate: UIActions.startImpersonate,
})(GroupKebab_);

const GroupTableRow: React.FC<RowFunctionArgs<GroupKind>> = ({ obj }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={referenceForModel(GroupModel)} name={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{_.size(obj.users)}</TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <GroupKebab group={obj} />
      </TableData>
    </>
  );
};

export const GroupList: React.FC = (props) => {
  const { t } = useTranslation();
  const GroupTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Users'),
        sortField: 'users.length',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Created'),
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
      aria-label={t('public~Groups')}
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
      title={t('public~Groups')}
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
    <EmptyBox label={t('public~Users')} />
  ) : (
    <table className="pf-v5-c-table pf-m-compact pf-m-border-rows">
      <thead className="pf-v5-c-table__thead">
        <tr className="pf-v5-c-table__tr">
          <th className="pf-v5-c-table__th">{t('public~Name')}</th>
          <th className="pf-v5-c-table__th" />
        </tr>
      </thead>
      <tbody className="pf-v5-c-table__tbody">
        {users.map((user: string) => (
          <tr className="pf-v5-c-table__tr" key={user}>
            <td className="pf-v5-c-table__td">
              <ResourceLink kind={referenceForModel(UserModel)} name={user} />
            </td>
            <td className="pf-v5-c-table__td dropdown-kebab-pf pf-v5-c-table__action">
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
        <SectionHeading text={t('public~Group details')} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={obj} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Users')} />
        <UsersTable group={obj} users={users} />
      </div>
    </>
  );
};

const RoleBindingsTab: React.FC<RoleBindingsTabProps> = ({ obj }) => (
  <RoleBindingsPage
    showTitle={false}
    staticFilters={{ 'role-binding-group': obj.metadata.name }}
    name={obj.metadata.name}
    kind={obj.kind}
  />
);

const GroupDetailsPage_: React.FC<GroupKebabDispatchProps> = ({ startImpersonate, ...props }) => {
  const navigate = useNavigate();

  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(GroupModel)}
      menuActions={[getImpersonateAction(startImpersonate, navigate), ...menuActions]}
      pages={[
        navFactory.details(GroupDetails),
        navFactory.editYaml(),
        navFactory.roles(RoleBindingsTab),
      ]}
    />
  );
};

export const GroupDetailsPage = connect<{}, GroupKebabDispatchProps>(null, {
  startImpersonate: UIActions.startImpersonate,
})(GroupDetailsPage_);

type StartImpersonate = (kind: string, name: string) => (dispatch, store) => Promise<void>;

type GroupKebabDispatchProps = {
  startImpersonate: StartImpersonate;
};

type GroupKebabProps = {
  group: GroupKind;
};

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
