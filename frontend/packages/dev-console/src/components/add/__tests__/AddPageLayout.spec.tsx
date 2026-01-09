import { screen, cleanup } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
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

  describe('Details switch', () => {
    it('should show correct text for switch when it is checked', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([addActionExtensions, true]);

      renderWithProviders(<AddPageLayout {...props} />);

      expect(screen.getByText('Details on')).toBeInTheDocument();
    });

    it('should show correct text for switch when it is unchecked', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([false, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([addActionExtensions, true]);

      renderWithProviders(<AddPageLayout {...props} />);

      expect(screen.getByText('Details off')).toBeInTheDocument();
    });

    it('should show loading state for switch if add actions have not resolved', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([[], false]);
      useAccessFilterExtensionsSpy.mockReturnValue([[], true]);

      renderWithProviders(<AddPageLayout {...props} />);

      expect(screen.getByTestId('add-page-skeleton')).toBeInTheDocument();
    });

    it('should show loading state for switch if add actions from access check have not loaded', () => {
      (useShowAddCardItemDetails as jest.Mock).mockReturnValue([true, () => {}]);
      useAddActionExtensionsSpy.mockReturnValue([addActionExtensions, true]);
      useAccessFilterExtensionsSpy.mockReturnValue([[], false]);

      renderWithProviders(<AddPageLayout {...props} />);

      expect(screen.getByTestId('add-page-skeleton')).toBeInTheDocument();
    });
  });
});
