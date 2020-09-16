import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { K8sResourceKind } from '../../module/k8s';
import { AlertmanagerConfig } from '../monitoring/alert-manager-config';
import { patchAlertmanagerConfig } from '../monitoring/alert-manager-utils';

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

export const AlertRoutingModal: React.FC<AlertRoutingModalProps> = ({
  config,
  secret,
  cancel,
  close,
}) => {
  const [errorMessage, setErrorMessage] = React.useState();
  const [inProgress, setInProgress] = React.useState(false);
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
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">
        {t('alert-routing-modal~Edit routing configuration')}
      </ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="group-by" className="control-label">
              {t('alert-routing-modal~Group by')}
            </label>
          </div>
          <div className="co-m-form-col col-sm-12">
            <div className="form-inline">
              <div className="pf-c-input-group">
                <input
                  placeholder="cluster, alertname"
                  type="text"
                  className="pf-c-form-control"
                  id="input-group-by"
                  data-test-id="input-group-by"
                  defaultValue={_.get(config, ['route', 'group_by'])}
                  aria-describedby="input-group-by-help"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="group-wait" className="control-label">
              {t('alert-routing-modal~Group wait')}
            </label>
          </div>
          <div className="co-m-form-col col-sm-12">
            <div className="form-inline">
              <div className="pf-c-input-group">
                <input
                  placeholder="30s"
                  type="text"
                  className="pf-c-form-control"
                  id="input-group-wait"
                  data-test-id="input-group-wait"
                  defaultValue={_.get(config, ['route', 'group_wait'])}
                  aria-describedby="input-group-wait-help"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="group-interval" className="control-label">
              {t('alert-routing-modal~Group interval')}
            </label>
          </div>
          <div className="co-m-form-col col-sm-12">
            <div className="form-inline">
              <div className="pf-c-input-group">
                <input
                  placeholder="5m"
                  type="text"
                  className="pf-c-form-control"
                  id="input-group-interval"
                  data-test-id="input-group-interval"
                  defaultValue={_.get(config, ['route', 'group_interval'])}
                  aria-describedby="input-group-interval-help"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="repeat-interval" className="control-label">
              {t('alert-routing-modal~Repeat interval')}
            </label>
          </div>
          <div className="co-m-form-col col-sm-12">
            <div className="form-inline">
              <div className="pf-c-input-group">
                <input
                  placeholder="3h"
                  type="text"
                  className="pf-c-form-control"
                  id="input-repeat-interval"
                  data-test-id="input-repeat-interval"
                  defaultValue={_.get(config, ['route', 'repeat_interval'])}
                  aria-describedby="input-repeat-interval-help"
                />
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        cancel={cancel}
        submitText={t('public~Save')}
        cancelText={t('public~Cancel')}
      />
    </form>
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
