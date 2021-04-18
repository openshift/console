import * as React from 'react';
import { useFormikContext } from 'formik';
import { TektonParam } from '../../../../types';
import { taskParamIsRequired } from '../utils';
import { TextAreaField, TextColumnField } from '@console/shared';
import { PipelineBuilderFormikValues, SelectedBuilderTask } from '../types';
import AutoCompletePopover from '../../../shared/common/auto-complete/AutoCompletePopover';
import { useBuilderParams } from '../../../shared/common/auto-complete/autoCompleteValueParsers';

type TaskSidebarParamProps = {
  hasParam: boolean;
  name: string;
  resourceParam: TektonParam;
  selectedData?: SelectedBuilderTask;
};

const TaskSidebarParam: React.FC<TaskSidebarParamProps> = (props) => {
  const { setFieldValue } = useFormikContext<PipelineBuilderFormikValues>();
  const { hasParam, name, resourceParam, selectedData } = props;
  const autoCompleteOptions = useBuilderParams(selectedData);

  const emptyIsInvalid = taskParamIsRequired(resourceParam);

  const resourceParamName = resourceParam.name;
  const setValue = React.useCallback(
    (value: string) => {
      setFieldValue(name, { name: resourceParamName, value });
    },
    [name, setFieldValue, resourceParamName],
  );

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
    <AutoCompletePopover autoCompleteValues={autoCompleteOptions} onAutoComplete={setValue}>
      {(ref) => (
        <TextAreaField
          ref={ref}
          name={fieldValue}
          label={resourceParam.name}
          placeholder={resourceParam.default as string}
          helpText={resourceParam.description}
          required={emptyIsInvalid}
          onChange={(value: string) => {
            if (!hasParam) {
              setValue(value);
            }
          }}
          rows={1}
          resizeOrientation="vertical"
          style={{ minHeight: 33 }}
        />
      )}
    </AutoCompletePopover>
  );
};

export default TaskSidebarParam;
