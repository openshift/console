import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Button, Popover } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { TableRow, TableData, Table } from '@console/internal/components/factory';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { useGuestAgentInfo } from '../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { isGuestAgentInstalled } from '../dashboards-page/vm-dashboard/vm-alerts';
import { VMIKind } from '../../types/vm';
import { VMStatusBundle } from '../../statuses/vm/types';
import { getGuestAgentFieldNotAvailMsg } from '../../utils/guest-agent-strings';
import { GUEST_AGENT_FILE_SYSTEMS_DESCRIPTION } from '../../strings/vm/messages';

import './guest-agent-file-systems.scss';

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-sm-4'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-sm-4'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-sm-4'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-sm-4'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-sm-4'),
];

const FileSystemsTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'File System Type',
      sortField: 'metadata.fileSystemType',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Mount Point',
      sortField: 'metadata.mountPoint',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Total Bytes',
      sortField: 'metadata.totalBytes',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Used Bytes',
      sortField: 'metadata.usedBytes',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
  ];
};
FileSystemsTableHeader.displayName = 'FileSystemsTableHeader';

const FileSystemTableRow = ({ obj: fileSystem, index, key, style }) => {
  return (
    <TableRow id={fileSystem?.metadata?.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>{fileSystem?.metadata?.name}</TableData>
      <TableData className={tableColumnClasses[1]}>
        {fileSystem?.metadata?.fileSystemType}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{fileSystem?.metadata?.mountPoint}</TableData>
      <TableData className={tableColumnClasses[3]}>{fileSystem?.metadata?.totalBytes}</TableData>
      <TableData className={tableColumnClasses[4]}>{fileSystem?.metadata?.usedBytes}</TableData>
    </TableRow>
  );
};

export const FileSystemsList: React.FC<FileSystemsListProps> = ({ vmi, vmStatusBundle, delay }) => {
  const [guestAgentInfoRaw, error, loading] = useGuestAgentInfo({ vmi, delay });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const fsList = guestAgentInfo.getFSInfo().getDisks();

  const data =
    guestAgentInfoRaw &&
    fsList &&
    fsList.map((fs, uid) => ({
      metadata: {
        uid,
        name: fs.getDiskName(),
        fileSystemType: fs.getType(),
        mountPoint: fs.getMountPoint(),
        totalBytes: humanizeBinaryBytes(fs.getTotalBytes()).string,
        usedBytes: humanizeBinaryBytes(fs.getUsedBytes()).string,
      },
    }));

  const body = () => {
    return !guestAgentInfoRaw ? (
      <div className="text-center">
        {getGuestAgentFieldNotAvailMsg(isGuestAgentInstalled(vmi), vmStatusBundle.status)}
      </div>
    ) : (
      <Table
        aria-label="FileSystems"
        Header={FileSystemsTableHeader}
        Row={FileSystemTableRow}
        data={data}
        loadError={error?.message}
        loaded={!loading}
        EmptyMsg={() => <div className="text-center">No File Systems Found</div>}
        virtualize
      />
    );
  };

  return (
    <div className="kubevirt-vm-details__file-systems">
      <h3>
        File Systems
        <Popover
          aria-label="File systems description"
          position="top"
          bodyContent={<>{GUEST_AGENT_FILE_SYSTEMS_DESCRIPTION}</>}
        >
          <Button variant="plain">
            <QuestionCircleIcon />
          </Button>
        </Popover>
      </h3>
      {body()}
    </div>
  );
};

type FileSystemsListProps = {
  vmi?: VMIKind;
  vmStatusBundle?: VMStatusBundle;
  delay?: number;
};
