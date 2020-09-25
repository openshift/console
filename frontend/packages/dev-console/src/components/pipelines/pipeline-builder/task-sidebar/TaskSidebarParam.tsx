import * as React from 'react';
import { FormGroup, ValidatedOptions } from '@patternfly/react-core';
import { PipelineResourceTaskParam, PipelineTaskParam } from '../../../../utils/pipeline-augment';
import { taskParamIsRequired, isFieldValid } from '../utils';
import { ArrayParam, ParameterProps, SidebarInputWrapper, StringParam } from './temp-utils';

type TaskSidebarParamProps = {
  resourceParam: PipelineResourceTaskParam;
  taskParam?: PipelineTaskParam;
  onChange: (newValue: string) => void;
};

const TaskSidebarParam: React.FC<TaskSidebarParamProps> = (props) => {
  const { onChange, resourceParam, taskParam } = props;
  const [dirty, setDirty] = React.useState(false);

  const currentValue = taskParam?.value;
  const emptyIsInvalid = taskParamIsRequired(resourceParam);

  const isValid = isFieldValid(currentValue, dirty, emptyIsInvalid);

  const paramRenderProps: ParameterProps = {
    currentValue,
    defaultValue: resourceParam.default,
    isValid,
    dirty,
    emptyIsInvalid,
    name: resourceParam.name,
    onChange,
    setDirty,
  };

  return resourceParam.type === 'array' ? (
    <ArrayParam {...paramRenderProps} description={resourceParam.description} />
  ) : (
    <FormGroup
      fieldId={resourceParam.name}
      label={resourceParam.name}
      helperText={resourceParam.description}
      helperTextInvalid="Required"
      validated={isValid ? ValidatedOptions.default : ValidatedOptions.error}
      isRequired={emptyIsInvalid}
    >
      <SidebarInputWrapper>
        <StringParam {...paramRenderProps} />
      </SidebarInputWrapper>
    </FormGroup>
  );
};

export default TaskSidebarParam;
