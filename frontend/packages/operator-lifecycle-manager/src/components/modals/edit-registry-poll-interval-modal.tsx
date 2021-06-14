import * as React from 'react';
import { Form, FormGroup } from '@patternfly/react-core';
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

const availablePollIntervals = {
  '10m0s': '10m',
  '15m0s': '15m',
  '30m0s': '30m',
  '45m0s': '45m',
  '60m0s': '60m',
};

const EditRegistryPollIntervalModal: React.FC<EditRegistryPollIntervalModalProps> = ({
  cancel,
  close,
  catalogSource,
  handlePromise,
  errorMessage,
}) => {
  const [pollInterval, setPollInterval] = React.useState(
    catalogSource.spec?.updateStrategy?.registryPoll?.interval,
  );

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const patch = [
      { op: 'add', path: '/spec/updateStrategy/registryPoll/interval', value: pollInterval },
    ];
    return handlePromise(k8sPatch(CatalogSourceModel, catalogSource, patch), close);
  };

  return (
    <Form onSubmit={submit} name="form">
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>Edit registry poll interval</ModalTitle>
        <ModalBody>
          <FormGroup label="Registry poll interval" fieldId="pollInterval_dropdown">
            <Dropdown
              className="dropdown--full-width"
              id="pollInterval_dropdown"
              items={{
                ...availablePollIntervals,
                ...(availablePollIntervals[pollInterval] ? {} : { pollInterval }),
              }}
              onChange={(selectedInterval: string) => setPollInterval(selectedInterval)}
              selectedKey={pollInterval}
            />
          </FormGroup>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={false}
          submitText="Save"
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
