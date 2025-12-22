/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Checkbox,
  FormGroup,
  FormHelperText,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Radio,
  TextArea,
  TextInput,
} from '@patternfly/react-core';

import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { SendResolvedAlertsCheckbox } from './send-resolved-alerts-checkbox';
import { SaveAsDefaultCheckbox } from './save-as-default-checkbox';
import { FormProps } from './receiver-form-props';
import { AdvancedConfiguration } from './advanced-configuration';

const GLOBAL_FIELDS = [
  'slack_api_url',
  'slack_send_resolved',
  'slack_username',
  'slack_icon_emoji',
  'slack_icon_url',
  'slack_link_names',
  'slack_title',
  'slack_text',
];

export const Form: FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <>
      <Grid hasGutter>
        <GridItem span={7}>
          <FormGroup label={t('public~Slack API URL')} fieldId="slack-api-url" isRequired>
            <TextInput
              id="slack-api-url"
              type="text"
              data-test="slack-api-url"
              value={formValues.slack_api_url ?? ''}
              onChange={(_e, value: string) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { slack_api_url: value },
                })
              }
              aria-describedby="slack-api-url-help"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem id="slack-api-url-help">
                  {t('public~The URL of the Slack webhook.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </GridItem>
        <GridItem span={1} /> {/* fixes an overlapping control issue */}
        <GridItem span={4} className="pf-v6-u-align-content-center">
          <SaveAsDefaultCheckbox
            formField="slackSaveAsDefault"
            disabled={formValues.slack_api_url === globals?.slack_api_url}
            label={t('public~Save as default Slack API URL')}
            formValues={formValues}
            dispatchFormChange={dispatchFormChange}
            tooltip={t(
              'public~Checking this box will write the API URL to the global section of the configuration file where it will become the default API URL for future Slack receivers.',
            )}
          />
        </GridItem>
      </Grid>
      <FormGroup label={t('public~Channel')} fieldId="slack-channel" isRequired>
        <TextInput
          id="slack-channel"
          type="text"
          data-test="slack-channel"
          value={formValues.slackChannel ?? ''}
          onChange={(_e, value: string) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { slackChannel: value },
            })
          }
          aria-describedby="slack-channel-help"
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem id="slack-channel-help">
              {t('public~The Slack channel or user to send notifications to.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <AdvancedConfiguration>
        <SendResolvedAlertsCheckbox
          formField="slack_send_resolved"
          formValues={formValues}
          dispatchFormChange={dispatchFormChange}
        />
        <FormGroup
          role="radiogroup"
          fieldId="slack-icon-type-group"
          label={t('public~Icon')}
          isInline
          className="pf-v6-c-form__group-control--no-row-gap"
        >
          <Radio
            id="slack-icon-type"
            name="slackIconType"
            label={t('public~URL')}
            value="url"
            onChange={(e) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { slackIconType: (e.target as HTMLInputElement).value },
              })
            }
            isChecked={formValues.slackIconType === 'url'}
            data-checked-state={formValues.slackIconType === 'url'}
            data-test="URL-radio-input"
          />
          <Radio
            id="slack-icon-type-emoji"
            name="slackIconType"
            label={t('public~Emoji')}
            value="emoji"
            onChange={(e) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { slackIconType: (e.target as HTMLInputElement).value },
              })
            }
            isChecked={formValues.slackIconType === 'emoji'}
            data-checked-state={formValues.slackIconType === 'emoji'}
            data-test="Emoji-radio-input"
          />
          {formValues.slackIconType === 'url' && (
            <>
              <TextInput
                id="slack-icon-url"
                type="text"
                data-test="slack-icon-url"
                value={formValues.slack_icon_url ?? ''}
                onChange={(_e, value: string) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { slack_icon_url: value },
                  })
                }
                aria-describedby="slack-icon-url-help"
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem id="slack-icon-url-help">
                    {t('public~The URL of the icon.')}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </>
          )}
          {formValues.slackIconType === 'emoji' && (
            <>
              <TextInput
                id="slack-icon-emoji"
                type="text"
                data-test="slack-icon-emoji"
                value={formValues.slack_icon_emoji ?? ''}
                onChange={(_e, value: string) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { slack_icon_emoji: value },
                  })
                }
                aria-describedby="slack-icon-emoji-help"
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem id="slack-icon-emoji-help">
                    <Trans ns="public">
                      An{' '}
                      <ExternalLink
                        href="https://www.webfx.com/tools/emoji-cheat-sheet/"
                        text={t('public~emoji code')}
                      />{' '}
                      to use in place of the default icon.
                    </Trans>
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </>
          )}
        </FormGroup>
        <FormGroup label={t('public~Username')} fieldId="slack-username" isRequired>
          <TextInput
            id="slack-username"
            type="text"
            data-test="slack-username"
            value={formValues.slack_username ?? ''}
            onChange={(_e, value: string) =>
              dispatchFormChange({ type: 'setFormValues', payload: { slack_username: value } })
            }
            aria-describedby="slack-username-help"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem id="slack-username-help">
                {t('public~The displayed username.')}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup>
          <Checkbox
            label={t('public~Link names')}
            onChange={(_event, checked) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { slack_link_names: checked },
              })
            }
            isChecked={formValues.slack_link_names ?? false}
            id="slack-link-names"
            data-test="slack-link-names"
            aria-describedby="slack-link-names-help"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem id="slack-link-names-help">
                {t('public~Find and link channel names and usernames.')}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup label={t('public~Title')} fieldId="slack-title">
          <TextArea
            id="slack-title"
            data-test="slack-title"
            onChange={(_event, value) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { slack_title: value },
              })
            }
            value={formValues.slack_title ?? ''}
            aria-describedby="slack-title-help"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem id="slack-title-help">
                {t('public~Slack message title')}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup label={t('public~Text')} fieldId="slack-text">
          <TextArea
            id="slack-text"
            data-test="slack-text"
            onChange={(_event, value) =>
              dispatchFormChange({ type: 'setFormValues', payload: { slack_text: value } })
            }
            value={formValues.slack_text ?? ''}
            aria-describedby="slack-text-help"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem id="slack-text-help">{t('public~Slack message text')}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </AdvancedConfiguration>
    </>
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
