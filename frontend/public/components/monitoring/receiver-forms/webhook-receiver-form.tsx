/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { ExpandCollapse } from '../../utils';
import { SendResolvedAlertsCheckbox, FormProps } from './alert-manager-receiver-forms';

export const Form: React.FC<FormProps> = ({ formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <div data-test-id="webhook-receiver-form" className="form-group">
      <label className="control-label co-required" htmlFor="webhook-url">
        {t('webhook-receiver-form~URL')}
      </label>
      <input
        className="pf-c-form-control"
        type="text"
        aria-describedby="webhook-url-help"
        id="webhook-url"
        data-test-id="webhook-url"
        value={formValues.webhookUrl}
        onChange={(e) =>
          dispatchFormChange({
            type: 'setFormValues',
            payload: { webhookUrl: e.target.value },
          })
        }
      />
      <div className="help-block" id="webhook-url-help">
        {t('webhook-receiver-form~The endpoint to send HTTP POST requests to.')}
      </div>
      <div className="form-group">
        <ExpandCollapse
          textCollapsed={t('webhook-receiver-form~Show advanced configuration')}
          textExpanded={t('webhook-receiver-form~Hide advanced configuration')}
        >
          <div className="co-form-subsection">
            <div className="form-group">
              <SendResolvedAlertsCheckbox
                formField="webhookSendResolved"
                formValues={formValues}
                dispatchFormChange={dispatchFormChange}
              />
            </div>
          </div>
        </ExpandCollapse>
      </div>
    </div>
  );
};

export const getInitialValues = (globals, receiverConfig) => {
  return {
    webhookUrl: receiverConfig?.url || '',
    webhookSendResolved: _.get(receiverConfig, 'send_resolved', globals?.webhook_send_resolved),
  };
};

export const isFormInvalid = (formValues) => {
  return !formValues.webhookUrl;
};

export const updateGlobals = () => {
  return {};
};

export const createReceiverConfig = (globals, formValues, receiverConfig) => {
  _.set(receiverConfig, 'url', formValues.webhookUrl);

  if (formValues.webhookSendResolved !== globals.webhook_send_resolved) {
    _.set(receiverConfig, 'send_resolved', formValues?.webhookSendResolved);
  } else {
    _.unset(receiverConfig, 'send_resolved'); // equals global, unset in config so global is used
  }

  return receiverConfig;
};
