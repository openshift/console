import * as _ from 'lodash-es';
import * as React from 'react';

import { SectionHeading } from '../../utils';
import { RadioInput } from '../../radio';

export const Form = ({ formValues, handleChange }) => (
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
  </div>
);

export const getInitialValues = (receiverConfig) => {
  return _.isEmpty(receiverConfig)
    ? {
        pagerDutyIntegrationType: 'events', // 'Events API v2'
        pagerDutyIntegrationKey: '',
      }
    : {
        pagerDutyIntegrationType: _.get(receiverConfig, 'routing_key') ? 'events' : 'prometheus',
        pagerDutyIntegrationKey:
          _.get(receiverConfig, 'routing_key') || _.get(receiverConfig, 'service_key'),
      };
};

export const isFormInvalid = (formValues): boolean => {
  return _.isEmpty(formValues.pagerDutyIntegrationKey);
};

export const createReceiverConfig = (formValues) => {
  const pagerDutyIntegrationKeyName = `${
    formValues.pagerDutyIntegrationType === 'events' ? 'routing' : 'service'
  }_key`;
  return {
    [pagerDutyIntegrationKeyName]: formValues.pagerDutyIntegrationKey,
  };
};
