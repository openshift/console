import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { FormGroup, TextInput, TextInputTypes } from '@patternfly/react-core';
import { SidebarInputWrapper } from './temp-utils';

type TaskSidebarNameProps = {
  initialName: string;
  onChange: (newName: string) => void;
  taskName: string;
};

const VALID_NAME = /^([a-z]([-a-z0-9]*[a-z0-9])?)*$/;

const getError = (value: string, t: TFunction): string | null => {
  let error = null;
  const INVALID_ERROR_MESSAGE = t(
    'pipelines-plugin~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
  );
  if (value === '') {
    error = t('pipelines-plugin~Required');
  } else if (!VALID_NAME.test(value)) {
    error = INVALID_ERROR_MESSAGE;
  }
  return error;
};

const TaskSidebarName: React.FC<TaskSidebarNameProps> = (props) => {
  const { t } = useTranslation();
  const { initialName, onChange, taskName } = props;
  const [interimName, setInterimName] = React.useState(initialName);
  const [error, setError] = React.useState(null);
  const isValid = !error;

  return (
    <FormGroup
      fieldId="task-name"
      label={t('pipelines-plugin~Display Name')}
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
            setError(getError(value, t));
          }}
          onBlur={() => {
            if (isValid) {
              onChange(interimName);
            }
          }}
          placeholder={taskName}
          type={TextInputTypes.text}
          value={interimName}
        />
      </SidebarInputWrapper>
    </FormGroup>
  );
};

export default TaskSidebarName;
