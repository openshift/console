import * as React from 'react';
import { FormGroup, TextInput, TextInputTypes } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { nameValidationSchema } from '@console/shared';
import { STATUS_KEY_NAME_ERROR } from '../const';
import { NameErrorStatus, PipelineBuilderFormikValues } from '../types';

type TaskSidebarNameProps = {
  name: string;
  onChange: (newName: string) => void;
  taskName: string;
};

const TaskSidebarName: React.FC<TaskSidebarNameProps> = (props) => {
  const { t } = useTranslation();
  const { name, onChange, taskName } = props;
  const { setStatus, status, values } = useFormikContext<PipelineBuilderFormikValues>();
  const {
    formData: { tasks, finallyTasks },
  } = values;
  const initialName: string = _.get(values, name, taskName);
  const statusPath: string[] = [STATUS_KEY_NAME_ERROR, name];
  const { nameError, errorMessage }: NameErrorStatus = _.get(status, statusPath, {});
  const [interimName, setInterimName] = React.useState(nameError ?? initialName);
  const [validating, setValidating] = React.useState(null);
  const isValid = !errorMessage;
  const reservedNames: string[] = [...tasks, ...finallyTasks]
    .map(({ name: usedName }) => usedName)
    .filter((usedName) => usedName !== initialName);

  const saveErrorState = (value: string, message: string) => {
    setStatus({
      ...status,
      [STATUS_KEY_NAME_ERROR]: {
        ...(status?.[STATUS_KEY_NAME_ERROR] || {}),
        // `name` stored as a path string intentionally
        [name]: {
          nameError: value,
          errorMessage: message,
        },
      },
    });
  };
  const clearErrorState = () => {
    setStatus({
      ...status,
      [STATUS_KEY_NAME_ERROR]: _.omit(status?.[STATUS_KEY_NAME_ERROR], name),
    });
  };

  return (
    <FormGroup
      fieldId="task-name"
      label={t('pipelines-plugin~Display name')}
      helperTextInvalid={errorMessage}
      validated={isValid ? 'default' : 'error'}
      isRequired
    >
      <TextInput
        data-test={`task-name ${interimName}`}
        id="task-name"
        validated={isValid ? 'default' : 'error'}
        isRequired
        onChange={(value) => {
          setInterimName(value);

          if (reservedNames.includes(value)) {
            saveErrorState(value, t('pipelines-plugin~This name is already in use.'));
            return;
          }

          setValidating(true);
          nameValidationSchema(t, 63)
            .validate(value)
            .then(() => {
              clearErrorState();
              setValidating(false);
            })
            .catch((err) => {
              saveErrorState(value, err?.message || t('pipelines-plugin~Required'));
              setValidating(false);
            });
        }}
        onBlur={() => {
          if (!validating && isValid) {
            onChange(interimName);
          }
        }}
        placeholder={taskName}
        type={TextInputTypes.text}
        value={interimName}
      />
    </FormGroup>
  );
};

export default TaskSidebarName;
