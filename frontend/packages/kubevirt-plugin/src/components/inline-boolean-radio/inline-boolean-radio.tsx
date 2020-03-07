import * as React from 'react';
import { Split, SplitItem } from '@patternfly/react-core';
import { prefixedID } from '../../utils';

import './inline-boolean-radio.scss';

type InlineBooleanRadioProps = {
  id: any;
  isDisabled: boolean;
  firstOptionLabel: string;
  secondOptionLabel: string;
  firstOptionChecked: boolean;
  onChange: (isFirstOptionSelected) => void;
};

export const InlineBooleanRadio: React.FC<InlineBooleanRadioProps> = ({
  id,
  isDisabled,
  firstOptionLabel,
  secondOptionLabel,
  firstOptionChecked,
  onChange,
}) => {
  const onFirstOptionChanged = React.useCallback(() => onChange(true), [onChange]);
  const onSecondOptionChanged = React.useCallback(() => onChange(false), [onChange]);

  const firstOptionID = prefixedID(id, 'first-option');
  const secondOptionID = prefixedID(id, 'second-option');
  return (
    <Split>
      <SplitItem>
        <input
          type="radio"
          disabled={isDisabled}
          checked={firstOptionChecked}
          name={id}
          onChange={onFirstOptionChanged}
          id={firstOptionID}
          className="kubevirt-inline-boolean-radio__first-option-radio"
        />
        <label
          htmlFor={firstOptionID}
          className="kubevirt-inline-boolean-radio__first-option-label"
        >
          {firstOptionLabel}
        </label>
      </SplitItem>
      <SplitItem isFilled className="kubevirt-inline-boolean-radio__second-option-wrapper">
        <input
          type="radio"
          disabled={isDisabled}
          checked={!firstOptionChecked}
          name={id}
          onChange={onSecondOptionChanged}
          id={secondOptionID}
          className="kubevirt-inline-boolean-radio__second-option-radio"
        />
        <label
          htmlFor={secondOptionID}
          className="kubevirt-inline-boolean-radio__second-option-label"
        >
          {secondOptionLabel}
        </label>
      </SplitItem>
    </Split>
  );
};
