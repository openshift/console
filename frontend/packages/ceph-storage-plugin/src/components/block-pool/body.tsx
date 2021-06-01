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
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { ListKind } from '@console/internal/module/k8s';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { useFlag } from '@console/shared/src/hooks/flag';

import { CephClusterKind, StorageClusterKind } from '../../types';
import { OCSServiceModel } from '../../models';
import { CEPH_STORAGE_NAMESPACE, OCS_DEVICE_REPLICA } from '../../constants/index';
import { checkArbiterCluster } from '../../utils/common';
import {
  PROGRESS_STATUS,
  ProgressStatusProps,
  BlockPoolState,
  BlockPoolAction,
  BlockPoolActionType,
  getErrorMessage,
} from '../../utils/block-pool';
import { POOL_STATE, POOL_PROGRESS } from '../../constants/storage-pool-const';

import { GUARDED_FEATURES } from '../../features';

import './body.scss';

export const BlockPoolStatus: React.FC<BlockPoolStatusProps> = ({ status, name, error = '' }) => {
  const { t } = useTranslation();
  const statusObj: ProgressStatusProps = PROGRESS_STATUS(t).find((state) => state.name === status);

  return (
    <>
      <EmptyState>
        <EmptyStateIcon icon={statusObj.icon} className={statusObj.className} />
        <EmptyStateBody data-test="empty-state-body">
          {error ? getErrorMessage(error) : statusObj.desc.replace('{name}', name)}
        </EmptyStateBody>
      </EmptyState>
    </>
  );
};

export type BlockPoolStatusProps = {
  status: string;
  name?: string;
  error?: string;
};

