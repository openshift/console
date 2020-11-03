import * as React from 'react';
import { Form, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { ValidationErrorType } from '@console/shared';
import { VMWizardStorage } from '../../types';
import { FormRow } from '../../../form/form-row';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { ignoreCaseSort } from '../../../../utils/sort';
import {
  NO_BOOTABLE_ATTACHED_DISK_ERROR,
  SELECT_BOOTABLE_DISK,
  BOOTABLE_ATTACHED_DISK_MESSAGE,
} from '../../strings/storage';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { DataVolumeSourceType, VolumeType } from '../../../../constants/vm/storage';

const STORAGE_BOOT_SOURCE = 'storage-bootsource';

type StorageBootOrderProps = {
  isDisabled: boolean;
  storages: VMWizardStorage[];
  onBootOrderChanged: (deviceID: string, bootOrder: number) => void;
  className: string;
};

export const StorageBootSource: React.FC<StorageBootOrderProps> = ({
  isDisabled,
  onBootOrderChanged,
  storages,
  className,
}) => {
  const selectedStorage = storages.find((storage) =>
    new DiskWrapper(storage.disk).isFirstBootableDevice(),
  );

  const isBootSourceValid =
    new VolumeWrapper(selectedStorage?.volume).getType() === VolumeType.PERSISTENT_VOLUME_CLAIM ||
    new VolumeWrapper(selectedStorage?.volume).getType() === VolumeType.CONTAINER_DISK ||
    [DataVolumeSourceType.PVC, DataVolumeSourceType.HTTP].includes(
      new DataVolumeWrapper(selectedStorage?.dataVolume).getType(),
    );

  return (
    <Form className={className}>
      <FormRow
        title="Boot Source"
        fieldId={STORAGE_BOOT_SOURCE}
        validationMessage={
          selectedStorage
            ? !isBootSourceValid && NO_BOOTABLE_ATTACHED_DISK_ERROR
            : BOOTABLE_ATTACHED_DISK_MESSAGE
        }
        validationType={
          selectedStorage
            ? !isBootSourceValid && ValidationErrorType.Error
            : ValidationErrorType.Info
        }
        isRequired
      >
        <FormSelect
          id={STORAGE_BOOT_SOURCE}
          value={selectedStorage ? selectedStorage.id : ''}
          onChange={(id) => onBootOrderChanged(id, 1)}
          isRequired
          isDisabled={isDisabled}
        >
          <FormSelectPlaceholderOption isDisabled placeholder={SELECT_BOOTABLE_DISK} />
          {ignoreCaseSort(storages, null, (storage) => storage.disk?.name).map((storage) => (
            <FormSelectOption key={storage.id} value={storage.id} label={storage.disk?.name} />
          ))}
        </FormSelect>
      </FormRow>
    </Form>
  );
};
