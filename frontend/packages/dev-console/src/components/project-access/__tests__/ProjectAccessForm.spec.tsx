import { render, screen } from '@testing-library/react';
import { defaultAccessRoles } from '../project-access-form-utils';
import ProjectAccessForm from '../ProjectAccessForm';
import '@testing-library/jest-dom';

jest.mock('@console/shared', () => ({
  MultiColumnField: (props) => props.children,
  InputField: () => 'InputField',
  DropdownField: () => 'DropdownField',
  FormFooter: () => 'FormFooter',
  NSDropdownField: () => 'NSDropdownField',
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: (props) => props.children,
}));

jest.mock('@patternfly/react-core', () => ({
  Form: (props) => props.children,
  TextInputTypes: { text: 'text' },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
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

    expect(screen.getAllByText(/DropdownField/)).toHaveLength(2);
    expect(screen.getByText(/InputField/)).toBeInTheDocument();
    expect(screen.getByText(/FormFooter/)).toBeInTheDocument();
  });

  it('should render the form components', () => {
    render(<ProjectAccessForm {...formProps} roles={defaultAccessRoles} />);

    expect(screen.getAllByText(/DropdownField/).length).toBeGreaterThan(0);
    expect(screen.getByText(/InputField/)).toBeInTheDocument();
  });
});
