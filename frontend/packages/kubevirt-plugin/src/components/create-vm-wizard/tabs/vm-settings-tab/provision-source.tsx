import * as React from 'react';
import { FormSelect, FormSelectOption, Button, ButtonVariant } from '@patternfly/react-core';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { VMSettingsField } from '../../types';
import { getPlaceholder } from '../../utils/renderable-field-utils';

export const ProvisionSourceComponent: React.FC<ProvisionSourceComponentProps> = React.memo(
  ({ provisionSourceField, onChange, goToStorageStep, getProvisionSourceAttribute }) => {
    const provisionSourceValue = iGetFieldValue(provisionSourceField);
    const storageBtn = (
      <Button
        isDisabled={!goToStorageStep}
        isInline
        onClick={goToStorageStep}
        variant={ButtonVariant.link}
      >
        <strong>Storage</strong>
      </Button>
    );
    const networkBtn = (
      <Button
        isDisabled={!goToStorageStep}
        isInline
        onClick={goToStorageStep}
        variant={ButtonVariant.link}
      >
        <strong>Networking</strong>
      </Button>
    );
    const getStorageMsg = () => {
      switch (provisionSourceValue) {
        case ProvisionSource.URL.toString():
          return <>Enter URL here or edit the mounted disk in the {storageBtn} step</>;
        case ProvisionSource.CONTAINER.toString():
          return <>Enter container image here or edit the mounted disk in the {storageBtn} step</>;
        case ProvisionSource.DISK.toString():
          return <>Add a source disk in the {storageBtn} step</>;
        default:
          return null;
      }
    };

    const provisionSourceDiskHelpMsg = (
      <div className="pf-c-form__helper-text" aria-live="polite">
        {getStorageMsg()}
      </div>
    );
    const provisionSourceNetHelpMsg = (
      <div className="pf-c-form__helper-text" aria-live="polite">
        Add a network interface in the {networkBtn} step
      </div>
    );

    return (
      <FormFieldRow field={provisionSourceField} fieldType={FormFieldType.SELECT}>
        <FormField>
          <FormSelect onChange={(v) => onChange(VMSettingsField.PROVISION_SOURCE_TYPE, v)}>
            <FormSelectPlaceholderOption
              placeholder={getPlaceholder(VMSettingsField.PROVISION_SOURCE_TYPE)}
              isDisabled={!!provisionSourceValue}
            />
            {(getProvisionSourceAttribute('sources') || []).map((source) => (
              <FormSelectOption key={source} value={source} label={source} />
            ))}
          </FormSelect>
        </FormField>
        {[
          ProvisionSource.URL.toString(),
          ProvisionSource.CONTAINER.toString(),
          ProvisionSource.DISK.toString(),
        ].includes(provisionSourceValue) && provisionSourceDiskHelpMsg}
        {[ProvisionSource.PXE.toString()].includes(provisionSourceValue) &&
          provisionSourceNetHelpMsg}
      </FormFieldRow>
    );
  },
);

type ProvisionSourceComponentProps = {
  provisionSourceField: any;
  onChange: (key: string, value: string | boolean) => void;
  goToStorageStep: () => void;
  getProvisionSourceAttribute: (attr: string) => any;
};
