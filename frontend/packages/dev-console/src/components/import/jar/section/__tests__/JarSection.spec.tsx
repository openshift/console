import { configure, render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import JarSection from '../JarSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@patternfly/react-core', () => ({
  FileUpload: () => 'FileUpload',
  TextInputTypes: {
    text: 'text',
  },
}));

jest.mock('@console/shared/src', () => ({
  InputField: () => 'InputField',
}));

jest.mock('../../../section/FormSection', () => ({
  __esModule: true,
  default: (props) => props.children,
}));

jest.mock('@console/app/src/components/file-upload/file-upload-context', () => ({
  FileUploadContext: {
    Provider: (props) => props.children,
  },
}));

jest.mock('@console/topology/src/const', () => ({
  UNASSIGNED_KEY: '',
}));

jest.mock('../../../upload-jar-validation-utils', () => ({
  getAppName: jest.fn((fileName) => fileName.replace('.jar', '')),
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockContextValue = {
  fileUpload: null,
  setFileUpload: jest.fn(),
};

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(() => mockContextValue),
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

describe('JarSection', () => {
  beforeEach(() => {
    (useFormikContext as jest.Mock).mockReturnValue({
      values: {
        name: '',
        fileUpload: { name: '', value: '' },
        application: { name: '', selectedKey: '' },
      },
      touched: {},
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render FileUpload, InputField', () => {
    render(<JarSection />);

    expect(screen.getByText(/FileUpload/)).toBeInTheDocument();
    expect(screen.getByText(/InputField/)).toBeInTheDocument();
  });
});
