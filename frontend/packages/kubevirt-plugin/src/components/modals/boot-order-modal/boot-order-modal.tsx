import * as React from 'react';
import * as _ from 'lodash';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { getNamespace, createBasicLookup } from '@console/shared';
import {
  withHandlePromise,
  HandlePromiseProps,
  Firehose,
  FirehoseResult,
} from '@console/internal/components/utils';
import {
  ModalComponentProps,
  createModalLauncher,
  ModalTitle,
  ModalBody,
} from '@console/internal/components/factory';
import { k8sPatch } from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s';
import { BootableDeviceType, VMIKind } from '../../../types';
import { VMLikeEntityKind } from '../../../types/vmLike';
import {
  getVMLikeModel,
  getDevices,
  getBootableDevices,
  asVM,
  isVMRunningOrExpectedRunning,
} from '../../../selectors/vm';
import { getVMLikePatches } from '../../../k8s/patches/vm-template';
import { BootOrder, deviceKey } from '../../boot-order';
import { DeviceType } from '../../../constants';
import { ModalFooter } from '../modal/modal-footer';
import { PendingChangesAlert } from '../../Alerts/PendingChangesAlert';
import { VirtualMachineInstanceModel } from '../../../models';
import { getLoadedData } from '../../../utils';
import { saveAndRestartModal } from '../../../selectors/vm-like/nextRunChanges';

const BootOrderModalComponent = withHandlePromise(
  ({
    vmLikeEntity,
    cancel,
    close,
    handlePromise,
    inProgress,
    errorMessage,
    vmis,
  }: BootOrderModalProps) => {
    const [devices, setDevices] = React.useState<BootableDeviceType[]>(
      getBootableDevices(vmLikeEntity),
    );
    const [initialDeviceList, setInitialDeviceList] = React.useState<BootableDeviceType[]>(
      getBootableDevices(vmLikeEntity),
    );
    const [showUpdatedAlert, setUpdatedAlert] = React.useState<boolean>(false);
    const [showPatchError, setPatchError] = React.useState<boolean>(false);
    const vm = asVM(vmLikeEntity);
    const isVMRunning = isVMRunningOrExpectedRunning(vm);
    const loadedVMIs = getLoadedData(vmis);
    const vmi = loadedVMIs && loadedVMIs.length > 0 && loadedVMIs[0];

    const onReload = React.useCallback(() => {
      const updatedDevices = getBootableDevices(vmLikeEntity);

      setInitialDeviceList(updatedDevices);
      setDevices(updatedDevices);
      setUpdatedAlert(false);
      setPatchError(false);
    }, [vmLikeEntity]); // eslint-disable-line react-hooks/exhaustive-deps

    // Inform user on vmLikeEntity.
    React.useEffect(() => {
      // Compare only bootOrder from initialDeviceList to current device list.
      const devicesMap = createBasicLookup(getBootableDevices(vmLikeEntity), deviceKey);
      const updated =
        initialDeviceList.length &&
        initialDeviceList.some((d) => {
          // Find the initial device in the updated list.
          const device = devicesMap[deviceKey(d)];

          // If a device bootOrder changed, or it was deleted, set alert.
          return !device || device.value.bootOrder !== d.value.bootOrder;
        });

      setUpdatedAlert(updated);
    }, [vmLikeEntity]); // eslint-disable-line react-hooks/exhaustive-deps

    const saveChanges = () => {
      // Copy only bootOrder from devices to current device list.
      const currentDevices = _.cloneDeep(getDevices(vmLikeEntity));
      const devicesMap = createBasicLookup(currentDevices, deviceKey);
      devices.forEach((d) => {
        // Find the device to update.
        const device = devicesMap[deviceKey(d)];

        // Update device bootOrder.
        if (device && d.value.bootOrder) {
          device.value.bootOrder = d.value.bootOrder;
        }
        if (device && device.value.bootOrder && !d.value.bootOrder) {
          delete device.value.bootOrder;
        }
      });

      // Filter disks and interfaces from devices list.
      const disks = [
        ...currentDevices
          .filter((source) => source.type === DeviceType.DISK)
          .map((source) => source.value),
      ];

      const interfaces = [
        ...currentDevices
          .filter((source) => source.type === DeviceType.NIC)
          .map((source) => source.value),
      ];

      // Patch k8s.
      const patches = [
        new PatchBuilder('/spec/template/spec/domain/devices/disks').replace(disks).build(),
        new PatchBuilder('/spec/template/spec/domain/devices/interfaces')
          .replace(interfaces)
          .build(),
      ];
      const promise = k8sPatch(
        getVMLikeModel(vmLikeEntity),
        vmLikeEntity,
        getVMLikePatches(vmLikeEntity, () => patches),
      );

      handlePromise(promise)
        .then(() => close())
        .catch(() => setPatchError(true));
    };

    // Send new bootOrder to k8s.
    const onSubmit = async (event) => {
      event.preventDefault();
      saveChanges();
    };

    return (
      <div className="modal-content">
        <ModalTitle>Virtual machine boot order</ModalTitle>
        <ModalBody>
          <>
            {isVMRunning && <PendingChangesAlert />}
            <BootOrder devices={devices} setDevices={setDevices} />
          </>
        </ModalBody>
        <ModalFooter
          errorMessage={showPatchError && errorMessage}
          inProgress={inProgress}
          isSaveAndRestart={isVMRunningOrExpectedRunning(vm)}
          onSubmit={onSubmit}
          onCancel={() => cancel()}
          submitButtonText="Save"
          infoTitle={showUpdatedAlert && 'Boot order has been updated outside this flow.'}
          infoMessage={
            <>
              Saving these changes will override any boot order previously saved.
              <br />
              To see the updated order{' '}
              <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                reload the content
              </Button>
              .
            </>
          }
          onSaveAndRestart={() => saveAndRestartModal(vm, vmi, saveChanges)}
        />
      </div>
    );
  },
);

export type BootOrderModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    vmis?: FirehoseResult<VMIKind[]>;
  };

const BootOrderModalFirehost = (props) => {
  const { vmLikeEntity } = props;
  const resources = [];

  resources.push({
    kind: VirtualMachineInstanceModel.kind,
    namespace: getNamespace(vmLikeEntity),
    prop: 'vmis',
    isList: true,
  });

  return (
    <Firehose resources={resources}>
      <BootOrderModalComponent {...props} />
    </Firehose>
  );
};

export const BootOrderModal = createModalLauncher(BootOrderModalFirehost);
