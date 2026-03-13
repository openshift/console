import type { FC, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import {
  ConfigureUpdateStrategy,
  getNumberOrPercent,
} from '@console/internal/components/modals/configure-update-strategy-modal';
import type { K8sKind, K8sResourceKind, Patch } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const UpdateStrategyModal: FC<UpdateStrategyModalProps> = ({
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
  const [strategyType, setStrategyType] = useState(
    _.get(resource, `${getPath}.type`) || defaultValue,
  );
  const [maxUnavailable, setMaxUnavailable] = useState(
    _.get(resource, `${getPath}.rollingUpdate.maxUnavailable`, '25%'),
  );
  const [maxSurge, setMaxSurge] = useState(
    _.get(resource, `${getPath}.rollingUpdate.maxSurge`, '25%'),
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
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
    <>
      <ModalHeader title={title} data-test-id="modal-title" labelId="update-strategy-modal-title" />
      <ModalBody>
        <Form id="update-strategy-form" onSubmit={submit}>
          <ConfigureUpdateStrategy
            strategyType={strategyType}
            maxUnavailable={maxUnavailable}
            maxSurge={maxSurge}
            onChangeStrategyType={setStrategyType}
            onChangeMaxUnavailable={setMaxUnavailable}
            onChangeMaxSurge={setMaxSurge}
          />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          form="update-strategy-form"
          isLoading={inProgress}
          isDisabled={inProgress}
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const UpdateStrategyModalOverlay: OverlayComponent<UpdateStrategyModalProps> = (props) => {
  return (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={props.closeOverlay}
      aria-labelledby="update-strategy-modal-title"
    >
      <UpdateStrategyModal {...props} close={props.closeOverlay} cancel={props.closeOverlay} />
    </Modal>
  );
};

UpdateStrategyModal.displayName = 'UpdateStrategyModal';

export type UpdateStrategyModalProps = {
  defaultValue: any;
  path: string;
  resource: K8sResourceKind;
  resourceKind: K8sKind;
  title: string;
} & ModalComponentProps;
