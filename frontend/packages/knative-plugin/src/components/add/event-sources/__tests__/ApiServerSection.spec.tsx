import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import ApiServerSection from '../ApiServerSection';

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => children ?? null,
}));

jest.mock('@console/internal/components/utils/async', () => ({
  AsyncComponent: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-AsyncComponent'),
}));

jest.mock('../../../dropdowns/ServiceAccountDropdown', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-ServiceAccountDropdown'),
}));

jest.mock('@console/shared/src/components/formik-fields/DropdownField', () => ({
  DropdownField: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-DropdownField'),
}));

jest.mock('@console/shared/src/components/formik-fields/field-utils', () => ({
  getFieldId: jest.fn(() => 'mocked-field-id'),
}));

jest.mock('react-i18next');

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
    expect(screen.getByText('Resource')).toBeVisible();
  });

  it('should render NameValueEditor', () => {
    render(<ApiServerSection title={title} />);
    expect(screen.getByText('The list of resources to watch.')).toBeVisible();
  });

  it('should render ServiceAccountDropdown', () => {
    render(<ApiServerSection title={title} />);
    expect(screen.getByText('mock-DropdownField')).toBeVisible();
    expect(screen.getByText('mock-ServiceAccountDropdown')).toBeVisible();
  });
});
