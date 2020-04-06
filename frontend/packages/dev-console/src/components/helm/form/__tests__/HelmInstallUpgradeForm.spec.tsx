import * as React from 'react';
import { shallow } from 'enzyme';
import { InputField, YAMLEditorField } from '@console/shared';
import HelmInstallUpgradeForm from '../HelmInstallUpgradeForm';
import HelmChartVersionDropdown from '../HelmChartVersionDropdown';

let helmInstallUpgradeFormProps: React.ComponentProps<typeof HelmInstallUpgradeForm>;

describe('HelmInstallUpgradeForm', () => {
  helmInstallUpgradeFormProps = {
    chartHasValues: true,
    chartName: 'helm-release',
    activeChartVersion: null,
    submitLabel: 'Install',
    values: {},
    errors: {},
    touched: {},
    isValid: true,
    initialValues: {
      helmReleaseName: 'helm-release',
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

  it('should render only the input field component and not the dropdown field when no active version exists', () => {
    expect(helmInstallUpgradeForm.find(InputField).exists()).toBe(true);
    expect(helmInstallUpgradeForm.find(InputField).props().isDisabled).toBe(false);
    expect(helmInstallUpgradeForm.find(HelmChartVersionDropdown).exists()).toBe(false);
  });

  it('should render the YAML Editor component', () => {
    expect(helmInstallUpgradeForm.find(YAMLEditorField).exists()).toBe(true);
  });

  it('should render the Dropdown Field component when active version exists', () => {
    helmInstallUpgradeFormProps.activeChartVersion = '0.1';
    helmInstallUpgradeForm = shallow(<HelmInstallUpgradeForm {...helmInstallUpgradeFormProps} />);
    expect(helmInstallUpgradeForm.find(HelmChartVersionDropdown).exists()).toBe(true);
  });

  it('should have the Release Name field disabled when active version exists', () => {
    expect(helmInstallUpgradeForm.find(InputField).props().label).toBe('Release Name');
    expect(helmInstallUpgradeForm.find(InputField).props().isDisabled).toBe(true);
  });
});
