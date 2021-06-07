import * as React from 'react';
import { useFormikContext } from 'formik';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { FormGroup, TextInput, TextInputTypes } from '@patternfly/react-core';
import { nameValidationSchema } from '@console/shared';
import { PipelineBuilderFormikValues } from '../types';

type TaskSidebarNameProps = {
  initialName: string;
  onChange: (newName: string) => void;
  taskName: string;
};

const TaskSidebarName: React.FC<TaskSidebarNameProps> = (props) => {
  const { t } = useTranslation();
  const { initialName, onChange, taskName } = props;
  const {
    values: {
      formData: { tasks, finallyTasks },
    },
  } = useFormikContext<PipelineBuilderFormikValues>();
  const [interimName, setInterimName] = React.useState(initialName);
  const [error, setError] = React.useState(null);
  const [validating, setValidating] = React.useState(null);
  const isValid = !error;
  const reservedNames = [...tasks, ...finallyTasks].map(({ name }) => name);

  return (
    <FormGroup
      fieldId="task-name"
      label={t('pipelines-plugin~Display name')}
      helperTextInvalid={error}
      validated={isValid ? 'default' : 'error'}
      isRequired
    >
      <TextInput
        id="task-name"
        validated={isValid ? 'default' : 'error'}
        isRequired
        onChange={(value) => {
          setInterimName(value);

          if (reservedNames.includes(value)) {
            setError(t('pipelines-plugin~Name is already in use'));
            return;
          }

          setValidating(true);
          nameValidationSchema((tKey) => i18n.t(tKey), 63)
            .validate(value)
            .then(() => {
              setError(null);
              setValidating(false);
            })
            .catch((err) => {
              setError(err?.message || t('pipelines-plugin~Required'));
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
