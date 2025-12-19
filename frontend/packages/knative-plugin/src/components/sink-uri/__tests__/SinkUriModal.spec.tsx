import type { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import SinkUriModal from '../SinkUriModal';

jest.mock('@console/internal/components/factory/modal', () => ({
  ModalTitle: jest.fn(() => null),
  ModalBody: jest.fn(() => null),
  ModalSubmitFooter: jest.fn(() => null),
}));

jest.mock('@console/shared', () => ({
  InputField: jest.fn(() => null),
  getFieldId: jest.fn(() => 'field-id'),
}));

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@patternfly/react-core', () => ({
  Form: jest.fn(() => null),
  FormGroup: jest.fn(() => null),
  FormHelperText: jest.fn(() => null),
  HelperText: jest.fn(() => null),
  HelperTextItem: jest.fn(() => null),
  TextInputTypes: {
    url: 'url',
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

type SinkUriModalProps = ComponentProps<typeof SinkUriModal>;

describe('SinkUriModal Form', () => {
  let formProps: SinkUriModalProps;
  const formValues = {
    uri: 'http://svc.cluster.com',
  };

  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      values: formValues,
      initialValues: formValues,
    };
  });

  it('should render without errors', () => {
    const { container } = render(<SinkUriModal {...formProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render with form props', () => {
    expect(() => render(<SinkUriModal {...formProps} />)).not.toThrow();
  });

  it('should render with different URI values', () => {
    const sinkValues = {
      uri: 'http://svc.cluster12.com',
    };
    const updatedFormProps = {
      ...formProps,
      values: {
        ...formProps.values,
        ...sinkValues,
      },
    };
    expect(() => render(<SinkUriModal {...updatedFormProps} />)).not.toThrow();
  });
});
