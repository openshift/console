import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
// no-op

import PaneBody from '@console/shared/src/components/layout/PaneBody';
// import * as UIActions from '../actions/ui';
import { GroupModel, UserModel } from '../models';
import { referenceForModel, GroupKind } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import { removeUserModal } from './modals';
import { RoleBindingsPage } from './RBAC';
import {
  asAccessReview,
  EmptyBox,
  Kebab,
  KebabOption,
  navFactory,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { Grid, GridItem } from '@patternfly/react-core';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

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

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

const GroupTableRow: React.FC<RowFunctionArgs<GroupKind>> = ({ obj }) => {
  const resourceKind = referenceForModel(GroupModel);
  const context = { [resourceKind]: obj };
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
        <LazyActionMenu context={context} />
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
    <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
      <thead className="pf-v6-c-table__thead">
        <tr className="pf-v6-c-table__tr">
          <th className="pf-v6-c-table__th">{t('public~Name')}</th>
          <th className="pf-v6-c-table__th" />
        </tr>
      </thead>
      <tbody className="pf-v6-c-table__tbody">
        {users.map((user: string) => (
          <tr className="pf-v6-c-table__tr" key={user}>
            <td className="pf-v6-c-table__td">
              <ResourceLink kind={referenceForModel(UserModel)} name={user} />
            </td>
            <td className="pf-v6-c-table__td pf-v6-c-table__action">
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
      <PaneBody>
        <SectionHeading text={t('public~Group details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Users')} />
        <UsersTable group={obj} users={users} />
      </PaneBody>
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

export const GroupDetailsPage: React.FC = (props) => {
  const customActionMenu = (kindObj, obj) => {
    const context = { [referenceForModel(GroupModel)]: obj };
    return <LazyActionMenu context={context} />;
  };

  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(GroupModel)}
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(GroupDetails),
        navFactory.editYaml(),
        navFactory.roles(RoleBindingsTab),
      ]}
    />
  );
};

// removed unused types after action provider migration

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
