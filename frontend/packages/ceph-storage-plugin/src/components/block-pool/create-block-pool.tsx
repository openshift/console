import * as React from 'react';
import { match as RouteMatch } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useDeepCompareMemoize } from '@console/shared';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { BreadCrumbs, history } from '@console/internal/components/utils';
import { Button } from '@patternfly/react-core';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { Modal } from '@console/shared/src/components/modal';

import { BlockPoolBody } from './body';
import { BlockPoolFooter } from './footer';
import { CephClusterKind, StoragePoolKind } from '../../types';
import { cephClusterResource } from '../../resources';
import { CEPH_EXTERNAL_CR_NAME } from '../../constants';
import { CephBlockPoolModel } from '../../models';
import {
  blockPoolReducer,
  blockPoolInitialState,
  BlockPoolActionType,
  getPoolKindObj,
  getErrorMessage,
} from '../../utils/block-pool';
import { POOL_STATE } from '../../constants/storage-pool-const';

import './create-block-pool.scss';

const CreateBlockPool: React.FC<CreateBlockPoolProps> = ({ match }) => {
  const {
    params: { appName },
    url,
  } = match;
  const { t } = useTranslation();

  const [state, dispatch] = React.useReducer(blockPoolReducer, blockPoolInitialState);
  const [cephClusters, isLoaded, loadError] = useK8sWatchResource<CephClusterKind[]>(
    cephClusterResource,
  );

  const cephCluster: CephClusterKind = useDeepCompareMemoize(cephClusters[0], true);

  const blockPoolPageUrl = url.replace('/~new', '');
  const pathName = appName || 'BlockPools';

  const onClose = () => {
    history.goBack();
  };

  // Create new pool
  const createPool = () => {
    if (cephCluster?.status?.phase === POOL_STATE.READY) {
      const poolObj: StoragePoolKind = getPoolKindObj(state);

      dispatch({ type: BlockPoolActionType.SET_INPROGRESS, payload: true });
      k8sCreate(CephBlockPoolModel, poolObj)
        .then(() => history.push(`${blockPoolPageUrl}/${state.poolName}`))
        .finally(() => dispatch({ type: BlockPoolActionType.SET_INPROGRESS, payload: false }))
        .catch((err) =>
          dispatch({
            type: BlockPoolActionType.SET_ERROR_MESSAGE,
            payload: getErrorMessage(err.message) || 'Could not create BlockPool.',
          }),
        );
    } else
      dispatch({
        type: BlockPoolActionType.SET_ERROR_MESSAGE,
        payload: t(
          "ceph-storage-plugin~OpenShift Container Storage's StorageCluster is not available. Try again after the StorageCluster is ready to use.",
        ),
      });
  };

  if (cephCluster?.metadata.name === CEPH_EXTERNAL_CR_NAME) {
    return (
      <Modal
        title={t('ceph-storage-plugin~Create BlockPool')}
        titleIconVariant="warning"
        isOpen
        onClose={onClose}
        variant="small"
        isFullScreen={false}
        actions={[
          <Button key="confirm" variant="primary" onClick={onClose}>
            {t('ceph-storage-plugin~Close')}
          </Button>,
        ]}
      >
        <strong>
          {t(
            "ceph-storage-plugin~Pool creation is not supported for OpenShift Data Foundation's external RHCS StorageSystem.",
          )}
        </strong>
      </Modal>
    );
  }

  return (
    <>
      <div className="co-create-operand__breadcrumbs">
        <BreadCrumbs
          breadcrumbs={[
            {
              name: pathName.startsWith('ocs-operator') ? 'Openshift Container Storage' : pathName,
              path: url.replace('/~new', ''),
            },
            {
              name: t('ceph-storage-plugin~Create BlockPool'),
              path: url,
            },
          ]}
        />
      </div>
      <div className="co-create-operand__header">
        <h1 className="co-create-operand__header-text">
          {t('ceph-storage-plugin~Create BlockPool')}
        </h1>
        <p className="help-block">
          {t(
            'ceph-storage-plugin~A BlockPool is a logical entity providing elastic capacity to applications and workloads. Pools provide a means of supporting policies for access data resilience and storage efficiency.',
          )}
        </p>
      </div>
      <div className="ceph-create-block-pool__form">
        {isLoaded && !loadError ? (
          <>
            <BlockPoolBody
              cephCluster={cephCluster}
              state={state}
              dispatch={dispatch}
              showPoolStatus={false}
            />
            <BlockPoolFooter state={state} cancel={onClose} onConfirm={createPool} />
          </>
        ) : (
          <StatusBox
            loadError={loadError}
            loaded={isLoaded}
            label={t('ceph-storage-plugin~BlockPool Creation Form')}
          />
        )}
      </div>
    </>
  );
};

type CreateBlockPoolProps = {
  match: RouteMatch<{ ns: string; appName: string }>;
};

export default CreateBlockPool;
