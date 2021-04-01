import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useFlag } from '@console/shared/src/hooks/flag';
import { ActionGroup, Button } from '@patternfly/react-core';
import { ModalComponentProps } from '@console/internal/components/factory/modal';

import { GUARDED_FEATURES } from '../../../features';
import { POOL_PROGRESS } from '../../../constants/storage-pool-const';
import {
  BlockPoolAction,
  BlockPoolActionType,
  checkRequiredValues,
  BlockPoolState,
} from '../../../utils/block-pool';

export const BlockPoolModalFooter = (props: BlockPoolModalFooterProps) => {
  const {
    state,
    dispatch,
    onPoolCreation,
    onClick,
    actionLabel,
    closeLabel,
    cancel,
    close,
  } = props;
  const { t } = useTranslation();

  const isPoolManagementSupported = useFlag(GUARDED_FEATURES.OCS_POOL_MANAGEMENT);

  const handleTryAgainButton = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: '' });
  };

  const handleFinishButton = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    if (state.poolStatus === POOL_PROGRESS.CREATED) {
      onPoolCreation(state.poolName);
    }
    close();
  };

  return state.poolStatus ? (
    <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
      {state.poolStatus === POOL_PROGRESS.FAILED && (
        <Button
          type="button"
          variant="secondary"
          data-test="modal-try-again-action"
          onClick={handleTryAgainButton}
        >
          {t('ceph-storage-plugin~Try Again')}
        </Button>
      )}
      <Button
        type="submit"
        variant="primary"
        data-test="confirm-action"
        isDisabled={state.poolStatus === POOL_PROGRESS.PROGRESS}
        id="confirm-action"
        onClick={handleFinishButton}
      >
        {closeLabel}
      </Button>
    </ActionGroup>
  ) : (
    <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
      <Button type="button" variant="secondary" data-test-id="modal-cancel-action" onClick={cancel}>
        {t('ceph-storage-plugin~Cancel')}
      </Button>
      <Button
        type="button"
        variant="primary"
        data-test="modal-create-action"
        onClick={onClick}
        isDisabled={checkRequiredValues(
          state.poolName,
          state.replicaSize,
          state.volumeType,
          isPoolManagementSupported,
        )}
      >
        {actionLabel}
      </Button>
    </ActionGroup>
  );
};

type BlockPoolModalFooterProps = {
  state: BlockPoolState;
  dispatch: React.Dispatch<BlockPoolAction>;
  onClick: () => void;
  actionLabel: string;
  closeLabel: string;
  onPoolCreation?: (name: string) => void;
} & ModalComponentProps;
