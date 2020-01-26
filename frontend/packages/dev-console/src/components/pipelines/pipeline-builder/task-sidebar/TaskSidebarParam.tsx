import * as React from 'react';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { PipelineResourceTaskParam, PipelineTaskParam } from '../../../../utils/pipeline-augment';

type TaskSidebarParamProps = {
  resourceParam: PipelineResourceTaskParam;
  taskParam?: PipelineTaskParam;
  onChange: (newValue: string) => void;
};

const TaskSidebarParam: React.FC<TaskSidebarParamProps> = (props) => {
  const { onChange, resourceParam, taskParam } = props;

  return (
    <FormGroup
      fieldId={resourceParam.name}
      label={resourceParam.name}
      helperText={resourceParam.description}
      // helperTextInvalid={errorMessage}
      // isValid={isValid}
      isRequired={!resourceParam.default}
    >
      <TextInput
        id={resourceParam.name}
        isRequired={!resourceParam.default}
        value={taskParam.value?.toString() || resourceParam.default || ''}
        onChange={(value) => {
          onChange(value);
        }}
      />
    </FormGroup>
  );
};

export default TaskSidebarParam;
