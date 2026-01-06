/* eslint-disable camelcase */
import * as _ from 'lodash';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormGroup,
  FormHelperText,
  FormSection,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Radio,
  TextInput,
} from '@patternfly/react-core';

import { SendResolvedAlertsCheckbox } from './send-resolved-alerts-checkbox';
import { SaveAsDefaultCheckbox } from './save-as-default-checkbox';
import { FormProps } from './receiver-form-props';
import { AdvancedConfiguration } from './advanced-configuration';

const GLOBAL_FIELDS = [
  'pagerduty_url',
  'pagerduty_send_resolved',
  'pagerduty_client',
  'pagerduty_client_url',
  'pagerduty_description',
  'pagerduty_severity',
];

export const Form: FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <>
      <FormGroup
        role="radiogroup"
        fieldId="integration-type"
        label={t('public~Integration type')}
        isInline
      >
        <Radio
          id="integration-type-events"
          name="pagerdutyIntegrationKeyType"
          label={t('public~Events API v2')}
          value="events"
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { pagerdutyIntegrationKeyType: (e.target as HTMLInputElement).value },
            })
          }
          isChecked={formValues.pagerdutyIntegrationKeyType === 'events'}
          data-checked-state={formValues.pagerdutyIntegrationKeyType === 'events'}
        />
        <Radio
          id="integration-type-prometheus"
          name="pagerdutyIntegrationKeyType"
          label={t('public~Prometheus')}
          value="prometheus"
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { pagerdutyIntegrationKeyType: (e.target as HTMLInputElement).value },
            })
          }
          isChecked={formValues.pagerdutyIntegrationKeyType === 'prometheus'}
          data-checked-state={formValues.pagerdutyIntegrationKeyType === 'prometheus'}
        />
      </FormGroup>
      <FormGroup
        label={
          formValues.pagerdutyIntegrationKeyType === 'events'
            ? t('public~Routing key')
            : t('public~Service key')
        }
        fieldId="integration-key"
        isRequired
      >
        <TextInput
          type="text"
          id="integration-key"
          data-test="integration-key"
          value={formValues.pagerdutyIntegrationKey ?? ''}
          onChange={(_e, value: string) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { pagerdutyIntegrationKey: value },
            })
          }
          aria-describedby="integration-key-help"
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem id="integration-key-help">
              {t('public~PagerDuty integration key.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <Grid hasGutter>
        <GridItem span={7}>
          <FormGroup label={t('public~PagerDuty URL')} fieldId="pagerduty-url" isRequired>
            <TextInput
              type="text"
              id="pagerduty-url"
              data-test="pagerduty-url"
              value={formValues.pagerduty_url ?? ''}
              onChange={(_e, value: string) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { pagerduty_url: value },
                })
              }
              aria-describedby="pagerduty-url-help"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem id="pagerduty-url-help">
                  {t('public~The URL of your PagerDuty installation.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </GridItem>
        <GridItem span={1} /> {/* fixes an overlapping control issue */}
        <GridItem span={4} className="pf-v6-u-align-content-center">
          <SaveAsDefaultCheckbox
            formField="pagerdutySaveAsDefault"
            disabled={formValues.pagerduty_url === globals?.pagerduty_url}
            label={t('public~Save as default PagerDuty URL')}
            formValues={formValues}
            dispatchFormChange={dispatchFormChange}
            tooltip={t(
              'public~Checking this box will write the URL to the global section of the configuration file where it will become the default URL for future PagerDuty receivers.',
            )}
          />
        </GridItem>
      </Grid>
      <AdvancedConfiguration>
        <SendResolvedAlertsCheckbox
          formField="pagerduty_send_resolved"
          formValues={formValues}
          dispatchFormChange={dispatchFormChange}
        />
        <FormSection title={t('public~Client details')}>
          <FormGroup label={t('public~Client')}>
            <TextInput
              type="text"
              id="pagerduty-client"
              data-test="pagerduty-client"
              value={formValues.pagerduty_client ?? ''}
              onChange={(_e, value: string) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { pagerduty_client: value },
                })
              }
              aria-describedby="pagerduty-client-help"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem id="pagerduty-client-help">
                  {t('public~The client identification of the Alertmanager.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup label={t('public~Client URL')}>
            <TextInput
              type="text"
              id="pagerduty-client-url"
              data-test="pagerduty-client-url"
              value={formValues.pagerduty_client_url ?? ''}
              onChange={(_e, value: string) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { pagerduty_client_url: value },
                })
              }
              aria-describedby="pagerduty-client-url-help"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem id="pagerduty-client-url-help">
                  {t('public~A backlink to the sender of the notification.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </FormSection>
        <FormSection title={t('public~Incident details')}>
          <FormGroup label={t('public~Description')}>
            <TextInput
              type="text"
              id="pagerduty-description"
              data-test="pagerduty-description"
              value={formValues.pagerduty_description ?? ''}
              onChange={(_e, value: string) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { pagerduty_description: value },
                })
              }
              aria-describedby="pagerduty-description-help"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem id="pagerduty-description-help">
                  {t('public~Description of the incident.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup label={t('public~Severity')}>
            <TextInput
              type="text"
              id="pagerduty-severity"
              data-test="pagerduty-severity"
              value={formValues.pagerduty_severity ?? ''}
              onChange={(_e, value: string) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { pagerduty_severity: value },
                })
              }
              aria-describedby="pagerduty-severity-help"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem id="pagerduty-severity-help">
                  {t('public~Severity of the incident.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </FormSection>
      </AdvancedConfiguration>
    </>
  );
};

export const getInitialValues = (globals, receiverConfig) => {
  const initValues: any = { pagerdutySaveAsDefault: false };

  initValues.pagerdutyIntegrationKeyType = _.has(receiverConfig, 'service_key')
    ? 'prometheus'
    : 'events';
  initValues.pagerdutyIntegrationKey = receiverConfig?.service_key || receiverConfig?.routing_key;

  GLOBAL_FIELDS.forEach((fld) => {
    const configFieldName = fld.substring(fld.indexOf('_') + 1); //strip off leading 'pagerduty_' prefix
    initValues[fld] = _.get(receiverConfig, configFieldName, globals[fld]);
  });

  return initValues;
};

export const isFormInvalid = (formValues): boolean => {
  return !formValues.pagerdutyIntegrationKey;
};

export const updateGlobals = (globals, formValues) => {
  const updatedGlobals = {};
  if (formValues.pagerdutySaveAsDefault && formValues.pagerduty_url) {
    _.set(updatedGlobals, 'pagerduty_url', formValues.pagerduty_url);
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  // handle integration key props
  _.unset(receiverConfig, 'routing_key');
  _.unset(receiverConfig, 'service_key');
  const pagerdutyIntegrationKeyName = `${
    formValues.pagerdutyIntegrationKeyType === 'events' ? 'routing' : 'service'
  }_key`;
  _.set(receiverConfig, pagerdutyIntegrationKeyName, formValues.pagerdutyIntegrationKey);

  // Only save these props in formValues different from globals
  GLOBAL_FIELDS.forEach((fld) => {
    const formValue = formValues[fld];
    const configFieldName = fld.substring(fld.indexOf('_') + 1); //strip off leading 'pagerduty_' prefix
    if (formValue !== globals[fld]) {
      if (fld === 'pagerduty_url' && formValues.pagerdutySaveAsDefault) {
        _.unset(receiverConfig, 'url'); // saving as global so unset in config
      } else {
        _.set(receiverConfig, configFieldName, formValue);
      }
    } else {
      _.unset(receiverConfig, configFieldName); // equals global, unset in config so global is used
    }
  });

  return receiverConfig;
};
