import * as React from 'react';
import { Form, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { ValidationErrorType } from '@console/shared';
import { VMWizardStorageWithWrappers } from '../../types';
import { FormRow } from '../../../form/form-row';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { ignoreCaseSort } from '../../../../utils/sort';
import { StorageUISource } from '../../../modals/disk-modal/storage-ui-source';
import { NO_BOOTABLE_ATTACHED_DISK_ERROR, SELECT_BOOTABLE_DISK } from '../../strings/storage';

const STORAGE_BOOT_SOURCE = 'storage-bootsource';

type StorageBootOrderProps = {
  isDisabled: boolean;
  storages: VMWizardStorageWithWrappers[];
  onBootOrderChanged: (deviceID: string, bootOrder: number) => void;
  className: string;
};

export const StorageBootSource: React.FC<StorageBootOrderProps> = ({
  isDisabled,
  onBootOrderChanged,
  storages,
  className,
}) => {
  const filteredStorages = storages.filter(({ volumeWrapper, dataVolumeWrapper }) =>
    [StorageUISource.ATTACH_DISK, StorageUISource.ATTACH_CLONED_DISK].includes(
      StorageUISource.fromTypes(
        volumeWrapper.getType(),
        dataVolumeWrapper && dataVolumeWrapper.getType(),
      ),
    ),
  );
  const hasStorages = filteredStorages.length > 0;

  const selectedStorage = filteredStorages.find((storage) =>
    storage.diskWrapper.isFirstBootableDevice(),
  );

  return (
    <Form className={className}>
      <FormRow
        title="Boot Source"
        fieldId={STORAGE_BOOT_SOURCE}
        validationMessage={!hasStorages && NO_BOOTABLE_ATTACHED_DISK_ERROR}
        validationType={!hasStorages && ValidationErrorType.Error}
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
          {ignoreCaseSort(filteredStorages, null, (storage) => storage.diskWrapper.getName()).map(
            (storage) => (
              <FormSelectOption
                key={storage.id}
                value={storage.id}
                label={storage.diskWrapper.getName()}
              />
            ),
          )}
        </FormSelect>
      </FormRow>
    </Form>
  );
};
