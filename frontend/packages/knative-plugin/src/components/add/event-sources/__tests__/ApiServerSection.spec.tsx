import { render, screen } from '@testing-library/react';
import ApiServerSection from '../ApiServerSection';
import '@testing-library/jest-dom';

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: 'FormSection',
}));

jest.mock('@console/internal/components/utils/async', () => ({
  AsyncComponent: 'AsyncComponent',
}));

jest.mock('../../../dropdowns/ServiceAccountDropdown', () => ({
  __esModule: true,
  default: 'ServiceAccountDropdown',
}));

jest.mock('@console/shared', () => ({
  DropdownField: 'DropdownField',
  getFieldId: jest.fn(() => 'mocked-field-id'),
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      type: 'ApiServerSource',
    },
  })),
  getFieldId: jest.fn(),
}));

describe('ApiServerSection', () => {
  const title = 'Api Server Source';

  it('should render FormSection', () => {
    render(<ApiServerSection title={title} />);
    expect(screen.getByText('Resource')).toBeInTheDocument();
  });

  it('should render NameValueEditor', () => {
    render(<ApiServerSection title={title} />);
    expect(screen.getByText('The list of resources to watch.')).toBeInTheDocument();
  });

  it('should render ServiceAccountDropdown', () => {
    const { container } = render(<ApiServerSection title={title} />);
    expect(container.querySelector('dropdownfield')).toBeInTheDocument();
    expect(container.querySelector('serviceaccountdropdown')).toBeInTheDocument();
  });
});
