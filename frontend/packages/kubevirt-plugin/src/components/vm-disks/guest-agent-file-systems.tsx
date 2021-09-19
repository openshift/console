import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Table, TableData } from '@console/internal/components/factory';
import { FieldLevelHelp, humanizeBinaryBytes } from '@console/internal/components/utils';
import { useGuestAgentInfo } from '../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VMStatusBundle } from '../../statuses/vm/types';
import { VMIKind } from '../../types/vm';
import { getGuestAgentFieldNotAvailMsg } from '../../utils/guest-agent-strings';
import { isGuestAgentInstalled } from '../../utils/guest-agent-utils';

import './guest-agent-file-systems.scss';

export const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-sm',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
];

const FileSystemsTableHeader = (t: TFunction) => () => {
  return [
    {
      title: t('kubevirt-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('kubevirt-plugin~File System Type'),
      sortField: 'metadata.fileSystemType',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('kubevirt-plugin~Mount Point'),
      sortField: 'metadata.mountPoint',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('kubevirt-plugin~Total Bytes'),
      sortField: 'metadata.totalBytes',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('kubevirt-plugin~Used Bytes'),
      sortField: 'metadata.usedBytes',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
  ];
};
FileSystemsTableHeader.displayName = 'FileSystemsTableHeader';

const FileSystemTableRow = ({ obj: fileSystem }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>{fileSystem?.metadata?.name}</TableData>
      <TableData className={tableColumnClasses[1]}>
        {fileSystem?.metadata?.fileSystemType}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{fileSystem?.metadata?.mountPoint}</TableData>
      <TableData className={tableColumnClasses[3]}>{fileSystem?.metadata?.totalBytes}</TableData>
      <TableData className={tableColumnClasses[4]}>{fileSystem?.metadata?.usedBytes}</TableData>
    </>
  );
};

export const FileSystemsList: React.FC<FileSystemsListProps> = ({ vmi, vmStatusBundle, delay }) => {
  const { t } = useTranslation();
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
      <div className="pf-u-text-align-center">
        {getGuestAgentFieldNotAvailMsg(t, isGuestAgentInstalled(vmi), vmStatusBundle.status)}
      </div>
    ) : (
      <Table
        aria-label={t('kubevirt-plugin~FileSystems')}
        Header={FileSystemsTableHeader(t)}
        Row={FileSystemTableRow}
        data={data}
        loadError={error?.message}
        loaded={!loading}
        EmptyMsg={() => (
          <div id="no-files-systems-found-msg" className="pf-u-text-align-center">
            {t('kubevirt-plugin~No file systems found')}
          </div>
        )}
        virtualize
      />
    );
  };

  return (
    <div className="kubevirt-vm-details__file-systems">
      <h3 id="file-systems-header">
        {t('kubevirt-plugin~File systems')}
        <FieldLevelHelp>
          {t(
            'kubevirt-plugin~The following information regarding how the disks are partitioned is provided by the guest agent.',
          )}
        </FieldLevelHelp>
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
