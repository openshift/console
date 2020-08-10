import * as React from 'react';
import { FormSelect, FormSelectOption, Button, ButtonVariant } from '@patternfly/react-core';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { VMSettingsField } from '../../types';
import { getPlaceholder } from '../../utils/renderable-field-utils';
import { iGet } from '../../../../utils/immutable';

const ProvisionSourceDiskHelpMsg: React.FC<ProvisionSourceDiskHelpMsgProps> = ({
  provisionSourceValue,
  goToStorageStep,
}) => {
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
  const getStorageMsg = React.useCallback(() => {
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
  }, [provisionSourceValue, storageBtn]);

  return (
    <div className="pf-c-form__helper-text" aria-live="polite">
      {getStorageMsg()}
    </div>
  );
};

const ProvisionSourceNetHelpMsg: React.FC<ProvisionSourceNetHelpMsgProps> = ({
  goToNetworkingStep,
}) => {
  const networkBtn = (
    <Button
      isDisabled={!goToNetworkingStep}
      isInline
      onClick={goToNetworkingStep}
      variant={ButtonVariant.link}
    >
      <strong>Networking</strong>
    </Button>
  );

  return (
    <div className="pf-c-form__helper-text" aria-live="polite">
      Add a network interface in the {networkBtn} step
    </div>
  );
};

export const ProvisionSourceComponent: React.FC<ProvisionSourceComponentProps> = React.memo(
  ({ provisionSourceField, onChange, goToStorageStep, goToNetworkingStep }) => {
    const provisionSourceValue = iGetFieldValue(provisionSourceField);
    const sources = iGet(provisionSourceField, 'sources');

    return (
      <FormFieldRow field={provisionSourceField} fieldType={FormFieldType.SELECT}>
        <FormField>
          <FormSelect onChange={(v) => onChange(VMSettingsField.PROVISION_SOURCE_TYPE, v)}>
            <FormSelectPlaceholderOption
              placeholder={getPlaceholder(VMSettingsField.PROVISION_SOURCE_TYPE)}
              isDisabled={!!provisionSourceValue}
            />
            {(sources || []).map((source) => (
              <FormSelectOption key={source} value={source} label={source} />
            ))}
          </FormSelect>
        </FormField>
        {[
          ProvisionSource.URL.toString(),
          ProvisionSource.CONTAINER.toString(),
          ProvisionSource.DISK.toString(),
        ].includes(provisionSourceValue) && (
          <ProvisionSourceDiskHelpMsg
            provisionSourceValue={provisionSourceValue}
            goToStorageStep={goToStorageStep}
          />
        )}
        {[ProvisionSource.PXE.toString()].includes(provisionSourceValue) && (
          <ProvisionSourceNetHelpMsg goToNetworkingStep={goToNetworkingStep} />
        )}
      </FormFieldRow>
    );
  },
);

type ProvisionSourceDiskHelpMsgProps = {
  provisionSourceValue: string;
  goToStorageStep: () => void;
};

type ProvisionSourceNetHelpMsgProps = {
  goToNetworkingStep: () => void;
};

type ProvisionSourceComponentProps = {
  provisionSourceField: any;
  onChange: (key: string, value: string | boolean) => void;
  goToStorageStep: () => void;
  goToNetworkingStep: () => void;
};
