import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { fromNow } from '@console/internal/components/utils/datetime';
import { Table, TableRow, TableData } from '@console/internal/components/factory';
import { Timestamp } from '@console/internal/components/utils/timestamp';
import { StatusItem } from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { BlueInfoCircleIcon } from '@console/shared/src/components/status';
import {
  VIRTUAL_MACHINE_IS_NOT_RUNNING,
  NO_GUEST_AGENT_MESSAGE,
} from '../../constants/vm/constants';
import { VMStatus } from '../../constants/vm/vm-status';
import { isGuestAgentInstalled } from '../dashboards-page/vm-dashboard/vm-alerts';
import { useGuestAgentInfo } from '../../hooks/use-guest-agent-info';
import { getGuestAgentInfoUserList } from '../../selectors/vmi-guest-agent-info/guest-agent-info';
import {
  getGuestOSUserUserName,
  getGuestOSUserLoginTimeSec,
  getGuestOSUserDomain,
} from '../../selectors/vmi-guest-agent-info/guest-os-user-list';
import { VMStatusBundle } from '../../statuses/vm/types';
import { VMIKind } from '../../types';

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-sm-4'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-sm-4'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-sm-4'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
];

const UsersTableHeader = () => {
  return [
    {
      title: 'User Name',
      sortField: 'metadata.userName',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Domain',
      sortField: 'metadata.domain',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Login time',
      sortField: 'metadata.loginTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Elapsed logged in time',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
UsersTableHeader.displayName = 'UsersTableHeader';

const UsersTableRow = ({ obj: user, index, key, style }) => {
  return (
    <TableRow id={user?.metadata?.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>{user?.metadata?.userName}</TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {user?.metadata?.domain}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={new Date(user?.metadata?.loginTime).toUTCString()} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{fromNow(user?.metadata?.loginTime)}</TableData>
    </TableRow>
  );
};

export const VMUsersList: React.FC<VMUsersListProps> = ({ vmi, vmStatusBundle, delay }) => {
  const [response, error, loading] = useGuestAgentInfo({ vmi, delay });

  if (vmStatusBundle.status !== VMStatus.RUNNING) {
    return <div className="text-center">{VIRTUAL_MACHINE_IS_NOT_RUNNING}</div>;
  }

  if (!isGuestAgentInstalled(vmi)) {
    return <StatusItem Icon={BlueInfoCircleIcon} message={NO_GUEST_AGENT_MESSAGE} />;
  }

  const data =
    response &&
    getGuestAgentInfoUserList(response) &&
    getGuestAgentInfoUserList(response).map((user, uid) => ({
      metadata: {
        uid,
        userName: getGuestOSUserUserName(user),
        domain: getGuestOSUserDomain(user),
        loginTime: getGuestOSUserLoginTimeSec(user),
      },
    }));

  return (
    <Table
      aria-label="Users"
      Header={UsersTableHeader}
      Row={UsersTableRow}
      data={data}
      loadError={error?.message}
      loaded={!loading}
      EmptyMsg={() => <div className="text-center">No Logged In Users</div>}
      virtualize
    />
  );
};

type VMUsersListProps = {
  vmi?: VMIKind;
  vmStatusBundle?: VMStatusBundle;
  delay?: number;
};
