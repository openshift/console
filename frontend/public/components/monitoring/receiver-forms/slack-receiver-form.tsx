import * as _ from 'lodash-es';
import * as React from 'react';

import {
  SaveAsDefaultCheckbox,
  equalOrEmpty,
  notEqualAndNotEmpty,
} from './alert-manager-receiver-forms';

const SAVE_AS_DEFAULT_FLD = 'saveSlackApiAsDefault';

export const Form = ({ globals, formValues, handleChange }) => {
  const disableSaveAsDefault = equalOrEmpty(
    formValues.slackApiUrl,
    _.get(globals, 'slack_api_url'),
  );

  return (
    <div data-test-id="slack-receiver-form">
      <div className="form-group">
        <label data-test-id="api-url-label" className="control-label co-required">
          Slack API Url
        </label>
        <div className="row">
          <div className="col-sm-7">
            <input
              className="pf-c-form-control"
              type="text"
              aria-describedby="slack-api-url-help"
              name="slackApiUrl"
              data-test-id="slack-api-url"
              value={formValues.slackApiUrl}
              onChange={handleChange}
            />
          </div>
          <div className="col-sm-5">
            <SaveAsDefaultCheckbox
              formField={SAVE_AS_DEFAULT_FLD}
              disabled={disableSaveAsDefault}
              label="Save as default Slack API Url"
              formValues={formValues}
              handleChange={handleChange}
            />
          </div>
        </div>
        <div className="help-block" id="integration-key-help">
          The URL of the Slack Webhook
        </div>
      </div>
      <div className="form-group">
        <label className="control-label co-required">Channel</label>
        <input
          className="pf-c-form-control"
          type="text"
          aria-describedby="slack-channel-help"
          name="slackChannel"
          data-test-id="slack-channel"
          value={formValues.slackChannel}
          onChange={handleChange}
        />
        <div className="help-block" id="slack-channel-help">
          The Slack channel or user to send notifications to
        </div>
      </div>
    </div>
  );
};

export const getInitialValues = (globals, receiverConfig) => {
  const initValues: any = { [SAVE_AS_DEFAULT_FLD]: false };
  // default to receiverConfig, global, or ''
  initValues.slackApiUrl =
    _.get(receiverConfig, 'api_url') || _.get(globals, 'slack_api_url') || '';
  initValues.slackChannel = _.get(receiverConfig, 'channel') || '';
  return initValues;
};

export const isFormInvalid = (formValues): boolean => {
  return _.isEmpty(formValues.slackApiUrl) || _.isEmpty(formValues.slackChannel);
};

export const updateGlobals = (globals, formValues) => {
  const updatedGlobals = {};
  if (
    formValues[SAVE_AS_DEFAULT_FLD] === true &&
    notEqualAndNotEmpty(formValues.slackApiUrl, _.get(globals, 'slack_api_url'))
  ) {
    _.set(updatedGlobals, 'slack_api_url', formValues.slackApiUrl);
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  _.set(receiverConfig, 'channel', formValues.slackChannel);
  // Only save slackApiUrl to receiverConfig if defined and different from global property
  // If they are the same, don't save in receiverConfig so the global property will be used
  if (
    formValues[SAVE_AS_DEFAULT_FLD] === false &&
    notEqualAndNotEmpty(formValues.slackApiUrl, _.get(globals, 'slack_api_url'))
  ) {
    _.set(receiverConfig, 'api_url', formValues.slackApiUrl);
  } else {
    _.unset(receiverConfig, 'api_url'); // saving api_url as global, so remove from existing receiver
  }
  return receiverConfig;
};
