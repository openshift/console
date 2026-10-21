/* eslint-disable camelcase */
import * as _ from 'lodash';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { SendResolvedAlertsCheckbox } from './send-resolved-alerts-checkbox';
import { SaveAsDefaultCheckbox } from './save-as-default-checkbox';
import { FormProps } from './receiver-form-props';
import {
  Checkbox,
  FormGroup,
  FormHelperText,
  FormSection,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  TextInput,
} from '@patternfly/react-core';
import { AdvancedConfiguration } from './advanced-configuration';

const SMTP_GLOBAL_FIELDS = [
  'smtp_from',
  'smtp_smarthost',
  'smtp_hello',
  'smtp_auth_username',
  'smtp_auth_password',
  'smtp_auth_identity',
  'smtp_auth_secret',
  'smtp_require_tls',
];
const GLOBAL_FIELDS = [...SMTP_GLOBAL_FIELDS, 'email_send_resolved', 'email_html'];

export const Form: FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  // disable saveAsDefault if all SMTP form fields match global values
  const disableSaveAsDefault = SMTP_GLOBAL_FIELDS.every(
    (propName) => formValues[propName] === globals[propName],
  );
  const { t } = useTranslation();

  return (
    <>
      <FormGroup label={t('public~To address')} fieldId="email-to" isRequired>
        <TextInput
          type="text"
          id="email-to"
          data-test="email-to"
          value={formValues.emailTo ?? ''}
          onChange={(_e, value: string) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { emailTo: value },
            })
          }
          aria-describedby="email-to-help"
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem id="email-to-help">
              {t('public~The email address to send notifications to.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <FormSection title={t('public~SMTP configuration')}>
        <SaveAsDefaultCheckbox
          formField="emailSaveAsDefault"
          disabled={disableSaveAsDefault}
          label={t('public~Save as default SMTP configuration')}
          formValues={formValues}
          dispatchFormChange={dispatchFormChange}
          tooltip={t(
            'public~Checking this box will write these values to the global section of the configuration file where they will become defaults for future email receivers.',
          )}
        />
        <FormGroup label={t('public~From address')} fieldId="email-from" isRequired>
          <TextInput
            type="text"
            id="email-from"
            data-test="email-from"
            value={formValues.smtp_from ?? ''}
            onChange={(_e, value: string) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { smtp_from: value },
              })
            }
            aria-describedby="email-from-help"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem id="email-from-help">
                {t('public~The email address to send notifications from.')}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <Grid hasGutter>
          <GridItem sm={6}>
            <FormGroup label={t('public~SMTP smarthost')} fieldId="email-smarthost" isRequired>
              <TextInput
                type="text"
                id="email-smarthost"
                data-test="email-smarthost"
                value={formValues.smtp_smarthost ?? ''}
                onChange={(_e, value: string) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { smtp_smarthost: value },
                  })
                }
                aria-describedby="email-smarthost-help"
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem id="email-smarthost-help">
                    {t('public~Smarthost used for sending emails, including port number.')}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          </GridItem>
          <GridItem sm={6}>
            <FormGroup label={t('public~SMTP hello')} fieldId="email-hello" isRequired>
              <TextInput
                type="text"
                id="email-hello"
                data-test="email-hello"
                value={formValues.smtp_hello ?? ''}
                onChange={(_e, value: string) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { smtp_hello: value },
                  })
                }
                aria-describedby="email-hello-help"
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem id="email-hello-help">
                    {t('public~The hostname to identify to the SMTP server.')}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          </GridItem>
        </Grid>
        <Grid hasGutter>
          <GridItem sm={6}>
            <FormGroup label={t('public~Auth username')} fieldId="email-auth-username">
              <TextInput
                type="text"
                id="email-auth-username"
                data-test="email-auth-username"
                value={formValues.smtp_auth_username ?? ''}
                onChange={(_e, value: string) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { smtp_auth_username: value },
                  })
                }
              />
            </FormGroup>
          </GridItem>
          <GridItem sm={6}>
            <FormGroup
              label={t('public~Auth password (using LOGIN and PLAIN)')}
              fieldId="email-auth-password"
            >
              <TextInput
                type="password"
                id="email-auth-password"
                data-test="email-auth-password"
                value={formValues.smtp_auth_password ?? ''}
                onChange={(_e, value: string) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { smtp_auth_password: value },
                  })
                }
              />
            </FormGroup>
          </GridItem>
        </Grid>
        <Grid hasGutter>
          <GridItem sm={6}>
            <FormGroup
              label={t('public~Auth identity (using PLAIN)')}
              fieldId="email-auth-identity"
            >
              <TextInput
                type="text"
                id="email-auth-identity"
                data-test="email-auth-identity"
                value={formValues.smtp_auth_identity ?? ''}
                onChange={(_e, value: string) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { smtp_auth_identity: value },
                  })
                }
              />
            </FormGroup>
          </GridItem>
          <GridItem sm={6}>
            <FormGroup label={t('public~Auth secret (CRAM-MDS)')} fieldId="email-auth-secret">
              <TextInput
                type="password"
                id="email-auth-secret"
                data-test="email-auth-secret"
                value={formValues.smtp_auth_secret ?? ''}
                onChange={(_e, value: string) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { smtp_auth_secret: value },
                  })
                }
              />
            </FormGroup>
          </GridItem>
        </Grid>
        <FormGroup>
          <Checkbox
            label={t('public~Require TLS')}
            onChange={(_event, checked) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { smtp_require_tls: checked },
              })
            }
            isChecked={formValues.smtp_require_tls ?? false}
            id="email-require-tls"
            data-test="email-require-tls"
          />
        </FormGroup>
      </FormSection>
      <AdvancedConfiguration>
        <SendResolvedAlertsCheckbox
          formField="email_send_resolved"
          formValues={formValues}
          dispatchFormChange={dispatchFormChange}
        />
        <FormGroup label={t('public~Body of email notifications (HTML)')} fieldId="email-html">
          <TextInput
            type="text"
            id="email-html"
            data-test="email-html"
            value={formValues.email_html ?? ''}
            onChange={(_e, value: string) =>
              dispatchFormChange({
                type: 'setFormValues',
                payload: { email_html: value },
              })
            }
          />
        </FormGroup>
      </AdvancedConfiguration>
    </>
  );
};

