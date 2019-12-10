import * as _ from 'lodash-es';
import * as React from 'react';

import { RadioInput } from '../../radio';
import {
  SaveAsDefaultCheckbox,
  equalOrEmpty,
  notEqualAndNotEmpty,
} from './alert-manager-receiver-forms';

const SAVE_AS_DEFAULT_FLD = 'savePagerDutyUrlAsDefault';

export const Form = ({ globals, formValues, handleChange }) => {
  const disableSaveAsDefault = equalOrEmpty(
    formValues.pagerDutyURL,
    _.get(globals, 'pagerduty_url'),
  );

  return (
    <div data-test-id="pagerduty-receiver-form">
      <div className="form-group">
        <label className="control-label">Integration Type</label>
        <div>
          <RadioInput
            title="Events API v2"
            name="pagerDutyIntegrationType"
            id="integration-type-events"
            value="events"
            onChange={handleChange}
            checked={formValues.pagerDutyIntegrationType === 'events'}
            inline
          />
          <RadioInput
            title="Prometheus"
            name="pagerDutyIntegrationType"
            data-test-id="integration-type-prometheus"
            value="prometheus"
            onChange={handleChange}
            checked={formValues.pagerDutyIntegrationType === 'prometheus'}
            inline
          />
        </div>
      </div>
      <div className="form-group">
        <label data-test-id="pagerduty-key-label" className="control-label co-required">
          {formValues.pagerDutyIntegrationType === 'events' ? 'Routing' : 'Service'} Key
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          aria-describedby="integration-key-help"
          name="pagerDutyIntegrationKey"
          data-test-id="integration-key"
          value={formValues.pagerDutyIntegrationKey}
          onChange={handleChange}
        />
        <div className="help-block" id="integration-key-help">
          PagerDuty integration key
        </div>
      </div>
      <div className="form-group">
        <label data-test-id="pagerduty-url-label" className="control-label co-required">
          PagerDuty URL
        </label>
        <div className="row">
          <div className="col-sm-7">
            <input
              className="pf-c-form-control"
              type="text"
              aria-describedby="integration-url-help"
              name="pagerDutyURL"
              data-test-id="pagerduty-url"
              value={formValues.pagerDutyURL}
              onChange={handleChange}
            />
          </div>
          <div className="col-sm-5">
            <SaveAsDefaultCheckbox
              formField={SAVE_AS_DEFAULT_FLD}
              disabled={disableSaveAsDefault}
              label="Save as default PagerDuty URL"
              formValues={formValues}
              handleChange={handleChange}
            />
          </div>
        </div>
        <div className="help-block" id="integration-key-help">
          The URL of your PagerDuty Installation
        </div>
      </div>
    </div>
  );
};

export const getInitialValues = (globals, receiverConfig) => {
  const initValues: any = { [SAVE_AS_DEFAULT_FLD]: false };

  initValues.pagerDutyIntegrationType = _.has(receiverConfig, 'service_key')
    ? 'prometheus'
    : 'events';
  initValues.pagerDutyIntegrationKey =
    _.get(receiverConfig, 'service_key') || _.get(receiverConfig, 'routing_key') || '';
  // default to receiverConfig, global, or ''
  initValues.pagerDutyURL = _.get(receiverConfig, 'url') || _.get(globals, 'pagerduty_url') || '';

  return initValues;
};

export const isFormInvalid = (formValues): boolean => {
  return _.isEmpty(formValues.pagerDutyIntegrationKey);
};

export const updateGlobals = (globals, formValues) => {
  const updatedGlobals = {};
  if (
    formValues[SAVE_AS_DEFAULT_FLD] === true &&
    notEqualAndNotEmpty(formValues.pagerDutyURL, _.get(globals, 'pagerduty_url'))
  ) {
    _.set(updatedGlobals, 'pagerduty_url', formValues.pagerDutyURL);
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  const pagerDutyIntegrationKeyName = `${
    formValues.pagerDutyIntegrationType === 'events' ? 'routing' : 'service'
  }_key`;
  _.set(receiverConfig, pagerDutyIntegrationKeyName, formValues.pagerDutyIntegrationKey);

  // Only save pagerDutyURL to receiverConfig if different from global property
  // If they are the same, don't save in receiverConfig so the global property will be used
  if (
    formValues[SAVE_AS_DEFAULT_FLD] === false &&
    notEqualAndNotEmpty(formValues.pagerDutyURL, _.get(globals, 'pagerduty_url'))
  ) {
    _.set(receiverConfig, 'url', formValues.pagerDutyURL);
  } else {
    _.unset(receiverConfig, 'url'); // saving url as global, so remove from existing receiver
  }
  return receiverConfig;
};
