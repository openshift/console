import * as React from 'react';
import { FieldArray } from 'formik';
import {
  Flex,
  FlexItem,
  FormGroup,
  TextInputTypes,
  ValidatedOptions,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { global_disabled_color_200 as disabledColor } from '@patternfly/react-tokens';
import { InputField } from '@console/shared';
import MultiColumnFieldFooter from '@console/shared/src/components/formik-fields/multi-column-field/MultiColumnFieldFooter';
import { PipelineResourceTaskParam } from '../../../../utils/pipeline-augment';

type TaskSidebarParamArrayProps = {
  isRequired: boolean;
  isValid: boolean;
  name: string;
  resourceParam: PipelineResourceTaskParam;
  values: string[];
};

/**
 * @deprecated
 * TODO: Replace with frontend/packages/console-shared/src/components/formik-fields/TextColumnField.tsx
 * Once https://github.com/openshift/console/pull/4931 is merged
 */
const TaskSidebarParamArray: React.FC<TaskSidebarParamArrayProps> = (props) => {
  const { isRequired, isValid, name, resourceParam, values } = props;

  if (!values) {
    return null;
  }

  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => {
        return (
          <>
            <FormGroup
              fieldId={resourceParam.name}
              label={resourceParam.name}
              validated={isValid ? ValidatedOptions.success : ValidatedOptions.error}
              isRequired={isRequired}
            >
              {values.map((v, idx) => {
                return (
                  <Flex
                    key={`${idx.toString()}`}
                    style={{ marginBottom: 'var(--pf-global--spacer--xs)' }}
                  >
                    <FlexItem grow={{ default: 'grow' }}>
                      <InputField type={TextInputTypes.text} name={`${name}.${idx}`} />
                    </FlexItem>
                    <FlexItem>
                      <MinusCircleIcon
                        aria-hidden="true"
                        style={{ color: values.length === 1 ? disabledColor.value : null }}
                        onClick={(e) => {
                          e.stopPropagation();
                          arrayHelpers.remove(idx);
                        }}
                      />
                    </FlexItem>
                  </Flex>
                );
              })}
            </FormGroup>
            <p
              className="pf-c-form__helper-text"
              style={{ marginBottom: 'var(--pf-global--spacer--sm)' }}
            >
              {resourceParam.description}
            </p>
            <MultiColumnFieldFooter
              addLabel="Add another value"
              onAdd={() => {
                arrayHelpers.push('');
              }}
            />
          </>
        );
      }}
    />
  );
};

export default TaskSidebarParamArray;
