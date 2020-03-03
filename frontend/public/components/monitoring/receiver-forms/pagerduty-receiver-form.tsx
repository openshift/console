/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import * as React from 'react';

import { RadioInput } from '../../radio';
import { FormProps, SaveAsDefaultCheckbox } from './alert-manager-receiver-forms';

const GLOBAL_FIELDS = ['pagerduty_url']; //TODO follow up PR will add advanced fields

export const Form: React.FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  return (
    <div data-test-id="pagerduty-receiver-form">
      <div className="form-group">
        <label className="control-label" htmlFor="integration-type-events">
          Integration Type
        </label>
        <div>
          <RadioInput
            title="Events API v2"
            id="integration-type-events"
            value="events"
            onChange={(e) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { pagerDutyIntegrationType: e.target.value },
              })
            }
            checked={formValues.pagerdutyIntegrationKeyType === 'events'}
            aria-checked={formValues.pagerdutyIntegrationKeyType === 'events'}
            inline
          />
          <RadioInput
            title="Prometheus"
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
          {formValues.pagerdutyIntegrationKeyType === 'events' ? 'Routing' : 'Service'} Key
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
          PagerDuty integration key
        </div>
      </div>
      <div className="form-group">
        <label
          data-test-id="pagerduty-url-label"
          className="control-label co-required"
          htmlFor="pagerduty-url"
        >
          PagerDuty URL
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
              label="Save as default PagerDuty URL"
              formValues={formValues}
              dispatchFormChange={dispatchFormChange}
              tooltip="Checking this box will write the url to the global section of the
                configuration file where it will become default url for future PagerDuty receivers."
            />
          </div>
        </div>
        <div className="help-block" id="pagerduty-url-help">
          The URL of your PagerDuty Installation
        </div>
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
