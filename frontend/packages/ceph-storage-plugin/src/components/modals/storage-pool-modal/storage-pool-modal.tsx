import * as React from 'react';
import * as _ from 'lodash';

import {
  Switch,
  Dropdown,
  DropdownToggle,
  DropdownItem,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  ActionGroup,
  Button,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';

import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
  ModalFooter,
} from '@console/internal/components/factory/modal';
import {
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils/promise-component';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { referenceForModel, apiVersionForModel } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { CephClusterKind, StoragePoolKind } from '../../../types';
import { CephBlockPoolModel } from '../../../models';
import { CEPH_STORAGE_NAMESPACE, OCS_DEVICE_REPLICA } from '../../../constants/index';
import { PROGRESS_STATUS } from '../../../utils/storage-pool';
import { SECOND } from '../../../../integration-tests/utils/consts';
import {
  POOL_STATE,
  MODAL_TITLE,
  MODAL_DESC,
  POOL_PROGRESS,
  COMPRESSION_ON,
} from '../../../constants/storage-pool-const';

import './storage-pool-modal.scss';

const PoolStatusComponent: React.FC<PoolStatusComponentProps> = ({ status, name, error = '' }) => {
  const statusObj = PROGRESS_STATUS.find((state) => state.name === status);
  return (
    <>
      <EmptyState>
        <EmptyStateIcon icon={statusObj.icon} className={statusObj.className} />
        <EmptyStateBody>{error || statusObj.desc.replace('{name}', name)}</EmptyStateBody>
      </EmptyState>
    </>
  );
};

export const StoragePoolModal = withHandlePromise((props: StoragePoolModalProps) => {
  const {
    cephClusterObj,
    onPoolCreation,
    close,
    cancel,
    handlePromise,
    errorMessage,
    inProgress,
  } = props;
  const [newPoolName, setNewPoolName] = React.useState('sc-pool');
  const [isReplicaOpen, setReplicaOpen] = React.useState(false);
  const [isPerfObjOpen, setPerfObjOpen] = React.useState(false);
  const [replicaSize, setReplicaSize] = React.useState('');
  const [isCompressed, setCompression] = React.useState(false);
  const [deviceClass, setdeviceClass] = React.useState('');
  const [poolStatus, setPoolStatus] = React.useState('');
  /* TODO: use reducer */
  const [isSubmit, setIsSubmit] = React.useState(false);
  const [timer, setTimer] = React.useState<NodeJS.Timer>(null);

  const poolResource = React.useMemo(() => {
    return {
      kind: referenceForModel(CephBlockPoolModel),
      namespaced: true,
      isList: false,
      name: newPoolName,
    };
  }, [newPoolName]);

  const [newPool, newPoolLoaded, newPoolLoadError] = useK8sWatchResource<StoragePoolKind>(
    poolResource,
  );

  React.useEffect(() => {
    if (isSubmit) {
      if (newPool && newPoolLoaded && newPool?.status?.phase === POOL_STATE.READY) {
        setPoolStatus(POOL_PROGRESS.CREATED);
        setIsSubmit(false);
        clearTimeout(timer);
      } else if (newPoolLoaded && newPool?.status?.phase === POOL_STATE.FAILED) {
        setPoolStatus(POOL_PROGRESS.FAILED);
        setIsSubmit(false);
        clearTimeout(timer);
      } else if (newPoolLoaded && newPoolLoadError && newPoolLoadError?.response?.status !== 404) {
        setPoolStatus(POOL_PROGRESS.FAILED);
        setIsSubmit(false);
        clearTimeout(timer);
      }
    }
  }, [isSubmit, newPool, newPoolLoadError, newPoolLoaded, timer]);

  const replicaDropdownItems = _.keys(OCS_DEVICE_REPLICA).map((replica) => {
    return (
      <DropdownItem
        key={`replica-${OCS_DEVICE_REPLICA[replica]}`}
        component="button"
        id={replica}
        onClick={(e) => setReplicaSize(e.currentTarget.id)}
      >
        {`${OCS_DEVICE_REPLICA[replica]} Replication`}
      </DropdownItem>
    );
  });

  const availableDeviceClasses = cephClusterObj[0]?.status?.storage?.deviceClasses.map((device) => {
    return (
      <DropdownItem
        key={`device-${device?.name}`}
        component="button"
        id={device?.name}
        onClick={(e) => setdeviceClass(e.currentTarget.id)}
      >
        {device?.name}
      </DropdownItem>
    );
  });

  const handleFinishButton = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    if (poolStatus === POOL_PROGRESS.CREATED) {
      onPoolCreation(newPoolName);
    }
    close();
  };

  const handleTryAgainButton = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    setPoolStatus('');
  };

  const isClusterReady: boolean =
    !poolStatus && cephClusterObj[0]?.status?.phase === POOL_STATE.READY;

  const submit = (event: React.FormEvent<EventTarget>) => {
    setPoolStatus(POOL_PROGRESS.PROGRESS);
    event.preventDefault();
    const poolObj: StoragePoolKind = {
      apiVersion: apiVersionForModel(CephBlockPoolModel),
      kind: CephBlockPoolModel.kind,
      metadata: {
        name: newPoolName,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
      spec: {
        compressionMode: isCompressed ? COMPRESSION_ON : '',
        deviceClass: deviceClass || '',
        parameters: {
          compression_mode: isCompressed ? COMPRESSION_ON : '', // eslint-disable-line @typescript-eslint/camelcase
        },
        replicated: {
          size: Number(replicaSize),
        },
      },
    };

    handlePromise(
      k8sCreate(CephBlockPoolModel, poolObj),
      () => {
        setIsSubmit(true);
        // The modal will wait for 15 sec to get feedback from Rook
        const timeoutTimer = setTimeout(() => {
          setPoolStatus(POOL_PROGRESS.TIMEOUT);
          setIsSubmit(false);
        }, 15 * SECOND);
        setTimer(timeoutTimer);
      },
      () => {
        setPoolStatus(POOL_PROGRESS.FAILED);
      },
    );
  };

  if (poolStatus) {
    return (
      <div className="modal-content modal-content--no-inner-scroll" key="progress-modal">
        <ModalTitle>{MODAL_TITLE}</ModalTitle>
        <ModalBody>
          <p>{MODAL_DESC}</p>
          <PoolStatusComponent status={poolStatus} name={newPoolName} error={errorMessage} />
        </ModalBody>
        <ModalFooter inProgress={poolStatus === POOL_PROGRESS.PROGRESS}>
          <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
            {poolStatus === POOL_PROGRESS.FAILED && (
              <Button
                type="button"
                variant="secondary"
                data-test-id="modal-cancel-action"
                onClick={handleTryAgainButton}
              >
                Try Again
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              isDisabled={poolStatus === POOL_PROGRESS.PROGRESS}
              id="confirm-action"
              onClick={handleFinishButton}
            >
              Finish
            </Button>
          </ActionGroup>
        </ModalFooter>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="modal-content modal-content--no-inner-scroll"
      key="pool-form-modal"
    >
      <ModalTitle>{MODAL_TITLE}</ModalTitle>
      <ModalBody>
        <p>{MODAL_DESC}</p>
        {isClusterReady ? (
          <>
            <div className="form-group ceph-storage-pool__input">
              <label className="control-label co-required" htmlFor="pool-name">
                Pool Name
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={(e) => setNewPoolName(e.currentTarget.value)}
                value={newPoolName}
                placeholder="my-storage-pool"
                aria-describedby="pool-name-help"
                id="pool-name"
                name="newPoolName"
                required
              />
            </div>
            <div className="form-group ceph-storage-pool__input">
              <label className="control-label co-required" htmlFor="pool-replica-size">
                Data Protection Policy
              </label>
              <Dropdown
                className="dropdown dropdown--full-width"
                toggle={
                  <DropdownToggle
                    id="toggle-id"
                    onToggle={() => setReplicaOpen(!isReplicaOpen)}
                    toggleIndicator={CaretDownIcon}
                  >
                    {replicaSize
                      ? `${OCS_DEVICE_REPLICA[replicaSize]} Replication`
                      : 'Select Replication'}
                  </DropdownToggle>
                }
                isOpen={isReplicaOpen}
                dropdownItems={replicaDropdownItems}
                onSelect={() => setReplicaOpen(false)}
                id="pool-replica-size"
              />
            </div>
            <div className="form-group ceph-storage-pool__input">
              <label className="control-label co-required" htmlFor="compression-switch">
                Compression
              </label>
              <div>
                <Switch
                  className="ceph-storage-pool__switch"
                  id="compression-switch"
                  label="Enabled"
                  labelOff="Disabled"
                  isChecked={isCompressed}
                  onChange={setCompression}
                />
              </div>
            </div>
            {cephClusterObj[0]?.status?.storage?.deviceClasses && (
              <div className="form-group ceph-storage-pool__input">
                <label className="control-label co-required" htmlFor="pool-device-type">
                  Device Type
                </label>
                <Dropdown
                  className="dropdown dropdown--full-width"
                  toggle={
                    <DropdownToggle
                      id="toggle-id"
                      onToggle={() => setPerfObjOpen(!isPerfObjOpen)}
                      toggleIndicator={CaretDownIcon}
                    >
                      {deviceClass || 'Select device type'}
                    </DropdownToggle>
                  }
                  isOpen={isPerfObjOpen}
                  dropdownItems={availableDeviceClasses}
                  onSelect={() => setPerfObjOpen(false)}
                  id="pool-device-type"
                />
              </div>
            )}
          </>
        ) : (
          <PoolStatusComponent status={POOL_PROGRESS.NOTREADY} />
        )}
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        submitText="Create"
        cancel={cancel}
        submitDisabled={!newPoolName || !replicaSize}
      />
    </form>
  );
});

export type StoragePoolModalProps = {
  cephClusterObj?: CephClusterKind[];
  onPoolCreation: (name: string) => void;
} & HandlePromiseProps &
  ModalComponentProps;

type PoolStatusComponentProps = {
  status: string;
  name?: string;
  error?: string;
};

export const storagePoolModal = createModalLauncher(StoragePoolModal);
