import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { Navigation } from '../index';
import NavHeader from '../NavHeader';
import PerspectiveNav from '../PerspectiveNav';

jest.mock('../NavHeader', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../PerspectiveNav', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const MockNavHeader = NavHeader as jest.Mock;
const MockPerspectiveNav = PerspectiveNav as jest.Mock;

describe('Navigation', () => {
  const mockOnNavSelect = jest.fn();
  const mockOnPerspectiveSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    MockNavHeader.mockImplementation(({ onPerspectiveSelected }) => {
      onPerspectiveSelected();
      return null;
    });
    MockPerspectiveNav.mockImplementation(() => null);
  });

  it('should render navigation sidebar when isNavOpen is true', () => {
    MockNavHeader.mockImplementation(() => null);
    renderWithProviders(
      <Navigation
        isNavOpen
        onNavSelect={mockOnNavSelect}
        onPerspectiveSelected={mockOnPerspectiveSelected}
      />,
    );

    expect(screen.getByRole('navigation')).toBeVisible();
  });

  it('should render NavHeader component', () => {
    renderWithProviders(
      <Navigation
        isNavOpen
        onNavSelect={mockOnNavSelect}
        onPerspectiveSelected={mockOnPerspectiveSelected}
      />,
    );

    expect(MockNavHeader).toHaveBeenCalled();
  });

  it('should render PerspectiveNav component', () => {
    renderWithProviders(
      <Navigation
        isNavOpen
        onNavSelect={mockOnNavSelect}
        onPerspectiveSelected={mockOnPerspectiveSelected}
      />,
    );

    expect(MockPerspectiveNav).toHaveBeenCalled();
  });

  it('should pass onPerspectiveSelected callback to NavHeader', () => {
    MockNavHeader.mockImplementation(({ onPerspectiveSelected }) => {
      onPerspectiveSelected();
      return null;
    });
    renderWithProviders(
      <Navigation
        isNavOpen
        onNavSelect={mockOnNavSelect}
        onPerspectiveSelected={mockOnPerspectiveSelected}
      />,
    );

    expect(mockOnPerspectiveSelected).toHaveBeenCalled();
  });

  it('should have accessible aria-label on Nav', () => {
    MockNavHeader.mockImplementation(() => null);
    renderWithProviders(
      <Navigation
        isNavOpen
        onNavSelect={mockOnNavSelect}
        onPerspectiveSelected={mockOnPerspectiveSelected}
      />,
    );

    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Nav');
  });

  it('should hide sidebar when isNavOpen is false', () => {
    renderWithProviders(
      <Navigation
        isNavOpen={false}
        onNavSelect={mockOnNavSelect}
        onPerspectiveSelected={mockOnPerspectiveSelected}
      />,
    );

    expect(screen.getByTestId('navigation-page-sidebar')).toHaveAttribute('aria-hidden', 'true');
  });
});
