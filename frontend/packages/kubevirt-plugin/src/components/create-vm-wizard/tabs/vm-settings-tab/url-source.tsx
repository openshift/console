import * as React from 'react';
import { TextInput } from '@patternfly/react-core';
import * as _ from 'lodash';
import { DataVolumeSourceType } from '../../../../constants/vm/storage';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { toShallowJS } from '../../../../utils/immutable';
import { URLSourceHelp } from '../../../form/helper/url-source-help';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldRow } from '../../form/form-field-row';
import { VMWizardStorage } from '../../types';

export const URLSource: React.FC<URLSourceProps> = React.memo(
  ({ field, provisionSourceStorage, onProvisionSourceStorageChange, baseImageName }) => {
    const storage: VMWizardStorage = toShallowJS(provisionSourceStorage);
    const dataVolumeWrapper = new DataVolumeWrapper(storage?.dataVolume);

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
                dataVolume: new DataVolumeWrapper(storage?.dataVolume, true)
                  .appendTypeData({ url }, false)
                  .asResource(),
              })
            }
          />
        </FormField>
        <URLSourceHelp baseImageName={baseImageName} />
      </FormFieldRow>
    );
  },
);

type URLSourceProps = {
  field: any;
  provisionSourceStorage: any;
  onProvisionSourceStorageChange: (provisionSourceStorage: any) => void;
  baseImageName: string;
};
