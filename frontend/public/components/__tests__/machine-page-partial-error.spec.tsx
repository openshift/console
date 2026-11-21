import { screen } from '@testing-library/react';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { MachineKind, MachineSetKind } from '../../module/k8s';
import { MachinePage } from '../machine';
import { MachineSetPage } from '../machine-set';
import { useK8sWatchResources } from '../utils/k8s-watch-hook';

jest.mock('../utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
  useK8sWatchResource: jest.fn(() => [undefined, true, undefined]),
}));

jest.mock('../factory/ListPage/ListPageCreate', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

// Keep StatusBox so a mistaken page-level 403 still surfaces as Access Denied.
jest.mock('@console/app/src/components/data-view/ConsoleDataView', () => ({
  ConsoleDataView: ({
    data,
    loaded,
    loadError,
    label,
  }: {
    data: { metadata?: { name?: string; uid?: string } }[];
    loaded: boolean;
    loadError?: { message?: string };
    label?: string;
  }) => (
    <StatusBox data={data} loaded={loaded} loadError={loadError} label={label}>
      <ul>
        {(data || []).map((obj) => (
          <li key={obj.metadata?.uid || obj.metadata?.name}>{obj.metadata?.name}</li>
        ))}
      </ul>
    </StatusBox>
  ),
}));

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;

const httpError = (status: number, message = `HTTP ${status}`) =>
  Object.assign(new Error(message), { response: { status } });

const mapiMachine: MachineKind = {
  apiVersion: 'machine.openshift.io/v1beta1',
  kind: 'Machine',
  metadata: {
    name: 'mapi-worker-1',
    namespace: 'openshift-machine-api',
    uid: 'mapi-1',
  },
  spec: {},
} as MachineKind;

const mapiMachineSet: MachineSetKind = {
  apiVersion: 'machine.openshift.io/v1beta1',
  kind: 'MachineSet',
  metadata: {
    name: 'mapi-workers',
    namespace: 'openshift-machine-api',
    uid: 'ms-1',
  },
  spec: {
    selector: {},
    template: { spec: {} },
  },
} as MachineSetKind;

describe('combined Machine / MachineSet pages with CAPI 403', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('MachinePage keeps MAPI rows and shows an inline CAPI warning, not Access Denied', () => {
    useK8sWatchResourcesMock.mockImplementation((resources: Record<string, unknown>) => {
      if ('mapMachines' in resources && 'capiMachines' in resources) {
        return {
          mapMachines: { data: [mapiMachine], loaded: true, loadError: undefined },
          capiMachines: { data: [], loaded: false, loadError: httpError(403, 'capi forbidden') },
        };
      }
      return {};
    });

    renderWithProviders(<MachinePage namespace="openshift-machine-api" />);

    expect(screen.getByText('mapi-worker-1')).toBeVisible();
    expect(screen.getByText('Cluster API resources could not be listed')).toBeVisible();
    expect(screen.queryByText('Restricted access')).not.toBeInTheDocument();
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
  });

  it('MachineSetPage keeps MAPI rows and shows an inline CAPI warning, not Access Denied', () => {
    useK8sWatchResourcesMock.mockImplementation((resources: Record<string, unknown>) => {
      if ('mapMachineSets' in resources) {
        return {
          mapMachineSets: { data: [mapiMachineSet], loaded: true, loadError: undefined },
          capiMachineSets: {
            data: [],
            loaded: false,
            loadError: httpError(403, 'capi forbidden'),
          },
        };
      }
      // Nested MachineSetList capacity watches — keep them successful so the list can render.
      if ('mapMachines' in resources) {
        return {
          mapMachines: { data: [], loaded: true, loadError: undefined },
          capiMachines: { data: [], loaded: true, loadError: undefined },
        };
      }
      return {};
    });

    renderWithProviders(<MachineSetPage namespace="openshift-machine-api" />);

    expect(screen.getByText('mapi-workers')).toBeVisible();
    expect(screen.getByText('Cluster API resources could not be listed')).toBeVisible();
    expect(screen.queryByText('Restricted access')).not.toBeInTheDocument();
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
  });
});
