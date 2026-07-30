import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import SinkBindingSection from '../SinkBindingSection';

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: ({ children, title }: { children?: ReactNode; title?: ReactNode }) => (
    <>
      {title}
      {children}
    </>
  ),
}));

jest.mock('@console/internal/components/utils/async', () => ({
  AsyncComponent: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-AsyncComponent'),
}));

jest.mock('@console/shared/src/components/formik-fields/InputField', () => ({
  InputField: () => <span data-test="mock-InputField" />,
}));

jest.mock('@console/shared/src/components/formik-fields/DropdownField', () => ({
  DropdownField: 'DropdownField',
}));

jest.mock('@console/shared/src/components/formik-fields/field-utils', () => ({
  getFieldId: jest.fn(() => 'mocked-field-id'),
}));

jest.mock('@console/shared/src/components/heading/TertiaryHeading', () => ({
  __esModule: true,
  default: 'TertiaryHeading',
}));

jest.mock('react-i18next');

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
    render(<SinkBindingSection title={title} />);
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('should render NameValueEditor', () => {
    render(<SinkBindingSection title={title} />);
    expect(screen.getByText('mock-AsyncComponent')).toBeVisible();
  });

  it('should render InputFields', () => {
    render(<SinkBindingSection title={title} />);
    expect(screen.getAllByTestId('mock-InputField')).toHaveLength(2);
  });
});
