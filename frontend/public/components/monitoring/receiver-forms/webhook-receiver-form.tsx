import * as _ from 'lodash-es';
import * as React from 'react';

export const Form = ({ formValues, handleChange }) => (
  <div data-test-id="webhook-receiver-form" className="form-group">
    <label className="control-label co-required">URL</label>
    <input
      className="pf-c-form-control"
      type="text"
      aria-describedby="webhook-url-help"
      name="webhookUrl"
      data-test-id="webhook-url"
      value={formValues.webhookUrl}
      onChange={handleChange}
    />
    <div className="help-block" id="webhook-url-help">
      The endpoint to send HTTP POST requests to
    </div>
  </div>
);

export const getInitialValues = (receiverConfig) => {
  return _.isEmpty(receiverConfig)
    ? { webhookUrl: '' }
    : {
        webhookUrl: _.get(receiverConfig, 'url'),
      };
};

export const isFormInvalid = (formValues) => {
  return _.isEmpty(formValues.webhookUrl);
};

export const createReceiverConfig = (formValues) => {
  return { url: formValues.webhookUrl };
};
