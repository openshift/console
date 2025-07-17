/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { render, screen } from '@testing-library/react';
import * as formik from 'formik';
import { CREATE_APPLICATION_KEY } from '../../../const';
import ApplicationDropdown from '../ApplicationDropdown';
import ApplicationSelector from '../ApplicationSelector';
import '@testing-library/jest-dom';

jest.mock('@console/shared', () => {
  const React = require('react');
  return {
    InputField: jest.fn((props) =>
      React.createElement('input', {
        'data-testid': 'application-form-app-input',
        ...props,
        onChange: props.onChange,
        onBlur: props.onBlur,
      }),
    ),
    getFieldId: () => 'application-name-dropdown',
    useFormikValidationFix: () => {},
    RedExclamationCircleIcon: () => React.createElement('div', null, '!'),
  };
});

jest.mock('../ApplicationDropdown', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn(() =>
      React.createElement('div', { 'data-testid': 'application-dropdown' }, 'ApplicationDropdown'),
    ),
  };
});

describe('ApplicationSelector', () => {
  const setFieldValue = jest.fn();
  const setFieldTouched = jest.fn();

  const mockUseFormikContext = jest.spyOn(formik, 'useFormikContext');
  const mockUseField = jest.spyOn(formik, 'useField');

  beforeEach(() => {
    mockUseField.mockImplementation((name) => {
      if (name.includes('selectedKey')) {
        return [{ value: CREATE_APPLICATION_KEY, name }, {}];
      }
      return [{ value: '', name }, {}];
    });

    mockUseFormikContext.mockReturnValue({
      setFieldValue,
      setFieldTouched,
      values: {
        application: {
          selectedKey: CREATE_APPLICATION_KEY,
          name: '',
          initial: '',
        },
      },
    });
    jest.clearAllMocks();
  });

  it('should show InputField if no projects are available', () => {
    render(<ApplicationSelector noProjectsAvailable namespace="ns" />);
    expect(screen.getByTestId('application-form-app-input')).toBeInTheDocument();
  });

  it('should show ApplicationDropdown if projects are available', () => {
    render(<ApplicationSelector noProjectsAvailable={false} namespace="ns" />);
    expect(screen.getByTestId('application-dropdown')).toBeInTheDocument();
  });

  it('should reset selectedKey if applications are not loaded', () => {
    render(<ApplicationSelector noProjectsAvailable={false} namespace="ns" />);
    const [{ onLoad }] = (ApplicationDropdown as jest.Mock).mock.calls[0];
    onLoad({});
    expect(setFieldValue).toHaveBeenCalledWith('application.selectedKey', '');
  });

  it('should reset application name if the application list is empty', () => {
    render(<ApplicationSelector noProjectsAvailable={false} namespace="ns" />);
    const [{ onLoad }] = (ApplicationDropdown as jest.Mock).mock.calls[0];
    onLoad({});
    expect(setFieldValue).toHaveBeenCalledWith('application.selectedKey', '');
    expect(setFieldValue).toHaveBeenCalledWith('application.name', '');
    expect(setFieldValue).toHaveBeenCalledTimes(2);
  });

  it('should set application name and selectedKey on dropdown change', () => {
    render(<ApplicationSelector noProjectsAvailable={false} namespace="ns" />);
    const [{ onChange }] = (ApplicationDropdown as jest.Mock).mock.calls[0];
    onChange('one', 'test-application');
    expect(setFieldValue).toHaveBeenCalledWith('application.selectedKey', 'one');
    expect(setFieldValue).toHaveBeenCalledWith('application.name', 'test-application');
    expect(setFieldTouched).toHaveBeenCalledWith('application.selectedKey', true);
    expect(setFieldValue).toHaveBeenCalledTimes(2);
  });

  it('should not set application name if undefined in dropdown change', () => {
    render(<ApplicationSelector noProjectsAvailable={false} namespace="ns" />);
    const [{ onChange }] = (ApplicationDropdown as jest.Mock).mock.calls[0];
    onChange('one', undefined);
    expect(setFieldValue).toHaveBeenCalledWith('application.selectedKey', 'one');
    expect(setFieldValue).toHaveBeenCalledWith('application.name', undefined);
    expect(setFieldTouched).toHaveBeenCalledWith('application.selectedKey', true);
    expect(setFieldValue).toHaveBeenCalledTimes(2);
  });
});
