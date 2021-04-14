import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useFlag } from '@console/shared/src/hooks/flag';
import { ButtonBar } from '@console/internal/components/utils';
import { ActionGroup, Button } from '@patternfly/react-core';

import { GUARDED_FEATURES } from '../../features';
import { checkRequiredValues, BlockPoolState } from '../../utils/block-pool';

import './create-block-pool.scss';

export const BlockPoolFooter = (props: BlockPoolFooterProps) => {
  const { state, cancel, onConfirm } = props;
  const { t } = useTranslation();

  const isPoolManagementSupported = useFlag(GUARDED_FEATURES.OCS_POOL_MANAGEMENT);

  return (
    <ButtonBar errorMessage={state.errorMessage} inProgress={state.inProgress}>
      <ActionGroup className="pf-c-form pf-c-form__actions--left">
        <Button
          type="button"
          variant="primary"
          data-test-id="confirm-action"
          onClick={onConfirm}
          isDisabled={checkRequiredValues(
            state.poolName,
            state.replicaSize,
            state.volumeType,
            isPoolManagementSupported,
          )}
        >
          {t('ceph-storage-plugin~Create')}
        </Button>
        <Button type="button" variant="secondary" data-test-id="cancel-action" onClick={cancel}>
          {t('ceph-storage-plugin~Cancel')}
        </Button>
      </ActionGroup>
    </ButtonBar>
  );
};

type BlockPoolFooterProps = {
  state: BlockPoolState;
  cancel: () => void;
  onConfirm: () => void;
};
