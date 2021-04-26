import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';

import {
  Alert,
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
import { referenceForModel, apiVersionForModel, ListKind } from '@console/internal/module/k8s';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';

import { CephClusterKind, StoragePoolKind, StorageClusterKind } from '../../../types';
import { CephBlockPoolModel, OCSServiceModel } from '../../../models';
import { CEPH_STORAGE_NAMESPACE, OCS_DEVICE_REPLICA } from '../../../constants/index';
import { PROGRESS_STATUS } from '../../../utils/storage-pool';
import { SECOND } from '../../../../integration-tests/utils/consts';
import { checkArbiterCluster } from '../../../utils/common';
import {
  POOL_STATE,
  POOL_PROGRESS,
  COMPRESSION_ON,
  ROOK_MODEL,
} from '../../../constants/storage-pool-const';

import './storage-pool-modal.scss';

const PoolStatusComponent: React.FC<PoolStatusComponentProps> = ({ status, name, error = '' }) => {
  const { t } = useTranslation();

  const statusObj = PROGRESS_STATUS(t).find((state) => state.name === status);
  return (
    <>
      <EmptyState>
        <EmptyStateIcon icon={statusObj.icon} className={statusObj.className} />
        <EmptyStateBody data-test="empty-state-body">
          {error ? error.replace(ROOK_MODEL, 'Pool') : statusObj.desc.replace('{name}', name)}
        </EmptyStateBody>
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
  const { t } = useTranslation();

  const [newPoolName, setNewPoolName] = React.useState('sc-pool');
  const [isReplicaOpen, setReplicaOpen] = React.useState(false);
  const [replicaSize, setReplicaSize] = React.useState('');
  const [isCompressed, setCompression] = React.useState(false);
  const [poolStatus, setPoolStatus] = React.useState('');
  /* TODO: use reducer */
  const [isSubmit, setIsSubmit] = React.useState(false);
  const [timer, setTimer] = React.useState<NodeJS.Timer>(null);
  const [isArbiterCluster, setArbiterCluster] = React.useState(false);

  /* Not to be exposed for 4.6
  const [isPerfObjOpen, setPerfObjOpen] = React.useState(false);
  const [deviceClass, setdeviceClass] = React.useState(''); */

  const [storageCluster, storageClusterLoaded, storageClusterLoadError] = useK8sGet<
    ListKind<StorageClusterKind>
  >(OCSServiceModel, null, CEPH_STORAGE_NAMESPACE);

  const poolResource: WatchK8sResource = React.useMemo(() => {
    return {
      kind: referenceForModel(CephBlockPoolModel),
      namespaced: true,
      isList: false,
      name: newPoolName,
      namespace: CEPH_STORAGE_NAMESPACE,
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

  React.useEffect(() => {
    setArbiterCluster(checkArbiterCluster(storageCluster?.items[0]));
    if (isArbiterCluster) {
      setReplicaSize('4');
    }
  }, [storageCluster, storageClusterLoaded, storageClusterLoadError, isArbiterCluster]);

  const replicaList: string[] = _.keys(OCS_DEVICE_REPLICA).filter(
    (replica: string) =>
      (isArbiterCluster && replica === '4') || (!isArbiterCluster && replica !== '4'),
  );

  const replicaDropdownItems = replicaList.map((replica) => (
    <DropdownItem
      key={`replica-${OCS_DEVICE_REPLICA[replica]}`}
      component="button"
      id={replica}
      data-test-id={replica}
      onClick={(e) => setReplicaSize(e.currentTarget.id)}
    >
      {t('ceph-storage-plugin~{{replica}} Replication', { replica: OCS_DEVICE_REPLICA[replica] })}
    </DropdownItem>
  ));
  /* Not to be exposed for 4.6
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
  }); */

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
        // deviceClass: deviceClass || '',
        parameters: {
          compression_mode: isCompressed ? COMPRESSION_ON : '', // eslint-disable-line @typescript-eslint/camelcase
        },
        replicated: {
          size: Number(replicaSize),
        },
        failureDomain: storageCluster?.items[0]?.status?.failureDomain || '',
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
        }, 30 * SECOND);
        setTimer(timeoutTimer);
      },
      () => {
        setPoolStatus(POOL_PROGRESS.FAILED);
      },
    );
  };

  const MODAL_DESC = t(
    'ceph-storage-plugin~A Storage pool is a logical entity providing elastic capacity to applications and workloads. Pools provide a means of supporting policies for access data resilience and storage efficiency.',
  );

  const MODAL_TITLE = t('ceph-storage-plugin~Create New Storage Pool');

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
                {t('ceph-storage-plugin~Try Again')}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              data-test="confirm-action"
              isDisabled={poolStatus === POOL_PROGRESS.PROGRESS}
              id="confirm-action"
              onClick={handleFinishButton}
            >
              {t('ceph-storage-plugin~Finish')}
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
                {t('ceph-storage-plugin~Pool Name')}
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={(e) => setNewPoolName(e.currentTarget.value)}
                value={newPoolName}
                placeholder={t('ceph-storage-plugin~my-storage-pool')}
                aria-describedby={t('ceph-storage-plugin~pool-name-help')}
                id="pool-name"
                name="newPoolName"
                data-test="new-pool-name-textbox"
                required
              />
            </div>
            <div className="form-group ceph-storage-pool__input">
              <label className="control-label co-required" htmlFor="pool-replica-size">
                {t('ceph-storage-plugin~Data Protection Policy')}
              </label>
              <Dropdown
                className="dropdown dropdown--full-width"
                toggle={
                  <DropdownToggle
                    id="replica-dropdown"
                    data-test="replica-dropdown"
                    onToggle={() => setReplicaOpen(!isReplicaOpen)}
                    toggleIndicator={CaretDownIcon}
                    isDisabled={isArbiterCluster}
                  >
                    {replicaSize
                      ? t('ceph-storage-plugin~{{replica}} Replication', {
                          replica: OCS_DEVICE_REPLICA[replicaSize],
                        })
                      : t('ceph-storage-plugin~Select Replication')}
                  </DropdownToggle>
                }
                isOpen={isReplicaOpen}
                dropdownItems={replicaDropdownItems}
                onSelect={() => setReplicaOpen(false)}
                id="pool-replica-size"
              />
            </div>
            <div className="form-group ceph-storage-pool__input">
              <label className="control-label co-required" htmlFor="compression-check">
                {t('ceph-storage-plugin~Compression')}
              </label>
              <div className="checkbox">
                <label>
                  <input
                    type="checkbox"
                    onChange={(event) => setCompression(event.target.checked)}
                    checked={isCompressed}
                    name="compression-check"
                  />
                  {t('ceph-storage-plugin~Enable Compression')}
                </label>
              </div>
            </div>
            {isCompressed && (
              <Alert
                className="co-alert"
                variant="info"
                title={t(
                  'ceph-storage-plugin~Enabling compression may result in little or no space savings for encrypted or random data. Also, enabling compression may have an impact on I/O performance.',
                )}
                isInline
              />
            )}
            {/* Not to be exposed for 4.6
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
            )} */}
          </>
        ) : (
          <PoolStatusComponent status={POOL_PROGRESS.NOTREADY} />
        )}
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        submitText={t('ceph-storage-plugin~Create')}
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
