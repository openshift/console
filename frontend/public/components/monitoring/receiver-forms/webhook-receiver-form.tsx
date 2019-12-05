import * as _ from 'lodash-es';
import * as React from 'react';

export const Form = ({ formValues, dispatchFormChange }) => (
  <div data-test-id="webhook-receiver-form" className="form-group">
    <label className="control-label co-required">URL</label>
    <input
      className="pf-c-form-control"
      type="text"
      aria-describedby="webhook-url-help"
      name="webhookUrl"
      data-test-id="webhook-url"
      value={formValues.webhookUrl}
      onChange={(e) =>
        dispatchFormChange({
          type: 'setFormValues',
          payload: { webhookUrl: e.target.value },
        })
      }
    />
    <div className="help-block" id="webhook-url-help">
      The endpoint to send HTTP POST requests to
    </div>
  </div>
);

export const getInitialValues = (receiverConfig) => {
  return {
    webhookUrl: receiverConfig?.url || '',
  };
};

export const isFormInvalid = (formValues) => {
  return !formValues.webhookUrl;
};

export const createReceiverConfig = (formValues, receiverConfig) => {
  return _.set(receiverConfig, 'url', formValues.webhookUrl);
};
