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
import {
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { ModalBody, ModalComponentProps, ModalTitle } from '@console/internal/components/factory';
import { getName, ValidationErrorType } from '@console/shared';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { getLoadedData, getLoadError, isLoaded, prefixedID } from '../../../utils';
import { validateNIC } from '../../../utils/validations/vm';
import { isValidationError } from '../../../utils/validations/common';
import { FormRow } from '../../form/form-row';
import { ignoreCaseSort } from '../../../utils/sort';
import {
  asFormSelectValue,
  FormSelectPlaceholderOption,
} from '../../form/form-select-placeholder-option';
import {
  NetworkInterfaceModel,
  NetworkInterfaceType,
  NetworkType,
} from '../../../constants/vm/network';
import { NetworkInterfaceWrapper } from '../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../k8s/wrapper/vm/network-wrapper';
import { ADD, EDIT, getDialogUIError, getSequenceName, SAVE } from '../../../utils/strings';
import { ModalFooter } from '../modal/modal-footer';
import { useShowErrorToggler } from '../../../hooks/use-show-error-toggler';
import { UINetworkEditConfig } from '../../../types/ui/nic';
import { isFieldDisabled } from '../../../utils/ui/edit-config';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PendingChangesAlert } from '../../Alerts/PendingChangesAlert';
import { MODAL_RESTART_IS_REQUIRED } from '../../../strings/vm/status';
import { FormPFSelect } from '../../form/form-pf-select';
import {
  SELECT_PXE_NAD_ERROR_INFO,
  SELECT_PXE_NAD_MISSING_INFO,
} from '../../create-vm-wizard/strings/networking';

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
  const nadsLoading = !isLoaded(nads);
  const nadsLoadError = getLoadError(nads, NetworkAttachmentDefinitionModel);
  const networkChoices = getNetworkChoices(
    getLoadedData(nads, []),
    allowPodNetwork,
    allowedMultusNetworkTypes,
  ).filter((n) => n.getType().isSupported());
  const validationMessage = nadsLoadError
    ? SELECT_PXE_NAD_ERROR_INFO
    : networkChoices.length === 0
    ? SELECT_PXE_NAD_MISSING_INFO
    : null;
  const validationType =
    nadsLoadError || networkChoices.length === 0 ? ValidationErrorType.Error : null;

  return (
    <FormRow
      title="Network"
      fieldId={id}
      isRequired
      isLoading={nadsLoading && !nadsLoadError}
      validationMessage={validationMessage}
      validationType={validationType}
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
          placeholder={'--- Select Network Attachment Definition ---'}
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
      <ModalTitle>{isEditing ? EDIT : ADD} Network Interface</ModalTitle>
      <ModalBody>
        {isVMRunning && <PendingChangesAlert warningMsg={MODAL_RESTART_IS_REQUIRED} />}
        <Form>
          {editConfig?.warning && (
            <Alert variant={AlertVariant.warning} isInline title={editConfig?.warning} />
          )}
          <FormRow
            title="Name"
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
          <FormRow title="Model" fieldId={asId('model')} isRequired>
            <FormPFSelect
              menuAppendTo={() => document.body}
              id={asId('model')}
              placeholderText="--- Select Model ---"
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
                      description={ifaceModel.getDescription()}
                    >
                      {ifaceModel.toString()}
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
          <FormRow title="Type" fieldId={asId('type')} isRequired>
            <FormPFSelect
              menuAppendTo={() => document.body}
              onSelect={(e, v) => onNetworkInterfaceChange(v.toString())}
              id={asId('type')}
              placeholderText="--- Select Type ---"
              selections={asFormSelectValue(interfaceType?.getValue())}
              isDisabled={isDisabled('type')}
            >
              {(resultNetwork.getType()
                ? resultNetwork.getType().getAllowedInterfaceTypes()
                : NetworkType.getSupportedAllowedInterfaceTypes()
              ).map((iType) => (
                <SelectOption
                  key={iType.getValue()}
                  value={iType.getValue()}
                  description={iType.getDescription()}
                >
                  {iType.toString()}
                </SelectOption>
              ))}
            </FormPFSelect>
          </FormRow>
          <FormRow
            title="MAC Address"
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
        submitButtonText={isEditing ? SAVE : ADD}
        errorMessage={
          errorMessage || (!isValid && showUIError ? getDialogUIError(hasAllRequiredFilled) : null)
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
