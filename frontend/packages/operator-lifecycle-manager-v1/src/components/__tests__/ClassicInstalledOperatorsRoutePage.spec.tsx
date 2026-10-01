import { render, screen } from '@testing-library/react';
import ClassicInstalledOperatorsRoutePage from '../ClassicInstalledOperatorsRoutePage';

jest.mock('../InstalledOperatorsTabbedPage', () => ({
  __esModule: true,
  default: ({ activeTab }: { activeTab?: string }) => (
    <div data-test="installed-operators-tabbed-page" data-active-tab={activeTab ?? ''} />
  ),
}));

describe('ClassicInstalledOperatorsRoutePage', () => {
  it('selects the Classic Installed Operators tab', () => {
    render(<ClassicInstalledOperatorsRoutePage />);

    expect(screen.getByTestId('installed-operators-tabbed-page')).toHaveAttribute(
      'data-active-tab',
      'classic',
    );
  });
});
