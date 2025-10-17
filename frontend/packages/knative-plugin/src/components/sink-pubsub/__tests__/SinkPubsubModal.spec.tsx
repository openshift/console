import { render } from '@testing-library/react';
import SinkPubsubModal from '../SinkPubsubModal';

jest.mock('@console/internal/components/factory/modal', () => ({
  ModalTitle: jest.fn(() => null),
  ModalBody: jest.fn(() => null),
  ModalSubmitFooter: jest.fn(() => null),
}));

jest.mock('@console/shared', () => ({
  ResourceDropdownField: jest.fn(() => null),
}));

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: jest.fn(() => null),
}));

describe('SinkPubsubModal', () => {
  let formProps: any;
  const formValues = {
    ref: {
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Service',
      name: 'overlayimage',
    },
  };

  beforeEach(() => {
    formProps = {
      values: formValues,
      resourceName: 'myapps',
      initialValues: formValues,
      resourceDropdown: [],
      labelTitle: 'Move Subscription',
      handleSubmit: jest.fn(),
      setFieldTouched: jest.fn(),
      setFieldValue: jest.fn(),
      validateForm: jest.fn(),
      isSubmitting: false,
      status: { error: null },
      cancel: jest.fn(),
    } as any;
  });

  it('should render without crashing', () => {
    expect(() => render(<SinkPubsubModal {...formProps} />)).not.toThrow();
  });

  it('should render with all required props', () => {
    const { container } = render(<SinkPubsubModal {...formProps} />);
    expect(container).toBeInTheDocument();
  });
});
