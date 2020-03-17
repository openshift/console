/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import * as React from 'react';

import { FormProps, SaveAsDefaultCheckbox } from './alert-manager-receiver-forms';

const GLOBAL_FIELDS = ['slack_api_url']; //TODO follow up PR will add advanced fields

export const Form: React.FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  return (
    <div data-test-id="slack-receiver-form">
      <div className="form-group">
        <label
          data-test-id="api-url-label"
          className="control-label co-required"
          htmlFor="slack-api-url"
        >
          Slack API URL
        </label>
        <div className="row">
          <div className="col-sm-7">
            <input
              className="pf-c-form-control"
              type="text"
              id="slack-api-url"
              aria-describedby="slack-api-url-help"
              data-test-id="slack-api-url"
              value={formValues.slack_api_url}
              onChange={(e) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { slack_api_url: e.target.value },
                })
              }
            />
          </div>
          <div className="col-sm-5">
            <SaveAsDefaultCheckbox
              formField="slackSaveAsDefault"
              disabled={formValues.slack_api_url === globals?.slack_api_url}
              label="Save as default Slack API URL"
              formValues={formValues}
              dispatchFormChange={dispatchFormChange}
              tooltip="Checking this box will write the API URL to the global section of the
                configuration file where it will become the default API URL for future Slack receivers."
            />
          </div>
        </div>
        <div className="help-block" id="slack-api-url-help">
          The URL of the Slack Webhook
        </div>
      </div>
      <div className="form-group">
        <label className="control-label co-required" htmlFor="slack-channel">
          Channel
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          id="slack-channel"
          aria-describedby="slack-channel-help"
          data-test-id="slack-channel"
          value={formValues.slackChannel}
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { slackChannel: e.target.value },
            })
          }
        />
        <div className="help-block" id="slack-channel-help">
          The Slack channel or user to send notifications to
        </div>
      </div>
    </div>
  );
};

export const getInitialValues = (globals, receiverConfig) => {
  const initValues: any = {
    slackSaveAsDefault: false,
    slackChannel: _.get(receiverConfig, 'channel'),
  };

  GLOBAL_FIELDS.forEach((fld) => {
    const configFieldName = fld.substring(fld.indexOf('_') + 1); //strip off leading 'slack_' prefix
    initValues[fld] = _.get(receiverConfig, configFieldName, globals[fld]);
  });

  return initValues;
};

export const isFormInvalid = (formValues): boolean => {
  return !formValues.slack_api_url || !formValues.slackChannel;
};

export const updateGlobals = (globals, formValues) => {
  const updatedGlobals = {};
  if (formValues.slackSaveAsDefault && formValues.slack_api_url) {
    _.set(updatedGlobals, 'slack_api_url', formValues.slack_api_url);
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  _.set(receiverConfig, 'channel', formValues.slackChannel);

  // Only save these props in receiverConfig if different from global
  GLOBAL_FIELDS.forEach((fld) => {
    const formValue = formValues[fld];
    const configFieldName = fld.substring(fld.indexOf('_') + 1); //strip off leading 'slack_' prefix
    if (formValue !== globals[fld]) {
      if (fld === 'slack_api_url' && formValues.slackSaveAsDefault) {
        _.unset(receiverConfig, 'api_url'); // saving as global so unset in config
      } else {
        _.set(receiverConfig, configFieldName, formValue);
      }
    } else {
      _.unset(receiverConfig, configFieldName); // equals global, unset in config so global is used
    }
  });

  return receiverConfig;
};
