import type { FC, FormEvent } from 'react';
import { useCallback } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import type { K8sKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import type { OperatorHubKind } from '../operator-hub';

const DisableDefaultSourceModal: FC<DisableDefaultSourceModalProps> = ({
  kind,
  operatorHub,
  sourceName,
  close,
  cancel,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();
  const submit = useCallback(
    (event: FormEvent<EventTarget>): void => {
      event.preventDefault();
      const currentSources = _.get(operatorHub, 'spec.sources', []);
      const patch = [
        {
          op: 'add',
          path: '/spec/sources',
          value: [
            ..._.filter(currentSources, (source) => source.name !== sourceName),
            {
              name: sourceName,
              disabled: true,
            },
          ],
        },
      ];
      handlePromise(k8sPatch(kind, operatorHub, patch))
        .then(() => {
          close();
        })
        .catch(() => {});
    },
    [close, handlePromise, kind, operatorHub, sourceName],
  );

  return (
    <>
      <ModalHeader
        title={t('olm~Disable CatalogSource?')}
        titleIconVariant="warning"
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="disable-default-source-form" onSubmit={submit}>
          {t(
            'olm~By disabling a default source, the operators it provides will no longer appear in Software Catalog and any operator that has been installed from this source will no longer receive updates until the source is re-enabled. Disabling the source will also remove the corresponding OperatorSource and CatalogSource resources from the cluster.',
          )}
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="danger"
          onClick={submit}
          form="disable-default-source-form"
          isLoading={inProgress}
          isDisabled={inProgress}
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Disable')}
        </Button>
        <Button
          variant="link"
          onClick={cancel}
          isDisabled={inProgress}
          data-test-id="modal-cancel-action"
        >
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const DisableDefaultSourceModalOverlay: OverlayComponent<DisableDefaultSourceModalProps> = (
  props,
) => {
  return (
    <Modal variant={ModalVariant.small} isOpen onClose={props.closeOverlay}>
      <DisableDefaultSourceModal
        {...props}
        close={props.closeOverlay}
        cancel={props.closeOverlay}
      />
    </Modal>
  );
};

export type DisableDefaultSourceModalProps = {
  kind: K8sKind;
  operatorHub: OperatorHubKind;
  sourceName: string;
} & ModalComponentProps;
