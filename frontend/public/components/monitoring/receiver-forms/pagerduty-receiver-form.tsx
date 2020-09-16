/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { RadioInput } from '../../radio';
import {
  FormProps,
  SendResolvedAlertsCheckbox,
  SaveAsDefaultCheckbox,
} from './alert-manager-receiver-forms';
import { ExpandCollapse } from '../../utils';

const GLOBAL_FIELDS = [
  'pagerduty_url',
  'pagerduty_send_resolved',
  'pagerduty_client',
  'pagerduty_client_url',
  'pagerduty_description',
  'pagerduty_severity',
];

export const Form: React.FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <div data-test-id="pagerduty-receiver-form">
      <div className="form-group">
        <label className="control-label" htmlFor="integration-type-events">
          {t('pagerduty-receiver-form~Integration type')}
        </label>
        <div>
          <RadioInput
            title={t('pagerduty-receiver-form~Events API v2')}
            id="integration-type-events"
            value="events"
            onChange={(e) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { pagerdutyIntegrationKeyType: e.target.value },
              })
            }
            checked={formValues.pagerdutyIntegrationKeyType === 'events'}
            aria-checked={formValues.pagerdutyIntegrationKeyType === 'events'}
            inline
          />
          <RadioInput
            title={t('pagerduty-receiver-form~Prometheus')}
            name="pagerdutyIntegrationKeyType"
            data-test-id="integration-type-prometheus"
            value="prometheus"
            onChange={(e) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { pagerdutyIntegrationKeyType: e.target.value },
              })
            }
            checked={formValues.pagerdutyIntegrationKeyType === 'prometheus'}
            aria-checked={formValues.pagerdutyIntegrationKeyType === 'prometheus'}
            inline
          />
        </div>
      </div>
      <div className="form-group">
        <label
          data-test-id="pagerduty-key-label"
          className="control-label co-required"
          htmlFor="integration-key"
        >
          {formValues.pagerdutyIntegrationKeyType === 'events'
            ? t('pagerduty-receiver-form~Routing key')
            : t('pagerduty-receiver-form~Service key')}
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          aria-describedby="integration-key-help"
          id="integration-key"
          data-test-id="integration-key"
          value={formValues.pagerdutyIntegrationKey}
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { pagerdutyIntegrationKey: e.target.value },
            })
          }
        />
        <div className="help-block" id="integration-key-help">
          {t('pagerduty-receiver-form~PagerDuty integration key.')}
        </div>
      </div>
      <div className="form-group">
        <label
          data-test-id="pagerduty-url-label"
          className="control-label co-required"
          htmlFor="pagerduty-url"
        >
          {t('pagerduty-receiver-form~PagerDuty URL')}
        </label>
        <div className="row">
          <div className="col-sm-7">
            <input
              className="pf-c-form-control"
              type="text"
              id="pagerduty-url"
              aria-describedby="pagerduty-url-help"
              data-test-id="pagerduty-url"
              value={formValues.pagerduty_url}
              onChange={(e) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { pagerduty_url: e.target.value },
                })
              }
            />
          </div>
          <div className="col-sm-5">
            <SaveAsDefaultCheckbox
              formField="pagerdutySaveAsDefault"
              disabled={formValues.pagerduty_url === globals?.pagerduty_url}
              label={t('pagerduty-receiver-form~Save as default PagerDuty URL')}
              formValues={formValues}
              dispatchFormChange={dispatchFormChange}
              tooltip={t(
                'pagerduty-receiver-form~Checking this box will write the url to the global section of the configuration file where it will become default url for future PagerDuty receivers.',
              )}
            />
          </div>
        </div>
        <div className="help-block" id="pagerduty-url-help">
          {t('pagerduty-receiver-form~The URL of your PagerDuty installation.')}
        </div>
      </div>
      <div className="form-group">
        <ExpandCollapse
          textCollapsed={t('pagerduty-receiver-form~Show advanced configuration')}
          textExpanded={t('pagerduty-receiver-form~Hide advanced configuration')}
        >
          <div className="co-form-subsection">
            <SendResolvedAlertsCheckbox
              formField="pagerduty_send_resolved"
              formValues={formValues}
              dispatchFormChange={dispatchFormChange}
            />
            <h3>{t('pagerduty-receiver-form~Client details')}</h3>
            <div className="form-group">
              <label className="control-label" htmlFor="pagerduty-client">
                {t('pagerduty-receiver-form~Client')}
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                aria-describedby="client-help"
                id="pagerduty-client"
                data-test-id="pagerduty-client"
                value={formValues.pagerduty_client}
                onChange={(e) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { pagerduty_client: e.target.value },
                  })
                }
              />
              <div className="help-block" id="client-help">
                {t('pagerduty-receiver-form~The client identification of the Alertmanager.')}
              </div>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="pagerduty-client-url">
                {t('pagerduty-receiver-form~Client URL')}
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                aria-describedby="client-url-help"
                id="pagerduty-client-url"
                data-test-id="pagerduty-client-url"
                value={formValues.pagerduty_client_url}
                onChange={(e) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { pagerduty_client_url: e.target.value },
                  })
                }
              />
              <div className="help-block" id="client-url-help">
                {t('pagerduty-receiver-form~A backlink to the sender of the notification.')}
              </div>
            </div>
            <h3>{t('pagerduty-receiver-form~Incident details')}</h3>
            <div className="form-group">
              <label className="control-label" htmlFor="pagerduty-description">
                {t('pagerduty-receiver-form~Description')}
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                aria-describedby="description-help"
                id="pagerduty-description"
                data-test-id="pagerduty-description"
                value={formValues.pagerduty_description}
                onChange={(e) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { pagerduty_description: e.target.value },
                  })
                }
              />
              <div className="help-block" id="description-help">
                {t('pagerduty-receiver-form~Description of the incident.')}
              </div>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="pagerduty-severity">
                {t('pagerduty-receiver-form~Severity')}
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                aria-describedby="severity-help"
                id="pagerduty-severity"
                data-test-id="pagerduty-severity"
                value={formValues.pagerduty_severity}
                onChange={(e) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { pagerduty_severity: e.target.value },
                  })
                }
              />
              <div className="help-block" id="severity-help">
                {t('pagerduty-receiver-form~Severity of the incident.')}
              </div>
            </div>
          </div>
        </ExpandCollapse>
      </div>
    </div>
  );
};

