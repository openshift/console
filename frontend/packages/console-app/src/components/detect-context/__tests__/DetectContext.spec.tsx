import { render, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';
import { DetectContext } from '../DetectContext';
import { useValuesForPerspectiveContext } from '../useValuesForPerspectiveContext';

const MockApp = () => <h1>App</h1>;

jest.mock('../PerspectiveDetector', () => ({
  __esModule: true,
  default: () => 'PerspectiveDetector',
}));

jest.mock('../useValuesForPerspectiveContext', () => ({
  useValuesForPerspectiveContext: jest.fn(),
}));

jest.mock('../namespace', () => ({
  NamespaceContext: { Provider: ({ children }) => children, Consumer: () => null },
  useValuesForNamespaceContext: jest.fn().mockReturnValue({
    namespace: 'default',
    setNamespace: jest.fn(),
    loaded: true,
  }),
}));

jest.mock('../../user-preferences/language/usePreferredLanguage', () => ({
  usePreferredLanguage: jest.fn().mockReturnValue(['en', jest.fn(), true]),
}));

jest.mock('../../user-preferences/language/useLanguage', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/usePerspectives', () => ({
  usePerspectives: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  PerspectiveContext: { Provider: ({ children }) => children, Consumer: () => null },
  useResolvedExtensions: jest.fn().mockReturnValue([[], true]),
  isContextProvider: jest.fn(),
  isReduxReducer: jest.fn(),
}));

jest.mock('@console/internal/redux', () => ({
  applyReduxExtensions: jest.fn(),
}));

jest.mock('react-router', () => ({
  useLocation: jest.fn(),
  createPath: jest.fn((loc) => loc.pathname),
}));

const useValuesForPerspectiveContextMock = useValuesForPerspectiveContext as jest.Mock;
const usePerspectivesMock = usePerspectives as jest.Mock;
const useLocationMock = useLocation as jest.Mock;

describe('DetectContext', () => {
  beforeEach(() => {
    useValuesForPerspectiveContextMock.mockClear();
    usePerspectivesMock.mockClear();
    useLocationMock.mockClear();
    useLocationMock.mockReturnValue({ pathname: '/test' });
  });

  it('should render children when there is an active perspective', () => {
    useValuesForPerspectiveContextMock.mockReturnValue(['dev', jest.fn(), true]);
    usePerspectivesMock.mockReturnValue([
      { properties: { id: 'admin' } },
      { properties: { id: 'dev' } },
      { properties: { id: 'dev-test' } },
    ]);

    render(
      <DetectContext>
        <MockApp />
      </DetectContext>,
    );

    expect(screen.getByRole('heading', { name: 'App' })).toBeVisible();
    expect(screen.queryByText('PerspectiveDetector')).not.toBeInTheDocument();
  });

  it('should render PerspectiveDetector when there is no active perspective', () => {
    useValuesForPerspectiveContextMock.mockReturnValue([undefined, jest.fn(), true]);
    usePerspectivesMock.mockReturnValue([
      { properties: { id: 'admin' } },
      { properties: { id: 'dev' } },
    ]);

    render(
      <DetectContext>
        <MockApp />
      </DetectContext>,
    );

    expect(screen.getByText('PerspectiveDetector')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'App' })).not.toBeInTheDocument();
  });
});
