import { render, screen } from '@testing-library/react';
import * as formik from 'formik';
import { CREATE_APPLICATION_KEY } from '../../../const';
import ApplicationDropdown from '../ApplicationDropdown';
import ApplicationSelector from '../ApplicationSelector';

jest.mock('@console/shared', () => ({
  InputField: jest.fn(() => 'Mock Input Field'),
  getFieldId: () => 'application-name-dropdown',
  useFormikValidationFix: () => {},
  RedExclamationCircleIcon: () => 'Mock Red Exclamation Icon',
}));

jest.mock('../ApplicationDropdown', () => ({
  __esModule: true,
  default: jest.fn(() => 'Mock Application Dropdown'),
}));

describe('ApplicationSelector', () => {
  const setFieldValue = jest.fn();
  const setFieldTouched = jest.fn();

  const mockUseFormikContext = jest.spyOn(formik, 'useFormikContext');
  const mockUseField = jest.spyOn(formik, 'useField');

  beforeEach(() => {
    mockUseField.mockImplementation((name: string) => {
      if (name.includes('selectedKey')) {
        return [{ value: CREATE_APPLICATION_KEY, name }, {}, {}];
      }
      return [{ value: '', name }, {}, {}];
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
    expect(screen.getByText('Mock Input Field')).toBeInTheDocument();
  });

  it('should show ApplicationDropdown if projects are available', () => {
    render(<ApplicationSelector noProjectsAvailable={false} namespace="ns" />);
    expect(screen.getByText('Mock Application Dropdown')).toBeInTheDocument();
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
