/* eslint-disable camelcase */
import * as _ from 'lodash-es';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { SendResolvedAlertsCheckbox } from './send-resolved-alerts-checkbox';
import { FormProps } from './receiver-form-props';
import {
  FormGroup,
  FormHelperText,
  HelperTextItem,
  HelperText,
  TextInput,
} from '@patternfly/react-core';
import { AdvancedConfiguration } from './advanced-configuration';

export const Form: FC<FormProps> = ({ formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <>
      <FormGroup label={t('public~URL')} fieldId="webhook-url" isRequired>
        <TextInput
          id="webhook-url"
          data-test="webhook-url"
          value={formValues.webhookUrl ?? ''}
          onChange={(_e, value: string) =>
            dispatchFormChange({ type: 'setFormValues', payload: { webhookUrl: value } })
          }
          aria-describedby="webhook-url-help"
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem id="webhook-url-help">
              {t('public~The endpoint to send HTTP POST requests to.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <AdvancedConfiguration>
        <SendResolvedAlertsCheckbox
          formField="webhookSendResolved"
          formValues={formValues}
          dispatchFormChange={dispatchFormChange}
        />
      </AdvancedConfiguration>
    </>
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
