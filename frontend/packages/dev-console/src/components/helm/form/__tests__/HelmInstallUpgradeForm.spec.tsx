import * as React from 'react';
import { shallow } from 'enzyme';
import { InputField, SyncedEditorField } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import HelmInstallUpgradeForm from '../HelmInstallUpgradeForm';

let helmInstallUpgradeFormProps: React.ComponentProps<typeof HelmInstallUpgradeForm>;

describe('HelmInstallUpgradeForm', () => {
  helmInstallUpgradeFormProps = {
    chartHasValues: true,
    helmAction: 'Install',
    onVersionChange: jest.fn(),
    chartMetaDescription: <p>Some chart meta</p>,
    values: {
      releaseName: 'helm-release',
      chartName: 'helm-release',
      chartVersion: '',
      yamlData: 'chart-yaml-values',
      formData: {
        test: 'data',
      },
      formSchema: {
        type: 'object',
        required: ['test'],
        properties: {
          test: {
            type: 'string',
          },
        },
      },
      editorType: EditorType.Form,
    },
    errors: {},
    touched: {},
    isValid: true,
    initialValues: {
      releaseName: 'helm-release',
      chartName: 'helm-release',
      chartVersion: '0.3',
      yamlData: 'chart-yaml-values',
      formData: {
        test: 'data',
      },
      formSchema: {
        type: 'object',
        required: ['test'],
        properties: {
          test: {
            type: 'string',
          },
        },
      },
      editorType: EditorType.Form,
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

  it('should render the SyncedEditorField  component', () => {
    const helmInstallUpgradeForm = shallow(
      <HelmInstallUpgradeForm {...helmInstallUpgradeFormProps} />,
    );
    expect(helmInstallUpgradeForm.find(SyncedEditorField).exists()).toBe(true);
  });

  it('should have the Release Name field disabled in the Helm Upgrade Form', () => {
    helmInstallUpgradeFormProps.helmAction = 'Upgrade';
    const helmInstallUpgradeForm = shallow(
      <HelmInstallUpgradeForm {...helmInstallUpgradeFormProps} />,
    );
    expect(helmInstallUpgradeForm.find(InputField).props().label).toBe('Release Name');
    expect(helmInstallUpgradeForm.find(InputField).props().isDisabled).toBe(true);
  });
});
