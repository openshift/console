import * as React from 'react';
import { InputGroup, InputGroupText, TextInput } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';

import './grace-period-input.scss';

const DEFAULT_GRACE_PERIOD = 180;

interface GracePeriodInputProps {
  gracePeriodSeconds: number;
  setGracePeriodSeconds: (number) => void;
}

export const GracePeriodInput: React.FC<GracePeriodInputProps> = ({
  gracePeriodSeconds,
  setGracePeriodSeconds,
}) => {
  const { t } = useTranslation();
  const onGracePeriodCheckChange = (event: React.FormEvent<HTMLInputElement>) => {
    if (event.currentTarget.checked) setGracePeriodSeconds(DEFAULT_GRACE_PERIOD);
    else setGracePeriodSeconds(null);
  };

  const onGracePeriodSecondsChange = (value: string) => {
    if (value === '') {
      setGracePeriodSeconds(0);
    } else {
      setGracePeriodSeconds(parseInt(value, 10));
    }
  };

  const isChecked = !_.isNil(gracePeriodSeconds);

  return (
    <div className="checkbox grace-period-input">
      <label className="control-label">
        <input
          data-test="grace-period-checkbox"
          type="checkbox"
          onChange={onGracePeriodCheckChange}
          checked={isChecked}
        />
        {t('kubevirt-plugin~With Grace Period')}

        <FieldLevelHelp>
          {t(
            'kubevirt-plugin~The duration in seconds before the object should be deleted. Value must be non-negative integer. The value zero indicates delete immediately. If this value is nil, the default grace period for the specified type will be used. Defaults to a per object value if not specified. zero means delete immediately.',
          )}
        </FieldLevelHelp>
      </label>
      {isChecked && (
        <InputGroup className="grace-period-input__input-group">
          <TextInput
            type="number"
            value={gracePeriodSeconds}
            onChange={onGracePeriodSecondsChange}
            min={0}
            aria-label={t('kubevirt-plugin~seconds')}
            data-test="grace-period-seconds-input"
          />
          <InputGroupText>{t('kubevirt-plugin~seconds')}</InputGroupText>
        </InputGroup>
      )}
    </div>
  );
};
