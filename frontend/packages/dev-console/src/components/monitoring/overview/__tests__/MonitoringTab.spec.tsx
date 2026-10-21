import { render, screen } from '@testing-library/react';
import MonitoringTab from '../MonitoringTab';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(() => ({
    resourceEvents: { data: [], loaded: true, loadError: null },
  })),
}));

jest.mock('@console/internal/models', () => ({
  PodModel: { kind: 'Pod' },
}));

jest.mock('@console/internal/module/k8s', () => ({
  PodKind: {},
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  getReferenceForModel: jest.fn(
    (model) => `${model.apiGroup || 'core'}~${model.apiVersion}~${model.kind}`,
  ),
  getReference: jest.fn((ref) => `${ref.group || 'core'}~${ref.version}~${ref.kind}`),
  K8sModel: {},
}));

jest.mock('../MonitoringOverview', () => ({
  __esModule: true,
  default: () => 'MonitoringOverview',
}));

jest.mock('@console/shared', () => ({
  usePodsWatcher: () => ({
    loaded: true,
    loadError: '',
    podData: {},
  }),
  OverviewItem: {},
}));

describe('Monitoring Tab', () => {
  const monTabProps: React.ComponentProps<typeof MonitoringTab> = {
    item: {
      obj: {
        metadata: {
          name: 'workload-name',
          namespace: 'test',
        },
        kind: 'Deployment',
        status: {},
        spec: {
          selector: {},
          template: {
            metadata: {},
            spec: {
              containers: [],
            },
          },
        },
      },
    },
  };

  it('should render Monitoring tab with Metrics section for selected workload', () => {
    render(<MonitoringTab {...monTabProps} />);

    expect(screen.getByText(/MonitoringOverview/)).toBeInTheDocument();
  });
});
