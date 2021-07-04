import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import {
  ListKind,
  k8sKill,
  PersistentVolumeClaimKind,
  K8sKind,
} from '@console/internal/module/k8s';
import { useDeepCompareMemoize, YellowExclamationTriangleIcon } from '@console/shared';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
} from '@console/internal/components/factory/modal';
import { HandlePromiseProps } from '@console/internal/components/utils/promise-component';
import { withHandlePromise } from '@console/internal/components/utils';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { StorageClassModel, PersistentVolumeClaimModel } from '@console/internal/models';

import { BlockPoolModalFooter } from './modal-footer';
import { BlockPoolStatus } from '../../block-pool/body';
import { CephClusterKind, OcsStorageClassKind, StoragePoolKind } from '../../../types';
import { cephClusterResource } from '../../../resources';
import {
  blockPoolReducer,
  blockPoolInitialState,
  BlockPoolActionType,
  FooterPrimaryActions,
  isDefaultPool,
  getScNamesUsingPool,
} from '../../../utils/block-pool';
import { toList } from '../../../utils/common';
import { POOL_PROGRESS } from '../../../constants/storage-pool-const';
import { CephBlockPoolModel } from '../../../models';
import { CEPH_EXTERNAL_CR_NAME } from '../../../constants';
import { getStorageClassName } from '../../../selectors';

const DeleteBlockPoolModal = withHandlePromise((props: DeleteBlockPoolModalProps) => {
  const { t } = useTranslation();
  const { blockPoolConfig, cancel, close, handlePromise, inProgress } = props;
  const poolName = blockPoolConfig?.metadata.name;

  const [state, dispatch] = React.useReducer(blockPoolReducer, blockPoolInitialState);
  const [scNames, setScNames] = React.useState<React.ReactNode>();

  const [cephClusters, isLoaded, loadError] = useK8sWatchResource<CephClusterKind[]>(
    cephClusterResource,
  );
  const [scResources, scLoaded, scLoadError] = useK8sGet<ListKind<OcsStorageClassKind>>(
    StorageClassModel,
  );
  const [pvcResources, pvcLoaded, pvcLoadError] = useK8sGet<ListKind<PersistentVolumeClaimKind>>(
    PersistentVolumeClaimModel,
  );
  const cephCluster: CephClusterKind = useDeepCompareMemoize(cephClusters[0], true);

  React.useEffect(() => {
    // restrict pool management for default pool and external cluster
    cephCluster?.metadata.name === CEPH_EXTERNAL_CR_NAME || isDefaultPool(blockPoolConfig)
      ? dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.NOTALLOWED })
      : dispatch({
          type: BlockPoolActionType.SET_POOL_NAME,
          payload: poolName,
        });
  }, [blockPoolConfig, cephCluster, isLoaded, loadError, poolName]);

  React.useEffect(() => {
    if (scLoaded && pvcLoaded && state.poolStatus !== POOL_PROGRESS.NOTALLOWED) {
      const poolScNames: string[] = getScNamesUsingPool(scResources.items, poolName);
      const pvcScNames: string[] = pvcResources.items?.map(getStorageClassName);

      // intersection of scNames and pvcScNames
      const usedScNames = poolScNames.filter((scName) => pvcScNames.includes(scName));

      if (usedScNames.length) {
        dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.BOUNDED });
        setScNames(toList(usedScNames));
      }
    }
  }, [scResources, scLoaded, pvcResources, pvcLoaded, state.poolStatus, poolName, t]);

  // Delete block pool
  const deletePool = () => {
    handlePromise(k8sKill(CephBlockPoolModel, blockPoolConfig), () => close());
  };

  const MODAL_TITLE = t('ceph-storage-plugin~Delete BlockPool');

  return (
    <div className="modal-content modal-content--no-inner-scroll">
      <ModalTitle close={close}>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {MODAL_TITLE}
      </ModalTitle>
      {isLoaded && pvcLoaded && scLoaded && !(loadError && pvcLoadError && scLoadError) ? (
        <>
          <ModalBody>
            {state.poolStatus === POOL_PROGRESS.NOTALLOWED ? (
              <div key="progress-modal">
                <BlockPoolStatus
                  status={state.poolStatus}
                  name={state.poolName}
                  error={state.errorMessage}
                />
              </div>
            ) : state.poolStatus === POOL_PROGRESS.BOUNDED ? (
              <div>
                <Trans t={t} ns="ceph-storage-plugin">
                  <p data-test="pool-bound-message">
                    <strong>{{ poolName }}</strong> cannot be deleted. When a pool is bounded to PVC
                    it cannot be deleted. Please detach all the resources from StorageClass(es):
                  </p>
                </Trans>
                <strong>
                  <ul data-test="pool-storage-classes">{scNames}</ul>
                </strong>
              </div>
            ) : (
              <Trans t={t} ns="ceph-storage-plugin">
                <p>
                  Deleting <strong>{{ poolName }}</strong> will remove all the saved data of this
                  pool. Are you sure want to delete?
                </p>
              </Trans>
            )}
          </ModalBody>
          <ModalFooter inProgress={inProgress}>
            <BlockPoolModalFooter
              state={state}
              dispatch={dispatch}
              onSubmit={deletePool}
              cancel={cancel}
              close={close}
              primaryAction={FooterPrimaryActions(t).DELETE}
            />
          </ModalFooter>
        </>
      ) : (
        <StatusBox
          loaded={isLoaded && pvcLoaded && scLoaded}
          loadError={loadError ?? pvcLoadError ?? scLoadError}
          label={t('ceph-storage-plugin~BlockPool Delete Modal')}
        />
      )}
    </div>
  );
});

type DeleteBlockPoolModalProps = {
  kindObj?: K8sKind;
  blockPoolConfig: StoragePoolKind;
} & HandlePromiseProps &
  ModalComponentProps;

export const deleteBlockPoolModal = createModalLauncher(DeleteBlockPoolModal);
