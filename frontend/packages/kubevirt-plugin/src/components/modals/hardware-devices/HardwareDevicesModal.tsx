import * as React from 'react';
import { Grid } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { VMIWrapper } from 'packages/kubevirt-plugin/src/k8s/wrapper/vm/vmi-wrapper';
import { PatchBuilder } from '../../../k8s/helpers/patch';
import { getVMLikePatches } from '../../../k8s/patches/vm-template';
import { getVMLikeModel } from '../../../selectors/vm/vmlike';
import { V1GPU, V1HostDevice } from '../../../types/api';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { ModalPendingChangesAlert } from '../../Alerts/PendingChangesAlert';
import { ModalFooter } from '../modal/modal-footer';
import HardwareDeviceAddButton from './HardwareDeviceAddButton';
import HardwareDevicesEmptyState from './HardwareDevicesEmptyState';
import HardwareDevicesList from './HardwareDevicesList';
import HardwareDevicesListHeaders from './HardwareDevicesListHeaders';
import HardwareDevicesListRow from './HardwareDevicesListRow';

export type HardwareDevicesModalProps = {
  isGPU?: boolean;
  devices: V1GPU[] | V1HostDevice[];
  vmName: string;
  usedNames?: string[];
  vmLikeEntity: VMLikeEntityKind;
  isVMRunning: boolean;
  vmiWrapper?: VMIWrapper;
} & ModalComponentProps &
  HandlePromiseProps;

export const HardwareDevicesModal = withHandlePromise(
  ({
    isVMRunning,
    devices,
    isGPU,
    vmName,
    close,
    handlePromise,
    usedNames,
    vmLikeEntity,
    errorMessage,
    vmiWrapper,
  }: HardwareDevicesModalProps) => {
    // const  = props;
    const { t } = useTranslation();
    const [isAttachDevice, setIsAttachDevice] = React.useState<boolean>(false);
    const [name, setName] = React.useState<string>('');
    const [deviceName, setDeviceName] = React.useState<string>('');
    const [updatedDevices, setUpdatedDevices] = React.useState<V1GPU[] | V1HostDevice[]>(devices);
    const [isBlur, setIsBlur] = React.useState<boolean>(false);
    const [showPatchError, setPatchError] = React.useState<boolean>(false);

    const [updatedUsedNames, setUpdatedUsedNames] = React.useState<string[]>(usedNames);

    const isNameValid = name?.length > 0 && !updatedUsedNames?.includes(name);
    const isDeviceNameValid = deviceName?.length > 0;

    const isChanged = !_.isEqual(
      isGPU ? vmiWrapper.getGPUDevices() : vmiWrapper.getHostDevices(),
      updatedDevices,
    );

    React.useEffect(() => {
      if (isNameValid && isDeviceNameValid && isBlur) {
        // when user focus out of text input, and both name and deviceName are vaild
        const device: V1GPU | V1HostDevice = {
          name,
          deviceName,
        };
        setUpdatedDevices((prevState) => (prevState?.length ? [...prevState, device] : [device]));
        setUpdatedUsedNames((prevState) => (prevState?.length ? [...prevState, name] : [name]));
        setIsAttachDevice(false);
        setName('');
        setDeviceName('');
      }
    }, [isNameValid, isDeviceNameValid, isBlur, name, deviceName]);

    const onDetachHandler = (selectedName) => {
      setUpdatedUsedNames((prevState) => prevState?.filter((item) => item !== selectedName));
      setUpdatedDevices((prevState) => prevState?.filter((item) => item?.name !== selectedName));
    };

    const saveChanges = () => {
      const patchPath = isGPU
        ? '/spec/template/spec/domain/devices/gpus'
        : '/spec/template/spec/domain/devices/hostDevices';

      const patch = [new PatchBuilder(patchPath).replace(updatedDevices).build()];

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
        <ModalTitle>
          {isGPU ? t('kubevirt-plugin~GPU devices') : t('kubevirt-plugin~Host devices')}
        </ModalTitle>
        <ModalBody>
          {isVMRunning && <ModalPendingChangesAlert isChanged={isChanged} />}
          <Grid className="kv-labels-list__grid">
            {updatedDevices?.length > 0 || isAttachDevice ? (
              <>
                <HardwareDevicesListHeaders />
                <HardwareDevicesList devices={updatedDevices} onDetachHandler={onDetachHandler} />
                {isAttachDevice && (
                  <HardwareDevicesListRow
                    setDeviceName={setDeviceName}
                    deviceName={deviceName}
                    name={name}
                    setName={setName}
                    setIsAttachDevice={setIsAttachDevice}
                    isAttachDevice={isAttachDevice}
                    setIsBlur={setIsBlur}
                    isBlur={isBlur}
                    isNameEmpty={name?.length === 0}
                    isNameUsed={updatedUsedNames?.includes(name)}
                  />
                )}
              </>
            ) : (
              <HardwareDevicesEmptyState vmName={vmName} isGPU={isGPU} />
            )}
            <HardwareDeviceAddButton
              isDisabled={isAttachDevice}
              onClick={setIsAttachDevice}
              isGPU={isGPU}
            />
          </Grid>
        </ModalBody>
        <ModalFooter
          id="hardware-devices"
          onSubmit={onSubmit}
          onCancel={close}
          submitButtonText={t('kubevirt-plugin~Save')}
          errorMessage={showPatchError && errorMessage}
          isDisabled={(isAttachDevice && (!isNameValid || !isDeviceNameValid)) || showPatchError}
        />
      </div>
    );
  },
);

export const hardwareDevicesModal = createModalLauncher(HardwareDevicesModal);
