import type { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import SinkUriModal from '../SinkUriModal';

jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  ModalHeader: jest.fn(() => null),
  ModalBody: jest.fn(({ children }) => <div>{children}</div>),
  Button: jest.fn(() => null),
  Form: jest.fn(({ children, ...props }) => <form {...props}>{children}</form>),
  FormGroup: jest.fn(({ children }) => <div>{children}</div>),
  FormHelperText: jest.fn(() => null),
  HelperText: jest.fn(() => null),
  HelperTextItem: jest.fn(() => null),
  TextInputTypes: {
    text: 'text',
    url: 'url',
  },
}));

jest.mock('@console/shared/src/components/modals/ModalFooterWithAlerts', () => ({
  ModalFooterWithAlerts: jest.fn(({ children }) => <div>{children}</div>),
}));

jest.mock('@console/shared', () => ({
  InputField: jest.fn(() => null),
  getFieldId: jest.fn(() => 'field-id'),
}));

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: jest.fn(() => null),
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
