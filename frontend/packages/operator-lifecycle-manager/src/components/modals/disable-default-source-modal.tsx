import type { FC, FormEvent } from 'react';
import { useCallback } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { K8sKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import type { OperatorHubKind } from '../operator-hub';

const DisableDefaultSourceModal: FC<DisableDefaultSourceModalProps> = ({
  kind,
  operatorHub,
  sourceName,
  close,
  cancel,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation('olm');
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
        title={t('Disable CatalogSource?')}
        titleIconVariant="warning"
        data-test-id="modal-title"
        labelId="disable-default-source-modal-title"
      />
      <ModalBody>
        <Form id="disable-default-source-form" onSubmit={submit}>
          {t(
            'If you disable a default source, its Operators no longer display in the software catalog, and Operators that you installed from that source stop receiving updates until you enable the source again. Disabling the source also removes the corresponding OperatorSource and CatalogSource resources from the cluster.',
          )}
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="danger"
          form="disable-default-source-form"
          isLoading={inProgress}
          isDisabled={inProgress}
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('Disable')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const DisableDefaultSourceModalOverlay: OverlayComponent<DisableDefaultSourceModalProps> = (
  props,
) => (
  <Modal
    variant={ModalVariant.small}
    isOpen
    onClose={props.closeOverlay}
    aria-labelledby="disable-default-source-modal-title"
  >
    <DisableDefaultSourceModal {...props} close={props.closeOverlay} cancel={props.closeOverlay} />
  </Modal>
);

export type DisableDefaultSourceModalProps = {
  kind: K8sKind;
  operatorHub: OperatorHubKind;
  sourceName: string;
} & ModalComponentProps;
