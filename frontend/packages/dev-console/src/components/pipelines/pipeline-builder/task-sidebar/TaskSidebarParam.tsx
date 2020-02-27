import * as React from 'react';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { PipelineResourceTaskParam, PipelineTaskParam } from '../../../../utils/pipeline-augment';

type TaskSidebarParamProps = {
  hasParamError?: boolean;
  resourceParam: PipelineResourceTaskParam;
  taskParam?: PipelineTaskParam;
  onChange: (newValue: string) => void;
};

const TaskSidebarParam: React.FC<TaskSidebarParamProps> = (props) => {
  const { hasParamError, onChange, resourceParam, taskParam } = props;
  const [dirty, setDirty] = React.useState(false);

  const currentValue = taskParam?.value?.toString() || '';
  const emptyIsInvalid = !resourceParam.default;

  const isValid = !(dirty && hasParamError && emptyIsInvalid && currentValue === '');

  return (
    <FormGroup
      fieldId={resourceParam.name}
      label={resourceParam.name}
      helperText={resourceParam.description}
      helperTextInvalid="Required"
      isValid={isValid}
      isRequired={emptyIsInvalid}
    >
      <TextInput
        id={resourceParam.name}
        isValid={isValid}
        isRequired={!resourceParam.default}
        onBlur={() => setDirty(true)}
        onChange={(value) => {
          onChange(value);
        }}
        placeholder={resourceParam.default}
        value={currentValue}
      />
    </FormGroup>
  );
};

export default TaskSidebarParam;
