import * as React from 'react';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { global_disabled_color_200 as disabledColor } from '@patternfly/react-tokens';
import { Flex, FlexItem, TextInput, Tooltip } from '@patternfly/react-core';
import MultiColumnFieldFooter from '@console/shared/src/components/formik-fields/multi-column-field/MultiColumnFieldFooter';

export type ParamValueType = string | string[];
export type ParameterProps = {
  currentValue: ParamValueType;
  defaultValue: ParamValueType;
  description?: string;
  isValid: boolean;
  name: string;
  onChange: (value: ParamValueType) => void;
  setDirty: (dirty: boolean) => void;
};

export const StringParam: React.FC<ParameterProps> = (props) => {
  const { currentValue, defaultValue, isValid, name, onChange, setDirty } = props;

  return (
    <TextInput
      id={name}
      validated={isValid ? 'default' : 'error'}
      isRequired={!defaultValue}
      onBlur={() => setDirty(true)}
      onChange={(value) => {
        onChange(value);
      }}
      placeholder={defaultValue as string}
      value={(currentValue || '') as string}
    />
  );
};

export const ArrayParam: React.FC<ParameterProps> = (props) => {
  const { currentValue, defaultValue, description, name, onChange, setDirty } = props;

  const values = (currentValue || defaultValue || ['']) as string[];

  return (
    <>
      {values.map((value, index) => {
        return (
          <Flex
            key={`${index.toString()}`}
            style={{ marginBottom: 'var(--pf-global--spacer--xs)' }}
          >
            <FlexItem grow={{ default: 'grow' }}>
              <StringParam
                {...props}
                name={`${name}-${index}`}
                currentValue={value}
                onChange={(changedValue: string) => {
                  const newValues: string[] = [...values];
                  newValues[index] = changedValue;
                  onChange(newValues);
                }}
              />
            </FlexItem>
            <FlexItem>
              <Tooltip content="Remove">
                <MinusCircleIcon
                  aria-hidden="true"
                  style={{ color: values.length === 1 ? disabledColor.value : null }}
                  onClick={() => {
                    if (values.length === 1) {
                      return;
                    }

                    setDirty(true);
                    setTimeout(
                      () => onChange([...values.slice(0, index), ...values.slice(index + 1)]),
                      0,
                    );
                  }}
                />
              </Tooltip>
            </FlexItem>
          </Flex>
        );
      })}
      <p
        className="pf-c-form__helper-text"
        style={{ marginBottom: 'var(--pf-global--spacer--sm)' }}
      >
        {description}
      </p>
      <MultiColumnFieldFooter
        onAdd={() => {
          setDirty(true);
          onChange([...values, '']);
        }}
      />
    </>
  );
};

export const SidebarInputWrapper: React.FC = ({ children }) => {
  return <div style={{ width: 'calc(100% - 28px)' }}>{children}</div>;
};
