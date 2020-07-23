import * as React from 'react';
import { TableData } from '@console/internal/components/factory';
import { KebabOption, Kebab } from '@console/internal/components/utils';
import { diskReplacementModal } from './disk-replacement-modal';
import { OCSDiskList, OCSColumnStateAction } from './state-reducer';

const startDiskReplacementAction = (
  diskName,
  diskOsdMap,
  isRebalancing,
  dispatch,
): KebabOption => ({
  label: 'Start Disk Replacement',
  callback: () =>
    diskReplacementModal({
      diskName,
      diskOsdMap,
      isRebalancing,
      dispatch,
    }),
});

export const OCSKebabOptions: React.FC<OCSKebabOptionsProps> = React.memo(
  ({ diskName, diskOsdMap, isRebalancing, dispatch }) => {
    const kebabOptions: KebabOption[] = [
      startDiskReplacementAction(diskName, diskOsdMap, isRebalancing, dispatch),
    ];
    return (
      <TableData className={Kebab.columnClass}>
        {/* Disable options for non OCS based disks */}
        <Kebab options={kebabOptions} isDisabled={!diskOsdMap[diskName]} />
      </TableData>
    );
  },
);

type OCSKebabOptionsProps = {
  diskName: string;
  diskOsdMap: OCSDiskList;
  isRebalancing: boolean;
  dispatch: React.Dispatch<OCSColumnStateAction>;
};
