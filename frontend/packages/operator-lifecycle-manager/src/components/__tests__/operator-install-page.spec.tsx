import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testClusterServiceVersion } from '../../../mocks';
import { CreateInitializationResourceButton } from '../operator-install-page';

const mockDispatch = jest.fn();
jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: () => mockDispatch,
}));

const mockGetResourcesAction = { type: 'getResources' };
const mockGetResources = jest.fn().mockReturnValue(mockGetResourcesAction);
jest.mock('@console/internal/actions/k8s', () => ({
  getResources: (...args) => mockGetResources(...args),
}));

let mockModel: object | undefined;
let mockInFlight: boolean;
jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: () => [mockModel, mockInFlight],
}));

const initializationResource = {
  apiVersion: 'example.com/v1',
  kind: 'ExampleResource',
  metadata: {
    name: 'example',
    namespace: 'default',
  },
};

const defaultProps = {
  initializationResource,
  obj: testClusterServiceVersion,
};

describe('CreateInitializationResourceButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModel = undefined;
    mockInFlight = false;
  });

  it('returns null when initializationResource is not provided', () => {
    const { container } = renderWithProviders(
      <CreateInitializationResourceButton obj={testClusterServiceVersion} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('dispatches getResources when the model is missing', () => {
    renderWithProviders(<CreateInitializationResourceButton {...defaultProps} />);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(mockGetResourcesAction);
  });

  it('does not dispatch getResources when the model is available', () => {
    mockModel = { kind: 'ExampleResource' };
    renderWithProviders(<CreateInitializationResourceButton {...defaultProps} />);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('disables the button when the model is missing', () => {
    renderWithProviders(<CreateInitializationResourceButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Create ExampleResource/i })).toBeDisabled();
  });

  it('disables the button when disabled prop is true', () => {
    mockModel = { kind: 'ExampleResource' };
    renderWithProviders(<CreateInitializationResourceButton {...defaultProps} disabled />);
    expect(screen.getByRole('button', { name: /Create ExampleResource/i })).toBeDisabled();
  });

  it('enables the button and renders a link when the model is available', () => {
    mockModel = { kind: 'ExampleResource' };
    renderWithProviders(<CreateInitializationResourceButton {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('useInitializationResource'));
    expect(screen.getByRole('button', { name: /Create ExampleResource/i })).toBeEnabled();
  });
});
