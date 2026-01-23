import type { FC, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { Alert, Form, FormGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { Checkbox } from '@console/internal/components/checkbox';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { k8sPatch } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { OperatorHubModel } from '../../models';
import { OperatorHubKind } from '../operator-hub';

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
    <Form onSubmit={submit}>
      <div className="modal-content">
        <ModalTitle>{t('olm~Edit default sources')}</ModalTitle>
        <ModalBody>
          <FormGroup fieldId="enabled-default-sources" label={t('olm~Enabled default sources')}>
            {operatorHub.status.sources
              .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
              .map((source) => {
                const checked = !userSelectedDefaultSourceToggleState[source.name];
                return (
                  <Checkbox
                    name={source.name}
                    key={source.name}
                    label={source.name}
                    checked={checked}
                    onChange={({ currentTarget }) => onToggle(source.name, currentTarget.checked)}
                  />
                );
              })}
          </FormGroup>
          {Object.values(userSelectedDefaultSourceToggleState).includes(true) && (
            <Alert
              variant="warning"
              className="co-alert"
              title={t('olm~Disable CatalogSource')}
              isInline
            >
              <p>
                {t(
                  'olm~By disabling a default source, the operators it provides will no longer appear in Software Catalog and any operator that has been installed from this source will no longer receive updates until the source is re-enabled. Disabling the source will also remove the corresponding OperatorSource and CatalogSource resources from the cluster.',
                )}
              </p>
            </Alert>
          )}
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={inProgress}
          submitText={t('public~Save')}
          cancel={cancel}
        />
      </div>
    </Form>
  );
};

const EditDefaultSourcesModalProvider: OverlayComponent<EditDefaultSourcesModalProviderProps> = (
  props,
) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <EditDefaultSourcesModal
        operatorHub={props.operatorHub}
        close={props.closeOverlay}
        cancel={props.closeOverlay}
      />
    </ModalWrapper>
  );
};

type EditDefaultSourcesModalProviderProps = {
  operatorHub: OperatorHubKind;
};

type EditDefaultSourcesModalProps = {
  operatorHub: OperatorHubKind;
  close?: () => void;
  cancel?: () => void;
};

export default EditDefaultSourcesModalProvider;
