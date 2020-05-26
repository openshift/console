import * as React from 'react';
import * as _ from 'lodash';
import { Form, Button, Tooltip, Text, TextVariants } from '@patternfly/react-core';
import {
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { ModalTitle, ModalBody, ModalComponentProps } from '@console/internal/components/factory';
import { PlusCircleIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { k8sPatch } from '@console/internal/module/k8s';
import { ModalFooter } from '../modal/modal-footer';
import { getCDsPatch } from '../../../k8s/patches/vm/vm-cdrom-patches';
import { getVMLikeModel, asVM, isWindows } from '../../../selectors/vm';
import { getCDRoms, isVMRunningOrExpectedRunning } from '../../../selectors/vm/selectors';
import { isValidationError, validateURL } from '../../../utils/validations/common';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { CDRomRow } from './cdrom-row';
import { getAvailableCDName, mapCDsToSource } from './helpers';
import { initialDisk, StorageType } from './constants';
import './cdrom-modal.scss';
import { CDMap } from './types';
import { VMKind } from '../../../types/vm';
import { useStorageClassConfigMap } from '../../../hooks/storage-class-config-map';
import { PendingChangesAlert } from '../../../selectors/vm-like/nextRunChanges';
import { confirmVMIModal } from '../menu-actions-modals/confirm-vmi-modal';
import { VMActionType, restartVM } from '../../../k8s/requests/vm/actions';
import { getActionMessage } from '../../vms/constants';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';

export const AddCDButton = ({
  className,
  text,
  onClick,
  isDisabled,
  isMaxCDsReached,
}: AddCDButtonProps) => (
  <div className={className}>
    <Button
      className="pf-m-link--align-left"
      id="vm-cd-add-btn"
      variant="link"
      onClick={onClick}
      isDisabled={isDisabled}
      icon={<PlusCircleIcon />}
    >
      {text}
    </Button>
    {isMaxCDsReached && (
      <Tooltip
        position="bottom"
        trigger="click mouseenter"
        entryDelay={0}
        exitDelay={0}
        content="You have reached the maximum amount of CD-ROM drives"
      >
        <OutlinedQuestionCircleIcon />
      </Tooltip>
    )}
  </div>
);

export const CDRomModal = withHandlePromise((props: CDRomModalProps) => {
  const {
    vmLikeEntity,
    handlePromise,
    inProgress: _inProgress,
    errorMessage,
    persistentVolumeClaims,
    storageClasses,
    winToolsContainer,
    cancel,
    close,
  } = props;
  const vm = asVM(vmLikeEntity);

  const [storageClassConfigMap, isStorageClassConfigMapLoaded] = useStorageClassConfigMap();
  const inProgress = _inProgress || !isStorageClassConfigMapLoaded;
  const { vmi } = React.useContext(VMDashboardContext);
  const isVMRunning = isVMRunningOrExpectedRunning(vm);

  const [cds, setCDs] = React.useState<CDMap>(mapCDsToSource(getCDRoms(vm), vm));
  const [shouldPatch, setShouldPatch] = React.useState<boolean>(false);

  const isMaxCDsReached = _.size(cds) > 1;
  const onCDChange = (cdName: string, key: string, value: string) => {
    setShouldPatch(true);
    const cd = { ...cds[cdName], [key]: value };
    if (key === StorageType.URL) {
      if (isValidationError(validateURL(value))) {
        cd.isURLValid = false;
      } else {
        cd.isURLValid = true;
      }
    }
    setCDs({ ...cds, [cdName]: cd });
  };

  const onCDAdd = () => {
    const name = getAvailableCDName(Object.values(cds));
    const newCD = {
      ...initialDisk,
      type: StorageType.CONTAINER,
      name,
      newCD: true,
    };
    setShouldPatch(true);
    setCDs({ ...cds, [name]: newCD });
  };

  const onCDDelete = (cdName: string) => {
    setShouldPatch(true);
    setCDs(_.omit(cds, cdName));
  };

  const saveChanges = () => {
    if (shouldPatch) {
      const promise = k8sPatch(
        getVMLikeModel(vmLikeEntity),
        vmLikeEntity,
        getCDsPatch(vmLikeEntity, Object.values(cds), storageClassConfigMap),
      );
      handlePromise(promise).then(close); // eslint-disable-line promise/catch-or-return
    } else {
      close();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    saveChanges();
  };

  const cdsValue = Object.values(cds);
  const windowsBool = isWindows(vm);
  const usedPVCs = cdsValue.map((cd) => cd.pvc);
  const isFormInvalid =
    !!cdsValue.find((vol) => !vol.isURLValid) ||
    !!cdsValue.find((cd) => cd.type === StorageType.PVC && !cd.pvc) ||
    !!cdsValue.find((cd) => cd.type === StorageType.URL && !cd.storageClass) ||
    !!cdsValue.find((cd) => cd.type === StorageType.WINTOOLS && !cd.windowsTools);

  return (
    <div className="modal-content">
      <ModalTitle>Edit CD-ROMs</ModalTitle>
      <ModalBody>
        {isVMRunning && <PendingChangesAlert />}
        <Form className="pf-l-grid pf-m-gutter">
          {_.size(cds) > 0 ? (
            cdsValue.map((cd, i) => (
              <CDRomRow
                key={`cd-row-${cd.name}`}
                cd={cd}
                pvcs={persistentVolumeClaims}
                usedPVCs={usedPVCs}
                storageClasses={storageClasses}
                winToolsContainer={winToolsContainer}
                index={i}
                isWindows={windowsBool}
                inProgress={inProgress}
                onChange={onCDChange}
                onDelete={onCDDelete}
              />
            ))
          ) : (
            <Text component={TextVariants.h4}>
              This virtual machine does not have any CD-ROMs attached.
            </Text>
          )}
          <AddCDButton
            className="kubevirt-add-cd-btn"
            text="Add CD-ROM"
            onClick={onCDAdd}
            isDisabled={inProgress || isMaxCDsReached}
            isMaxCDsReached={isMaxCDsReached}
          />
        </Form>
      </ModalBody>
      <ModalFooter
        id="cdrom"
        errorMessage={errorMessage}
        inProgress={inProgress}
        isDisabled={isFormInvalid || inProgress}
        isSaveAndRestart={isVMRunning}
        submitButtonText="Save"
        onSubmit={submit}
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
        onSaveAndRestart={() => {
          confirmVMIModal({
            vmi,
            title: 'Restart Virtual Machine',
            alertTitle: 'Restart Virtual Machine alert',
            message: getActionMessage(vm, VMActionType.Restart),
            btnText: _.capitalize(VMActionType.Restart),
            executeFn: () => {
              saveChanges();
              return restartVM(vm);
            },
            cancel: () => saveChanges(),
          });
        }}
      />
    </div>
  );
});

type AddCDButtonProps = {
  className: string;
  text: string;
  isDisabled: boolean;
  isMaxCDsReached: boolean;
  onClick: () => void;
};

type CDRomModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    persistentVolumeClaims?: FirehoseResult<VMKind[]>;
    storageClasses?: FirehoseResult<VMKind[]>;
    winToolsContainer: string;
  };
