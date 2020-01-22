import * as _ from 'lodash-es';
import * as React from 'react';
import { FormProps } from './alert-manager-receiver-forms';

export const Form: React.FC<FormProps> = ({ formValues, dispatchFormChange }) => (
  <div data-test-id="webhook-receiver-form" className="form-group">
    <label className="control-label co-required" htmlFor="webhook-url">
      URL
    </label>
    <input
      className="pf-c-form-control"
      type="text"
      aria-describedby="webhook-url-help"
      id="webhook-url"
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

export const getInitialValues = (globals, receiverConfig) => {
  return {
    webhookUrl: receiverConfig?.url || '',
  };
};

export const isFormInvalid = (formValues) => {
  return !formValues.webhookUrl;
};

export const updateGlobals = () => {
  return {};
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  _.set(receiverConfig, 'url', formValues.webhookUrl);
  return receiverConfig;
};
