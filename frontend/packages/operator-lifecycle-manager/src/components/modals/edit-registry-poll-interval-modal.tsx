import * as React from 'react';
import { Form, FormGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  ModalTitle,
  ModalBody,
  createModalLauncher,
  ModalComponentProps,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import {
  withHandlePromise,
  HandlePromiseProps,
  Dropdown,
} from '@console/internal/components/utils';
import { k8sPatch } from '@console/internal/module/k8s';
import { CatalogSourceModel } from '../../models';
import { CatalogSourceKind } from '../../types';

type DropdownItems = Record<string, string>;

const availablePollIntervals: DropdownItems = {
  '10m': '10m',
  '15m': '15m',
  '30m': '30m',
  '45m': '45m',
  '60m': '60m',
};

const EditRegistryPollIntervalModal: React.FC<EditRegistryPollIntervalModalProps> = ({
  cancel,
  close,
  catalogSource,
  handlePromise,
  errorMessage,
}) => {
  const { t } = useTranslation();
  const [pollInterval, setPollInterval] = React.useState(() => {
    let initialValue = catalogSource.spec?.updateStrategy?.registryPoll?.interval || '';
    if (initialValue.endsWith('0s')) {
      initialValue = initialValue.substring(0, initialValue.length - 2);
    }
    return initialValue;
  });
  const items = React.useMemo<DropdownItems>(() => {
    let interval = catalogSource.spec?.updateStrategy?.registryPoll?.interval || '';
    if (interval.endsWith('0s')) {
      interval = interval.substring(0, interval.length - 2);
    }
    return {
      ...availablePollIntervals,
      ...(interval && !availablePollIntervals[interval] ? { interval } : {}),
    };
  }, [catalogSource.spec]);

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const patch = [
      { op: 'add', path: '/spec/updateStrategy/registryPoll/interval', value: pollInterval },
    ];
    return handlePromise(k8sPatch(CatalogSourceModel, catalogSource, patch), close);
  };

  return (
    <Form onSubmit={submit} name="form">
      <div className="modal-content">
        <ModalTitle>{t('olm~Edit registry poll interval')}</ModalTitle>
        <ModalBody>
          <FormGroup label={t('olm~Registry poll interval')} fieldId="pollInterval_dropdown">
            <Dropdown
              className="dropdown--full-width"
              id="pollInterval_dropdown"
              items={items}
              onChange={(selectedInterval: string) => setPollInterval(selectedInterval)}
              selectedKey={pollInterval}
            />
          </FormGroup>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={false}
          submitText={t('olm~Save')}
          cancel={cancel}
          submitDisabled={
            pollInterval === catalogSource.spec?.updateStrategy?.registryPoll?.interval
          }
        />
      </div>
    </Form>
  );
};

export const editRegitryPollInterval = createModalLauncher(
  withHandlePromise(EditRegistryPollIntervalModal),
);

type EditRegistryPollIntervalModalProps = {
  catalogSource: CatalogSourceKind;
} & ModalComponentProps &
  HandlePromiseProps;
