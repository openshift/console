import * as classNames from 'classnames';
import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { BlueInfoCircleIcon } from '@console/shared';

export const SaveAsDefaultCheckbox: React.FC<SaveAsDefaultCheckboxProps> = ({
  formField,
  disabled,
  label,
  formValues,
  dispatchFormChange,
  tooltip,
}) => {
  const saveAsDefaultLabelClass = classNames('checkbox', { 'co-no-bold': disabled });
  return (
    <label className={saveAsDefaultLabelClass} htmlFor={formField}>
      <input
        type="checkbox"
        id={formField}
        data-test-id="save-as-default"
        onChange={(e) =>
          dispatchFormChange({
            type: 'setFormValues',
            payload: { [formField]: e.target.checked },
          })
        }
        checked={formValues[formField]}
        aria-checked={formValues[formField]}
        disabled={disabled}
        aria-disabled={disabled}
      />
      <span className="co-alert-manager-config__save-as-default-label">{label}</span>
      <Tooltip content={<p>{tooltip}</p>}>
        <BlueInfoCircleIcon />
      </Tooltip>
    </label>
  );
};

type SaveAsDefaultCheckboxProps = {
  formField: string;
  disabled: boolean;
  label: string;
  formValues: { [key: string]: any };
  dispatchFormChange: Function;
  tooltip: string;
};
