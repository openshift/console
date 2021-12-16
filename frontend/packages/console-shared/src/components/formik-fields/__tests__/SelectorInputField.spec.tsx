import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { useFormikContext, useField } from 'formik';
import { SelectorInput } from '@console/internal/components/utils';
import SelectorInputField from '../SelectorInputField';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({})),
  useField: jest.fn(() => [{}, {}]),
}));

const useFormikContextMock = useFormikContext as jest.Mock;
const useFieldMock = useField as jest.Mock;

describe('SelectorInputField', () => {
  it('should use formik data to render child components', () => {
    const wrapper = shallow(
      <SelectorInputField
        name="field-name"
        label="a label"
        placeholder="a placeholder"
        dataTest="field-test-id"
      />,
    );

    expect(useFormikContextMock).toHaveBeenCalled();
    expect(useFieldMock).toHaveBeenCalled();

    // PatternFly FormGroup around the actual input field
    const formGroup = wrapper.find(FormGroup).first();
    expect(formGroup.props().fieldId).toBe('form-selector-field-name-field');
    expect(formGroup.props().label).toBe('a label');

    // Shared compontent
    const selectorInput = wrapper.find(SelectorInput).first();
    expect(selectorInput.props().onChange).toBeTruthy();
    expect(selectorInput.props().tags).toEqual([]);
    expect(selectorInput.props().inputProps).toEqual({
      id: 'form-selector-field-name-field',
      'data-test': 'field-test-id',
    });
  });

  it('should automatically convert objects to a tags-array', () => {
    useFieldMock.mockReturnValue([
      {
        value: {
          labelwithoutvalue: null,
          labelwithstring: 'a-string',
          labelwithboolean: true,
        },
      },
      {},
    ]);

    const wrapper = shallow(
      <SelectorInputField
        name="field-name"
        label="a label"
        placeholder="a placeholder"
        dataTest="field-test-id"
      />,
    );

    // PatternFly FormGroup around the actual input field
    const formGroup = wrapper.find(FormGroup).first();
    expect(formGroup.props().fieldId).toBe('form-selector-field-name-field');
    expect(formGroup.props().label).toBe('a label');

    // Shared compontent
    const selectorInput = wrapper.find(SelectorInput).first();
    expect(selectorInput.props().onChange).toBeTruthy();
    expect(selectorInput.props().tags).toEqual([
      'labelwithoutvalue',
      'labelwithstring=a-string',
      'labelwithboolean=true',
    ]);
    expect(selectorInput.props().inputProps).toEqual({
      id: 'form-selector-field-name-field',
      'data-test': 'field-test-id',
    });
  });

  it('should set formik objects when receiving tag-array change events', () => {
    const setFieldValueMock = jest.fn();
    const setFieldTouchedMock = jest.fn();
    useFormikContextMock.mockReturnValue({
      setFieldValue: setFieldValueMock,
      setFieldTouched: setFieldTouchedMock,
    });
    useFieldMock.mockReturnValue([
      {
        value: {
          labelwithoutvalue: null,
          labelwithstring: 'a-string',
          labelwithboolean: true,
        },
      },
      {},
    ]);

    const wrapper = shallow(
      <SelectorInputField
        name="field-name"
        label="a label"
        placeholder="a placeholder"
        dataTest="field-test-id"
      />,
    );

    // trigger onChange
    const selectorInput = wrapper.find(SelectorInput).first();
    selectorInput
      .props()
      .onChange([
        'another-labelwithoutvalue',
        'another-labelwithstring=a-string',
        'another-labelwithboolean=true',
      ]);

    // assert formik updates
    expect(setFieldValueMock).toHaveBeenCalledTimes(1);
    expect(setFieldValueMock).toHaveBeenCalledWith(
      'field-name',
      {
        'another-labelwithoutvalue': null,
        'another-labelwithstring': 'a-string',
        'another-labelwithboolean': 'true',
      },
      false,
    );

    expect(setFieldTouchedMock).toHaveBeenCalledTimes(1);
    expect(setFieldTouchedMock).toHaveBeenCalledWith('field-name', true, true);
  });
});
