import * as React from 'react';
import { Form, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ValidationErrorType } from '@console/shared';
import { DataVolumeSourceType, VolumeType } from '../../../../constants/vm/storage';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { ignoreCaseSort } from '../../../../utils/sort';
import { FormRow } from '../../../form/form-row';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { VMWizardStorage } from '../../types';

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
  const { t } = useTranslation();
  const selectedStorage = storages.find((storage) =>
    new DiskWrapper(storage.disk).isFirstBootableDevice(),
  );

  const isBootSourceValid =
    new VolumeWrapper(selectedStorage?.volume).getType() === VolumeType.PERSISTENT_VOLUME_CLAIM ||
    new VolumeWrapper(selectedStorage?.volume).getType() === VolumeType.CONTAINER_DISK ||
    [DataVolumeSourceType.PVC, DataVolumeSourceType.HTTP, DataVolumeSourceType.REGISTRY].includes(
      new DataVolumeWrapper(selectedStorage?.dataVolume).getType(),
    );

  return (
    <Form className={className}>
      <FormRow
        title="Boot Source"
        fieldId={STORAGE_BOOT_SOURCE}
        validationMessage={
          selectedStorage
            ? !isBootSourceValid &&
              t(
                'kubevirt-plugin~This disk does not have a source defined and can not be used as a boot source',
              )
            : t('kubevirt-plugin~A boot source disk must have a source and can not be blank')
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
          <FormSelectPlaceholderOption
            isDisabled
            placeholder={t('kubevirt-plugin~--- Select Bootable Disk ---')}
          />
          {ignoreCaseSort(storages, null, (storage) => storage.disk?.name).map((storage) => (
            <FormSelectOption key={storage.id} value={storage.id} label={storage.disk?.name} />
          ))}
        </FormSelect>
      </FormRow>
    </Form>
  );
};
