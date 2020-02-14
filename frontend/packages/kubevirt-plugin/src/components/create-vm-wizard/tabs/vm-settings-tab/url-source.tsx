import * as React from 'react';
import * as _ from 'lodash';
import { TextInput } from '@patternfly/react-core';
import { toShallowJS } from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { VMWizardStorage } from '../../types';
import { DataVolumeSourceType } from '../../../../constants/vm/storage';
import {
  DataVolumeWrapper,
  MutableDataVolumeWrapper,
} from '../../../../k8s/wrapper/vm/data-volume-wrapper';

export const URLSource: React.FC<URLSourceProps> = React.memo(
  ({ field, provisionSourceStorage, onProvisionSourceStorageChange }) => {
    const storage: VMWizardStorage = toShallowJS(provisionSourceStorage);
    const dataVolumeWrapper = DataVolumeWrapper.initialize(storage?.dataVolume);

    return (
      <FormFieldRow
        field={field}
        fieldType={FormFieldType.TEXT}
        validation={_.get(storage, ['validation', 'validations', 'url'])}
      >
        <FormField
          value={dataVolumeWrapper.getURL()}
          isDisabled={dataVolumeWrapper.getType() !== DataVolumeSourceType.HTTP}
        >
          <TextInput
            onChange={(url) =>
              onProvisionSourceStorageChange({
                ...storage,
                dataVolume: new MutableDataVolumeWrapper(storage?.dataVolume, true)
                  .appendTypeData({ url }, false)
                  .asMutableResource(),
              })
            }
          />
        </FormField>
      </FormFieldRow>
    );
  },
);

type URLSourceProps = {
  field: any;
  provisionSourceStorage: any;
  onProvisionSourceStorageChange: (provisionSourceStorage: any) => void;
};
