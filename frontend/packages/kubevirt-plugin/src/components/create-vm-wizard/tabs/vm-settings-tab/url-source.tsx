import * as React from 'react';
import * as _ from 'lodash';
import { TextInput } from '@patternfly/react-core';
import { toShallowJS } from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { VMWizardStorage } from '../../types';
import { DataVolumeSourceType } from '../../../../constants/vm/storage';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { RHEL_IMAGE_LINK, FEDORA_IMAGE_LINK } from '../../../../utils/strings';

export const URLSource: React.FC<URLSourceProps> = React.memo(
  ({ field, provisionSourceStorage, onProvisionSourceStorageChange }) => {
    const isUpstream = window.SERVER_FLAGS.branding === 'okd';
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
        <div className="pf-c-form__helper-text" aria-live="polite">
          Example: For {isUpstream ? 'Fedora' : 'RHEL'}, visit the{' '}
          <a
            href={isUpstream ? FEDORA_IMAGE_LINK : RHEL_IMAGE_LINK}
            rel="noopener noreferrer"
            target="_blank"
          >
            <strong>{isUpstream ? 'Fedora cloud image list' : 'RHEL download page'}</strong>
          </a>{' '}
          {isUpstream
            ? 'and copy the download link URL for the cloud base image'
            : '(requires login) and copy the download link URL of the KVM guest image'}
        </div>
      </FormFieldRow>
    );
  },
);

type URLSourceProps = {
  field: any;
  provisionSourceStorage: any;
  onProvisionSourceStorageChange: (provisionSourceStorage: any) => void;
};
