import * as React from 'react';
import { useField } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import { PipelineResourceTaskParam } from '../../../../utils/pipeline-augment';
import { SidebarInputWrapper } from './field-utils';
import TaskSidebarParamArray from './TaskSidebarParamArray';

type TaskSidebarParamProps = {
  name: string;
  resourceParam: PipelineResourceTaskParam;
};

const TaskSidebarParam: React.FC<TaskSidebarParamProps> = (props) => {
  const { name: paramName, resourceParam } = props;
  const name = `${paramName}.value`;
  const [{ value }, { error, touched }] = useField<string | string[]>(name);
  const isRequired = !resourceParam.default;

  return resourceParam.type === 'array' ? (
    <TaskSidebarParamArray
      isRequired={isRequired}
      isValid={touched && !error}
      name={name}
      resourceParam={resourceParam}
      values={value as string[]}
    />
  ) : (
    <SidebarInputWrapper>
      <InputField
        label={resourceParam.name}
        helpText={resourceParam.description}
        type={TextInputTypes.text}
        name={name}
        placeholder={resourceParam.default as string}
        required={isRequired}
      />
    </SidebarInputWrapper>
  );
};

export default TaskSidebarParam;