const getConfigFieldName = (fld) => fld.substring(fld.indexOf('_') + 1); //strip off leading 'email_' or 'smtp_' prefix

export const getInitialValues = (globals, receiverConfig) => {
  const initValues: any = {
    emailSaveAsDefault: false,
    emailTo: receiverConfig?.to,
  };

  GLOBAL_FIELDS.forEach((fld) => {
    initValues[fld] = _.get(receiverConfig, getConfigFieldName(fld), globals[fld]);
  });

  return initValues;
};

export const isFormInvalid = (formValues) => {
  return (
    !formValues.emailTo ||
    !formValues.smtp_from ||
    !formValues.smtp_smarthost ||
    !formValues.smtp_hello
  );
};

export const updateGlobals = (globals, formValues) => {
  const updatedGlobals = {};
  if (formValues.emailSaveAsDefault) {
    SMTP_GLOBAL_FIELDS.forEach((propName) => {
      const formValue = formValues[propName];
      if (formValue !== undefined) {
        _.set(updatedGlobals, propName, formValue);
      }
    });
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  _.set(receiverConfig, 'to', formValues.emailTo);

  // Only save these props in receiverConfig if different from global
  GLOBAL_FIELDS.forEach((fld) => {
    const formValue = formValues[fld];
    const configFieldName = getConfigFieldName(fld);
    if (formValue !== globals[fld]) {
      if (SMTP_GLOBAL_FIELDS.includes(fld) && formValues.emailSaveAsDefault) {
        _.unset(receiverConfig, configFieldName); // saving as global so unset in config
      } else {
        _.set(receiverConfig, configFieldName, formValue);
      }
    } else {
      _.unset(receiverConfig, configFieldName); // equals global, unset in config so global is used
    }
  });

  return receiverConfig;
};
