import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TableData } from '@console/internal/components/factory';
import { KebabOption, Kebab } from '@console/internal/components/utils';
import { DiskMetadata } from 'packages/local-storage-operator-plugin/src/components/disks-list/types';
import { OCSColumnStateAction, OCSColumnState } from './state-reducer';
import { diskReplacementModal } from '../modals/disk-replacement-modal';

export const OCSKebabOptions: React.FC<OCSKebabOptionsProps> = React.memo(
  ({ nodeName, disk, ocsState, dispatch }) => {
    const { t } = useTranslation();

    const { alertsMap } = ocsState;

    const kebabOptions: KebabOption[] = [
      {
        // t('ceph-storage-plugin~Start Disk Replacement')
        labelKey: t('ceph-storage-plugin~Start Disk Replacement'),
        callback: () =>
          diskReplacementModal({
            nodeName,
            disk,
            ocsState,
            dispatch,
          }),
      },
    ];

    return (
      <TableData className={Kebab.columnClass}>
        {/* Enables the options for the disk with failures */}
        <Kebab options={kebabOptions} isDisabled={alertsMap?.[disk.path]?.node !== nodeName} />
      </TableData>
    );
  },
);

type OCSKebabOptionsProps = {
  disk: DiskMetadata;
  nodeName: string;
  ocsState: OCSColumnState;
  dispatch: React.Dispatch<OCSColumnStateAction>;
};
