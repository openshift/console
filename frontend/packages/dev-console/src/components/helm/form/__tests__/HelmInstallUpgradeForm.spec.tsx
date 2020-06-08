import * as React from 'react';
import { shallow } from 'enzyme';
import { InputField, YAMLEditorField } from '@console/shared';
import HelmInstallUpgradeForm from '../HelmInstallUpgradeForm';

let helmInstallUpgradeFormProps: React.ComponentProps<typeof HelmInstallUpgradeForm>;

describe('HelmInstallUpgradeForm', () => {
  helmInstallUpgradeFormProps = {
    chartHasValues: true,
    helmAction: 'Install',
    values: {
      helmReleaseName: 'helm-release',
      chartName: 'helm-release',
      chartValuesYAML: 'chart-yaml-values',
      chartVersion: '',
    },
    errors: {},
    touched: {},
    isValid: true,
    initialValues: {
      helmReleaseName: 'helm-release',
      chartName: 'helm-release',
      chartValuesYAML: 'chart-yaml-values',
      chartVersion: '0.3',
    },
    isSubmitting: true,
    isValidating: true,
    status: {},
    submitCount: 0,
    dirty: false,
    getFieldProps: jest.fn(),
    handleBlur: jest.fn(),
    handleChange: jest.fn(),
    handleReset: jest.fn(),
    handleSubmit: jest.fn(),
    initialErrors: {},
    initialStatus: {},
    initialTouched: {},
    registerField: jest.fn(),
    resetForm: jest.fn(),
    setErrors: jest.fn(),
    setFieldError: jest.fn(),
    setFieldTouched: jest.fn(),
    setFieldValue: jest.fn(),
    setFormikState: jest.fn(),
    setStatus: jest.fn(),
    setSubmitting: jest.fn(),
    setTouched: jest.fn(),
    setValues: jest.fn(),
    submitForm: jest.fn(),
    unregisterField: jest.fn(),
    validateField: jest.fn(),
    validateForm: jest.fn(),
    getFieldMeta: jest.fn(),
    validateOnBlur: true,
    validateOnChange: true,
  };

  let helmInstallUpgradeForm = shallow(<HelmInstallUpgradeForm {...helmInstallUpgradeFormProps} />);

  it('should render the YAML Editor component', () => {
    expect(helmInstallUpgradeForm.find(YAMLEditorField).exists()).toBe(true);
  });

  it('should have the Release Name field disabled in the Helm Upgrade Form', () => {
    helmInstallUpgradeFormProps.helmAction = 'Upgrade';
    helmInstallUpgradeForm = shallow(<HelmInstallUpgradeForm {...helmInstallUpgradeFormProps} />);
    expect(helmInstallUpgradeForm.find(InputField).props().label).toBe('Release Name');
    expect(helmInstallUpgradeForm.find(InputField).props().isDisabled).toBe(true);
  });
});
