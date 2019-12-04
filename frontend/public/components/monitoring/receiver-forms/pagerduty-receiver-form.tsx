import * as _ from 'lodash-es';
import * as React from 'react';

import { SectionHeading } from '../../utils';
import { RadioInput } from '../../radio';
import * as classNames from 'classnames';

export const Form = ({ globals, formValues, handleChange }) => {
  const globalPagerDutyURL = _.get(globals, 'pagerduty_url');
  const disableSaveAsDefault =
    formValues.pagerDutyURL === globalPagerDutyURL ||
    (_.isEmpty(formValues.pagerDutyURL) && globalPagerDutyURL === undefined);
  const saveAsDefaultLabelClass = classNames({ 'co-no-bold': disableSaveAsDefault });

  return (
    <div data-test-id="pagerduty-receiver-form" className="co-m-pane__body--section-heading">
      <SectionHeading text="PagerDuty Configuration" />
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
            <label className={saveAsDefaultLabelClass}>
              <input
                type="checkbox"
                name="pagerDutyURLSaveAsDefault"
                data-test-id="save-as-default"
                onChange={(e) =>
                  handleChange({
                    target: { name: 'pagerDutyURLSaveAsDefault', value: e.target.checked },
                  })
                }
                checked={formValues.pagerDutyURLSaveAsDefault}
                disabled={disableSaveAsDefault}
              />
              &nbsp; Save as default PagerDuty URL
            </label>
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
  const initValues: any = { pagerDutyURLSaveAsDefault: false };

  initValues.pagerDutyIntegrationType = _.has(receiverConfig, 'service_key')
    ? 'prometheus'
    : 'events';
  initValues.pagerDutyIntegrationKey =
    _.get(receiverConfig, 'service_key') || _.get(receiverConfig, 'routing_key') || '';
  // default to receiverConfig, global, or ''
  initValues.pagerDutyURL =
    _.get(receiverConfig, 'pagerduty_url') || _.get(globals, 'pagerduty_url') || '';

  return initValues;
};

export const isFormInvalid = (formValues): boolean => {
  return _.isEmpty(formValues.pagerDutyIntegrationKey);
};

export const updateGlobals = (globals, formValues) => {
  const updatedGlobals = {};
  if (
    formValues.pagerDutyURLSaveAsDefault === true &&
    formValues.pagerDutyURL !== _.get(globals, 'pagerduty_url')
  ) {
    _.set(updatedGlobals, 'pagerduty_url', formValues.pagerDutyURL);
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues) => {
  const pagerDutyIntegrationKeyName = `${
    formValues.pagerDutyIntegrationType === 'events' ? 'routing' : 'service'
  }_key`;
  const receiverConfig = {
    [pagerDutyIntegrationKeyName]: formValues.pagerDutyIntegrationKey,
  };

  // Only save pagerDutyURL to receiverConfig if different from global property
  // If they are the same, don't save in receiverConfig so the global property will be used
  if (
    formValues.pagerDutyURLSaveAsDefault === false &&
    formValues.pagerDutyURL !== _.get(globals, 'pagerduty_url')
  ) {
    _.set(receiverConfig, 'pagerduty_url', formValues.pagerDutyURL);
  }
  return receiverConfig;
};
