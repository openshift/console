/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { SectionHeading, ExpandCollapse } from '../../utils';
import {
  SaveAsDefaultCheckbox,
  SendResolvedAlertsCheckbox,
  FormProps,
} from './alert-manager-receiver-forms';

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

export const Form: React.FC<FormProps> = ({ globals, formValues, dispatchFormChange }) => {
  // disable saveAsDefault if all SMTP form fields match global values
  const disableSaveAsDefault = SMTP_GLOBAL_FIELDS.every(
    (propName) => formValues[propName] === globals[propName],
  );
  const { t } = useTranslation();

  return (
    <div data-test-id="email-receiver-form">
      <div className="form-group">
        <label className="control-label co-required" htmlFor="email-to">
          {t('email-receiver-form~To address')}
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          aria-describedby="email-to-help"
          id="email-to"
          data-test-id="email-to"
          value={formValues.emailTo}
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { emailTo: e.target.value },
            })
          }
        />
        <div className="help-block" id="email-to-help">
          {t('email-receiver-form~The email address to send notifications to.')}
        </div>
      </div>
      <div className="form-group">
        <div className="co-m-pane__body--section-heading">
          <div className="row">
            <div className="col-sm-6">
              <SectionHeading text={t('email-receiver-form~SMTP configuration')} />
            </div>
            <div className="col-sm-6">
              <SaveAsDefaultCheckbox
                formField="emailSaveAsDefault"
                disabled={disableSaveAsDefault}
                label={t('email-receiver-form~Save as default SMTP configuration')}
                formValues={formValues}
                dispatchFormChange={dispatchFormChange}
                tooltip={t(
                  'email-receiver-form~Checking this box will write these values to the global section of the configuration file where they will become defaults for future email receivers.',
                )}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="email-from">
              {t('email-receiver-form~From address')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              aria-describedby="email-from-help"
              id="email-from"
              data-test-id="email-from"
              value={formValues.smtp_from}
              onChange={(e) =>
                dispatchFormChange({
                  type: 'setFormValues',
                  payload: { smtp_from: e.target.value },
                })
              }
            />
            <div className="help-block" id="email-from-help">
              {t('email-receiver-form~The email address to send notifications from.')}
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label co-required" htmlFor="email-smarthost">
                  {t('email-receiver-form~SMTP smarthost')}
                </label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  aria-describedby="email-smarthost-help"
                  id="email-smarthost"
                  data-test-id="email-smarthost"
                  value={formValues.smtp_smarthost}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { smtp_smarthost: e.target.value },
                    })
                  }
                />
                <div className="help-block" id="email-smarthost-help">
                  {t(
                    'email-receiver-form~Smarthost used for sending emails, including port number.',
                  )}
                </div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label co-required" htmlFor="email-hello">
                  {t('email-receiver-form~SMTP hello')}
                </label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  aria-describedby="email-hello-help"
                  id="email-hello"
                  data-test-id="email-hello"
                  value={formValues.smtp_hello}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { smtp_hello: e.target.value },
                    })
                  }
                />
                <div className="help-block" id="email-hello-help">
                  {t('email-receiver-form~The hostname to identify to the SMTP server.')}
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label" htmlFor="email-auth-username">
                  {t('email-receiver-form~Auth username')}
                </label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  id="email-auth-username"
                  data-test-id="email-auth-username"
                  value={formValues.smtp_auth_username}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { smtp_auth_username: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label" htmlFor="email-auth-password">
                  {t('email-receiver-form~Auth password (using LOGIN and PLAIN)')}
                </label>
                <input
                  className="pf-c-form-control"
                  type="password"
                  id="email-auth-password"
                  data-test-id="email-auth-password"
                  value={formValues.smtp_auth_password}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { smtp_auth_password: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label" htmlFor="email-auth-identity">
                  {t('email-receiver-form~Auth identity (using PLAIN)')}
                </label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  id="email-auth-identity"
                  data-test-id="email-auth-identity"
                  value={formValues.smtp_auth_identity}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { smtp_auth_identity: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label" htmlFor="email-auth-secret">
                  {t('email-receiver-form~Auth secret (CRAM-MDS)')}
                </label>
                <input
                  className="pf-c-form-control"
                  type="password"
                  id="email-auth-secret"
                  data-test-id="email-auth-secret"
                  value={formValues.smtp_auth_secret}
                  onChange={(e) =>
                    dispatchFormChange({
                      type: 'setFormValues',
                      payload: { smtp_auth_secret: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <div className="checkbox">
            <label className="control-label" htmlFor="email-require-tls">
              <input
                type="checkbox"
                id="email-require-tls"
                data-test-id="email-require-tls"
                onChange={(e) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: {
                      smtp_require_tls: e.target.checked,
                    },
                  })
                }
                checked={formValues.smtp_require_tls}
                aria-checked={formValues.smtp_require_tls}
              />
              {t('email-receiver-form~Require TLS')}
            </label>
          </div>
        </div>
      </div>
      <div className="form-group">
        <ExpandCollapse
          textCollapsed={t('email-receiver-form~Show advanced configuration')}
          textExpanded={t('email-receiver-form~Hide advanced configuration')}
        >
          <div className="co-form-subsection">
            <div className="form-group">
              <SendResolvedAlertsCheckbox
                formField="email_send_resolved"
                formValues={formValues}
                dispatchFormChange={dispatchFormChange}
              />
            </div>
            <div className="form-group">
              <label className="control-label co-required" htmlFor="email-html">
                {t('email-receiver-form~Body of email notifications (HTML)')}
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                aria-describedby="html-help"
                id="email-html"
                data-test-id="email-html"
                value={formValues.email_html}
                onChange={(e) =>
                  dispatchFormChange({
                    type: 'setFormValues',
                    payload: { email_html: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </ExpandCollapse>
      </div>
    </div>
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
