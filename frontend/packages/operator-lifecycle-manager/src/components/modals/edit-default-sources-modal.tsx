import * as React from 'react';
import { Alert, Form, FormGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@console/internal/components/checkbox';
import {
  ModalTitle,
  ModalBody,
  createModalLauncher,
  ModalComponentProps,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { OperatorHubModel } from '../../models';
import { OperatorHubKind } from '../operator-hub';

const EditDefaultSourcesModal: React.FC<EditDefaultSourcesModalProps> = ({
  cancel,
  close,
  operatorHub,
  handlePromise,
  errorMessage,
}) => {
  const { t } = useTranslation();
  // state to maintain user selection of toggle, maintained as an [] of {defaultCatalogSourceName: <booleanFlagForToggle>}
  const [
    userSelectedDefaultSourceToggleState,
    setUserSelectedDefaultSourceToggleState,
  ] = React.useState(
    (operatorHub.spec.sources ?? []).reduce(
      (acc, source) => ({
        ...acc,
        [source.name]: source.disabled,
      }),
      {},
    ),
  );

  const submit = React.useCallback(
    (event: React.FormEvent<EventTarget>): void => {
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
      return handlePromise(k8sPatch(OperatorHubModel, operatorHub, patch), close);
    },
    [close, handlePromise, operatorHub, userSelectedDefaultSourceToggleState],
  );

  const onToggle = React.useCallback((sourceName, checked) => {
    setUserSelectedDefaultSourceToggleState((currState) => ({
      ...currState,
      [sourceName]: !checked,
    }));
  }, []);

  return (
    <Form onSubmit={submit}>
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>{t('olm~Edit default sources')}</ModalTitle>
        <ModalBody>
          <FormGroup fieldId="enabled-default-sources" label={t('olm~Enabled default sources')}>
            {operatorHub.status.sources
              .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
              .map((source) => {
                const checked = !userSelectedDefaultSourceToggleState[source.name] ?? true;
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
                  'olm~By disabling a default source, the operators it provides will no longer appear in OperatorHub and any operator that has been installed from this source will no longer receive updates until the source is re-enabled. Disabling the source will also remove the corresponding OperatorSource and CatalogSource resources from the cluster.',
                )}
              </p>
            </Alert>
          )}
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={false}
          submitText={t('public~Save')}
          cancel={cancel}
        />
      </div>
    </Form>
  );
};

export const editDefaultSourcesModal = createModalLauncher(
  withHandlePromise(EditDefaultSourcesModal),
);

type EditDefaultSourcesModalProps = {
  operatorHub: OperatorHubKind;
} & ModalComponentProps &
  HandlePromiseProps;