export const getInitialValues = (globals, receiverConfig) => {
  const initValues: any = { pagerdutySaveAsDefault: false };

  initValues.pagerdutyIntegrationKeyType = _.has(receiverConfig, 'service_key')
    ? 'prometheus'
    : 'events';
  initValues.pagerdutyIntegrationKey = receiverConfig?.service_key || receiverConfig?.routing_key;

  GLOBAL_FIELDS.forEach((fld) => {
    const configFieldName = fld.substring(fld.indexOf('_') + 1); //strip off leading 'pagerduty_' prefix
    initValues[fld] = _.get(receiverConfig, configFieldName, globals[fld]);
  });

  return initValues;
};

export const isFormInvalid = (formValues): boolean => {
  return !formValues.pagerdutyIntegrationKey;
};

export const updateGlobals = (globals, formValues) => {
  const updatedGlobals = {};
  if (formValues.pagerdutySaveAsDefault && formValues.pagerduty_url) {
    _.set(updatedGlobals, 'pagerduty_url', formValues.pagerduty_url);
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  // handle integration key props
  _.unset(receiverConfig, 'routing_key');
  _.unset(receiverConfig, 'service_key');
  const pagerdutyIntegrationKeyName = `${
    formValues.pagerdutyIntegrationKeyType === 'events' ? 'routing' : 'service'
  }_key`;
  _.set(receiverConfig, pagerdutyIntegrationKeyName, formValues.pagerdutyIntegrationKey);

  // Only save these props in formValues different from globals
  GLOBAL_FIELDS.forEach((fld) => {
    const formValue = formValues[fld];
    const configFieldName = fld.substring(fld.indexOf('_') + 1); //strip off leading 'pagerduty_' prefix
    if (formValue !== globals[fld]) {
      if (fld === 'pagerduty_url' && formValues.pagerdutySaveAsDefault) {
        _.unset(receiverConfig, 'url'); // saving as global so unset in config
      } else {
        _.set(receiverConfig, configFieldName, formValue);
      }
    } else {
      _.unset(receiverConfig, configFieldName); // equals global, unset in config so global is used
    }
  });

  return receiverConfig;
};
