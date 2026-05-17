import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import ContainerSourceSection from '../ContainerSourceSection';

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => children ?? null,
}));

jest.mock('@console/internal/components/utils/async', () => ({
  AsyncComponent: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-AsyncComponent'),
}));

jest.mock('@console/shared/src/components/formik-fields/text-column-field/TextColumnField', () => ({
  TextColumnField: ({ label }: { label?: string }) => label ?? null,
}));

jest.mock('@console/shared/src/components/formik-fields/InputField', () => ({
  InputField: ({ label, ...rest }: { label?: string; [k: string]: unknown }) => (
    <input type="text" aria-label={label} {...(rest as ComponentPropsWithoutRef<'input'>)} />
  ),
}));

jest.mock('react-i18next');

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      formData: {
        type: 'ContainerSource',
        data: {
          ContainerSource: {
            template: {
              spec: {
                containers: [
                  {
                    args: [],
                  },
                ],
              },
            },
          },
        },
      },
    },
  })),
}));

describe('ContainerSourceSection', () => {
  const title = 'Container Source';

  it('should render ContainerSource FormSection', () => {
    render(<ContainerSourceSection title={title} />);
    expect(screen.getByText('Container')).toBeInTheDocument();
  });

  it('should render Container image and name input fields', () => {
    render(<ContainerSourceSection title={title} />);
    expect(screen.getByRole('textbox', { name: 'Image' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('should render Container args field', () => {
    render(<ContainerSourceSection title={title} />);
    expect(screen.getByText('Arguments')).toBeInTheDocument();
  });

  it('should render environment variables section', () => {
    render(<ContainerSourceSection title={title} />);
    expect(screen.getByText('mock-AsyncComponent')).toBeVisible();
  });
});
