import * as React from 'react';
import * as _ from 'lodash';
import { TextInput } from '@patternfly/react-core';
import { toShallowJS } from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { VMWizardStorage } from '../../types';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { VolumeType } from '../../../../constants/vm/storage';
import { EXAMPLE_CONTAINER } from '../../../../utils/strings';

export const ContainerSource: React.FC<ContainerSourceProps> = React.memo(
  ({ field, provisionSourceStorage, onProvisionSourceStorageChange }) => {
    const storage: VMWizardStorage = toShallowJS(provisionSourceStorage);
    const volumeWrapper = new VolumeWrapper(storage?.volume);

    return (
      <FormFieldRow
        field={field}
        fieldType={FormFieldType.TEXT}
        validation={_.get(storage, ['validation', 'validations', 'container'])}
      >
        <FormField
          value={volumeWrapper.getContainerImage()}
          isDisabled={volumeWrapper.getType() !== VolumeType.CONTAINER_DISK}
        >
          <TextInput
            onChange={(image) =>
              onProvisionSourceStorageChange({
                ...storage,
                volume: new VolumeWrapper(storage?.volume, true)
                  .appendTypeData({ image }, false)
                  .asResource(),
              })
            }
          />
        </FormField>
        <div className="pf-c-form__helper-text" aria-live="polite">
          Example: {EXAMPLE_CONTAINER}
        </div>
      </FormFieldRow>
    );
  },
);

type ContainerSourceProps = {
  field: any;
  provisionSourceStorage: any;
  onProvisionSourceStorageChange: (provisionSourceStorage: any) => void;
};
