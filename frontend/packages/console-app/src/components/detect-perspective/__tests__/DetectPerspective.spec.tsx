import { render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom-v5-compat';
import { usePerspectives } from '@console/shared/src';
import DetectPerspective from '../DetectPerspective';
import { useValuesForPerspectiveContext } from '../useValuesForPerspectiveContext';

const MockApp = () => <h1>App</h1>;

jest.mock('../PerspectiveDetector', () => ({
  __esModule: true,
  default: () => 'PerspectiveDetector',
}));

jest.mock('../useValuesForPerspectiveContext', () => ({
  useValuesForPerspectiveContext: jest.fn(),
}));

jest.mock('@console/shared/src', () => ({
  usePerspectives: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  useLocation: jest.fn(),
}));

const useValuesForPerspectiveContextMock = useValuesForPerspectiveContext as jest.Mock;
const usePerspectivesMock = usePerspectives as jest.Mock;
const useLocationMock = useLocation as jest.Mock;

describe('DetectPerspective', () => {
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
      <DetectPerspective>
        <MockApp />
      </DetectPerspective>,
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
      <DetectPerspective>
        <MockApp />
      </DetectPerspective>,
    );

    expect(screen.getByText('PerspectiveDetector')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'App' })).not.toBeInTheDocument();
  });
});
