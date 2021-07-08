import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { useFlag } from '@console/shared/src/hooks/flag';
import { ActionGroup, Button, ButtonVariant, ButtonType } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';

import { GUARDED_FEATURES } from '../../../features';
import { POOL_PROGRESS } from '../../../constants/storage-pool-const';
import {
  BlockPoolAction,
  BlockPoolActionType,
  checkRequiredValues,
  BlockPoolState,
  FooterPrimaryActions,
} from '../../../utils/block-pool';

export const BlockPoolModalFooter = (props: BlockPoolModalFooterProps) => {
  const { state, dispatch, onSubmit, primaryAction, cancel, close } = props;
  const { t } = useTranslation();

  const isPoolManagementSupported = useFlag(GUARDED_FEATURES.OCS_POOL_MANAGEMENT);

  const handleFinishButton = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    close();
  };

  const footerButtonsFactory: FooterButtonFactory = {
    [POOL_PROGRESS.FAILED]: [
      {
        id: 'modal-try-again-action',
        label: t('ceph-storage-plugin~Try Again'),
        type: ButtonType.button,
        variant: ButtonVariant.secondary,
        onClick: () => {
          dispatch({ type: BlockPoolActionType.SET_POOL_STATUS, payload: '' });
        },
      },
      {
        id: 'modal-finish-action',
        label: t('ceph-storage-plugin~Finish'),
        type: ButtonType.submit,
        variant: ButtonVariant.primary,
        onClick: handleFinishButton,
      },
    ],
    [POOL_PROGRESS.NOTALLOWED]: [
      {
        id: 'modal-close-action',
        label: t('ceph-storage-plugin~Close'),
        type: ButtonType.submit,
        variant: ButtonVariant.primary,
        onClick: handleFinishButton,
      },
    ],
    [POOL_PROGRESS.BOUNDED]: [
      {
        id: 'modal-close-action',
        label: t('ceph-storage-plugin~Close'),
        type: ButtonType.button,
        variant: ButtonVariant.secondary,
        onClick: handleFinishButton,
      },
      {
        id: 'modal-go-to-pvc-list-action',
        label: t('ceph-storage-plugin~Go To Pvc List'),
        type: ButtonType.submit,
        variant: ButtonVariant.primary,
        onClick: () => {
          history.push('/k8s/all-namespaces/persistentvolumeclaims');
          close();
        },
      },
    ],
    [POOL_PROGRESS.CREATED]: [
      {
        id: 'modal-finish-action',
        label: t('ceph-storage-plugin~Finish'),
        type: ButtonType.submit,
        variant: ButtonVariant.primary,
        onClick: handleFinishButton,
        disable: state.poolStatus === POOL_PROGRESS.PROGRESS,
      },
    ],
    [POOL_PROGRESS.CLUSTERNOTREADY]: [
      {
        id: 'modal-finish-action',
        label: t('ceph-storage-plugin~Finish'),
        type: ButtonType.submit,
        variant: ButtonVariant.primary,
        onClick: handleFinishButton,
        disable: state.poolStatus === POOL_PROGRESS.PROGRESS,
      },
    ],
    [POOL_PROGRESS.PROGRESS]: [
      {
        id: 'modal-finish-action',
        label: t('ceph-storage-plugin~Finish'),
        type: ButtonType.submit,
        variant: ButtonVariant.primary,
        onClick: handleFinishButton,
        disable: state.poolStatus === POOL_PROGRESS.PROGRESS,
      },
    ],
    [POOL_PROGRESS.TIMEOUT]: [
      {
        id: 'modal-finish-action',
        label: t('ceph-storage-plugin~Finish'),
        type: ButtonType.submit,
        variant: ButtonVariant.primary,
        onClick: handleFinishButton,
        disable: state.poolStatus === POOL_PROGRESS.PROGRESS,
      },
    ],
    [POOL_PROGRESS.NOTREADY]: [
      {
        id: 'modal-finish-action',
        label: t('ceph-storage-plugin~Finish'),
        type: ButtonType.submit,
        variant: ButtonVariant.primary,
        onClick: handleFinishButton,
      },
    ],
    default: [
      {
        id: 'modal-cancel-action',
        label: t('ceph-storage-plugin~Cancel'),
        type: ButtonType.button,
        variant: ButtonVariant.secondary,
        onClick: cancel,
      },
      {
        id: 'confirm-action',
        label: t(`ceph-storage-plugin~${primaryAction}`),
        type: ButtonType.submit,
        variant:
          primaryAction === FooterPrimaryActions(t).DELETE
            ? ButtonVariant.danger
            : ButtonVariant.primary,
        onClick: onSubmit,
        disable:
          primaryAction !== FooterPrimaryActions(t).DELETE &&
          checkRequiredValues(
            state.poolName,
            state.replicaSize,
            state.volumeType,
            isPoolManagementSupported,
          ),
      },
    ],
  };

  return (
    <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
      {footerButtonsFactory[state.poolStatus || 'default'].map((buttonProp) => {
        return (
          <Button
            type={buttonProp.type}
            variant={buttonProp.variant}
            isDisabled={buttonProp.disable}
            id={buttonProp.id}
            data-test-id={buttonProp.id}
            onClick={buttonProp.onClick}
          >
            {buttonProp.label}
          </Button>
        );
      })}
    </ActionGroup>
  );
};

type BlockPoolModalFooterProps = {
  state: BlockPoolState;
  dispatch: React.Dispatch<BlockPoolAction>;
  primaryAction: string;
  onSubmit: () => void;
  cancel: () => void;
  close: () => void;
};

type ButtonProps = {
  id: string;
  label: string;
  type: ButtonType;
  variant: ButtonVariant;
  onClick: (e?: React.FormEvent<EventTarget>) => void;
  disable?: boolean;
};

type FooterButtonFactory = {
  [status in POOL_PROGRESS | 'default']?: ButtonProps[];
};
