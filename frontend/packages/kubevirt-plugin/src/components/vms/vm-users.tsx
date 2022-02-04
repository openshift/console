import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import classnames from 'classnames';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { RowFunctionArgs, Table, TableData } from '@console/internal/components/factory';
import { fromNow } from '@console/internal/components/utils/datetime';
import { Timestamp } from '@console/internal/components/utils/timestamp';
import { useGuestAgentInfo } from '../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VMStatusBundle } from '../../statuses/vm/types';
import { VMIKind } from '../../types';
import { getGuestAgentFieldNotAvailMsg } from '../../utils/guest-agent-strings';
import { isGuestAgentInstalled } from '../../utils/guest-agent-utils';

const tableColumnClasses = ['', '', '', 'pf-m-hidden pf-m-visible-on-lg'];

const UsersTableHeader = (t: TFunction) => () => {
  return [
    {
      title: t('kubevirt-plugin~User Name'),
      sortField: 'metadata.userName',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('kubevirt-plugin~Domain'),
      sortField: 'metadata.domain',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('kubevirt-plugin~Time of login'),
      sortField: 'metadata.loginTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('kubevirt-plugin~Elapsed time since login'),
      props: { className: tableColumnClasses[3] },
    },
  ];
};
UsersTableHeader.displayName = 'UsersTableHeader';

const UsersTableRow: React.FC<RowFunctionArgs> = ({ obj: user }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>{user?.metadata?.userName}</TableData>
      <TableData className={classnames(tableColumnClasses[1], 'co-break-word')}>
        {user?.metadata?.domain}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={new Date(user?.metadata?.loginTime).toUTCString()} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{fromNow(user?.metadata?.loginTime)}</TableData>
    </>
  );
};

export const VMUsersList: React.FC<VMUsersListProps> = ({ vmi, vmStatusBundle }) => {
  const { t } = useTranslation();
  const [guestAgentInfoRaw, error, loading] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const userList = guestAgentInfo.getUserList();

  const guestAgentFieldNotAvailMsg = getGuestAgentFieldNotAvailMsg(
    t,
    isGuestAgentInstalled(vmi),
    vmStatusBundle.status,
  );

  if (!guestAgentInfoRaw) {
    return (
      <div id="guest-agent-unavailable-msg" className="pf-u-text-align-center">
        {guestAgentFieldNotAvailMsg}
      </div>
    );
  }

  const data =
    guestAgentInfoRaw &&
    userList &&
    userList.map((user, uid) => ({
      metadata: {
        uid,
        userName: user.getUserName(),
        domain: user.getDomain(),
        loginTime: user.getLoginTimeInMilliSec(),
      },
    }));

  return (
    <Table
      aria-label={t('kubevirt-plugin~Users')}
      Header={UsersTableHeader(t)}
      Row={UsersTableRow}
      data={data}
      loadError={error?.message}
      loaded={!loading}
      EmptyMsg={() => (
        <div id="no-active-users-msg" className="pf-u-text-align-center">
          {t('kubevirt-plugin~No Active Users')}
        </div>
      )}
      virtualize
    />
  );
};

type VMUsersListProps = {
  vmi?: VMIKind;
  vmStatusBundle?: VMStatusBundle;
};
