import * as React from 'react';
import { useTranslation } from 'react-i18next';

export const SendResolvedAlertsCheckbox = ({ formField, formValues, dispatchFormChange }) => {
  const { t } = useTranslation();
  return (
    <div className="checkbox">
      <label className="control-label" htmlFor={formField}>
        <input
          type="checkbox"
          id={formField}
          data-test-id="send-resolved-alerts"
          onChange={(e) =>
            dispatchFormChange({
              type: 'setFormValues',
              payload: { [formField]: e.target.checked },
            })
          }
          checked={formValues[formField]}
          aria-checked={formValues[formField]}
        />
        {t('public~Send resolved alerts to this receiver?')}
      </label>
    </div>
  );
};
