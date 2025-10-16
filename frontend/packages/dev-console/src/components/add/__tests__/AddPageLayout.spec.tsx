import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
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

describe('AddPageLayout', () => {
  const props = { title: 'title' };
  const useAddActionExtensionsSpy = jest.spyOn(utils, 'useAddActionExtensions');
  const useAccessFilterExtensionsSpy = jest.spyOn(accessFilterHook, 'useAccessFilterExtensions');

  afterEach(() => {
    jest.resetAllMocks();
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
