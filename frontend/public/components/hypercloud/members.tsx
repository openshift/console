import * as _ from "lodash";
import * as React from "react";
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { EmptyBox, PageHeading, SectionHeading, } from '../utils';
import { Table, TableHeader, TableBody, sortable, SortByDirection } from '@patternfly/react-table';

const getRowUserData = (users): RowUserData[] => {
  const data: RowUserData[] = [];

  _.forEach(users, (role, name) => {
    data.push([name, role]);
  });
  return data;
};

const UsersTableHeader = [
  {
    title: 'Name',
    transforms: [sortable],
  },
  {
    title: 'Role',
    transforms: [sortable],
  },
];

const getRowUserGroupData = (userGroups): RowUserGroupData[] => {
  const data: RowUserGroupData[] = [];

  _.forEach(userGroups, (role, name) => {
    data.push([name, role]);
  });
  return data;
};

const UserGroupsTableHeader = [
  {
    title: 'Name',
    transforms: [sortable],
  },
  {
    title: 'Role',
    transforms: [sortable],
  },
];

export const UsersTable = (props) => {
  const { users, heading } = props;

  const [rows, setRows] = React.useState(getRowUserData(users));
  const [sortBy, setSortBy] = React.useState({ index: 0, direction: SortByDirection.asc });

  React.useEffect(()=>{
    setRows(getRowUserData(users));
  }, [users]);

  const onSort = (_event, index, direction) => {
    const sortedRows = rows.sort((a, b) => {
      const compA = typeof a[index] === 'string' ? (a[index] as string).toLowerCase() : a[index],
        compB = typeof b[index] === 'string' ? (b[index] as string).toLowerCase() : b[index];
      return compA < compB ? -1 : compA > compB ? 1 : 0;
    });

    setSortBy({
      index,
      direction
    });
    setRows(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse());

  };

  return (
    <div className="hc-members__users">
      {heading && <SectionHeading text={heading} />}
      {_.isEmpty(rows) ? (
        <EmptyBox label="Users" />
      ) : (
          <Table aria-label="Users" sortBy={sortBy} onSort={onSort} cells={UsersTableHeader} rows={rows}>
            <TableHeader />
            <TableBody />
          </Table>
        )}
    </div>
  );
};

export const UserGroupsTable = (props) => {
  const { groups, heading } = props;
  const data: RowUserGroupData[] = getRowUserGroupData(groups);

  const [rows, setRows] = React.useState(data);
  const [sortBy, setSortBy] = React.useState({ index: 0, direction: SortByDirection.asc });
  
  React.useEffect(()=>{
    setRows(getRowUserGroupData(groups));
  }, [groups]);

  const onSort = (_event, index, direction) => {
    const sortedRows = rows.sort((a, b) => {
      const compA = typeof a[index] === 'string' ? (a[index] as string).toLowerCase() : a[index],
        compB = typeof b[index] === 'string' ? (b[index] as string).toLowerCase() : b[index];
      return compA < compB ? -1 : compA > compB ? 1 : 0;
    });

    setSortBy({
      index,
      direction
    });
    setRows(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse());

  };

  return (
    <div className="hc-members__user-groups">
      {heading && <SectionHeading text={heading} />}
      {_.isEmpty(data) ? (
        <EmptyBox label="UserGroups" />
      ) : (
          <Table aria-label="UserGroups" sortBy={sortBy} onSort={onSort} cells={UserGroupsTableHeader} rows={rows}>
            <TableHeader />
            <TableBody />
          </Table>
        )}
    </div>
  );
};

export const inviteMemberModal = (props) =>
  import('./modals/invite-member-modal' /* webpackChunkName: "members-modal" */).then((m) => m.inviteMemberModal(props));

export const MembersPage = (props) => {
  return (
    <>
      <PageHeading title={props.title} className={classNames('co-m-nav-title--row')}>
        <div className="co-m-primary-action">
          <Button variant="primary" id="yaml-create" onClick={() => inviteMemberModal({ clusterName: props.resource.metadata.name, modalClassName: 'modal-lg' })}>
            Invite Member
          </Button>
        </div>
      </PageHeading>
      <div className="hc-members__body">
        <UsersTable users={props.resource.status.members} heading={props.userHeading} />
        <UserGroupsTable groups={props.resource.status.groups} heading={props.userGroupHeading} />
      </div>
    </>
  );
}

export type RowUserData = [string, string];

export type RowUserGroupData = [string, string];
