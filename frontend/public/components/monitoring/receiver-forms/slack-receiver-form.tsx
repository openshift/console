/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RadioInput } from '../../radio';
import { ExpandCollapse, ExternalLink } from '../../utils';
import {
  SaveAsDefaultCheckbox,
  SendResolvedAlertsCheckbox,
  FormProps,
} from './alert-manager-receiver-forms';

const GLOBAL_FIELDS = [
  'slack_api_url',
  'slack_send_resolved',
  'slack_username',
  'slack_icon_emoji',
  'slack_icon_url',
  'slack_link_names',
];

export const Form: React.FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <div data-test-id="slack-receiver-form">
      <div className="form-group">
        <label
          data-test-id="api-url-label"
          className="control-label co-required"
          htmlFor="slack-api-url"
        >
          {t('slack-receiver-form~Slack API URL')}
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
              label={t('slack-receiver-form~Save as default Slack API URL')}
              formValues={formValues}
              dispatchFormChange={dispatchFormChange}
              tooltip={t(
                'slack-receiver-form~Checking this box will write the API URL to the global section of the configuration file where it will become the default API URL for future Slack receivers.',
              )}
            />
          </div>
        </div>
        <div className="help-block" id="slack-api-url-help">
          {t('slack-receiver-form~The URL of the Slack webhook.')}
        </div>
      </div>
      <div className="form-group">
        <label className="control-label co-required" htmlFor="slack-channel">
          {t('slack-receiver-form~Channel')}
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
          {t('slack-receiver-form~The Slack channel or user to send notifications to.')}
        </div>
      </div>
      <div className="form-group">
        <ExpandCollapse
          textCollapsed={t('slack-receiver-form~Show advanced configuration')}
          textExpanded={t('slack-receiver-form~Hide advanced configuration')}
        >
          <div className="co-form-subsection">
            <div className="form-group">
              <SendResolvedAlertsCheckbox
                formField="slack_send_resolved"
                formValues={formValues}
                dispatchFormChange={dispatchFormChange}
              />
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="slack-icon-type">
                {t('slack-receiver-form~Icon')} &nbsp;
                <RadioInput
                  title={t('slack-receiver-form~URL')}
                  name="slackIconType"
                  id="slack-icon-type"
                  value="url"
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { slackIconType: e.target.value },
                    })
                  }
                  checked={formValues.slackIconType === 'url'}
                  inline
                />
                <RadioInput
                  title={t('slack-receiver-form~Emoji')}
                  name="slackIconType"
                  value="emoji"
                  data-test-id="slack-icon-type-emoji"
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { slackIconType: e.target.value },
                    })
                  }
                  checked={formValues.slackIconType === 'emoji'}
                  inline
                />
              </label>
              {formValues.slackIconType === 'url' && (
                <>
                  <input
                    className="pf-c-form-control"
                    type="text"
                    aria-describedby="slack-icon-url-help"
                    aria-label="The URL of the icon."
                    data-test-id="slack-icon-url"
                    value={formValues.slack_icon_url}
                    onChange={(e) =>
                      dispatchFormChange({
                        type: 'setFormValues',
                        payload: { slack_icon_url: e.target.value },
                      })
                    }
                  />
                  <div className="help-block" id="slack-icon-url-help">
                    {t('slack-receiver-form~The URL of the icon.')}
                  </div>
                </>
              )}
              {formValues.slackIconType === 'emoji' && (
                <>
                  <input
                    className="pf-c-form-control"
                    type="text"
                    aria-describedby="slack-icon-emoji-help"
                    aria-label="An emoji code to use in place of the default icon."
                    name="slackIconEmoji"
                    data-test-id="slack-icon-emoji"
                    value={formValues.slack_icon_emoji}
                    onChange={(e) =>
                      dispatchFormChange({
                        type: 'setFormValues',
                        payload: { slack_icon_emoji: e.target.value },
                      })
                    }
                  />
                  <div className="help-block" id="slack-icon-emoji-help">
                    <Trans ns="slack-receiver-form">
                      An{' '}
                      <ExternalLink
                        href="https://www.webfx.com/tools/emoji-cheat-sheet/"
                        text={t('slack-receiver-form~emoji code')}
                      />{' '}
                      to use in place of the default icon.
                    </Trans>
                  </div>
                </>
              )}
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="slack-username">
                {t('slack-receiver-form~Username')}
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                aria-describedby="slack-username-help"
                id="slack-username"
                data-test-id="slack-username"
                value={formValues.slack_username}
                onChange={(e) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { slack_username: e.target.value },
                  })
                }
              />
              <div className="help-block" id="slack-username-help">
                {t('slack-receiver-form~The displayed username.')}
              </div>
            </div>
            <div className="form-group">
              <div className="checkbox">
                <label className="control-label" htmlFor="slack-link-names">
                  <input
                    type="checkbox"
                    id="slack-link-names"
                    data-test-id="slack-link-names"
                    aria-describedby="slack-link-names-help"
                    onChange={(e) =>
                      dispatchFormChange({
                        type: 'setFormValues',
                        payload: { slack_link_names: e.target.checked },
                      })
                    }
                    checked={formValues.slack_link_names}
                  />
                  {t('slack-receiver-form~Link names')}
                </label>
              </div>
              <div className="help-block" id="slack-link-names-help">
                {t('slack-receiver-form~Find and link channel names and usernames.')}
              </div>
            </div>
          </div>
        </ExpandCollapse>
      </div>
    </div>
  );
};

export const getInitialValues = (globals, receiverConfig) => {
  const initValues: any = {
    slackSaveAsDefault: false,
    slackChannel: _.get(receiverConfig, 'channel'),
  };

  initValues.slackIconType = _.has(receiverConfig, 'icon_emoji') ? 'emoji' : 'url';

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

  _.unset(receiverConfig, formValues.slackIconType === 'url' ? 'icon_emoji' : 'icon_url');

  return receiverConfig;
};
