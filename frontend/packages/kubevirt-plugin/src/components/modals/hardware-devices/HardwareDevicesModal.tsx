import * as React from 'react';
import { Grid, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import {
  ExternalLink,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { useHyperconvergedCR } from '../../../hooks/use-hyperconverged-resource';
import { PatchBuilder } from '../../../k8s/helpers/patch';
import { getVMLikePatches } from '../../../k8s/patches/vm-template';
import { VMWrapper } from '../../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../../k8s/wrapper/vm/vmi-wrapper';
import { getVMLikeModel } from '../../../selectors/vm/vmlike';
import { V1GPU, V1HostDevice } from '../../../types/api';
import { ModalPendingChangesAlert } from '../../Alerts/PendingChangesAlert';
import HardwareDevicesList from '../../HardwareDevicesList/HardwareDevicesList';
import { ModalFooter } from '../modal/modal-footer';
import HWContext from './hardware-devices-context';

export const HARDWARE_DEVICES_DOCS_URL =
  'https://docs.openshift.com/container-platform/4.8/virt/virtual_machines/advanced_vm_management/virt-configuring-pci-passthrough.html';

export type HardwareDevicesModalProps = {
  isGPU?: boolean;
  isVMRunning: boolean;
  vmWrapper: VMWrapper;
  vmiWrapper: VMIWrapper;
} & ModalComponentProps &
  HandlePromiseProps;

export const HardwareDevicesModal = withHandlePromise(
  ({
    isVMRunning,
    isGPU,
    close,
    handlePromise,
    errorMessage,
    vmWrapper,
    vmiWrapper,
  }: HardwareDevicesModalProps) => {
    const { t } = useTranslation();
    const [hc, loaded, loadError] = useHyperconvergedCR();

    const [showAddDeviceRow, setShowAddDeviceRow] = React.useState<boolean>(false);
    const [name, setName] = React.useState<string>('');
    const [deviceName, setDeviceName] = React.useState<string>('');
    const [updatedDevices, setUpdatedDevices] = React.useState<V1GPU[] | V1HostDevice[]>(
      isGPU ? vmWrapper.getGPUDevices() : vmWrapper.getHostDevices(),
    );

    const [isBlur, setIsBlur] = React.useState<boolean>(false);
    const [showPatchError, setPatchError] = React.useState<boolean>(false);

    const [updatedUsedNames, setUpdatedUsedNames] = React.useState<string[]>(
      vmWrapper.getUsedHardwareDevicesNames(),
    );

    const isNameValid = name?.length > 0 && !updatedUsedNames?.includes(name);
    const isDeviceNameValid = deviceName?.length > 0;

    const isChanged = !isEqual(
      isGPU ? vmiWrapper.getGPUDevices() : vmiWrapper.getHostDevices(),
      updatedDevices,
    );

    const isUserForbidden = React.useMemo(() => !hc && !loaded && loadError?.code === 403, [
      hc,
      loaded,
      loadError,
    ]);

    React.useEffect(() => {
      if (isNameValid && isDeviceNameValid && isBlur) {
        // when user focus out of text input, and both name and deviceName are vaild
        const device: V1GPU | V1HostDevice = {
          name,
          deviceName,
        };
        setUpdatedDevices((prevState) => (prevState?.length ? [...prevState, device] : [device]));
        setUpdatedUsedNames((prevState) => (prevState?.length ? [...prevState, name] : [name]));
        setShowAddDeviceRow(false);
        setName('');
        setDeviceName('');
      }
    }, [isNameValid, isDeviceNameValid, isBlur, name, deviceName]);

    const onCancelAttachHandler = () => {
      setShowAddDeviceRow(false);
    };

    const onDetachHandler = (selectedName) => {
      setUpdatedUsedNames((prevState) => prevState?.filter((item) => item !== selectedName));
      setUpdatedDevices((prevState) => prevState?.filter((item) => item?.name !== selectedName));
    };

    const saveChanges = () => {
      const patchPath = isGPU
        ? '/spec/template/spec/domain/devices/gpus'
        : '/spec/template/spec/domain/devices/hostDevices';

      const patch = [new PatchBuilder(patchPath).replace(updatedDevices).build()];
      const vmLikeEntity = vmWrapper.asResource();

      const promise = k8sPatch(
        getVMLikeModel(vmLikeEntity),
        vmLikeEntity,
        getVMLikePatches(vmLikeEntity, () => patch),
      );

      handlePromise(
        promise,
        () => close(),
        () => setPatchError(true),
      );
    };

    const onSubmit = async (event) => {
      event.preventDefault();
      saveChanges();
    };

    return (
      <div className="modal-content">
        <HWContext.Provider
          value={{
            isBlur,
            isNameEmpty: name?.length === 0,
            isNameUsed: updatedUsedNames?.includes(name),
          }}
        >
          <ModalTitle>
            {isGPU ? t('kubevirt-plugin~GPU devices') : t('kubevirt-plugin~Host devices')}
          </ModalTitle>
          <ModalBody>
            {isVMRunning && <ModalPendingChangesAlert isChanged={isChanged} />}
            <Grid className="kv-labels-list__grid">
              <HardwareDevicesList
                devices={updatedDevices}
                onDetachHandler={onDetachHandler}
                onCancelAttachHandler={onCancelAttachHandler}
                showAddDeviceRow={showAddDeviceRow}
                onNameChange={setName}
                onValidateName={() => setIsBlur(true)}
                onResetValidateName={() => setIsBlur(false)}
                deviceName={deviceName}
                onDeviceNameChange={setDeviceName}
                onAttachHandler={() => setShowAddDeviceRow(true)}
                addDeviceText={
                  isGPU ? t('kubevirt-plugin~Add GPU device') : t('kubevirt-plugin~Add Host device')
                }
                noDevicesFoundText={
                  isGPU
                    ? t('kubevirt-plugin~No GPU devices found')
                    : t('kubevirt-plugin~No Host devices found')
                }
                isUserForbidden={isUserForbidden}
              />
            </Grid>
            {isUserForbidden && (
              <TextContent>
                <Text component={TextVariants.small}>
                  {t(
                    'kubevirt-plugin~Adding and removing hardware devices require permissions for Hyperconverged CRD. ',
                  )}
                  <ExternalLink
                    href={HARDWARE_DEVICES_DOCS_URL}
                    text={t('kubevirt-plugin~Learn more')}
                  />
                </Text>
              </TextContent>
            )}
          </ModalBody>
          <ModalFooter
            id="hardware-devices"
            onSubmit={onSubmit}
            onCancel={close}
            submitButtonText={t('kubevirt-plugin~Save')}
            errorMessage={showPatchError && errorMessage}
            isDisabled={
              (showAddDeviceRow && (!isNameValid || !isDeviceNameValid)) ||
              showPatchError ||
              isUserForbidden
            }
          />
        </HWContext.Provider>
      </div>
    );
  },
);

export const hardwareDevicesModal = createModalLauncher(HardwareDevicesModal);
