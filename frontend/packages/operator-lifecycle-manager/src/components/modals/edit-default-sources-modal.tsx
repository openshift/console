import type { FC, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import { k8sPatch } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { OperatorHubModel } from '../../models';
import type { OperatorHubKind } from '../operator-hub';

const EditDefaultSourcesModal: FC<EditDefaultSourcesModalProps> = ({
  cancel,
  close,
  operatorHub,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();
  // state to maintain user selection of toggle, maintained as an [] of {defaultCatalogSourceName: <booleanFlagForToggle>}
  const [userSelectedDefaultSourceToggleState, setUserSelectedDefaultSourceToggleState] = useState(
    (operatorHub.spec.sources ?? []).reduce(
      (acc, source) => ({
        ...acc,
        [source.name]: source.disabled,
      }),
      {},
    ),
  );

  const submit = useCallback(
    (event: FormEvent<EventTarget>): void => {
      event.preventDefault();
      const patch = [
        {
          op: 'replace',
          path: '/spec/sources',
          value: Object.keys(userSelectedDefaultSourceToggleState).map((name) => ({
            name,
            disabled: userSelectedDefaultSourceToggleState[name],
          })),
        },
      ];
      handlePromise(k8sPatch(OperatorHubModel, operatorHub, patch))
        .then(() => {
          close();
        })
        .catch(() => {});
    },
    [close, handlePromise, operatorHub, userSelectedDefaultSourceToggleState],
  );

  const onToggle = useCallback((sourceName, checked) => {
    setUserSelectedDefaultSourceToggleState((currState) => ({
      ...currState,
      [sourceName]: !checked,
    }));
  }, []);

  return (
    <>
      <ModalHeader
        title={t('olm~Edit default sources')}
        data-test-id="modal-title"
        labelId="edit-default-sources-modal-title"
      />
      <ModalBody>
        <Form id="edit-default-sources-form" onSubmit={submit}>
          <FormGroup
            fieldId="enabled-default-sources"
            label={t('olm~Enabled default sources')}
            role="group"
          >
            {operatorHub.status.sources
              .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
              .map((source) => {
                const checked = !userSelectedDefaultSourceToggleState[source.name];
                return (
                  <Checkbox
                    name={source.name}
                    key={source.name}
                    label={source.name}
                    id={source.name}
                    isChecked={checked}
                    onChange={(_event, isChecked) => onToggle(source.name, isChecked)}
                    data-test={`${source.name}__checkbox`}
                  />
                );
              })}
          </FormGroup>
          {Object.values(userSelectedDefaultSourceToggleState).includes(true) && (
            <Alert variant="warning" title={t('olm~Disable CatalogSource')} isInline>
              {t(
                'olm~By disabling a default source, the operators it provides will no longer appear in Software Catalog and any operator that has been installed from this source will no longer receive updates until the source is re-enabled. Disabling the source will also remove the corresponding OperatorSource and CatalogSource resources from the cluster.',
              )}
            </Alert>
          )}
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          form="edit-default-sources-form"
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

export const EditDefaultSourcesModalOverlay: OverlayComponent<EditDefaultSourcesModalProps> = (
  props,
) => {
  return (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={props.closeOverlay}
      aria-labelledby="edit-default-sources-modal-title"
    >
      <EditDefaultSourcesModal {...props} close={props.closeOverlay} cancel={props.closeOverlay} />
    </Modal>
  );
};

type EditDefaultSourcesModalProps = {
  operatorHub: OperatorHubKind;
} & ModalComponentProps;
