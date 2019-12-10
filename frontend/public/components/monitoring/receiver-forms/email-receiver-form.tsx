import * as _ from 'lodash-es';
import * as React from 'react';

import { SectionHeading } from '../../utils';
import {
  equalOrEmpty,
  notEqualAndNotEmpty,
  SaveAsDefaultCheckbox,
} from './alert-manager-receiver-forms';

const SMTP_CONFIG_FIELDS = [
  'from',
  'smarthost',
  'hello',
  'auth_username',
  'auth_password',
  'auth_identity',
  'auth_secret',
  'require_tls',
];

const GLOBAL_PREFIX = 'smtp';
const FORM_PREFIX = 'email';
const SAVE_AS_DEFAULT_FLD = 'saveSMPTAsDefault';

// Ex: converts 'auth_password' to 'emailAuthPassword'
const getFormFieldName = (prefix, propName) =>
  `${prefix}${_.map(_.split(propName, '_'), (part) => _.upperFirst(part)).join('')}`;
const getFormValue = (formValues, prefix, propName) =>
  _.get(formValues, getFormFieldName(prefix, propName));
const getGlobalValue = (globals, prefix, propName) => _.get(globals, `${prefix}_${propName}`);

export const Form = ({ globals, formValues, handleChange }) => {
  // disable saveAsDefault if all SMTP form fields match global values
  const disableSaveAsDefault = _.every(SMTP_CONFIG_FIELDS, (propName) =>
    equalOrEmpty(
      getFormValue(formValues, FORM_PREFIX, propName),
      getGlobalValue(globals, GLOBAL_PREFIX, propName),
    ),
  );

  return (
    <div data-test-id="email-receiver-form">
      <div className="form-group">
        <label className="control-label co-required">To Address</label>
        <input
          className="pf-c-form-control"
          type="text"
          aria-describedby="email-to-help"
          name="emailTo"
          data-test-id="email-to"
          value={formValues.emailTo}
          onChange={handleChange}
        />
        <div className="help-block" id="email-to-help">
          The email address to send notifications to
        </div>
      </div>
      <div className="form-group">
        <div className="co-m-pane__body--section-heading">
          <div className="row">
            <div className="col-sm-6">
              <SectionHeading text="SMTP Configuration" />
            </div>
            <div className="col-sm-6">
              <SaveAsDefaultCheckbox
                formField={SAVE_AS_DEFAULT_FLD}
                disabled={disableSaveAsDefault}
                label="Save as default SMTP configuration"
                formValues={formValues}
                handleChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="control-label co-required">From Address</label>
            <input
              className="pf-c-form-control"
              type="text"
              aria-describedby="email-from-help"
              name="emailFrom"
              data-test-id="email-from"
              value={formValues.emailFrom}
              onChange={handleChange}
            />
            <div className="help-block" id="email-from-help">
              The email address to send notifications from
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label co-required">SMTP Smarthost</label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  aria-describedby="email-smarthost-help"
                  name="emailSmarthost"
                  data-test-id="email-smarthost"
                  value={formValues.emailSmarthost}
                  onChange={handleChange}
                />
                <div className="help-block" id="email-smarthost-help">
                  Smarthost used for sending emails, including port number
                </div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label co-required">SMTP Hello</label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  aria-describedby="email-hello-help"
                  name="emailHello"
                  data-test-id="email-hello"
                  value={formValues.emailHello}
                  onChange={handleChange}
                />
                <div className="help-block" id="email-hello-help">
                  The hostname to identify to the SMTP server
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label">Auth Username</label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  aria-describedby="email-auth-username-help"
                  name="emailAuthUsername"
                  data-test-id="email-auth-username"
                  value={formValues.emailAuthUsername}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label">Auth Password (Using LOGIN and PLAIN)</label>
                <input
                  className="pf-c-form-control"
                  type="password"
                  aria-describedby="email-auth-password-help"
                  name="emailAuthPassword"
                  data-test-id="email-auth-password"
                  value={formValues.emailAuthPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label">Auth Identity (Using PLAIN)</label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  aria-describedby="email-auth-identity-help"
                  name="emailAuthIdentity"
                  data-test-id="email-auth-identity"
                  value={formValues.emailAuthIdentity}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="col-sm-6">
              <div className="form-group">
                <label className="control-label">Auth Secret (CRAM-MDS)</label>
                <input
                  className="pf-c-form-control"
                  type="password"
                  aria-describedby="email-auth-secret-help"
                  name="emailAuthSecret"
                  data-test-id="email-auth-secret"
                  value={formValues.emailAuthSecret}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <label className="co-no-bold">
            <input
              type="checkbox"
              name="emailRequireTls"
              onChange={(e) =>
                handleChange({
                  target: { name: 'emailRequireTls', value: e.target.checked },
                })
              }
              checked={formValues.emailRequireTls}
            />
            &nbsp; Require TLS
          </label>
        </div>
      </div>
    </div>
  );
};

export const getInitialValues = (globals, receiverConfig) => {
  const getInitialValue = (propName: string) =>
    _.get(receiverConfig, propName) || _.get(globals, `smtp_${propName}`) || '';

  const initValues: any = { [SAVE_AS_DEFAULT_FLD]: false };
  initValues.emailTo = _.get(receiverConfig, 'to') || '';

  _.forEach(SMTP_CONFIG_FIELDS, (propName) => {
    initValues[`${getFormFieldName(FORM_PREFIX, propName)}`] = getInitialValue(propName);
  });

  return initValues;
};

export const isFormInvalid = (formValues) => {
  return (
    _.isEmpty(formValues.emailTo) ||
    _.isEmpty(formValues.emailFrom) ||
    _.isEmpty(formValues.emailSmarthost) ||
    _.isEmpty(formValues.emailHello)
  );
};

const updateConfig = (config, globals, formValues, saveAsGlobal) =>
  // Only save SMTP config values to receiverConfig or global if formValue is defined and different from global property
  // If they are the same, don't save in receiverConfig so the global property will be used
  _.forEach(SMTP_CONFIG_FIELDS, (propName) => {
    const formValue = getFormValue(formValues, FORM_PREFIX, propName);
    const globalValue = getGlobalValue(globals, GLOBAL_PREFIX, propName);
    if (notEqualAndNotEmpty(formValue, globalValue)) {
      _.set(
        config,
        saveAsGlobal ? `smtp_${propName}` : propName,
        formValue,
        // TODO: does auth_secret need to be encoded?
        // propName === 'auth_secret' ? Base64.encode(formValue) : formValue,
      );
    }
  });

export const updateGlobals = (globals, formValues) => {
  const updatedGlobals = {};
  if (formValues[SAVE_AS_DEFAULT_FLD] === true) {
    updateConfig(updatedGlobals, globals, formValues, formValues[SAVE_AS_DEFAULT_FLD]);
  }
  return updatedGlobals;
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  _.set(receiverConfig, 'to', formValues.emailTo);

  if (formValues[SAVE_AS_DEFAULT_FLD] === false) {
    updateConfig(receiverConfig, globals, formValues, formValues[SAVE_AS_DEFAULT_FLD]);
  } else {
    // saving all smtp props as global, so remove them from existing receiver config
    _.forEach(SMTP_CONFIG_FIELDS, (propName) => {
      _.unset(receiverConfig, propName);
    });
  }

  return receiverConfig;
};
