import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useDeepCompareMemoize } from '@console/shared';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
} from '@console/internal/components/factory/modal';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { k8sPatch } from '@console/internal/module/k8s';
import { HandlePromiseProps } from '@console/internal/components/utils/promise-component';
import { withHandlePromise } from '@console/internal/components/utils';

import { BlockPoolModalFooter } from './modal-footer';
import { BlockPoolBody, BlockPoolStatus } from '../../block-pool/body';
import { CephClusterKind, StoragePoolKind } from '../../../types';
import { cephClusterResource } from '../../../resources';
import {
  blockPoolReducer,
  blockPoolInitialState,
  BlockPoolActionType,
  FooterPrimaryActions,
  isDefaultPool,
} from '../../../utils/block-pool';
import { POOL_PROGRESS, COMPRESSION_ON } from '../../../constants/storage-pool-const';
import { CephBlockPoolModel } from '../../../models';
import { CEPH_EXTERNAL_CR_NAME } from '../../../constants';

const UpdateBlockPoolModal = withHandlePromise((props: UpdateBlockPoolModalProps) => {
  const { t } = useTranslation();
  const { blockPoolConfig, cancel, close, handlePromise, inProgress } = props;

  const [state, dispatch] = React.useReducer(blockPoolReducer, blockPoolInitialState);
  const [cephClusters, isLoaded, loadError] = useK8sWatchResource<CephClusterKind[]>(
    cephClusterResource,
  );
  const cephCluster: CephClusterKind = useDeepCompareMemoize(cephClusters[0], true);

  const MODAL_TITLE = t('ceph-storage-plugin~Edit BlockPool');
  const MODAL_DESC = t(
    'ceph-storage-plugin~A BlockPool is a logical entity providing elastic capacity to applications and workloads. Pools provide a means of supporting policies for access data resilience and storage efficiency.',
  );

  const populateBlockPoolData = React.useCallback(
    (poolConfig: StoragePoolKind) => {
      dispatch({
        type: BlockPoolActionType.SET_POOL_NAME,
        payload: poolConfig?.metadata.name,
      });
      dispatch({
        type: BlockPoolActionType.SET_POOL_REPLICA_SIZE,
        payload: poolConfig?.spec.replicated.size.toString(),
      });
      dispatch({
        type: BlockPoolActionType.SET_POOL_COMPRESSED,
        payload: poolConfig?.spec.compressionMode === COMPRESSION_ON,
      });
      // Already existing pool may not have any deviceClass, Default is SSD
      poolConfig?.spec.deviceClass &&
        dispatch({
          type: BlockPoolActionType.SET_POOL_VOLUME_TYPE,
          payload: poolConfig?.spec.deviceClass,
        });
    },
    [dispatch],
  );

  React.useEffect(() => {
    // restrict pool management for default pool and external cluster
    cephCluster?.metadata.name === CEPH_EXTERNAL_CR_NAME || isDefaultPool(blockPoolConfig)
      ? dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.NOTALLOWED })
      : populateBlockPoolData(blockPoolConfig);
  }, [blockPoolConfig, cephCluster, populateBlockPoolData]);

  // Update block pool
  const updatePool = () => {
    const patch = [
      {
        op: 'replace',
        path: '/spec/replicated/size',
        value: Number(state.replicaSize),
      },
      {
        op: 'replace',
        path: '/spec/compressionMode',
        value: state.isCompressed ? COMPRESSION_ON : 'none',
      },
      {
        op: 'replace',
        path: '/spec/parameters/compression_mode',
        value: state.isCompressed ? COMPRESSION_ON : 'none',
      },
    ];

    handlePromise(k8sPatch(CephBlockPoolModel, blockPoolConfig, patch), () => close());
  };

  return (
    <div className="modal-content modal-content--no-inner-scroll">
      <ModalTitle close={close}>{MODAL_TITLE}</ModalTitle>
      {isLoaded && !loadError ? (
        <>
          <ModalBody>
            <p>{MODAL_DESC}</p>
            {state.poolStatus ? (
              <div key="progress-modal">
                <BlockPoolStatus
                  status={state.poolStatus}
                  name={state.poolName}
                  error={state.errorMessage}
                />
              </div>
            ) : (
              <BlockPoolBody
                cephCluster={cephCluster}
                state={state}
                dispatch={dispatch}
                showPoolStatus
                isUpdate
              />
            )}
          </ModalBody>
          <ModalFooter inProgress={inProgress}>
            <BlockPoolModalFooter
              state={state}
              dispatch={dispatch}
              onSubmit={updatePool}
              cancel={cancel}
              close={close}
              primaryAction={FooterPrimaryActions.UPDATE}
            />
          </ModalFooter>
        </>
      ) : (
        <StatusBox
          loadError={loadError}
          loaded={isLoaded}
          label={t('ceph-storage-plugin~BlockPool Update Form')}
        />
      )}
    </div>
  );
});

type UpdateBlockPoolModalProps = {
  kind?: string;
  blockPoolConfig: StoragePoolKind;
} & HandlePromiseProps &
  ModalComponentProps;

export const updateBlockPoolModal = createModalLauncher(UpdateBlockPoolModal);
