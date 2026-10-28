import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom-v5-compat';
import { NamespaceContext } from '@console/app/src/components/detect-namespace/namespace';
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

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(() => [[], true]),
}));

// Importing the Console plugin store starts plugins that require webpack's populated share scope.
// The drawer resolves no alert action extensions, so skip application startup in Jest.
jest.mock('@console/dynamic-plugin-sdk/src/runtime/plugin-init', () => ({
  initConsolePlugins: jest.fn(),
}));

const useNotificationAlertsMock = useNotificationAlerts as jest.Mock;

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
    </NamespaceContext.Provider>,
  );

const severities: [string, string][] = [
  ['critical', 'Notifications in the critical alerts group'],
  ['warning', 'Notifications in the other alerts group'],
];

severities.forEach(([severity, groupName]) => {
  describe(`NotificationDrawer ${severity} alert cap`, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    [5, 50].forEach((count) => {
      it(`renders all ${count} alerts without an overflow entry`, async () => {
        useNotificationAlertsMock.mockReturnValue([makeAlerts(count, severity), true, null]);
        renderDrawer();

        const group = within(await screen.findByRole('list', { name: groupName }));
        expect(group.getAllByText(/^Alert \d+$/)).toHaveLength(count);
        expect(group.queryByText(/View all/)).not.toBeInTheDocument();
      });
    });

    it('caps rendered alerts at 50 and shows the full count in the overflow entry', async () => {
      useNotificationAlertsMock.mockReturnValue([makeAlerts(200, severity), true, null]);
      renderDrawer();

      const group = within(await screen.findByRole('list', { name: groupName }));
      expect(group.getAllByText(/^Alert \d+$/)).toHaveLength(50);
      expect(group.getByText('View all 200 alerts')).toBeVisible();
    });

    it('selects all namespaces when opening the full alert list', () => {
      const setNamespace = jest.fn();
      useNotificationAlertsMock.mockReturnValue([makeAlerts(200, severity), true, null]);
      renderDrawer(setNamespace);

      const group = within(screen.getByRole('list', { name: groupName }));
      userEvent.click(group.getByText('View all 200 alerts'));

      expect(setNamespace).toHaveBeenCalledWith(ALL_NAMESPACES_KEY);
      expect(screen.getByRole('heading', { name: 'Alerts' })).toBeVisible();
    });
  });
});
