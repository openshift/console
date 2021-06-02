import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory/modal';
import {
  ConfigureUpdateStrategy,
  getNumberOrPercent,
} from '@console/internal/components/modals/configure-update-strategy-modal';
import { K8sKind, k8sPatch, K8sResourceKind, Patch } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const UpdateStrategyModal: React.FC<UpdateStrategyModalProps> = ({
  cancel,
  close,
  path,
  defaultValue,
  resource,
  resourceKind,
  title,
}) => {
  const { t } = useTranslation();
  const getPath = path.substring(1).replace('/', '.');
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [strategyType, setStrategyType] = React.useState(
    _.get(resource, `${getPath}.type`) || defaultValue,
  );
  const [maxUnavailable, setMaxUnavailable] = React.useState(
    _.get(resource, `${getPath}.rollingUpdate.maxUnavailable`, '25%'),
  );
  const [maxSurge, setMaxSurge] = React.useState(
    _.get(resource, `${getPath}.rollingUpdate.maxSurge`, '25%'),
  );

  const submit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();

      const patch: Patch = { path: `${path}/rollingUpdate`, op: 'remove' };
      if (strategyType === 'RollingUpdate') {
        patch.value = {
          maxUnavailable: getNumberOrPercent(maxUnavailable || '25%'),
          maxSurge: getNumberOrPercent(maxSurge || '25%'),
        };
        patch.op = 'add';
      }
      handlePromise(
        k8sPatch(resourceKind, resource, [
          patch,
          { path: `${path}/type`, value: strategyType, op: 'replace' },
        ]),
      )
        .then(close)
        .catch(() => {});
    },
    [close, handlePromise, maxSurge, maxUnavailable, path, resource, resourceKind, strategyType],
  );

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{title}</ModalTitle>
      <ModalBody>
        <ConfigureUpdateStrategy
          strategyType={strategyType}
          maxUnavailable={maxUnavailable}
          maxSurge={maxSurge}
          onChangeStrategyType={setStrategyType}
          onChangeMaxUnavailable={setMaxUnavailable}
          onChangeMaxSurge={setMaxSurge}
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancel={cancel}
      />
    </form>
  );
};

export const updateStrategyModal = createModalLauncher(UpdateStrategyModal);

UpdateStrategyModal.displayName = 'UpdateStrategyModal';

export type UpdateStrategyModalProps = {
  defaultValue: any;
  path: string;
  resource: K8sResourceKind;
  resourceKind: K8sKind;
  title: string;
  cancel?: () => void;
  close?: () => void;
};
