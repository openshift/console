import { render, screen } from '@testing-library/react';
import ContainerSourceSection from '../ContainerSourceSection';

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: 'FormSection',
}));

jest.mock('@console/internal/components/utils/async', () => ({
  AsyncComponent: 'AsyncComponent',
}));

jest.mock('@console/shared', () => ({
  TextColumnField: 'TextColumnField',
  InputField: 'InputField',
}));

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
    const { container } = render(<ContainerSourceSection title={title} />);
    expect(container.querySelector('FormSection')).toBeInTheDocument();
    expect(screen.getByText('Container')).toBeInTheDocument();
  });

  it('should render Container image and name input fields', () => {
    const { container } = render(<ContainerSourceSection title={title} />);
    const imageInputField = container.querySelector('[data-test-id="container-image-field"]');
    const nameInputField = container.querySelector('[data-test-id="container-name-field"]');
    expect(imageInputField).toBeInTheDocument();
    expect(nameInputField).toBeInTheDocument();
  });

  it('should render Container args field', () => {
    const { container } = render(<ContainerSourceSection title={title} />);
    expect(container.querySelector('TextColumnField')).toBeInTheDocument();
  });

  it('should render environment variables section', () => {
    const { container } = render(<ContainerSourceSection title={title} />);
    expect(container.querySelector('AsyncComponent')).toBeInTheDocument();
  });
});
