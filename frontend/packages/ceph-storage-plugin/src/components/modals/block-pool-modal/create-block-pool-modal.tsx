import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
} from '@console/internal/components/factory/modal';
import {
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils/promise-component';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';

import { BlockPoolModalFooter } from './modal-footer';
import { CephClusterKind, StoragePoolKind } from '../../../types';
import { CephBlockPoolModel } from '../../../models';
import { CEPH_STORAGE_NAMESPACE } from '../../../constants/index';
import { SECOND } from '../../../../integration-tests/utils/consts';
import { POOL_STATE, POOL_PROGRESS } from '../../../constants/storage-pool-const';
import {
  blockPoolReducer,
  blockPoolInitialState,
  BlockPoolActionType,
  getPoolKindObj,
  FooterPrimaryActions,
} from '../../../utils/block-pool';
import { BlockPoolBody, BlockPoolStatus } from '../../block-pool/body';

export const CreateBlockPoolModal = withHandlePromise((props: CreateBlockPoolModalProps) => {
  const { cephClusters, onPoolCreation, handlePromise, errorMessage } = props;
  const { t } = useTranslation();

  const [state, dispatch] = React.useReducer(blockPoolReducer, blockPoolInitialState);
  const [isSubmit, setIsSubmit] = React.useState(false);
  const [timer, setTimer] = React.useState<NodeJS.Timer>(null);

  const MODAL_DESC = t(
    'ceph-storage-plugin~A BlockPool is a logical entity providing elastic capacity to applications and workloads. Pools provide a means of supporting policies for access data resilience and storage efficiency.',
  );
  const MODAL_TITLE = t('ceph-storage-plugin~Create BlockPool');

  // Watch newly created pool after submit
  const poolResource: WatchK8sResource = React.useMemo(() => {
    return {
      kind: referenceForModel(CephBlockPoolModel),
      namespaced: true,
      isList: false,
      name: state.poolName,
      namespace: CEPH_STORAGE_NAMESPACE,
    };
  }, [state.poolName]);

  const [newPool, newPoolLoaded, newPoolLoadError] = useK8sWatchResource<StoragePoolKind>(
    poolResource,
  );

  React.useEffect(() => {
    if (isSubmit) {
      if (newPool && newPoolLoaded && newPool?.status?.phase === POOL_STATE.READY) {
        dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.CREATED });
        setIsSubmit(false);
        clearTimeout(timer);
        onPoolCreation(state.poolName);
      } else if (
        newPoolLoaded &&
        (newPool?.status?.phase === POOL_STATE.RECONCILE_FAILED ||
          newPool?.status?.phase === POOL_STATE.FAILURE)
      ) {
        dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.NOTREADY });
        setIsSubmit(false);
        clearTimeout(timer);
      } else if (newPoolLoaded && newPoolLoadError && newPoolLoadError?.response?.status !== 404) {
        dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.FAILED });
        setIsSubmit(false);
        clearTimeout(timer);
      }
    }
  }, [isSubmit, newPool, newPoolLoadError, newPoolLoaded, onPoolCreation, state.poolName, timer]);

  // Create new pool
  const createPool = () => {
    if (state.poolStatus === '') {
      dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.PROGRESS });
      const poolObj: StoragePoolKind = getPoolKindObj(state);

      handlePromise(
        k8sCreate(CephBlockPoolModel, poolObj),
        () => {
          setIsSubmit(true);
          // The modal will wait for 15 sec to get feedback from Rook
          const timeoutTimer = setTimeout(() => {
            dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.TIMEOUT });
            setIsSubmit(false);
          }, 30 * SECOND);
          setTimer(timeoutTimer);
        },
        () => {
          dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: POOL_PROGRESS.FAILED });
        },
      );
    }
  };

  return (
    <div className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{MODAL_TITLE}</ModalTitle>
      <ModalBody>
        <p>{MODAL_DESC}</p>
        {state.poolStatus ? (
          <div key="progress-modal">
            <BlockPoolStatus status={state.poolStatus} name={state.poolName} error={errorMessage} />
          </div>
        ) : (
          <BlockPoolBody
            cephCluster={cephClusters[0]}
            state={state}
            dispatch={dispatch}
            showPoolStatus
          />
        )}
      </ModalBody>
      <ModalFooter inProgress={state.poolStatus === POOL_PROGRESS.PROGRESS}>
        <BlockPoolModalFooter
          state={state}
          dispatch={dispatch}
          onSubmit={createPool}
          cancel={props.cancel}
          close={props.close}
          primaryAction={FooterPrimaryActions(t).CREATE}
        />
      </ModalFooter>
    </div>
  );
});

export type CreateBlockPoolModalProps = {
  cephClusters?: CephClusterKind[];
  onPoolCreation: (name: string) => void;
} & ModalComponentProps &
  HandlePromiseProps;

export const createBlockPoolModal = createModalLauncher(CreateBlockPoolModal);
