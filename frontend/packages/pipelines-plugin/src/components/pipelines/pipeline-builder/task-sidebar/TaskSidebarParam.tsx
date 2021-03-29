import * as React from 'react';
import { useFormikContext } from 'formik';
import { TektonParam } from '../../../../types';
import { taskParamIsRequired } from '../utils';
import { TextAreaField, TextColumnField } from '@console/shared';
import { PipelineBuilderFormikValues } from '../types';

type TaskSidebarParamProps = {
  hasParam: boolean;
  name: string;
  resourceParam: TektonParam;
};

const TaskSidebarParam: React.FC<TaskSidebarParamProps> = (props) => {
  const { setFieldValue } = useFormikContext<PipelineBuilderFormikValues>();
  const { hasParam, name, resourceParam } = props;
  const emptyIsInvalid = taskParamIsRequired(resourceParam);

  const fieldValue = `${name}.value`;
  return resourceParam.type === 'array' ? (
    <TextColumnField
      name={fieldValue}
      label={resourceParam.name}
      required={emptyIsInvalid}
      onChange={(values: string[]) => {
        if (!hasParam) {
          setFieldValue(name, { name: resourceParam.name, value: values });
        }
      }}
    />
  ) : (
    <TextAreaField
      name={fieldValue}
      label={resourceParam.name}
      placeholder={resourceParam.default as string}
      helpText={resourceParam.description}
      required={emptyIsInvalid}
      onChange={(value: string) => {
        if (!hasParam) {
          setFieldValue(name, { name: resourceParam.name, value });
        }
      }}
      rows={1}
      resizeOrientation="vertical"
      style={{ minHeight: 33 }}
    />
  );
};

export default TaskSidebarParam;
