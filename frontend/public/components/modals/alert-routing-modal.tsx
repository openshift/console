import type { FC } from 'react';
import { useState } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core';

import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ModalComponentProps } from '../factory/modal';
import { K8sResourceKind } from '../../module/k8s';
import { AlertmanagerConfig } from '../monitoring/alertmanager/alertmanager-config';
import { patchAlertmanagerConfig } from '../monitoring/alertmanager/alertmanager-utils';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

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
    <>
      <ModalHeader title={t('public~Edit routing configuration')} />
      <ModalBody>
        <Form id="alert-routing-form" onSubmit={submit}>
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
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isLoading={inProgress}
          isDisabled={inProgress}
          data-test="confirm-action"
          form="alert-routing-form"
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

export const AlertRoutingModalOverlay: OverlayComponent<AlertRoutingModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <AlertRoutingModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};

type AlertRoutingModalProps = {
  config: AlertmanagerConfig;
  secret: K8sResourceKind;
} & ModalComponentProps;
