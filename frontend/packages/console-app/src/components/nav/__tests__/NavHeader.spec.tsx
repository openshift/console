import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import NavHeader from '../NavHeader';
import { renderWithPerspective } from './navTestUtils';

jest.mock('@console/internal/components/utils/async', () => ({
  AsyncComponent: () => null,
}));

describe('NavHeader', () => {
  const mockOnPerspectiveSelected = jest.fn();
  let mockSetActivePerspective: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetActivePerspective = jest.fn();
  });

  // Uses real perspectives from static plugin data loaded via renderWithProviders
  // Static plugins provide admin and dev perspectives by default
  describe('when multiple perspectives are available', () => {
    it('should render perspective switcher dropdown with toggle button', () => {
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />);

      const toggle = screen.getByRole('button', { expanded: false });
      expect(toggle).toBeVisible();
      expect(screen.getByRole('heading', { name: 'Core platform' })).toBeVisible();
    });

    it('should open dropdown menu when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />);

      const toggle = screen.getByRole('button', { expanded: false });
      await user.click(toggle);

      expect(await screen.findByRole('button', { expanded: true })).toBeVisible();
    });

    it('should display all perspective options in dropdown menu', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />);

      await user.click(screen.getByRole('button'));

      expect(await screen.findByRole('listbox')).toBeVisible();
      expect(screen.getAllByRole('option')).toHaveLength(2);
    });

    it('should switch perspective when an option is selected', async () => {
      const user = userEvent.setup();
      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'admin',
        mockSetActivePerspective,
      );

      await user.click(screen.getByRole('button'));

      expect(await screen.findByRole('button', { expanded: true })).toBeVisible();

      const devOption = screen.getByRole('heading', { name: 'Developer' });
      await user.click(devOption);

      expect(mockSetActivePerspective).toHaveBeenCalledWith('dev');
      expect(mockOnPerspectiveSelected).toHaveBeenCalled();
    });

    it('should close dropdown after selecting a perspective', async () => {
      const user = userEvent.setup();
      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'admin',
        mockSetActivePerspective,
      );

      await user.click(screen.getByRole('button'));

      const listbox = await screen.findByRole('listbox');
      expect(listbox).toBeVisible();

      const options = screen.getAllByRole('option');
      await user.click(options[0]);

      await waitForElementToBeRemoved(listbox);
    });
  });

  describe('when only one perspective is available', () => {
    beforeEach(() => {
      window.SERVER_FLAGS.perspectives = JSON.stringify([
        { id: 'admin', visibility: { state: 'Enabled' } },
        { id: 'dev', visibility: { state: 'Disabled' } },
      ]);
    });

    afterEach(() => {
      delete window.SERVER_FLAGS.perspectives;
    });

    it('should render static label instead of dropdown', () => {
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />);

      expect(screen.getByRole('heading', { name: 'Core platform' })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('when all perspectives are disabled', () => {
    beforeEach(() => {
      window.SERVER_FLAGS.perspectives = JSON.stringify([
        { id: 'admin', visibility: { state: 'Disabled' } },
        { id: 'dev', visibility: { state: 'Disabled' } },
      ]);
    });

    afterEach(() => {
      delete window.SERVER_FLAGS.perspectives;
    });

    it('should fall back to static label for admin perspective', () => {
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />);

      expect(screen.getByRole('heading', { name: 'Core platform' })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
