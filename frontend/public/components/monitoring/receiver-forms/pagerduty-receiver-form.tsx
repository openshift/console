/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import * as React from 'react';

import { SectionHeading } from '../../utils';
import { RadioInput } from '../../radio';

export const Form = ({ formValues, dispatchFormChange }) => (
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
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { pagerDutyIntegrationType: e.target.value },
            })
          }
          checked={formValues.pagerDutyIntegrationType === 'events'}
          inline
        />
        <RadioInput
          title="Prometheus"
          name="pagerDutyIntegrationType"
          data-test-id="integration-type-prometheus"
          value="prometheus"
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { pagerDutyIntegrationType: e.target.value },
            })
          }
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
        onChange={(e) =>
          dispatchFormChange({
            type: 'setFormValues',
            payload: { pagerDutyIntegrationKey: e.target.value },
          })
        }
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
        pagerDutyIntegrationType: receiverConfig?.routing_key ? 'events' : 'prometheus',
        pagerDutyIntegrationKey: receiverConfig?.routing_key || receiverConfig?.service_key,
      };
};

export const isFormInvalid = (formValues): boolean => {
  return !formValues.pagerDutyIntegrationKey;
};

export const createReceiverConfig = (formValues, receiverConfig) => {
  const pagerDutyIntegrationKeyName = `${
    formValues.pagerDutyIntegrationType === 'events' ? 'routing' : 'service'
  }_key`;
  _.set(receiverConfig, pagerDutyIntegrationKeyName, formValues.pagerDutyIntegrationKey);
  return receiverConfig;
};
