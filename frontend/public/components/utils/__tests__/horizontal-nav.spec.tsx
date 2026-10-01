import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { HorizontalNav, NavBar } from '../horizontal-nav';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

const pages = [
  { href: '', name: 'Next-Gen Operators', component: () => null },
  { href: 'classic', name: 'Classic Operators', component: () => null },
];

describe('NavBar', () => {
  it('uses an explicit active tab and base path', () => {
    render(
      <MemoryRouter initialEntries={['/k8s/ns/ns-a/operators.coreos.com~v1alpha1~CSV']}>
        <Routes>
          <Route
            path="/k8s/ns/:ns/*"
            element={
              <NavBar activeTab="classic" basePath="/installed-operators/ns/ns-a" pages={pages} />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('tab', { name: 'Next-Gen Operators' })).toHaveAttribute(
      'href',
      '/installed-operators/ns/ns-a/',
    );
    expect(screen.getByRole('tab', { name: 'Classic Operators' })).toHaveAttribute(
      'href',
      '/installed-operators/ns/ns-a/classic',
    );
    expect(screen.getByRole('tab', { name: 'Classic Operators' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

describe('HorizontalNav', () => {
  it('renders default tabs first and maps a contributed tab badge', async () => {
    const NextGenBadge = () => <div data-test="olmv1-info-popover" />;
    (useExtensions as jest.Mock).mockImplementation((predicate: (extension: unknown) => boolean) =>
      [
        {
          type: 'console.tab',
          properties: {
            contextId: 'installed-software',
            name: 'Next-Gen Operators',
            href: '',
            component: () => Promise.resolve(() => null),
            badge: () => Promise.resolve(NextGenBadge),
          },
        },
        {
          type: 'console.tab',
          properties: {
            contextId: 'installed-software',
            name: 'Classic Operators',
            href: 'classic',
            component: () => Promise.resolve(() => null),
          },
        },
      ].filter(predicate),
    );

    render(
      <MemoryRouter initialEntries={['/installed-operators/all-namespaces']}>
        <Routes>
          <Route
            path="/installed-operators/*"
            element={
              <HorizontalNav
                basePath="/installed-operators/all-namespaces"
                contextId="installed-software"
                pages={[]}
                noStatusBox
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('loading-box')).not.toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Next-Gen Operators', 'Classic Operators']);
    const nextGenTab = screen.getByRole('tab', { name: /Next-Gen Operators/ });
    const badge = await screen.findByTestId('olmv1-info-popover');
    expect(nextGenTab).toBeInTheDocument();
    expect(nextGenTab).toHaveAttribute('aria-selected', 'true');
    expect(badge).toBeInTheDocument();
  });
});
