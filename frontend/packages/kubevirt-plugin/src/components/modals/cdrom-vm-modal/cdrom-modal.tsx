import * as React from 'react';
import * as _ from 'lodash';
import { Form, Button, Tooltip, Alert, Text, TextVariants } from '@patternfly/react-core';
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
import { getRemoveDiskPatches } from '../../../k8s/patches/vm/vm-disk-patches';
import { getVMLikeModel, asVM, isWindows } from '../../../selectors/vm';
import {
  getCDRoms,
  getContainerImageByDisk,
  getURLSourceByDisk,
  getPVCSourceByDisk,
  getStorageSizeByDisk,
  getStorageClassNameByDisk,
  isVMRunning,
} from '../../../selectors/vm/selectors';
import { isValidationError, validateURL } from '../../../utils/validations/common';
import { VMKind, VMLikeEntityKind } from '../../../types';
import { CDRomRow } from './cdrom-row';
import { initialDisk, WINTOOLS_CONTAINER_NAMES, StorageType, CD, CDMap } from './constants';
import './cdrom-modal.scss';

export const CDRomModal = withHandlePromise((props: CDRomModalProps) => {
  const {
    vmLikeEntity,
    handlePromise,
    inProgress,
    errorMessage,
    persistentVolumeClaims,
    storageClasses,
    winToolsContainer,
    cancel,
    close,
  } = props;
  const vm = asVM(vmLikeEntity);

  const mapCDsToSource = (cds) =>
    Object.assign(
      {},
      ...cds.map(({ name, cdrom, bootOrder }) => {
        let cd: CD = {
          ...initialDisk,
          name,
          cdrom,
          bootOrder,
          isInVM: true,
        };
        const container = getContainerImageByDisk(vm, name);
        if (container) {
          if (_.includes(WINTOOLS_CONTAINER_NAMES, container))
            cd = {
              ...cd,
              type: StorageType.WINTOOLS,
              windowsTools: container,
            };
          else {
            cd = { ...cd, type: StorageType.CONTAINER, container };
          }
        }

        const url = getURLSourceByDisk(vm, name);
        if (url) {
          const storageClass = getStorageClassNameByDisk(vm, name);
          const size = getStorageSizeByDisk(vm, cd.name).replace(/[^0-9]/g, '');
          cd = { ...cd, type: StorageType.URL, url, storageClass, size };
        }

        const pvc = getPVCSourceByDisk(vm, name);
        if (pvc) {
          cd = {
            ...cd,
            type: StorageType.PVC,
            pvc,
          };
        }
        return { [name]: cd };
      }),
    );

  const [cds, setCDs] = React.useState<CDMap>(mapCDsToSource(getCDRoms(vm)));
  const [showRestartAlert, setShowRestartAlert] = React.useState<boolean>(false);

  const onCDChange = (cdName: string, key: string, value: string) => {
    setShowRestartAlert(true);
    const cd = { ...cds[cdName], [key]: value, changed: true };
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
    let index = 1;
    let name = `cd-drive-${index}`;
    while (cds[name]) {
      index++;
      name = `cd-drive-${index}`;
    }
    const newCD = {
      ...initialDisk,
      type: StorageType.CONTAINER,
      name,
      isInVM: false,
      changed: true,
    };
    setShowRestartAlert(true);
    setCDs({ ...cds, [name]: newCD });
  };

  const onCDEject = (cdName: string) =>
    setCDs({ ...cds, [cdName]: { ...cds[cdName], ejected: true } });

  const onCDDelete = (cdName: string) => {
    if (cds[cdName].isInVM) {
      const patch = getRemoveDiskPatches(vmLikeEntity, cds[cdName]);
      const promise = k8sPatch(getVMLikeModel(vmLikeEntity), vmLikeEntity, patch);
      // eslint-disable-next-line promise/catch-or-return
      handlePromise(promise).then(() => {
        setCDs(_.omit(cds, cdName));
        setShowRestartAlert(true);
      });
    } else {
      setCDs(_.omit(cds, cdName));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (Object.values(cds).find((cd) => cd.changed)) {
      const patch = await getCDsPatch(vmLikeEntity, Object.values(cds));
      const promise = k8sPatch(getVMLikeModel(vmLikeEntity), vmLikeEntity, patch);
      handlePromise(promise).then(close); // eslint-disable-line promise/catch-or-return
    } else {
      close();
    }
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
        {showRestartAlert && isVMRunning(vm) && (
          <Alert
            variant="info"
            isInline
            title="Changes will be applied when the virtual machine has been restarted"
          />
        )}
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
                onEject={onCDEject}
              />
            ))
          ) : (
            <Text component={TextVariants.h4}>
              This virtual machine does not have any CD-ROMs attached.
            </Text>
          )}
          <div className="kubevirt-add-cd-btn">
            <Button
              className="pf-m-link--align-left"
              id="vm-cd-add-btn"
              variant="link"
              onClick={onCDAdd}
              isDisabled={_.size(cds) > 1}
              icon={<PlusCircleIcon />}
            >
              Add CD-ROM
            </Button>
            {_.size(cds) > 1 && (
              <Tooltip
                position="bottom"
                content="You have reached the maximum amount of CD-ROM drives"
              >
                <OutlinedQuestionCircleIcon />
              </Tooltip>
            )}
          </div>
        </Form>
      </ModalBody>
      <ModalFooter
        id="cdrom"
        errorMessage={errorMessage}
        inProgress={inProgress}
        isDisabled={isFormInvalid || inProgress}
        submitButtonText="Save"
        onSubmit={submit}
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
      />
    </div>
  );
});

type CDRomModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    persistentVolumeClaims?: FirehoseResult<VMKind[]>;
    storageClasses?: FirehoseResult<VMKind[]>;
    winToolsContainer: string;
  };
