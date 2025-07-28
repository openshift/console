/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
// eslint-disable-next-line import/order
import BuilderImageEnvironments from '../BuilderImageEnvironments';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  InputField: function MockInputField(props) {
    const React = require('react');
    return React.createElement('input', {
      'data-test': `input-field-${props.name}`,
      'data-label': props.label,
      'data-help-text': props.helpText,
      'data-placeholder': props.placeholder,
      name: props.name,
      type: props.type,
    });
  },
}));

jest.mock('../builderImageHooks', () => ({
  useBuilderImageEnvironments: jest.fn(),
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
  useField: jest.fn(() => ['', { touched: false }]),
}));

const mockFormikContext = useFormikContext as jest.Mock;
const { useBuilderImageEnvironments } = require('../builderImageHooks');

describe('BuilderImageEnvironments', () => {
  const defaultProps = {
    name: 'image.imageEnv',
    imageStreamName: 'nodejs-ex',
    imageStreamTag: '14-ubi8',
  };

  beforeEach(() => {
    mockFormikContext.mockReturnValue({
      setFieldValue: jest.fn(),
      values: {
        build: { env: [{ name: 'TEST_KEY', value: 'TEST_VAL' }] },
        image: {},
        formType: '',
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not render anything when there are no extensions provided', () => {
    useBuilderImageEnvironments.mockReturnValue([[], true]);

    renderWithProviders(<BuilderImageEnvironments {...defaultProps} />);

    expect(screen.queryByTestId(/^input-field-/)).not.toBeInTheDocument();
  });

  it('should not render anything when imagestream does not exist in extensions', () => {
    useBuilderImageEnvironments.mockReturnValue([[], true]);

    const props = {
      ...defaultProps,
      imageStreamName: 'non-matching-stream',
    };

    renderWithProviders(<BuilderImageEnvironments {...props} />);

    expect(screen.queryByTestId(/^input-field-/)).not.toBeInTheDocument();
  });

  it('should render field when matching imagestream is provided', () => {
    const mockEnvironments = [
      {
        key: 'NPM_RUN',
        label: 'NPM Run Command',
        description: 'Command to run npm',
        defaultValue: 'start',
      },
    ];

    useBuilderImageEnvironments.mockReturnValue([mockEnvironments, true]);

    const props = {
      ...defaultProps,
      imageStreamTag: 'latest',
    };

    renderWithProviders(<BuilderImageEnvironments {...props} />);

    const inputField = screen.getByTestId('input-field-image.imageEnv.NPM_RUN');
    expect(inputField).toBeInTheDocument();
    expect(inputField.getAttribute('data-label')).toBe('NPM Run Command');
    expect(inputField.getAttribute('data-help-text')).toBe('Command to run npm');
    expect(inputField.getAttribute('data-placeholder')).toBe('start');
  });

  it('should initialize field when a matching builderImage value exists in edit flow', () => {
    const mockEnvironments = [
      {
        key: 'TEST_KEY',
        label: 'Test Key',
        description: 'Test environment variable',
        defaultValue: 'default',
      },
    ];

    useBuilderImageEnvironments.mockReturnValue([mockEnvironments, true]);

    const setFieldValueMock = jest.fn();
    mockFormikContext.mockReturnValue({
      setFieldValue: setFieldValueMock,
      values: {
        build: { env: [{ name: 'TEST_KEY', value: 'TEST_VAL' }] },
        image: {},
        formType: 'edit',
      },
    });

    const props = {
      ...defaultProps,
      imageStreamTag: 'latest',
    };

    renderWithProviders(<BuilderImageEnvironments {...props} />);

    expect(setFieldValueMock).toHaveBeenCalledTimes(1);
    expect(setFieldValueMock).toHaveBeenCalledWith('image.imageEnv.TEST_KEY', 'TEST_VAL');
  });
});
