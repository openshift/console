import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Form,
  FormSelect,
  FormSelectOption,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ModalBody, ModalComponentProps, ModalTitle } from '@console/internal/components/factory';
import {
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { getName, ValidationErrorType } from '@console/shared';
import {
  NetworkInterfaceModel,
  NetworkInterfaceType,
  NetworkType,
} from '../../../constants/vm/network';
import { useShowErrorToggler } from '../../../hooks/use-show-error-toggler';
import { NetworkInterfaceWrapper } from '../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../k8s/wrapper/vm/network-wrapper';
import { UINetworkEditConfig } from '../../../types/ui/nic';
import { getLoadedData, getLoadError, isLoaded, prefixedID } from '../../../utils';
import { ignoreCaseSort } from '../../../utils/sort';
import { getDialogUIError, getSequenceName } from '../../../utils/strings';
import { isFieldDisabled } from '../../../utils/ui/edit-config';
import { isValidationError } from '../../../utils/validations/common';
import { validateNIC } from '../../../utils/validations/vm';
import { PendingChangesAlert } from '../../Alerts/PendingChangesAlert';
import { FormPFSelect } from '../../form/form-pf-select';
import { FormRow } from '../../form/form-row';
import {
  asFormSelectValue,
  FormSelectPlaceholderOption,
} from '../../form/form-select-placeholder-option';
import { ModalFooter } from '../modal/modal-footer';

const getNetworkChoices = (
  nads: K8sResourceKind[],
  allowPodNetwork,
  allowedMultusNetworkTypes?: string[],
): NetworkWrapper[] => {
  const networkChoices = nads
    .map((nad) => {
      const networkName = getName(nad);
      const type = JSON.parse(nad?.spec?.config)?.type;

      if (allowedMultusNetworkTypes && !allowedMultusNetworkTypes?.includes(type)) {
        return null;
      }

      return new NetworkWrapper().setType(NetworkType.MULTUS, {
        networkName,
      });
    })
    .filter((nad) => nad);

  if (allowPodNetwork) {
    networkChoices.push(new NetworkWrapper().setType(NetworkType.POD));
  }
  return networkChoices;
};

export type NetworkProps = {
  id: string;
  isDisabled: boolean;
  nads?: FirehoseResult;
  allowPodNetwork: boolean;
  allowedMultusNetworkTypes?: string[];
  network?: NetworkWrapper;
  onChange: (networkChoice: NetworkType, network: string) => void;
  acceptEmptyValues?: boolean;
};

export const Network: React.FC<NetworkProps> = ({
  id,
  isDisabled,
  network,
  onChange,
  nads,
  allowPodNetwork,
  allowedMultusNetworkTypes,
  acceptEmptyValues,
}) => {
  const { t } = useTranslation();
  const nadsLoading = !isLoaded(nads);
  const nadsLoadError = getLoadError(nads, NetworkAttachmentDefinitionModel);
  const networkChoices = getNetworkChoices(
    getLoadedData(nads, []),
    allowPodNetwork,
    allowedMultusNetworkTypes,
  ).filter((n) => n.getType().isSupported());
  const validationMessage = nadsLoadError
    ? t(
        'kubevirt-plugin~Error fetching available Network Attachment Definitions. Contact your system administrator for additional support.',
      )
    : networkChoices.length === 0
    ? t(
        'kubevirt-plugin~No Network Attachment Definitions available. Contact your system administrator for additional support.',
      )
    : null;
  const validationType =
    nadsLoadError || networkChoices.length === 0 ? ValidationErrorType.Error : null;

  return (
    <FormRow
      title={t('kubevirt-plugin~Network')}
      fieldId={id}
      isRequired
      isLoading={nadsLoading && !nadsLoadError}
      validationMessage={validationMessage}
      validationType={validationType}
      rawErrorMessage={nadsLoadError}
    >
      <FormSelect
        onChange={(net, event) => {
          const target = event.target as HTMLSelectElement;
          const newNetworkType = NetworkType.fromString(
            target[target.selectedIndex].getAttribute('data-network-type'),
          );
          onChange(newNetworkType, newNetworkType === NetworkType.MULTUS ? net : undefined);
        }}
        value={asFormSelectValue(network?.getReadableName())}
        id={id}
        isDisabled={isDisabled || nadsLoading || nadsLoadError || networkChoices.length === 0}
      >
        <FormSelectPlaceholderOption
          isDisabled={!acceptEmptyValues}
          placeholder={t('kubevirt-plugin~--- Select Network Attachment Definition ---')}
        />
        {ignoreCaseSort(networkChoices, undefined, (n) => n.getReadableName()).map(
          (networkWrapper: NetworkWrapper) => {
            const readableName = networkWrapper.getReadableName();
            return (
              <FormSelectOption
                key={readableName}
                data-network-type={networkWrapper.getType().getValue()}
                value={readableName}
                label={readableName}
              />
            );
          },
        )}
      </FormSelect>
    </FormRow>
  );
};

export const NICModal = withHandlePromise((props: NICModalProps) => {
  const {
    nads,
    showInitialValidation,
    isEditing,
    usedInterfacesNames,
    allowPodNetwork,
    allowedMultusNetworkTypes,
    onSubmit,
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
    editConfig,
    isVMRunning,
  } = props;
  const { t } = useTranslation();
  const isDisabled = (fieldName: string, disabled?: boolean) =>
    inProgress || disabled || isFieldDisabled(editConfig, fieldName);

  const asId = prefixedID.bind(null, 'nic');
  const nic = props.nic || new NetworkInterfaceWrapper();
  const network = props.network || new NetworkWrapper();

  const [name, setName] = React.useState<string>(
    nic.getName() || getSequenceName('nic', usedInterfacesNames),
  );
  const [model, setModel] = React.useState<NetworkInterfaceModel>(
    nic.getModel() || (isEditing ? null : NetworkInterfaceModel.VIRTIO),
  );
  const [networkType, setNetworkType] = React.useState<NetworkType>(network.getType());
  const [multusNetworkName, setMultusNetworkName] = React.useState<string>(
    network.getMultusNetworkName(),
  );
  const [interfaceType, setInterfaceType] = React.useState<NetworkInterfaceType>(nic.getType());
  const [macAddress, setMacAddress] = React.useState<string>(nic.getMACAddress() || '');

  const resultNIC = new NetworkInterfaceWrapper()
    .init({
      name,
      model,
      macAddress,
    })
    .setType(interfaceType);

  const resultNetwork = new NetworkWrapper()
    .init({
      name,
    })
    .setType(networkType, { networkName: multusNetworkName });

  const {
    validations: { name: nameValidation, macAddress: macAddressValidation },
    isValid,
    hasAllRequiredFilled,
  } = validateNIC(resultNIC, resultNetwork, {
    usedInterfacesNames,
    acceptEmptyNetwork: editConfig?.acceptEmptyValuesOverride?.network,
  });

  const [showUIError, setShowUIError] = useShowErrorToggler(
    !!showInitialValidation,
    isValid,
    isValid,
  );

  const onNetworkChoiceChange = (newType: NetworkType, newMultusNetworkName) => {
    if (newType === NetworkType.POD) {
      setMacAddress('');
    }

    if (!interfaceType || (newType && !newType.allowsInterfaceType(interfaceType))) {
      setInterfaceType(newType.getDefaultInterfaceType());
    }

    setNetworkType(newType);
    setMultusNetworkName(newMultusNetworkName);
  };

  const onNetworkInterfaceChange = (iType: string) => {
    if (iType === NetworkInterfaceType.SRIOV.toString()) {
      setModel(NetworkInterfaceModel.VIRTIO);
    }

    setInterfaceType(NetworkInterfaceType.fromString(iType));
  };

  const submit = (e) => {
    e.preventDefault();

    if (isValid) {
      handlePromise(onSubmit(resultNIC, resultNetwork), close);
    } else {
      setShowUIError(true);
    }
  };

  return (
    <div className="modal-content">
      <ModalTitle>
        {isEditing ? t('kubevirt-plugin~Edit') : t('kubevirt-plugin~Add')}{' '}
        {t('kubevirt-plugin~Network Interface')}
      </ModalTitle>
      <ModalBody>
        {isVMRunning && (
          <PendingChangesAlert
            warningMsg={t(
              'kubevirt-plugin~The changes you are making require this virtual machine to be updated. Restart this VM to apply these changes.',
            )}
          />
        )}
        <Form>
          {editConfig?.warning && (
            <Alert variant={AlertVariant.warning} isInline title={editConfig?.warning} />
          )}
          <FormRow
            title={t('kubevirt-plugin~Name')}
            fieldId={asId('name')}
            isRequired
            isLoading={!usedInterfacesNames}
            validation={nameValidation}
          >
            <TextInput
              validated={!isValidationError(nameValidation) ? 'default' : 'error'}
              isDisabled={isDisabled('name', !usedInterfacesNames)}
              isRequired
              id={asId('name')}
              value={name}
              onChange={(v) => setName(v)}
            />
          </FormRow>
          <FormRow title={t('kubevirt-plugin~Model')} fieldId={asId('model')} isRequired>
            <FormPFSelect
              menuAppendTo={() => document.body}
              id={asId('model')}
              toggleId={asId('select-model')}
              placeholderText={t('kubevirt-plugin~--- Select Model ---')}
              isDisabled={isDisabled('model') || interfaceType === NetworkInterfaceType.SRIOV}
              selections={asFormSelectValue(model?.getValue())}
              onSelect={(e, v) => setModel(NetworkInterfaceModel.fromString(v.toString()))}
            >
              {NetworkInterfaceModel.getAll()
                .filter((ifaceModel) => ifaceModel.isSupported() || ifaceModel === model)
                .map((ifaceModel) => {
                  return (
                    <SelectOption
                      key={ifaceModel.getValue()}
                      value={ifaceModel.getValue()}
                      description={t(ifaceModel.getDescriptionKey())}
                    >
                      {t(ifaceModel.toString())}
                    </SelectOption>
                  );
                })}
            </FormPFSelect>
          </FormRow>
          <Network
            id={asId('network')}
            isDisabled={isDisabled('network')}
            network={resultNetwork}
            onChange={onNetworkChoiceChange}
            nads={nads}
            allowPodNetwork={
              editConfig?.allowPodNetworkOverride != null
                ? editConfig?.allowPodNetworkOverride
                : allowPodNetwork
            }
            allowedMultusNetworkTypes={
              editConfig?.allowedMultusNetworkTypes != null
                ? editConfig?.allowedMultusNetworkTypes
                : allowedMultusNetworkTypes
            }
            acceptEmptyValues={editConfig?.acceptEmptyValuesOverride?.network}
          />
          <FormRow title={t('kubevirt-plugin~Type')} fieldId={asId('type')} isRequired>
            <FormPFSelect
              menuAppendTo={() => document.body}
              onSelect={(e, v) => onNetworkInterfaceChange(v.toString())}
              id={asId('type')}
              placeholderText={t('kubevirt-plugin~--- Select Type ---')}
              selections={asFormSelectValue(interfaceType?.getValue())}
              isDisabled={isDisabled('type')}
              toggleId={asId('select-type')}
            >
              {(resultNetwork.getType()
                ? resultNetwork.getType().getAllowedInterfaceTypes()
                : NetworkType.getSupportedAllowedInterfaceTypes()
              ).map((iType) => (
                <SelectOption
                  key={iType.getValue()}
                  value={iType.getValue()}
                  description={t(iType.getDescriptionKey())}
                >
                  {t(iType.toString())}
                </SelectOption>
              ))}
            </FormPFSelect>
          </FormRow>
          <FormRow
            title={t('kubevirt-plugin~MAC Address')}
            fieldId={asId('mac-address')}
            validation={macAddressValidation}
          >
            <TextInput
              validated={!isValidationError(macAddressValidation) ? 'default' : 'error'}
              isDisabled={isDisabled('macAddress', resultNetwork.isPodNetwork())}
              id={asId('mac-address')}
              value={macAddress}
              onChange={(v) => setMacAddress(v)}
            />
          </FormRow>
        </Form>
      </ModalBody>
      <ModalFooter
        id="nic"
        submitButtonText={isEditing ? t('kubevirt-plugin~Save') : t('kubevirt-plugin~Add')}
        errorMessage={
          errorMessage ||
          (!isValid && showUIError ? getDialogUIError(hasAllRequiredFilled, t) : null)
        }
        isDisabled={inProgress}
        isSimpleError={showUIError}
        onSubmit={submit}
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
      />
    </div>
  );
});

export type NICModalProps = {
  showInitialValidation?: boolean;
  isEditing?: boolean;
  nic?: NetworkInterfaceWrapper;
  network?: NetworkWrapper;
  onSubmit: (networkInterface: NetworkInterfaceWrapper, network: NetworkWrapper) => Promise<any>;
  nads?: FirehoseResult;
  usedInterfacesNames: Set<string>;
  allowPodNetwork: boolean;
  allowedMultusNetworkTypes?: string[];
  editConfig?: UINetworkEditConfig;
  isVMRunning?: boolean;
} & ModalComponentProps &
  HandlePromiseProps;
