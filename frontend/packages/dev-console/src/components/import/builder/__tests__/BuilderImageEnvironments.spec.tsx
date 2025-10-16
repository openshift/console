import { screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import BuilderImageEnvironments from '../BuilderImageEnvironments';
import { useBuilderImageEnvironments } from '../builderImageHooks';

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  InputField: (props) =>
    `InputField ${props.name} label="${props.label}" helpText="${props.helpText}" placeholder="${props.placeholder}"`,
}));

jest.mock('../builderImageHooks', () => ({
  useBuilderImageEnvironments: jest.fn(),
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
  useField: jest.fn(() => ['', { touched: false }]),
}));

describe('BuilderImageEnvironments', () => {
  const defaultProps = {
    name: 'image.imageEnv',
    imageStreamName: 'nodejs-ex',
    imageStreamTag: '14-ubi8',
  };

  beforeEach(() => {
    (useFormikContext as jest.Mock).mockReturnValue({
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
    (useBuilderImageEnvironments as jest.Mock).mockReturnValue([[], true]);

    renderWithProviders(<BuilderImageEnvironments {...defaultProps} />);

    expect(screen.queryByText(/InputField/)).not.toBeInTheDocument();
  });

  it('should not render anything when imagestream does not exist in extensions', () => {
    (useBuilderImageEnvironments as jest.Mock).mockReturnValue([[], true]);

    const props = {
      ...defaultProps,
      imageStreamName: 'non-matching-stream',
    };

    renderWithProviders(<BuilderImageEnvironments {...props} />);

    expect(screen.queryByText(/InputField/)).not.toBeInTheDocument();
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

    (useBuilderImageEnvironments as jest.Mock).mockReturnValue([mockEnvironments, true]);

    const props = {
      ...defaultProps,
      imageStreamTag: 'latest',
    };

    renderWithProviders(<BuilderImageEnvironments {...props} />);

    expect(
      screen.getByText(
        /InputField image\.imageEnv\.NPM_RUN label="NPM Run Command" helpText="Command to run npm" placeholder="start"/,
      ),
    ).toBeInTheDocument();
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

    (useBuilderImageEnvironments as jest.Mock).mockReturnValue([mockEnvironments, true]);

    const setFieldValueMock = jest.fn();
    (useFormikContext as jest.Mock).mockReturnValue({
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
