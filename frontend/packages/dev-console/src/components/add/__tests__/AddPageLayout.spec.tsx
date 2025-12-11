import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import * as utils from '../../../utils/useAddActionExtensions';
import AddPageLayout from '../AddPageLayout';
import * as accessFilterHook from '../hooks/useAccessFilterExtensions';
import { useShowAddCardItemDetails } from '../hooks/useShowAddCardItemDetails';
import { addActionExtensions } from './add-page-test-data';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => {
  return { useExtensions: () => [] };
});

jest.mock('../hooks/useShowAddCardItemDetails', () => ({
  useShowAddCardItemDetails: jest.fn(),
}));

jest.mock('@console/app/src/components/quick-starts/utils/useQuickStarts', () => ({
  useQuickStarts: () => [[], true, null],
}));

jest.mock('../../../utils/useAddActionExtensions', () => ({
  ...jest.requireActual('../../../utils/useAddActionExtensions'),
  useAddActionExtensions: jest.fn(),
}));

jest.mock('../hooks/useAccessFilterExtensions', () => ({
  ...jest.requireActual('../hooks/useAccessFilterExtensions'),
  useAccessFilterExtensions: jest.fn(),
}));

const useAddActionExtensionsSpy = utils.useAddActionExtensions as jest.Mock;
const useAccessFilterExtensionsSpy = accessFilterHook.useAccessFilterExtensions as jest.Mock;

describe('AddPageLayout', () => {
  const props = { title: 'title' };

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const renderWithProvider = (ui: React.ReactNode) =>
    render(<Provider store={store}>{ui}</Provider>);

  describe('Details switch', () => {
    it('should show correct text for switch when it is checked', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([addActionExtensions, true]);

      renderWithProvider(<AddPageLayout {...props} />);

      expect(screen.getByText('Details on')).toBeInTheDocument();
    });

    it('should show correct text for switch when it is unchecked', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([false, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([addActionExtensions, true]);

      renderWithProvider(<AddPageLayout {...props} />);

      expect(screen.getByText('Details off')).toBeInTheDocument();
    });

    it('should show loading state for switch if add actions have not resolved', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([[], false]);
      useAccessFilterExtensionsSpy.mockReturnValue([[], true]);

      renderWithProvider(<AddPageLayout {...props} />);

      expect(screen.getByTestId('add-page-skeleton')).toBeInTheDocument();
    });

    it('should show loading state for switch if add actions from access check have not loaded', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([[], false]);

      renderWithProvider(<AddPageLayout {...props} />);

      expect(screen.getByTestId('add-page-skeleton')).toBeInTheDocument();
    });
  });
});
