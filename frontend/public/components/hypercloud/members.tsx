import * as _ from "lodash";
import * as React from "react";
import * as classNames from 'classnames';
import { Button, Dropdown, DropdownToggle, DropdownItem, TextInput } from '@patternfly/react-core';
import { EmptyBox, SectionHeading, /*Kebab,*/ } from '../utils';
import { Table, TableHeader, TableBody, sortable, SortByDirection, IRow } from '@patternfly/react-table';
import { CaretDownIcon, UsersIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { TFunction } from "i18next";
//import { getId } from '../../hypercloud/auth';

const testData: ITableRow[] = [
  {
    cells: ['qwer', 'qwer@tmax.co.kr', 'admin'],
    obj: { name: 'qwer', email: 'qwer@tmax.co.kr', role: 'admin', type: 'user' }
  },
  {
    cells: ['as as as', 'asdf@tmax.co.kr', 'developer'],
    obj: { name: 'as as as', email: 'asdf@tmax.co.kr', role: 'developer', type: 'user' }
  },
  {
    cells: [<><UsersIcon className='hc-member__group-icon' />a123 346jso</>, '', 'guest'],
    obj: { name: 'a123 346jso', email: '', role: 'guest', type: 'group' }
  },
  {
    cells: [<><UsersIcon className='hc-member__group-icon' />pojgjdrk82347598 fhsuih103 fahsjk</>, '', 'developer'],
    obj: { name: 'pojgjdrk82347598 fhsuih103 fahsjk', email: '', role: 'developer', type: 'group' }
  },
];

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), /*Kebab.columnClass*/];

const MemberTableRows = (members, isUser): ITableRow[] => {
  const data = [];
  _.forEach(members, (role, name) => {
    const member = { name: name, role: role, type: isUser ? 'user' : 'group', email: isUser ? name : '' };
    data.push({
      cells: [member.name, member.email, member.role],
      obj: member
    });
  });
  return data;
}

const MemberTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_TABLEHEADER_2'),
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
      data: 'name'
    },
    {
      title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_TABLEHEADER_1'),
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      data: 'email'
    },
    {
      title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_TABLEHEADER_3'),
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
      data: 'role'
    },
    /* {
      title: '',
      props: { className: tableColumnClasses[3] },
    }, */
  ];
};
MemberTableHeader.displayName = 'UserTableHeader';

export const UsersTable = (props) => {
  const { clusterName, isOwner, users, groups, heading } = props;

  const [rows, setRows] = React.useState(_.concat(testData, MemberTableRows(users, true), MemberTableRows(groups, false)));
  const [sortBy, setSortBy] = React.useState({ index: 0, direction: SortByDirection.asc });

  React.useEffect(() => {
    setRows(_.concat(testData, MemberTableRows(users, true), MemberTableRows(groups, false)));
  }, [users, groups]);

  const onSort = (_event, index, direction, extraData) => {
    const sortField = extraData.column.data;
    const sortedRows = rows.sort((a, b) => {
      const compA = typeof a.obj[sortField] === 'string' ? (a.obj[sortField] as string).toLowerCase() : a.obj[sortField],
        compB = typeof b.obj[sortField] === 'string' ? (b.obj[sortField] as string).toLowerCase() : b.obj[sortField];
      return compA < compB ? -1 : compA > compB ? 1 : 0;
    });

    setSortBy({
      index,
      direction
    });
    setRows(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse());

  };

  const userActions = (t?: TFunction) => [
    {
      title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_ACTIONBUTTON_1'),
      onClick: (event, rowId, rowData, extra) => {
        modifyMemberModal({ clusterName, modalClassName: 'modal-lg', member: rowData.obj })
      }
    },
    {
      title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_ACTIONBUTTON_2'),
      onClick: (event, rowId, rowData, extra) => {
        removeMemberModal({ clusterName, modalClassName: 'modal-lg', member: rowData.obj })
      }
    }
  ];

  const { t } = useTranslation();
  return (
    <div className="hc-members__users">
      {heading && <SectionHeading text={heading} />}
      {_.isEmpty(rows) ? (
        <EmptyBox label="Users" />
      ) : (
        <Table aria-label="Users" sortBy={sortBy} onSort={onSort} cells={MemberTableHeader.bind(null, t)()} rows={rows} actions={isOwner && userActions.bind(null, t)()}>
          <TableHeader />
          <TableBody />
        </Table>
      )}
    </div>
  );
};

export const inviteMemberModal = (props) =>
  import('./modals/invite-member-modal' /* webpackChunkName: "members-modal" */).then((m) => m.inviteMemberModal(props));

export const modifyMemberModal = (props) =>
  import('./modals/modify-member-modal' /* webpackChunkName: "modify-member-modal" */).then((m) => m.modifyMemberModal(props));

export const removeMemberModal = (props) =>
  import('./modals/remove-member-modal' /* webpackChunkName: "remove-member-modal" */).then((m) => m.removeMemberModal(props));

export const MembersPage = (props) => {
  const [searchType, setSearchType] = React.useState('Email');
  const [isOpen, setOpen] = React.useState(false);

  const onToggle = (open: boolean) => setOpen(open);
  const onSelect = event => {
    const selectedName = event.target.name;
    setSearchType(selectedName);
    setOpen(!isOpen);
  };

  const dropdownItems = [
    <DropdownItem key="label-action" name='Email' component="button">
      Search By Email
    </DropdownItem>,
    <DropdownItem key="name-action" name='Name' component="button">
      Search By Name
    </DropdownItem>,
  ];

  const isOwner = true; //Object.keys(props.resource.status.owner)[0] === getId();
  const { t } = useTranslation();
  return (
    <>
      <div className='hc-members__header'>
        <Dropdown
          onSelect={onSelect}
          toggle={
            <DropdownToggle id="toggle-id" onToggle={onToggle} iconComponent={CaretDownIcon}>
              {searchType}
            </DropdownToggle>}
          isOpen={isOpen}
          dropdownItems={dropdownItems}
        />
        <TextInput className='hc-members__search'></TextInput>
        {isOwner &&
          <div className="co-m-primary-action">
            <Button variant="primary" id="yaml-create" onClick={() => inviteMemberModal({ clusterName: props.resource.metadata.name, modalClassName: 'modal-lg', existMembers: props.resource.status.members, existGroups: props.resource.status.groups })}>
              {t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_BUTTON_1')}
            </Button>
          </div>}
      </div>
      <div className="hc-members__body">
        <UsersTable clusterName={props.resource.metadata.name} isOwner={isOwner} users={props.resource.status.members} groups={props.resource.status.groups} />
      </div>
    </>
  );
}

export type RowMemberData = {
  name: string,
  role: string,
  type: 'user' | 'group',
  email: string
};

export interface ITableRow extends IRow {
  obj: RowMemberData
}
