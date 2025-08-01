/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import JarSection from '../JarSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@patternfly/react-core', () => ({
  FileUpload: function MockFileUpload(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'file-upload',
        'data-id': props.id,
        'data-name': props.name,
        'data-filename': props.filename,
        'data-value': JSON.stringify(props.value),
        'data-required': props.isRequired,
      },
      'File Upload',
    );
  },
  TextInputTypes: {
    text: 'text',
  },
}));

jest.mock('@console/shared/src', () => ({
  InputField: function MockInputField(props) {
    const React = require('react');
    return React.createElement('input', {
      'data-test': 'input-field',
      'data-test-id': props['data-test-id'],
      'data-type': props.type,
      'data-name': props.name,
      'data-label': props.label,
      'data-help-text': props.helpText,
      'data-placeholder': props.placeholder,
    });
  },
}));

jest.mock('../../../section/FormSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockFormSection(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'form-section',
          'data-title': props.title,
        },
        props.children,
      );
    },
  };
});

jest.mock('@console/app/src/components/file-upload/file-upload-context', () => ({
  FileUploadContext: {
    Provider: function MockProvider(props) {
      const React = require('react');
      return React.createElement('div', {}, props.children);
    },
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
  useFormikContext: jest.fn(() => ({
    values: {
      name: '',
      fileUpload: { name: '', value: '' },
      application: { name: '', selectedKey: '' },
    },
    touched: {},
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
  })),
}));

describe('JarSection', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render FileUpload, InputField', () => {
    render(<JarSection />);

    expect(screen.getByTestId('form-section')).toBeInTheDocument();
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    expect(screen.getByTestId('input-field')).toBeInTheDocument();
    const formSection = screen.getByTestId('form-section');
    expect(formSection.getAttribute('data-title')).toBe('devconsole~JAR');
    const fileUpload = screen.getByTestId('file-upload');
    expect(fileUpload.getAttribute('data-id')).toBe('upload-jar-field');
    expect(fileUpload.getAttribute('data-name')).toBe('fileUpload.name');
    expect(fileUpload.getAttribute('data-required')).toBe('true');
    const inputField = screen.getByTestId('input-field');
    expect(inputField.getAttribute('data-test-id')).toBe('upload-jar-form-java-args');
    expect(inputField.getAttribute('data-name')).toBe('fileUpload.javaArgs');
    expect(inputField.getAttribute('data-type')).toBe('text');
    expect(inputField.getAttribute('data-label')).toBe('devconsole~Optional Java arguments');
    expect(inputField.getAttribute('data-placeholder')).toBe('devconsole~JAVA_ARGS');
  });
});
