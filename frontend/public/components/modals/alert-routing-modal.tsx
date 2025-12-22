import type { FC } from 'react';
import { useState } from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { K8sResourceKind } from '../../module/k8s';
import { AlertmanagerConfig } from '../monitoring/alertmanager/alertmanager-config';
import { patchAlertmanagerConfig } from '../monitoring/alertmanager/alertmanager-utils';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';

const updateAlertRoutingProperty = (
  config: any,
  propertyName: string,
  newValue: string,
  oldValue: string,
) => {
  if (!_.isEqual(newValue, oldValue)) {
    if (_.isEmpty(newValue)) {
      _.unset(config, ['route', propertyName]); // unset so global/default value will be used
    } else {
      _.set(config, ['route', propertyName], newValue);
    }
  }
};

export const AlertRoutingModal: FC<AlertRoutingModalProps> = ({
  config,
  secret,
  cancel,
  close,
}) => {
  const [errorMessage, setErrorMessage] = useState();
  const [inProgress, setInProgress] = useState(false);
  const { t } = useTranslation();

  const submit = (event): void => {
    event.preventDefault();

    let groupByNew = event.target.elements['input-group-by'].value.replace(/\s+/g, '');
    const groupWaitNew = event.target.elements['input-group-wait'].value;
    const groupIntervalNew = event.target.elements['input-group-interval'].value;
    const repeatIntervalNew = event.target.elements['input-repeat-interval'].value;

    const groupByOld = _.get(config, ['route', 'group_by'], []);
    const groupWaitOld = _.get(config, ['route', 'group_wait'], '');
    const groupIntervalOld = _.get(config, ['route', 'group_interval'], '');
    const repeatIntervalOld = _.get(config, ['route', 'repeat_interval'], '');

    groupByNew = groupByNew === '' ? [] : groupByNew.split(',');
    updateAlertRoutingProperty(config, 'group_by', groupByNew, groupByOld);
    updateAlertRoutingProperty(config, 'group_wait', groupWaitNew, groupWaitOld);
    updateAlertRoutingProperty(config, 'group_interval', groupIntervalNew, groupIntervalOld);
    updateAlertRoutingProperty(config, 'repeat_interval', repeatIntervalNew, repeatIntervalOld);

    setInProgress(true);
    patchAlertmanagerConfig(secret, config).then(close, (err) => {
      setErrorMessage(err.message);
      setInProgress(false);
    });
  };

  return (
    <Form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">{t('public~Edit routing configuration')}</ModalTitle>
      <ModalBody>
        <div className="pf-v6-c-form">
          <FormGroup label={t('public~Group by')} fieldId="group-by">
            <TextInput
              id="group-by"
              name="input-group-by"
              type="text"
              defaultValue={_.get(config, ['route', 'group_by'], []).join(', ')}
              placeholder="cluster, alertname"
              aria-describedby="input-group-by-help"
              data-test-id="input-group-by"
            />
          </FormGroup>
          <FormGroup label={t('public~Group wait')} fieldId="group-wait">
            <TextInput
              id="group-wait"
              name="input-group-wait"
              type="text"
              defaultValue={_.get(config, ['route', 'group_wait'], '')}
              placeholder="30s"
              aria-describedby="input-group-wait-help"
              data-test-id="input-group-wait"
            />
          </FormGroup>
          <FormGroup label={t('public~Group interval')} fieldId="group-interval">
            <TextInput
              id="group-interval"
              name="input-group-interval"
              type="text"
              defaultValue={_.get(config, ['route', 'group_interval'], '')}
              placeholder="5m"
              aria-describedby="input-group-interval-help"
              data-test-id="input-group-interval"
            />
          </FormGroup>
          <FormGroup label={t('public~Repeat interval')} fieldId="repeat-interval">
            <TextInput
              id="repeat-interval"
              name="input-repeat-interval"
              type="text"
              defaultValue={_.get(config, ['route', 'repeat_interval'], '')}
              placeholder="3h"
              aria-describedby="input-repeat-interval-help"
              data-test-id="input-repeat-interval"
            />
          </FormGroup>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        cancel={cancel}
        submitText={t('public~Save')}
        cancelText={t('public~Cancel')}
      />
    </Form>
  );
};

export const createAlertRoutingModal = createModalLauncher<AlertRoutingModalProps>(
  AlertRoutingModal,
);

export type AlertRoutingModalProps = {
  cancel: () => void;
  close: () => void;
  config: AlertmanagerConfig;
  secret: K8sResourceKind;
};
