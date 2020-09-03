import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Form,
  FormSelect,
  FormSelectOption,
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

const getNetworkChoices = (nads: K8sResourceKind[], allowPodNetwork): NetworkWrapper[] => {
  const networkChoices = nads.map((nad) => {
    const networkName = getName(nad);
    return new NetworkWrapper().setType(NetworkType.MULTUS, {
      networkName,
    });
  });

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
  acceptEmptyValues,
}) => {
  const nadsLoading = !isLoaded(nads);
  const nadsLoadError = getLoadError(nads, NetworkAttachmentDefinitionModel);
  const networkChoices = getNetworkChoices(getLoadedData(nads, []), allowPodNetwork).filter((n) =>
    n.getType().isSupported(),
  );

  return (
    <FormRow
      title="Network"
      fieldId={id}
      isRequired
      isLoading={nadsLoading}
      validationMessage={nadsLoadError}
      validationType={nadsLoadError && ValidationErrorType.Error}
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
        isDisabled={isDisabled || nadsLoading || nadsLoadError}
      >
        <FormSelectPlaceholderOption
          isDisabled={!acceptEmptyValues}
          placeholder={
            networkChoices.length === 0
              ? '--- No Network Attachment Definitions available ---'
              : '--- Select Network Attachment Definition ---'
          }
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
            <FormSelect
              onChange={(networkInterfaceModel) =>
                setModel(NetworkInterfaceModel.fromString(networkInterfaceModel))
              }
              value={asFormSelectValue(model)}
              id={asId('model')}
              isDisabled={isDisabled('model') || interfaceType === NetworkInterfaceType.SRIOV}
            >
              <FormSelectPlaceholderOption isDisabled placeholder="--- Select Model ---" />
              {NetworkInterfaceModel.getAll()
                .filter((ifaceModel) => ifaceModel.isSupported() || ifaceModel === model)
                .map((ifaceModel) => {
                  return (
                    <FormSelectOption
                      key={ifaceModel.getValue()}
                      value={ifaceModel.getValue()}
                      label={ifaceModel.toString()}
                    />
                  );
                })}
            </FormSelect>
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
            acceptEmptyValues={editConfig?.acceptEmptyValuesOverride?.network}
          />
          <FormRow title="Type" fieldId={asId('type')} isRequired>
            <FormSelect
              onChange={onNetworkInterfaceChange}
              value={asFormSelectValue(interfaceType)}
              id={asId('type')}
              isDisabled={isDisabled('type')}
            >
              <FormSelectPlaceholderOption isDisabled placeholder="--- Select Type ---" />
              {(resultNetwork.getType()
                ? resultNetwork.getType().getAllowedInterfaceTypes()
                : NetworkType.getSupportedAllowedInterfaceTypes()
              ).map((iType) => (
                <FormSelectOption
                  key={iType.getValue()}
                  value={iType.getValue()}
                  label={iType.toString()}
                />
              ))}
            </FormSelect>
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
  editConfig?: UINetworkEditConfig;
  isVMRunning?: boolean;
} & ModalComponentProps &
  HandlePromiseProps;
