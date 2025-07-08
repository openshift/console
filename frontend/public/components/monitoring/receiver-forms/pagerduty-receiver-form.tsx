/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup, Grid, GridItem, Radio, Title } from '@patternfly/react-core';

import { SendResolvedAlertsCheckbox } from './send-resolved-alerts-checkbox';
import { SaveAsDefaultCheckbox } from './save-as-default-checkbox';
import { FormProps } from './receiver-form-props';
import { ExpandCollapse } from '../../utils';

const GLOBAL_FIELDS = [
  'pagerduty_url',
  'pagerduty_send_resolved',
  'pagerduty_client',
  'pagerduty_client_url',
  'pagerduty_description',
  'pagerduty_severity',
];

export const Form: React.FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <div data-test-id="pagerduty-receiver-form">
      <div className="form-group pf-v6-c-form">
        <FormGroup
          role="radiogroup"
          fieldId="integration-type"
          label={t('public~Integration type')}
          isInline
          className="pf-v6-c-form__group-control--no-row-gap"
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
            data-test-id="integration-type-events"
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
            data-test-id="integration-type-prometheus"
          />
        </FormGroup>
      </div>
      <div className="form-group">
        <label data-test-id="pagerduty-key-label" className="co-required" htmlFor="integration-key">
          {formValues.pagerdutyIntegrationKeyType === 'events'
            ? t('public~Routing key')
            : t('public~Service key')}
        </label>
        <span className="pf-v6-c-form-control">
          <input
            type="text"
            aria-describedby="integration-key-help"
            id="integration-key"
            data-test-id="integration-key"
            value={formValues.pagerdutyIntegrationKey}
            onChange={(e) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { pagerdutyIntegrationKey: e.target.value },
              })
            }
          />
        </span>
        <div className="help-block" id="integration-key-help">
          {t('public~PagerDuty integration key.')}
        </div>
      </div>
      <div className="form-group">
        <label data-test-id="pagerduty-url-label" className="co-required" htmlFor="pagerduty-url">
          {t('public~PagerDuty URL')}
        </label>
        <Grid hasGutter>
          <GridItem span={7}>
            <span className="pf-v6-c-form-control">
              <input
                type="text"
                id="pagerduty-url"
                aria-describedby="pagerduty-url-help"
                data-test-id="pagerduty-url"
                value={formValues.pagerduty_url}
                onChange={(e) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { pagerduty_url: e.target.value },
                  })
                }
              />
            </span>
          </GridItem>
          <GridItem span={1} /> {/* fixes an overlapping control issue */}
          <GridItem span={4}>
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
        <div className="help-block" id="pagerduty-url-help">
          {t('public~The URL of your PagerDuty installation.')}
        </div>
      </div>
      <div className="form-group">
        <ExpandCollapse
          textCollapsed={t('public~Show advanced configuration')}
          textExpanded={t('public~Hide advanced configuration')}
          dataTest="advanced-configuration"
        >
          <div className="co-form-subsection">
            <SendResolvedAlertsCheckbox
              formField="pagerduty_send_resolved"
              formValues={formValues}
              dispatchFormChange={dispatchFormChange}
            />
            <Title headingLevel="h3" className="pf-v6-u-mb-sm">
              {t('public~Client details')}
            </Title>
            <div className="form-group">
              <label htmlFor="pagerduty-client">{t('public~Client')}</label>
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  aria-describedby="client-help"
                  id="pagerduty-client"
                  data-test-id="pagerduty-client"
                  value={formValues.pagerduty_client}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { pagerduty_client: e.target.value },
                    })
                  }
                />
              </span>
              <div className="help-block" id="client-help">
                {t('public~The client identification of the Alertmanager.')}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="pagerduty-client-url">{t('public~Client URL')}</label>
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  aria-describedby="client-url-help"
                  id="pagerduty-client-url"
                  data-test-id="pagerduty-client-url"
                  value={formValues.pagerduty_client_url}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { pagerduty_client_url: e.target.value },
                    })
                  }
                />
              </span>
              <div className="help-block" id="client-url-help">
                {t('public~A backlink to the sender of the notification.')}
              </div>
            </div>
            <Title headingLevel="h3" className="pf-v6-u-mb-sm">
              {t('public~Incident details')}
            </Title>
            <div className="form-group">
              <label htmlFor="pagerduty-description">{t('public~Description')}</label>
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  aria-describedby="description-help"
                  id="pagerduty-description"
                  data-test-id="pagerduty-description"
                  value={formValues.pagerduty_description}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { pagerduty_description: e.target.value },
                    })
                  }
                />
              </span>
              <div className="help-block" id="description-help">
                {t('public~Description of the incident.')}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="pagerduty-severity">{t('public~Severity')}</label>
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  aria-describedby="severity-help"
                  id="pagerduty-severity"
                  data-test-id="pagerduty-severity"
                  value={formValues.pagerduty_severity}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { pagerduty_severity: e.target.value },
                    })
                  }
                />
              </span>
              <div className="help-block" id="severity-help">
                {t('public~Severity of the incident.')}
              </div>
            </div>
          </div>
        </ExpandCollapse>
      </div>
    </div>
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
