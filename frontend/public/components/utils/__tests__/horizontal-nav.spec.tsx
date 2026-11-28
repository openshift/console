import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { HorizontalNav, NavBar } from '../horizontal-nav';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

const pages = [
  { href: '', name: 'Cluster extensions', component: () => null },
  { href: 'classic', name: 'Classic operators', component: () => null },
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

    expect(screen.getByRole('tab', { name: 'Cluster extensions' })).toHaveAttribute(
      'href',
      '/installed-operators/ns/ns-a/',
    );
    expect(screen.getByRole('tab', { name: 'Classic operators' })).toHaveAttribute(
      'href',
      '/installed-operators/ns/ns-a/classic',
    );
    expect(screen.getByRole('tab', { name: 'Classic operators' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('should not disable the tab underline transition when switching tabs', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/test-ns']}>
        <Routes>
          <Route path="/*" element={<NavBar pages={pages} />} />
        </Routes>
      </MemoryRouter>,
    );

    // PatternFly Tabs applies pf-m-initializing-accent (transition duration 0) while it
    // measures the underline position; wait for the initial mount measurement to settle.
    // Class query is intentional: this asserts PatternFly's internal animation state,
    // which has no user-visible equivalent in jsdom.
    const clusterTab = screen.getByRole('tab', { name: 'Cluster extensions' });
    // eslint-disable-next-line testing-library/no-node-access -- asserts PatternFly's internal animation class, which has no Testing Library query
    const tabsRoot = clusterTab.closest('.pf-v6-c-tabs');
    await waitFor(() => expect(tabsRoot).not.toHaveClass('pf-m-initializing-accent'));

    // React 19 flushes Tab's title-identity effect in the same commit as the tab switch;
    // if it re-measures, pf-m-initializing-accent lands together with the new underline
    // position and the underline jumps instead of animating. The class is removed by a
    // 0 ms timeout, so track whether it ever appears rather than its final state.
    const classLog: string[] = [];
    const observer = new MutationObserver(() => {
      classLog.push(tabsRoot.className);
    });
    observer.observe(tabsRoot, { attributes: true, attributeFilter: ['class'] });

    await user.click(screen.getByRole('tab', { name: 'Classic operators' }));

    expect(classLog.some((className) => className.includes('pf-m-initializing-accent'))).toBe(
      false,
    );
  });
});

describe('HorizontalNav', () => {
  it.each([
    {
      path: '/k8s/all-namespaces/operators.coreos.com~v1alpha1~ClusterServiceVersion',
      route: '/k8s/all-namespaces/:kind',
      activeTab: 'classic',
      content: 'Classic operator list',
    },
    {
      path: '/k8s/ns/ns-a/operators.coreos.com~v1alpha1~ClusterServiceVersion',
      route: '/k8s/ns/:ns/:kind',
      activeTab: 'classic',
      content: 'Classic operator list',
    },
    {
      path: '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension',
      route: '/k8s/cluster/:kind',
      activeTab: '',
      content: 'Cluster extension list',
    },
    {
      path: '/installed-operators/all-namespaces',
      route: '/installed-operators/all-namespaces/*',
      activeTab: undefined,
      content: 'Cluster extension list',
    },
    {
      path: '/installed-operators/all-namespaces/classic',
      route: '/installed-operators/all-namespaces/*',
      activeTab: undefined,
      content: 'Classic operator list',
    },
  ])('renders $content at $path', ({ path, route, activeTab, content }) => {
    (useExtensions as jest.Mock).mockReturnValue([]);
    const contentPages = [
      { href: '', name: 'Cluster extensions', component: () => <>Cluster extension list</> },
      { href: 'classic', name: 'Classic operators', component: () => <>Classic operator list</> },
    ];

    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path={route}
            element={<HorizontalNav pages={contentPages} activeTab={activeTab} noStatusBox />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(content)).toBeVisible();
    expect(
      screen.queryByText(
        content === 'Classic operator list' ? 'Cluster extension list' : 'Classic operator list',
      ),
    ).not.toBeInTheDocument();
  });

  it('renders default tabs first and maps a contributed tab badge', async () => {
    const OLMv1Badge = () => <div data-test="olmv1-info-popover" />;
    (useExtensions as jest.Mock).mockImplementation((predicate: (extension: unknown) => boolean) =>
      [
        {
          type: 'console.tab',
          properties: {
            contextId: 'installed-software',
            name: 'Cluster extensions',
            href: '',
            component: () => Promise.resolve(() => null),
            badge: () => Promise.resolve(OLMv1Badge),
          },
        },
        {
          type: 'console.tab',
          properties: {
            contextId: 'installed-software',
            name: 'Classic operators',
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
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Cluster extensions', 'Classic operators']);
    const olmv1Tab = screen.getByRole('tab', { name: /Cluster extensions/ });
    const badge = await screen.findByTestId('olmv1-info-popover');
    expect(olmv1Tab).toBeInTheDocument();
    expect(olmv1Tab).toHaveAttribute('aria-selected', 'true');
    expect(badge).toBeInTheDocument();
  });
});
