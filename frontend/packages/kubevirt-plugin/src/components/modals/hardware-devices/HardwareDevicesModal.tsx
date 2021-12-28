import * as React from 'react';
import { Grid, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';
import { ModalBody, ModalComponentProps, ModalTitle } from '@console/internal/components/factory';
import { ExternalLink, HandlePromiseProps } from '@console/internal/components/utils';
import { k8sPatch, TemplateKind } from '@console/internal/module/k8s';
import { useHyperconvergedCR } from '../../../hooks/use-hyperconverged-resource';
import { PatchBuilder } from '../../../k8s/helpers/patch';
import { getVMLikePatches } from '../../../k8s/patches/vm-template';
import { getVMLikeModel } from '../../../selectors/vm/vmlike';
import { VMKind } from '../../../types';
import { V1GPU, V1HostDevice } from '../../../types/api';
import { ModalPendingChangesAlert } from '../../Alerts/PendingChangesAlert';
import HardwareDevicesList from '../../HardwareDevicesList/HardwareDevicesList';
import { ModalFooter } from '../modal/modal-footer';
import HWContext from './hardware-devices-context';

export const HARDWARE_DEVICES_DOCS_URL =
  'https://docs.openshift.com/container-platform/4.8/virt/virtual_machines/advanced_vm_management/virt-configuring-pci-passthrough.html';

export type HardwareDevicesModalProps = {
  vmLikeEntity: VMKind | TemplateKind;
  patchPath: string;
  vmDevices: V1GPU[] | V1HostDevice[];
  vmiDevices?: V1GPU[] | V1HostDevice[];
  isVMRunning?: boolean;
  emptyState?: React.ReactNode;
  addDeviceText?: string;
  title?: string;
} & ModalComponentProps &
  HandlePromiseProps;

export const HardwareDevicesModal: React.FC<HardwareDevicesModalProps> = ({
  vmLikeEntity,
  patchPath,
  isVMRunning,
  close,
  handlePromise,
  errorMessage,
  vmiDevices,
  vmDevices,
  emptyState,
  addDeviceText,
  title,
}) => {
  const { t } = useTranslation();
  const [hc, loaded, loadError] = useHyperconvergedCR();

  const [showAddDeviceRow, setShowAddDeviceRow] = React.useState<boolean>(false);
  const [name, setName] = React.useState<string>('');
  const [deviceName, setDeviceName] = React.useState<string>('');
  const [updatedDevices, setUpdatedDevices] = React.useState<V1GPU[] | V1HostDevice[]>(vmDevices);

  const [isBlur, setIsBlur] = React.useState<boolean>(false);
  const [showPatchError, setPatchError] = React.useState<boolean>(false);

  const [updatedUsedNames, setUpdatedUsedNames] = React.useState<string[]>(
    vmDevices?.map((dev) => dev?.name),
  );

  const isNameValid = name?.length > 0 && !updatedUsedNames?.includes(name);
  const isDeviceNameValid = deviceName?.length > 0;

  const isChanged = vmiDevices && !isEqual(vmiDevices, updatedDevices);

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
      <HWContext.Provider
        value={{
          isBlur,
          isNameEmpty: name?.length === 0,
          isNameUsed: updatedUsedNames?.includes(name),
        }}
      >
        <ModalTitle>{title}</ModalTitle>
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
              addDeviceText={addDeviceText}
              emptyState={emptyState}
              isDisabled={isUserForbidden}
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
};
