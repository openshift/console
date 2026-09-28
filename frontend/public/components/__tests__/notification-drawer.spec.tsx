import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { NamespaceContext } from '@console/app/src/providers/detect-context/namespace';
import { ToastProvider } from '@console/app/src/providers/toast/ToastProvider';
import type { Alert } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { AlertStates, RuleStates } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { NotificationDrawer } from '../notification-drawer';

jest.mock('@console/shared/src/hooks/useNotificationAlerts', () => ({
  useNotificationAlerts: jest.fn(() => [[], true, null]),
}));

jest.mock('@console/shared/src/hooks/useCanClusterUpgrade', () => ({
  useCanClusterUpgrade: jest.fn(() => false),
}));

// Importing the Console plugin store starts plugins that require webpack's populated share scope.
// The drawer uses its own empty plugin store below, so skip application startup in Jest.
jest.mock('@console/dynamic-plugin-sdk/src/runtime/plugin-init', () => ({
  initConsolePlugins: jest.fn(),
}));

const makeAlerts = (count: number, severity: string): Alert[] =>
  Array.from({ length: count }, (_, i) => ({
    activeAt: '2025-01-01T00:00:00Z',
    annotations: { description: `Alert ${i}` },
    labels: { alertname: `TestAlert${i}`, severity },
    rule: {
      id: `rule-${i}`,
      name: `TestAlert${i}`,
      alerts: [],
      annotations: {},
      duration: 0,
      labels: {},
      query: 'vector(1)',
      state: RuleStates.Firing,
      type: 'alerting',
    },
    state: AlertStates.Firing,
  }));

const renderDrawer = (setNamespace = jest.fn()) =>
  renderWithProviders(
    <NamespaceContext.Provider value={{ namespace: 'test-namespace', setNamespace }}>
      <ToastProvider>
        <Routes>
          <Route
            path="/"
            element={
              <NotificationDrawer
                isDrawerExpanded
                onDrawerChange={jest.fn()}
                drawerRef={{ current: null }}
              />
            }
          />
          <Route path="/monitoring/alerts" element={<h1>Alerts</h1>} />
        </Routes>
      </ToastProvider>
    </NamespaceContext.Provider>,
    {
      pluginStore: new PluginStore({
        loaderOptions: { entryCallbackSettings: { registerCallback: false } },
      }),
    },
  );

describe.each([
  ['critical', 'Notifications in the critical alerts group'],
  ['warning', 'Notifications in the other alerts group'],
])('NotificationDrawer %s alert cap', (severity, groupName) => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([5, 50])('renders all %i alerts without an overflow entry', async (count) => {
    jest.mocked(useNotificationAlerts).mockReturnValue([makeAlerts(count, severity), true, null]);
    renderDrawer();

    const group = within(await screen.findByRole('list', { name: groupName }));
    expect(group.getAllByText(/^Alert \d+$/)).toHaveLength(count);
    expect(group.queryByText(/View all/)).not.toBeInTheDocument();
  });

  it('caps rendered alerts at 50 and shows the full count in the overflow entry', async () => {
    jest.mocked(useNotificationAlerts).mockReturnValue([makeAlerts(200, severity), true, null]);
    renderDrawer();

    const group = within(await screen.findByRole('list', { name: groupName }));
    expect(group.getAllByText(/^Alert \d+$/)).toHaveLength(50);
    expect(group.getByText('View all 200 alerts')).toBeVisible();
  });

  it('selects all namespaces when opening the full alert list', async () => {
    const user = userEvent.setup();
    const setNamespace = jest.fn();
    jest.mocked(useNotificationAlerts).mockReturnValue([makeAlerts(200, severity), true, null]);
    renderDrawer(setNamespace);

    const group = within(await screen.findByRole('list', { name: groupName }));
    await user.click(group.getByText('View all 200 alerts'));

    expect(setNamespace).toHaveBeenCalledWith(ALL_NAMESPACES_KEY);
    expect(await screen.findByRole('heading', { name: 'Alerts' })).toBeVisible();
  });
});
