import * as _ from 'lodash';
import * as React from 'react';
import { K8sKind, k8sPatch, K8sResourceKind, Patch } from '@console/internal/module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory/modal';
import { withHandlePromise } from '@console/internal/components/utils';
import {
  ConfigureUpdateStrategy,
  getNumberOrPercent,
} from '@console/internal/components/modals/configure-update-strategy-modal';

export const UpdateStrategyModal = withHandlePromise((props: UpdateStrategyModalProps) => {
  const {
    path,
    resource,
    resourceKind,
    title,
    handlePromise,
    errorMessage,
    inProgress,
    defaultValue,
    cancel,
    close,
  } = props;
  const getPath = path.substring(1).replace('/', '.');
  const [strategyType, setStrategyType] = React.useState(
    _.get(resource, `${getPath}.type`) || defaultValue,
  );
  const [maxUnavailable, setMaxUnavailable] = React.useState(
    _.get(resource, `${getPath}.rollingUpdate.maxUnavailable`, '25%'),
  );
  const [maxSurge, setMaxSurge] = React.useState(
    _.get(resource, `${getPath}.rollingUpdate.maxSurge`, '25%'),
  );

  const submit = (event) => {
    event.preventDefault();

    const patch: Patch = { path: `${path}/rollingUpdate`, op: 'remove' };
    if (strategyType === 'RollingUpdate') {
      patch.value = {
        maxUnavailable: getNumberOrPercent(maxUnavailable || '25%'),
        maxSurge: getNumberOrPercent(maxSurge || '25%'),
      };
      patch.op = 'add';
    }

    return handlePromise(
      k8sPatch(resourceKind, resource, [
        patch,
        { path: `${path}/type`, value: strategyType, op: 'replace' },
      ]),
    ).then(close, () => {});
  };

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
        submitText="Save"
        cancel={cancel}
      />
    </form>
  );
});

export const updateStrategyModal = createModalLauncher(UpdateStrategyModal);

UpdateStrategyModal.displayName = 'UpdateStrategyModal';

export type UpdateStrategyModalProps = {
  defaultValue: any;
  path: string;
  resource: K8sResourceKind;
  resourceKind: K8sKind;
  title: string;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};
