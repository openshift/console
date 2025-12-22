import type { FC } from 'react';
import { Checkbox, FormGroup } from '@patternfly/react-core';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';

export const SaveAsDefaultCheckbox: FC<SaveAsDefaultCheckboxProps> = ({
  formField,
  disabled,
  label,
  formValues,
  dispatchFormChange,
  tooltip,
}) => {
  return (
    <FormGroup>
      <Checkbox
        label={
          <>
            {label}
            <FieldLevelHelp>{tooltip}</FieldLevelHelp>
          </>
        }
        isChecked={formValues[formField]}
        isDisabled={disabled}
        onChange={(_e, checked) =>
          dispatchFormChange({
            type: 'setFormValues',
            payload: { [formField]: checked },
          })
        }
        id={formField}
        data-test="save-as-default"
      />
    </FormGroup>
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
