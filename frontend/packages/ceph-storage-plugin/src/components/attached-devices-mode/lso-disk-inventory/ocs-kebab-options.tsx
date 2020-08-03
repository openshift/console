import * as React from 'react';
import { TableData } from '@console/internal/components/factory';
import { KebabOption, Kebab } from '@console/internal/components/utils';
import { diskReplacementModal } from './disk-replacement-modal';
import { OCSDiskList, OCSColumnStateAction } from './state-reducer';

const startDiskReplacementAction = (
  diskName,
  alertsMap,
  replacementMap,
  isRebalancing,
  dispatch,
): KebabOption => ({
  label: 'Start Disk Replacement',
  callback: () =>
    diskReplacementModal({
      diskName,
      alertsMap,
      replacementMap,
      isRebalancing,
      dispatch,
    }),
});

export const OCSKebabOptions: React.FC<OCSKebabOptionsProps> = React.memo(
  ({ diskName, alertsMap, replacementMap, isRebalancing, dispatch }) => {
    const kebabOptions: KebabOption[] = [
      startDiskReplacementAction(diskName, alertsMap, replacementMap, isRebalancing, dispatch),
    ];
    return (
      <TableData className={Kebab.columnClass}>
        {/* Enables the options for the disk with failures */}
        <Kebab options={kebabOptions} isDisabled={!alertsMap[diskName]} />
      </TableData>
    );
  },
);

type OCSKebabOptionsProps = {
  diskName: string;
  alertsMap: OCSDiskList;
  replacementMap: OCSDiskList;
  isRebalancing: boolean;
  dispatch: React.Dispatch<OCSColumnStateAction>;
};
