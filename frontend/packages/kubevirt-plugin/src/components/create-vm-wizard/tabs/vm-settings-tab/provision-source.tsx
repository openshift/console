import * as React from 'react';
import { Button, ButtonVariant, SelectOption, Text, TextContent } from '@patternfly/react-core';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { VMSettingsField } from '../../types';
import { iGet } from '../../../../utils/immutable';
import { FormPFSelect } from '../../../form/form-pf-select';

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
  const getStorageMsg = () => {
    switch (ProvisionSource.fromString(provisionSourceValue)) {
      case ProvisionSource.URL:
        return (
          <TextContent>
            <div className="pf-c-form__helper-text" aria-live="polite">
              Enter URL here or edit the mounted disk in the {storageBtn} step.
            </div>
            <div className="pf-c-form__helper-text" aria-live="polite">
              To boot this source from a CD-ROM edit the disk in the storage step and change to
              type: CD-ROM
            </div>
          </TextContent>
        );
      case ProvisionSource.CONTAINER:
        return (
          <Text>Enter container image here or edit the mounted disk in the {storageBtn} step.</Text>
        );
      case ProvisionSource.DISK:
        return <>Add a source disk in the {storageBtn} step</>;
      default:
        return null;
    }
  };

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
      <FormFieldRow field={provisionSourceField} fieldType={FormFieldType.PF_SELECT}>
        <FormField value={provisionSourceValue}>
          <FormPFSelect
            onSelect={(e, v) => {
              onChange(VMSettingsField.PROVISION_SOURCE_TYPE, v.toString());
            }}
          >
            {(sources || [])
              .map(ProvisionSource.fromString)
              .sort((a, b) => a.getOrder() - b.getOrder())
              .map((source) => (
                <SelectOption
                  key={source.getValue()}
                  value={source.getValue()}
                  description={source.getDescription()}
                >
                  {source.toString()}
                </SelectOption>
              ))}
          </FormPFSelect>
        </FormField>
        {[
          ProvisionSource.URL.getValue(),
          ProvisionSource.CONTAINER.getValue(),
          ProvisionSource.DISK.getValue(),
        ].includes(provisionSourceValue) && (
          <ProvisionSourceDiskHelpMsg
            provisionSourceValue={provisionSourceValue}
            goToStorageStep={goToStorageStep}
          />
        )}
        {[ProvisionSource.PXE.getValue()].includes(provisionSourceValue) && (
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
