import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { FLAG_CLUSTER_EXTENSION_API, FLAG_OPERATOR_LIFECYCLE_MANAGER } from '../../const';
import InstalledOperatorsTabbedPage from '../InstalledOperatorsTabbedPage';

jest.mock('@console/internal/components/namespace-bar', () => ({
  NamespaceBar: () => <div data-test="namespace-bar" />,
}));

jest.mock('@console/shared/src/components/multi-tab-list/MultiTabListPage', () => ({
  MultiTabListPage: ({ title, pages }) => (
    <div data-test="multi-tab-list-page" data-title={title}>
      {pages.map((page) => (
        <div key={page.href || 'default'} data-test="tab" data-href={page.href}>
          {page.name}
        </div>
      ))}
    </div>
  ),
}));

const mockUseFlag = jest.fn();
jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

const setFlags = (flags: Record<string, boolean>) =>
  mockUseFlag.mockImplementation((flag: string) => flags[flag] ?? false);

describe('InstalledOperatorsTabbedPage', () => {
  beforeEach(() => {
    setFlags({
      [FLAG_CLUSTER_EXTENSION_API]: true,
      [FLAG_OPERATOR_LIFECYCLE_MANAGER]: true,
    });
  });

  it('should always render the namespace bar', () => {
    renderWithProviders(<InstalledOperatorsTabbedPage />);

    expect(screen.getByTestId('namespace-bar')).toBeInTheDocument();
  });

  it('should land on the Next-Gen tab', () => {
    renderWithProviders(<InstalledOperatorsTabbedPage />);

    const tabs = screen.getAllByTestId('tab');
    expect(tabs[0]).toHaveTextContent('Next-Gen Operators');
    expect(tabs[0]).toHaveAttribute('data-href', '');
  });

  it('should render the Classic tab when OLMv0 is available', () => {
    renderWithProviders(<InstalledOperatorsTabbedPage />);

    const tabs = screen.getAllByTestId('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[1]).toHaveTextContent('Classic Operators');
    expect(tabs[1]).toHaveAttribute('data-href', 'classic');
  });

  it('should hide the Classic tab when OLMv0 is unavailable', () => {
    setFlags({ [FLAG_CLUSTER_EXTENSION_API]: true });

    renderWithProviders(<InstalledOperatorsTabbedPage />);

    const tabs = screen.getAllByTestId('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Next-Gen Operators');
  });

  // OLMv0-only clusters still need the page: the ClusterServiceVersion list redirects into it.
  it('should keep the Classic tab addressable when OLMv1 is unavailable', () => {
    setFlags({ [FLAG_OPERATOR_LIFECYCLE_MANAGER]: true });

    renderWithProviders(<InstalledOperatorsTabbedPage />);

    const tabs = screen.getAllByTestId('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Classic Operators');
    expect(tabs[0]).toHaveAttribute('data-href', 'classic');
  });
});
