import * as React from 'react';
import { Button, ButtonVariant, SelectOption, Text } from '@patternfly/react-core';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { VMSettingsField } from '../../types';
import { iGet } from '../../../../utils/immutable';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { SELECT_PXE_NAD_ERROR, PXE_NAD_NOT_FOUND_INFO } from '../../strings/networking';
import { FormPFSelect } from '../../../form/form-pf-select';
import { EXAMPLE_CONTAINER, RHEL_IMAGE_LINK, FEDORA_IMAGE_LINK } from '../../../../utils/strings';

const ProvisionSourceDiskHelpMsg: React.FC<ProvisionSourceDiskHelpMsgProps> = ({
  provisionSourceValue,
  goToStorageStep,
}) => {
  const isUpstream = window.SERVER_FLAGS.branding === 'okd';
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
          <>
            <Text> Enter URL here or edit the mounted disk in the {storageBtn} step</Text>
            <Text>
              For example, you can obtain the download link for {isUpstream ? 'Fedora' : 'RHEL'}{' '}
              cloud image from{' '}
              <a
                href={isUpstream ? FEDORA_IMAGE_LINK : RHEL_IMAGE_LINK}
                rel="noopener noreferrer"
                target="_blank"
              >
                <strong>here</strong>
              </a>
            </Text>
          </>
        );
      case ProvisionSource.CONTAINER:
        return (
          <>
            <Text>
              Enter container image here or edit the mounted disk in the {storageBtn} step.
            </Text>
            <Text>Example: {EXAMPLE_CONTAINER}</Text>
          </>
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

export const ProvisionSourceComponentWithNamespace: React.FC<ProvisionSourceComponentProps> = React.memo(
  ({ provisionSourceField, onChange, goToStorageStep, goToNetworkingStep, activeNamespace }) => {
    const provisionSourceValue = iGetFieldValue(provisionSourceField);
    const sources = iGet(provisionSourceField, 'sources');

    const networkAttachmentDefinitionModelResource = {
      kind: referenceForModel(NetworkAttachmentDefinitionModel),
      isList: true,
      optional: true,
      namespace: activeNamespace,
    };
    const [nads, nadsLoaded] = useK8sWatchResource<K8sResourceKind[]>(
      networkAttachmentDefinitionModelResource,
    );
    const hasNADs = nadsLoaded && nads?.length > 0;

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
              .map((source) => {
                if (source.getValue() === 'PXE' && !hasNADs) {
                  return (
                    <SelectOption
                      key={source.getValue()}
                      value={SELECT_PXE_NAD_ERROR}
                      description={`${source.getDescription()}\n${PXE_NAD_NOT_FOUND_INFO}`}
                    >
                      {source.toString()}
                    </SelectOption>
                  );
                }

                return (
                  <SelectOption
                    key={source.getValue()}
                    value={source.getValue()}
                    description={source.getDescription()}
                  >
                    {source.toString()}
                  </SelectOption>
                );
              })}
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
  activeNamespace: string;
};

const mapStateToProps = (state: RootState): { activeNamespace: string } => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

export const ProvisionSourceComponent = connect(mapStateToProps)(
  ProvisionSourceComponentWithNamespace,
);
