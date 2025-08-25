import { render } from '@testing-library/react';
import SinkBindingSection from '../SinkBindingSection';
import '@testing-library/jest-dom';

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: 'FormSection',
}));

jest.mock('@console/internal/components/utils/async', () => ({
  AsyncComponent: 'AsyncComponent',
}));

jest.mock('@console/shared', () => ({
  InputField: 'InputField',
  DropdownField: 'DropdownField',
  getFieldId: jest.fn(() => 'mocked-field-id'),
}));

jest.mock('@console/shared/src/components/heading/TertiaryHeading', () => ({
  __esModule: true,
  default: 'TertiaryHeading',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      type: 'SinkBinding',
    },
  })),
  getFieldId: jest.fn(),
}));

describe('SinkBindingSection', () => {
  const title = 'Sink Binding';

  it('should render FormSection', () => {
    const { container } = render(<SinkBindingSection title={title} />);
    expect(container.querySelector('FormSection')).toBeInTheDocument();
  });

  it('should render NameValueEditor', () => {
    const { container } = render(<SinkBindingSection title={title} />);
    expect(container.querySelector('AsyncComponent')).toBeInTheDocument();
  });

  it('should render InputFields', () => {
    const { container } = render(<SinkBindingSection title={title} />);
    const inputFields = container.querySelectorAll('InputField');
    expect(inputFields).toHaveLength(2);
  });
});