export const BlockPoolBody = (props: BlockPoolBodyPros) => {
  const { cephCluster, state, dispatch, showPoolStatus, isUpdate } = props;
  const { t } = useTranslation();

  const isPoolManagementSupported = useFlag(GUARDED_FEATURES.OCS_POOL_MANAGEMENT);
  const [storageCluster, storageClusterLoaded, storageClusterLoadError] = useK8sGet<
    ListKind<StorageClusterKind>
  >(OCSServiceModel, null, CEPH_STORAGE_NAMESPACE);

  const [isReplicaOpen, setReplicaOpen] = React.useState(false);
  const [isVolumeTypeOpen, setVolumeTypeOpen] = React.useState(false);
  const [availableDeviceClasses, setAvailableDeviceClasses] = React.useState([]);

  // Failure Domain
  React.useEffect(() => {
    if (storageClusterLoaded && !storageClusterLoadError)
      dispatch({
        type: BlockPoolActionType.SET_FAILURE_DOMAIN,
        payload: storageCluster.items[0].status?.failureDomain || '',
      });
  }, [storageCluster, storageClusterLoaded, storageClusterLoadError, dispatch]);

  // Volume Type
  const deviceClasses = cephCluster?.status?.storage?.deviceClasses ?? [];

  const setVolumeType = React.useCallback(
    (volumeType: string) =>
      dispatch({ type: BlockPoolActionType.SET_POOL_VOLUME_TYPE, payload: volumeType }),
    [dispatch],
  );

  React.useEffect(() => {
    if (deviceClasses.length && isPoolManagementSupported) {
      if (state.volumeType === '') {
        // Set default value
        const ssdDeviceClass =
          deviceClasses.find((deviceClass) => deviceClass.name === 'ssd') || {};
        Object.keys(ssdDeviceClass).length
          ? setVolumeType('ssd')
          : setVolumeType(deviceClasses[0].name);
      }

      // Volume Type dropdown
      setAvailableDeviceClasses(
        deviceClasses.map((device) => {
          return (
            <DropdownItem
              key={`device-${device?.name}`}
              component="button"
              id={device?.name}
              data-test={device?.name}
              onClick={(e) => setVolumeType(e.currentTarget.id)}
            >
              {device?.name.toUpperCase()}
            </DropdownItem>
          );
        }),
      );
    }
  }, [deviceClasses, dispatch, isPoolManagementSupported, setVolumeType, state.volumeType]);

  // Check storage cluster is in ready state
  const isClusterReady: boolean = cephCluster?.status?.phase === POOL_STATE.READY;

  // Check storage cluster is arbiter
  React.useEffect(() => {
    const isArbiterCluster: boolean = checkArbiterCluster(storageCluster?.items[0]);
    dispatch({ type: BlockPoolActionType.SET_POOL_ARBITER, payload: isArbiterCluster });
    if (isArbiterCluster) {
      dispatch({ type: BlockPoolActionType.SET_POOL_REPLICA_SIZE, payload: '4' });
    }
  }, [
    storageCluster,
    storageClusterLoaded,
    storageClusterLoadError,
    state.isArbiterCluster,
    dispatch,
  ]);

  const replicaList: string[] = _.keys(OCS_DEVICE_REPLICA).filter(
    (replica: string) =>
      (state.isArbiterCluster && replica === '4') || (!state.isArbiterCluster && replica !== '4'),
  );

  const replicaDropdownItems = replicaList.map((replica) => (
    <DropdownItem
      key={`replica-${OCS_DEVICE_REPLICA[replica]}`}
      component="button"
      id={replica}
      data-test-id={replica}
      onClick={(e) =>
        dispatch({ type: BlockPoolActionType.SET_POOL_REPLICA_SIZE, payload: e.currentTarget.id })
      }
    >
      {t('ceph-storage-plugin~{{replica}} Replication', { replica: OCS_DEVICE_REPLICA[replica] })}
    </DropdownItem>
  ));

  return (
    <>
      {isClusterReady || !showPoolStatus ? (
        <>
          <div className="form-group ceph-block-pool-body__input">
            <label className="control-label co-required" htmlFor="pool-name">
              {t('ceph-storage-plugin~Pool name')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={(e) =>
                dispatch({
                  type: BlockPoolActionType.SET_POOL_NAME,
                  payload: e.currentTarget.value,
                })
              }
              value={state.poolName}
              placeholder={t('ceph-storage-plugin~my-block-pool')}
              aria-describedby={t('ceph-storage-plugin~pool-name-help')}
              id="pool-name"
              name="newPoolName"
              data-test="new-pool-name-textbox"
              disabled={isUpdate}
              required
            />
          </div>
          <div className="form-group ceph-block-pool-body__input">
            <label className="control-label co-required" htmlFor="pool-replica-size">
              {t('ceph-storage-plugin~Data protection policy')}
            </label>
            <Dropdown
              className="dropdown dropdown--full-width"
              toggle={
                <DropdownToggle
                  id="replica-dropdown"
                  data-test="replica-dropdown"
                  onToggle={() => setReplicaOpen(!isReplicaOpen)}
                  toggleIndicator={CaretDownIcon}
                  isDisabled={state.isArbiterCluster}
                >
                  {state.replicaSize
                    ? t('ceph-storage-plugin~{{replica}} Replication', {
                        replica: OCS_DEVICE_REPLICA[state.replicaSize],
                      })
                    : t('ceph-storage-plugin~Select replication')}
                </DropdownToggle>
              }
              isOpen={isReplicaOpen}
              dropdownItems={replicaDropdownItems}
              onSelect={() => setReplicaOpen(false)}
              id="pool-replica-size"
            />
          </div>
          {isPoolManagementSupported && (
            <div className="form-group ceph-block-pool-body__input">
              <label className="control-label co-required" htmlFor="pool-volume-type">
                {t('ceph-storage-plugin~Volume type')}
              </label>
              <Dropdown
                className="dropdown dropdown--full-width"
                toggle={
                  <DropdownToggle
                    id="toggle-id"
                    data-test="volume-type-dropdown"
                    onToggle={() => setVolumeTypeOpen(!isVolumeTypeOpen)}
                    toggleIndicator={CaretDownIcon}
                    isDisabled={isUpdate}
                  >
                    {state.volumeType.toUpperCase() || t('ceph-storage-plugin~Select volume type')}
                  </DropdownToggle>
                }
                isOpen={isVolumeTypeOpen}
                dropdownItems={availableDeviceClasses}
                onSelect={() => setVolumeTypeOpen(false)}
                id="pool-volume-type"
              />
            </div>
          )}
          <div className="form-group ceph-block-pool-body__input">
            <label className="control-label" htmlFor="compression-check">
              {t('ceph-storage-plugin~Compression')}
            </label>
            <div className="checkbox">
              <label>
                <input
                  type="checkbox"
                  onChange={(event) =>
                    dispatch({
                      type: BlockPoolActionType.SET_POOL_COMPRESSED,
                      payload: event.target.checked,
                    })
                  }
                  checked={state.isCompressed}
                  name="compression-check"
                  data-test="compression-checkbox"
                />
                {t('ceph-storage-plugin~Enable compression')}
              </label>
            </div>
          </div>
          {state.isCompressed && (
            <Alert
              className="co-alert"
              variant="info"
              title={t(
                'ceph-storage-plugin~Enabling compression may result in little or no space savings for encrypted or random data. Also, enabling compression may have an impact on I/O performance.',
              )}
              isInline
            />
          )}
        </>
      ) : (
        <BlockPoolStatus status={POOL_PROGRESS.CLUSTERNOTREADY} />
      )}
    </>
  );
};

export type BlockPoolBodyPros = {
  cephCluster?: CephClusterKind;
  state: BlockPoolState;
  showPoolStatus: boolean;
  dispatch: React.Dispatch<BlockPoolAction>;
  isUpdate?: boolean;
};
