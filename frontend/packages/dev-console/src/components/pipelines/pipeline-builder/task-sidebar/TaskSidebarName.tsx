import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, TextInput, TextInputTypes } from '@patternfly/react-core';
import { SidebarInputWrapper } from './field-utils';

type TaskSidebarNameProps = {
  name: string;
  placeholder: string;
  onChange: (newName: string) => void;
};

// TODO: Fix the visualization dependency on name for the id and we can fully use Formik
const VALID_NAME = /^([a-z]([-a-z0-9]*[a-z0-9])?)*$/;
const INVALID_ERROR_MESSAGE =
  'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.';

const getError = (value: string): string | null => {
  let error = null;
  if (value === '') {
    error = 'Required';
  } else if (!VALID_NAME.test(value)) {
    error = INVALID_ERROR_MESSAGE;
  }
  return error;
};

const TaskSidebarName: React.FC<TaskSidebarNameProps> = (props) => {
  const { name, placeholder, onChange } = props;
  const [field] = useField(name);
  const [interimName, setInterimName] = React.useState<string>(field.value);
  const [error, setError] = React.useState(null);
  const isValid = !error;

  return (
    <FormGroup
      fieldId="task-name"
      label="Display Name"
      helperTextInvalid={error}
      validated={isValid ? 'default' : 'error'}
      isRequired
    >
      <SidebarInputWrapper>
        <TextInput
          id="task-name"
          validated={isValid ? 'default' : 'error'}
          isRequired
          onChange={(value) => {
            setInterimName(value);
            setError(getError(value));
          }}
          onBlur={() => {
            if (isValid) {
              onChange(interimName);
            }
          }}
          placeholder={placeholder}
          type={TextInputTypes.text}
          value={interimName}
        />
      </SidebarInputWrapper>
    </FormGroup>
  );
};

export default TaskSidebarName;
