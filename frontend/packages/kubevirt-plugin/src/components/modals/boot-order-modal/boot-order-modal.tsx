import * as _ from 'lodash';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import {
  Firehose,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { createBasicLookup, getName, getNamespace } from '@console/shared';
import { PatchBuilder } from '@console/shared/src/k8s';
import { Button, ButtonVariant } from '@patternfly/react-core';

import { DeviceType } from '../../../constants';
import { getVMLikePatches } from '../../../k8s/patches/vm-template';
import { VMWrapper } from '../../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../../k8s/wrapper/vm/vmi-wrapper';
import { VirtualMachineInstanceModel } from '../../../models';
import {
  asVM,
  getBootableDevices,
  getBootableDevicesInOrder,
  getTransformedDevices,
  getVMLikeModel,
  isVMRunningOrExpectedRunning,
} from '../../../selectors/vm';
import { isBootOrderChanged } from '../../../selectors/vm-like/next-run-changes';
import { BootableDeviceType, VMIKind } from '../../../types';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { getLoadedData } from '../../../utils';
import { ModalPendingChangesAlert } from '../../Alerts/PendingChangesAlert';
import { BootOrder, deviceKey } from '../../boot-order';
import { ModalFooter } from '../modal/modal-footer';
import { saveAndRestartModal } from '../save-and-restart-modal/save-and-restart-modal';
import { kvReferenceForModel } from '../../../models/kvReferenceForModel';

const BootOrderModalComponent = withHandlePromise(
  ({
    vmLikeEntity,
    cancel,
    close,
    handlePromise,
    inProgress,
    errorMessage,
    vmi: vmiProp,
  }: BootOrderModalProps) => {
    const bootableDevices = getBootableDevices(vmLikeEntity);
    const { t } = useTranslation();
    const [devices, setDevices] = React.useState<BootableDeviceType[]>(bootableDevices);
    const [initialDeviceList, setInitialDeviceList] = React.useState<BootableDeviceType[]>(
      bootableDevices,
    );
    const [showUpdatedAlert, setUpdatedAlert] = React.useState<boolean>(false);
    const [showPatchError, setPatchError] = React.useState<boolean>(false);
    const vm = asVM(vmLikeEntity);
    const vmi = getLoadedData(vmiProp);
    const isVMRunning = isVMRunningOrExpectedRunning(vm, vmi);

    const onReload = React.useCallback(() => {
      const updatedDevices = bootableDevices;

      setInitialDeviceList(updatedDevices);
      setDevices(updatedDevices);
      setUpdatedAlert(false);
      setPatchError(false);
    }, [vmLikeEntity]); // eslint-disable-line react-hooks/exhaustive-deps

    const isChanged =
      isBootOrderChanged(new VMWrapper(vm), new VMIWrapper(vmi)) ||
      !_.isEqual(
        getBootableDevicesInOrder(vm, devices),
        getBootableDevicesInOrder(vm, bootableDevices),
      );

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
      const currentDevices = _.cloneDeep(getTransformedDevices(vmLikeEntity));
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

      handlePromise(
        promise,
        () => close(),
        () => setPatchError(true),
      );
    };

    // Send new bootOrder to k8s.
    const onSubmit = async (event) => {
      event.preventDefault();
      saveChanges();
    };

    return (
      <div className="modal-content">
        <ModalTitle>{t('kubevirt-plugin~Virtual machine boot order')}</ModalTitle>
        <ModalBody>
          {isVMRunning && <ModalPendingChangesAlert isChanged={isChanged} />}
          <BootOrder devices={devices} setDevices={setDevices} />
        </ModalBody>
        <ModalFooter
          errorMessage={showPatchError && errorMessage}
          inProgress={inProgress}
          isSaveAndRestart={isChanged && isVMRunning}
          onSubmit={onSubmit}
          onCancel={() => cancel()}
          submitButtonText={t('kubevirt-plugin~Save')}
          infoTitle={
            showUpdatedAlert && t('kubevirt-plugin~Boot order has been updated outside this flow.')
          }
          infoMessage={
            <Trans t={t} i18nKey="bootOrderModalInfoMessage" ns="kubevirt-plugin">
              Saving these changes will override any boot order previously saved.
              <br />
              To see the updated order{' '}
              <Button variant={ButtonVariant.link} isInline onClick={onReload}>
                reload the content
              </Button>
              .
            </Trans>
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
    vmi?: FirehoseResult<VMIKind>;
  };

const BootOrderModalFirehost = (props) => {
  const { vmLikeEntity } = props;
  const resources = [];

  resources.push({
    kind: kvReferenceForModel(VirtualMachineInstanceModel),
    namespace: getNamespace(vmLikeEntity),
    name: getName(vmLikeEntity),
    prop: 'vmi',
  });

  return (
    <Firehose resources={resources}>
      <BootOrderModalComponent {...props} />
    </Firehose>
  );
};

export const BootOrderModal = createModalLauncher(BootOrderModalFirehost);
