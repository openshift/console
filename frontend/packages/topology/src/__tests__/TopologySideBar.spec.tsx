import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopologySideBar from '../components/side-bar/TopologySideBar';

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(() => [500, jest.fn(), true]),
}));

jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  DrawerPanelContent: ({ children }) => children,
}));

describe('TopologySideBar', () => {
  it('renders children and close button', () => {
    const handleClose = jest.fn();
    render(<TopologySideBar onClose={handleClose}>Test Content</TopologySideBar>);

    expect(screen.getByTestId('topology-sidepane')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-close-button')).toBeInTheDocument();
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <TopologySideBar onClose={handleClose}>
        <div>Sidebar Content</div>
      </TopologySideBar>,
    );

    fireEvent.click(screen.getByTestId('sidebar-close-button'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
