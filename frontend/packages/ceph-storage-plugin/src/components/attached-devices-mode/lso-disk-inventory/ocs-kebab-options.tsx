import * as React from 'react';
import { TableData } from '@console/internal/components/factory';
import { KebabOption, Kebab } from '@console/internal/components/utils';
import { diskReplacementModal } from './disk-replacement-modal';

const startDiskReplacementAction = (diskName: string, osdId: string): KebabOption => ({
  label: 'Start Disk Replacement',
  callback: () =>
    diskReplacementModal({
      diskName,
      osdId,
    }),
});

export const OCSKebabOptions: React.FC<OCSKebabOptionsProps> = ({ diskName, diskOsdMap }) => {
  const osdId: string = diskOsdMap.get(diskName);
  const kebabOptions: KebabOption[] = [startDiskReplacementAction(diskName, osdId)];

  return (
    <TableData className={Kebab.columnClass}>
      {/* Disable options for non OCS based disks */}
      <Kebab options={kebabOptions} isDisabled={!!osdId} />
    </TableData>
  );
};

type OCSKebabOptionsProps = { diskName: string; diskOsdMap: Map<string, string> };
