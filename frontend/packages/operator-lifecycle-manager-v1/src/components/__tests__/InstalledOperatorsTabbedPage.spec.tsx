import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { InstalledOperatorsTabbedPage } from '../InstalledOperatorsTabbedPage';

jest.mock('@console/internal/components/namespace-bar', () => ({
  NamespaceBar: () => <div data-test="namespace-bar" />,
}));

jest.mock('@console/shared/src/components/multi-tab-list/MultiTabListPage', () => ({
  MultiTabListPage: ({ title, badge, contextId, pages, activeTab, basePath }) => (
    <div
      data-test="multi-tab-list-page"
      data-active-tab={activeTab ?? ''}
      data-base-path={basePath}
      data-context-id={contextId}
      data-title={title}
      data-page-count={pages.length}
    >
      {badge}
    </div>
  ),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ ns: 'ns-a' }),
}));

describe('InstalledOperatorsTabbedPage', () => {
  it('should always render the namespace bar', () => {
    renderWithProviders(<InstalledOperatorsTabbedPage />);

    expect(screen.getByTestId('namespace-bar')).toBeInTheDocument();
  });

  it('should let plugins contribute tabs through the installed-operators context', () => {
    render(<InstalledOperatorsTabbedPage />);

    const page = screen.getByTestId('multi-tab-list-page');
    expect(page).toHaveAttribute('data-context-id', 'installed-operators');
    expect(page).toHaveAttribute('data-page-count', '0');
    expect(page).toHaveAttribute('data-title', 'Installed Operators');
  });

  it('should pass the selected tab and canonical tab path to the tab list', () => {
    renderWithProviders(<InstalledOperatorsTabbedPage activeTab="classic" />);

    const page = screen.getByTestId('multi-tab-list-page');
    expect(page).toHaveAttribute('data-active-tab', 'classic');
    expect(page).toHaveAttribute('data-base-path', '/installed-operators/ns/ns-a');
  });

  it('should not show the OLMv1 information popover with the page title', () => {
    render(<InstalledOperatorsTabbedPage />);

    expect(screen.queryByTestId('olmv1-info-popover')).not.toBeInTheDocument();
  });
});
