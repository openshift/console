/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import { defaultAccessRoles } from '../project-access-form-utils';
import ProjectAccessForm from '../ProjectAccessForm';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/shared', () => ({
  MultiColumnField: function MockMultiColumnField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'multi-column-field',
        'data-name': props.name,
        'data-add-label': props.addLabel,
        'data-headers': JSON.stringify(props.headers),
        'data-empty-values': JSON.stringify(props.emptyValues),
      },
      props.children,
    );
  },
  InputField: function MockInputField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'input-field',
        'data-name': props.name,
        'data-type': props.type,
        'data-placeholder': props.placeholder,
      },
      'Input Field',
    );
  },
  DropdownField: function MockDropdownField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'dropdown-field',
        'data-name': props.name,
        'data-title': props.title,
        'data-items': JSON.stringify(props.items),
        'data-full-width': props.fullWidth,
        'data-test-id': props.dataTest,
      },
      'Dropdown Field',
    );
  },
  FormFooter: function MockFormFooter(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'form-footer',
        'data-is-submitting': props.isSubmitting,
        'data-error-message': props.errorMessage,
        'data-success-message': props.successMessage,
      },
      'Form Footer',
    );
  },
  NSDropdownField: function MockNSDropdownField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'ns-dropdown-field',
        'data-name': props.name,
        'data-full-width': props.fullWidth,
      },
      'NS Dropdown Field',
    );
  },
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockPaneBody(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'pane-body',
          className: props.className,
        },
        props.children,
      );
    },
  };
});

jest.mock('@patternfly/react-core', () => ({
  Form: function MockForm(props) {
    const React = require('react');
    return React.createElement(
      'form',
      {
        'data-test': 'form',
        onSubmit: props.onSubmit,
      },
      props.children,
    );
  },
  TextInputTypes: { text: 'text' },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'devconsole~Add access') return 'Add access';
      if (key === 'devconsole~Subject') return 'Subject';
      if (key === 'devconsole~Name') return 'Name';
      if (key === 'devconsole~Role') return 'Role';
      if (key === 'devconsole~Select a type') return 'Select a type';
      if (key === 'devconsole~Select a role') return 'Select a role';
      return key;
    },
  }),
}));

jest.mock('lodash', () => ({
  isEmpty: jest.fn((obj) => obj === undefined || obj === null || Object.keys(obj).length === 0),
  isEqual: jest.fn(() => true),
}));

jest.mock('../project-access-form-utils', () => ({
  ignoreRoleBindingName: jest.fn((data) => data),
  defaultAccessRoles: {
    admin: 'Admin',
    view: 'View',
    edit: 'Edit',
  },
}));

type ProjectAccessFormProps = React.ComponentProps<typeof ProjectAccessForm>;
let formProps: ProjectAccessFormProps;

describe('Project Access Form', () => {
  beforeEach(() => {
    formProps = {
      values: {
        projectAccess: [
          {
            roleBindingName: 'abc-admin',
            user: 'abc',
            role: 'admin',
          },
          {
            roleBindingName: 'xyz-edit',
            user: 'xyz',
            role: 'edit',
          },
        ],
      },
      roleBindings: {
        projectAccess: [
          {
            roleBindingName: 'abc-admin',
            subject: {
              name: 'abc',
              kind: 'User',
              apiGroup: 'rbac.authorization.k8s.io',
            },
            subjects: [],
            role: 'admin',
          },
          {
            roleBindingName: 'xyz-edit',
            subject: {
              name: 'xyz',
              kind: 'User',
              apiGroup: 'rbac.authorization.k8s.io',
            },
            subjects: [],
            role: 'edit',
          },
        ],
      },
      errors: {},
      touched: {},
      isSubmitting: true,
      isValidating: true,
      status: {},
      submitCount: 0,
      dirty: false,
      getFieldHelpers: jest.fn(),
      getFieldProps: jest.fn(),
      handleBlur: jest.fn(),
      handleChange: jest.fn(),
      handleReset: jest.fn(),
      handleSubmit: jest.fn(),
      initialErrors: {},
      initialStatus: {},
      initialTouched: {},
      initialValues: {
        projectAccess: [
          {
            roleBindingName: 'abc-admin',
            user: 'abc',
            role: 'admin',
          },
          {
            roleBindingName: 'xyz-edit',
            user: 'xyz',
            role: 'edit',
          },
        ],
      },
      isValid: true,
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
      roles: {},
    };
  });

  it('should load the correct Project Access Form structure', () => {
    render(<ProjectAccessForm {...formProps} roles={defaultAccessRoles} />);

    const multiColumnField = screen.getByTestId('multi-column-field');
    expect(multiColumnField).toBeInTheDocument();
    expect(multiColumnField).toHaveAttribute('data-name', 'projectAccess');
    expect(multiColumnField).toHaveAttribute('data-add-label', 'Add access');
    expect(multiColumnField).toHaveAttribute('data-headers', '["Subject","Name","Role"]');

    expect(screen.getAllByTestId('dropdown-field')).toHaveLength(2);
    expect(screen.getByTestId('input-field')).toBeInTheDocument();
    expect(screen.getByTestId('form-footer')).toBeInTheDocument();
  });

  it('should load the dropdown with access roles', () => {
    render(<ProjectAccessForm {...formProps} roles={defaultAccessRoles} />);

    const dropdowns = screen.getAllByTestId('dropdown-field');
    const roleDropdown = dropdowns.find(
      (dropdown) => dropdown.getAttribute('data-name') === 'role',
    );

    expect(roleDropdown).toBeInTheDocument();
    expect(roleDropdown).toHaveAttribute('data-name', 'role');
    expect(roleDropdown).toHaveAttribute(
      'data-items',
      '{"admin":"Admin","view":"View","edit":"Edit"}',
    );
  });
});
