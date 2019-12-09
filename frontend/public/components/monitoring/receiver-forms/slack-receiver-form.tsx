import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';

export const Form = ({ globals, formValues, handleChange }) => {
  const globalApiUrlValue = _.get(globals, 'slack_api_url');
  const disableSaveAsDefault =
    formValues.slackApiUrl === globalApiUrlValue ||
    (_.isEmpty(formValues.slackApiUrl) && globalApiUrlValue === undefined);
  const saveAsDefaultLabelClass = classNames({ 'co-no-bold': disableSaveAsDefault });

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
            <label className={saveAsDefaultLabelClass}>
              <input
                type="checkbox"
                name="slackApiUrlSaveAsDefault"
                data-test-id="save-as-default"
                onChange={(e) =>
                  handleChange({
                    target: { name: 'slackApiUrlSaveAsDefault', value: e.target.checked },
                  })
                }
                checked={formValues.slackApiUrlSaveAsDefault}
                disabled={disableSaveAsDefault}
              />
              &nbsp; Save as default Slack API Url
            </label>
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
  const initValues: any = { slackApiUrlSaveAsDefault: false };
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
    formValues.slackApiUrlSaveAsDefault === true &&
    formValues.slackApiUrl !== _.get(globals, 'slack_api_url') &&
    !_.isEmpty(formValues.slackApiUrl)
  ) {
    _.set(updatedGlobals, 'slack_api_url', formValues.slackApiUrl);
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues) => {
  const receiverConfig = {
    channel: formValues.slackChannel,
  };

  // Only save slackApiUrl to receiverConfig if defined and different from global property
  // If they are the same, don't save in receiverConfig so the global property will be used
  const globalApiUrlValue = _.get(globals, 'slack_api_url');
  if (
    formValues.slackApiUrlSaveAsDefault === false &&
    formValues.slackApiUrl !== globalApiUrlValue
  ) {
    _.set(receiverConfig, 'api_url', formValues.slackApiUrl);
  }
  return receiverConfig;
};
