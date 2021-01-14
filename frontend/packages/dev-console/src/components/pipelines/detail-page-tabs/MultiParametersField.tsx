import * as React from 'react';
import { useState } from 'react';
import * as _ from 'lodash';
import { FieldArray, useFormikContext, FormikValues } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, DropdownField } from '@console/shared';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
export const MultiParametersField: React.FC<MultiParametersFieldProps> = ({ name }) => {
  const { values } = useFormikContext<FormikValues>();
  const fieldValue = _.get(values, name, []);
  const defaultItem = {
    name: '',
    description: '',
    type: '',
    default: '',
  };

  return (
    <FieldArray
      name={name}
      render={({ push, remove }) => {
        return (
          <FormGroup fieldId={`form-multi-column-input-${name.replace(/\./g, '-')}-field`}>
            {fieldValue.length > 0 &&
              fieldValue.map((value, index) => (
                <div className="parameter-input-field-wrapper" key={`${name}-${index}-inputFieldWrapper`}>
                  <div className="remove-button-wrapper">
                    <Button
                      className="pf-m-link remove-button"
                      data-test-id="pairs-list__delete-btn"
                      onClick={() => {
                        remove(index);
                      }}
                      type="button"
                      variant="link"
                    >
                      <MinusCircleIcon data-test-id="pairs-list__delete-icon" className="pairs-list__side-btn pairs-list__delete-ico co-icon-space-r" />
                      Remove Pipeline Parameter
                    </Button>
                  </div>
                  <InputSection label="Name" customClass="short-margin-top" isRequired={true}>
                    <InputField name={`${name}.${index}.name`} type={TextInputTypes.text} placeholder="Name" />
                  </InputSection>
                  <InputSection label="Description">
                    <InputField name={`${name}.${index}.description`} type={TextInputTypes.text} placeholder="Description" />
                  </InputSection>
                  <InputSection label="Type">
                    <DropdownValueComponent nameValue={`${name}.${index}`}></DropdownValueComponent>
                  </InputSection>
                </div>
              ))}
            <div className="add-button-wrapper">
              <Button
                className="pf-m-link--align-left"
                data-test-id="pairs-list__add-btn"
                onClick={() => {
                  push(defaultItem);
                }}
                type="button"
                variant="link"
              >
                <PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />
                Add Pipeline Parameter
              </Button>
            </div>
          </FormGroup>
        );
      }}
    />
  );
};
const DropdownValueComponent: React.FC<DropdownValueComponentProps> = props => {
  const { nameValue } = props;
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const [valueType, setValueType] = useState('');
  const renderValueField = (valueType, name) => {
    if (valueType === '') {
      valueType = _.get(values, `${name}.type`);
    }
    switch (valueType) {
      case 'string': {
        return (
          <InputSection label="Default Value" customClass="input-section-without-margin-left">
            <InputField name={`${name}.default`} type={TextInputTypes.text} placeholder="Default Value" />
          </InputSection>
        );
      }
      case 'array': {
        let arrayFieldValue = _.get(values, `${name}.default`, []);
        arrayFieldValue = arrayFieldValue === '' ? [] : arrayFieldValue;
        return (
          <InputSection label="Default Value">
            <FieldArray
              name={`${name}.default`}
              render={({ push, remove }) => {
                return (
                  <FormGroup fieldId={`form-multi-column-input-${name.replace(/\./g, '-')}-field`}>
                    {arrayFieldValue.length > 0 &&
                      arrayFieldValue.map((value, index) => (
                        <div key={`${name}-default-${index}-inputWrapper`} id="parameter-array-row-input-wrapper">
                          <InputField className="input-field" name={`${name}.default.${index}`} type={TextInputTypes.text} placeholder="Default Value" />
                          <Button
                            className="pf-m-link remove-button"
                            data-test-id="pairs-list__delete-btn"
                            onClick={() => {
                              remove(index);
                            }}
                            type="button"
                            variant="link"
                          >
                            <MinusCircleIcon data-test-id="pairs-list__delete-icon" className="pairs-list__side-btn pairs-list__delete-ico delete-button" />
                          </Button>
                        </div>
                      ))}
                    <Button
                      className="pf-m-link--align-left space-left"
                      data-test-id="pairs-list__add-btn"
                      onClick={() => {
                        push('');
                      }}
                      type="button"
                      variant="link"
                    >
                      <PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />
                      Add Default Value
                    </Button>
                  </FormGroup>
                );
              }}
            />
          </InputSection>
        );
      }
      default: {
        return null;
      }
    }
  };

  return (
    <div>
      <DropdownField
        fullWidth
        items={pipelineParameterTypeSelections}
        name={`${nameValue}.type`}
        onChange={data => {
          switch (data) {
            case 'string': {
              setFieldValue(`${nameValue}.default`, '');
              break;
            }
            case 'array': {
              setFieldValue(`${nameValue}.default`, []);
              break;
            }
            default: {
            }
          }
          setValueType(data);
        }}
      />
      {renderValueField(valueType, nameValue)}
    </div>
  );
};
const InputSection: React.FC<InputSectionProps> = ({ label, isRequired, children, customClass = '' }) => {
  return (
    <div className={'form-group parameter-input-section-wrapper ' + customClass}>
      <label className={'control-label ' + (isRequired ? 'co-required' : '')}>{label}</label>
      <div className="row">{children}</div>
    </div>
  );
};

export const pipelineParameterTypeSelections = {
  '': 'Select resource type',
  string: 'String',
  array: 'Array',
};
type DropdownValueComponentProps = {
  nameValue: string;
};
type InputSectionProps = {
  label?: string;
  isRequired?: boolean;
  children?: React.ReactNode;
  customClass?: string;
};
type MultiParametersFieldProps = {
  name: string;
  children?: React.ReactNode;
  addLabel?: string;
  defaultItem?: object;
};
export default MultiParametersField;
