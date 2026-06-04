import { render, screen } from '@testing-library/react';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import type { NodeKind } from '@console/internal/module/k8s';
import NodeDetailsGpuMetrics from '../NodeDetailsGpuMetrics';

jest.mock('@console/internal/components/graphs/prometheus-poll-hook', () => ({
  usePrometheusPoll: jest.fn(),
}));

const mockUsePrometheusPoll = usePrometheusPoll as jest.Mock;

const baseNode: NodeKind = {
  apiVersion: 'v1',
  kind: 'Node',
  metadata: { name: 'gpu-node-1', uid: 'uid-1' },
  spec: {},
  status: {
    capacity: { 'nvidia.com/gpu': '2', cpu: '8', memory: '32Gi' },
    allocatable: { 'nvidia.com/gpu': '2', cpu: '7500m', memory: '30Gi' },
    conditions: [],
    images: [],
  },
};

const nonGpuNode: NodeKind = {
  apiVersion: 'v1',
  kind: 'Node',
  metadata: { name: 'cpu-node-1', uid: 'uid-2' },
  spec: {},
  status: {
    capacity: { cpu: '8', memory: '32Gi' },
    allocatable: { cpu: '7500m', memory: '30Gi' },
    conditions: [],
    images: [],
  },
};

const makeResponse = (
  results: { gpu: string; value: string; modelName?: string; device?: string }[],
) => ({
  status: 'success',
  data: {
    resultType: 'vector' as const,
    result: results.map((r) => ({
      metric: {
        gpu: r.gpu,
        ...(r.modelName && { modelName: r.modelName }),
        ...(r.device && { device: r.device }),
      },
      value: [Date.now() / 1000, r.value],
    })),
  },
});

const makeScalarResponse = (value: string) => ({
  status: 'success',
  data: {
    resultType: 'vector' as const,
    result: [{ metric: {}, value: [Date.now() / 1000, value] }],
  },
});

const emptyResponse = { status: 'success', data: { resultType: 'vector' as const, result: [] } };

describe('NodeDetailsGpuMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing for a non-GPU node when no metrics are returned', () => {
    mockUsePrometheusPoll.mockReturnValue([emptyResponse, null, false]);
    const { container } = render(<NodeDetailsGpuMetrics node={nonGpuNode} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the GPU metrics heading when the node has GPU capacity', () => {
    mockUsePrometheusPoll.mockReturnValue([emptyResponse, null, false]);
    render(<NodeDetailsGpuMetrics node={baseNode} />);
    expect(screen.getByText('GPU metrics')).toBeInTheDocument();
  });

  it('shows capacity and allocatable counts from node status', () => {
    mockUsePrometheusPoll.mockReturnValue([emptyResponse, null, false]);
    render(<NodeDetailsGpuMetrics node={baseNode} />);
    expect(screen.getByText('GPU capacity')).toBeInTheDocument();
    expect(screen.getByText('Allocatable GPUs')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('shows a spinner while loading', () => {
    mockUsePrometheusPoll.mockReturnValue([undefined, null, true]);
    render(<NodeDetailsGpuMetrics node={baseNode} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders GPU count, model, and a table with device labels when GPU metrics are returned', () => {
    const countResp = makeScalarResponse('2');
    const utilResp = makeResponse([
      { gpu: '0', value: '45', modelName: 'Tesla T4', device: 'nvidia0' },
      { gpu: '1', value: '78', modelName: 'Tesla T4', device: 'nvidia1' },
    ]);
    const tempResp = makeResponse([
      { gpu: '0', value: '62', modelName: 'Tesla T4' },
      { gpu: '1', value: '71', modelName: 'Tesla T4' },
    ]);
    const powerResp = makeResponse([
      { gpu: '0', value: '120.5' },
      { gpu: '1', value: '185.3' },
    ]);
    const fbUsedResp = makeResponse([
      { gpu: '0', value: '4096' },
      { gpu: '1', value: '8192' },
    ]);
    const fbFreeResp = makeResponse([
      { gpu: '0', value: '12288' },
      { gpu: '1', value: '8192' },
    ]);

    mockUsePrometheusPoll
      .mockReturnValueOnce([countResp, null, false])
      .mockReturnValueOnce([utilResp, null, false])
      .mockReturnValueOnce([tempResp, null, false])
      .mockReturnValueOnce([powerResp, null, false])
      .mockReturnValueOnce([fbUsedResp, null, false])
      .mockReturnValueOnce([fbFreeResp, null, false]);

    render(<NodeDetailsGpuMetrics node={baseNode} />);

    expect(screen.getByText('GPU count')).toBeInTheDocument();
    expect(screen.getByText('GPU model')).toBeInTheDocument();
    expect(screen.getByText('Tesla T4')).toBeInTheDocument();
    expect(screen.getByText('GPU device')).toBeInTheDocument();

    expect(screen.getByText('GPU 0 \u2014 Tesla T4')).toBeInTheDocument();
    expect(screen.getByText('GPU 1 \u2014 Tesla T4')).toBeInTheDocument();

    expect(screen.getByText('Utilization')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Power usage')).toBeInTheDocument();

    expect(screen.getByText('45 %')).toBeInTheDocument();
    expect(screen.getByText('78 %')).toBeInTheDocument();
    expect(screen.getByText('62 °C')).toBeInTheDocument();
    expect(screen.getByText('71 °C')).toBeInTheDocument();
    expect(screen.getByText('120.5 W')).toBeInTheDocument();
    expect(screen.getByText('185.3 W')).toBeInTheDocument();
    expect(screen.getByText('4.0 GiB')).toBeInTheDocument();
    expect(screen.getAllByText('8.0 GiB')).toHaveLength(2);
  });

  it('renders a table with six column headers and correct row count', () => {
    const countResp = makeScalarResponse('2');
    const utilResp = makeResponse([
      { gpu: '0', value: '45', modelName: 'Tesla T4' },
      { gpu: '1', value: '78', modelName: 'Tesla T4' },
    ]);

    mockUsePrometheusPoll
      .mockReturnValueOnce([countResp, null, false])
      .mockReturnValueOnce([utilResp, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false]);

    render(<NodeDetailsGpuMetrics node={baseNode} />);

    const table = screen.getByRole('grid', { name: 'Per-device GPU metrics' });
    expect(table).toBeInTheDocument();

    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(6);
    expect(screen.getByRole('columnheader', { name: 'GPU device' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Utilization' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Temperature' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Power usage' })).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Framebuffer memory used' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Framebuffer memory free' }),
    ).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
  });

  it('shows the not-available message when node has capacity but no metric data', () => {
    mockUsePrometheusPoll.mockReturnValue([emptyResponse, null, false]);
    render(<NodeDetailsGpuMetrics node={baseNode} />);
    expect(screen.getByText(/GPU metrics are not available/)).toBeInTheDocument();
  });

  it('does not show GPU count when the Prometheus count value is non-numeric', () => {
    const countResp = makeScalarResponse('not-a-number');
    const utilResp = makeResponse([{ gpu: '0', value: '50' }]);

    mockUsePrometheusPoll
      .mockReturnValueOnce([countResp, null, false])
      .mockReturnValueOnce([utilResp, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false]);

    render(<NodeDetailsGpuMetrics node={baseNode} />);
    expect(screen.queryByText('GPU count')).not.toBeInTheDocument();
  });

  it('ignores Prometheus results without a GPU identifier', () => {
    const respWithMissing = {
      status: 'success',
      data: {
        resultType: 'vector' as const,
        result: [
          { metric: { gpu: '0' }, value: [Date.now() / 1000, '30'] },
          { metric: {}, value: [Date.now() / 1000, '99'] },
        ],
      },
    };

    mockUsePrometheusPoll
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([respWithMissing, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false]);

    render(<NodeDetailsGpuMetrics node={baseNode} />);
    expect(screen.getByText('30 %')).toBeInTheDocument();
    expect(screen.queryByText('99 %')).not.toBeInTheDocument();
  });

  it('renders metrics when the node has DCGM data but no GPU capacity keys', () => {
    const utilResp = makeResponse([{ gpu: '0', value: '55' }]);

    mockUsePrometheusPoll
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([utilResp, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false]);

    render(<NodeDetailsGpuMetrics node={nonGpuNode} />);
    expect(screen.getByText('GPU metrics')).toBeInTheDocument();
    expect(screen.getByText('55 %')).toBeInTheDocument();
  });

  it('shows capacity and unavailable message for an AMD-only GPU node', () => {
    const amdNode: NodeKind = {
      apiVersion: 'v1',
      kind: 'Node',
      metadata: { name: 'amd-node-1', uid: 'uid-3' },
      spec: {},
      status: {
        capacity: { 'amd.com/gpu': '1', cpu: '16', memory: '64Gi' },
        allocatable: { 'amd.com/gpu': '1', cpu: '15', memory: '62Gi' },
        conditions: [],
        images: [],
      },
    };

    mockUsePrometheusPoll.mockReturnValue([emptyResponse, null, false]);
    render(<NodeDetailsGpuMetrics node={amdNode} />);
    expect(screen.getByText('GPU metrics')).toBeInTheDocument();
    expect(screen.getByText('GPU capacity')).toBeInTheDocument();
    expect(screen.getByText('Allocatable GPUs')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/GPU metrics are not available/)).toBeInTheDocument();
  });

  it('shows the metrics table when some polls fail but utilization data is present', () => {
    const utilResp = makeResponse([{ gpu: '0', value: '80' }]);

    mockUsePrometheusPoll
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([utilResp, null, false])
      .mockReturnValueOnce([undefined, new Error('fetch failed'), false])
      .mockReturnValueOnce([undefined, new Error('fetch failed'), false])
      .mockReturnValueOnce([undefined, new Error('fetch failed'), false])
      .mockReturnValueOnce([undefined, new Error('fetch failed'), false]);

    render(<NodeDetailsGpuMetrics node={baseNode} />);
    expect(screen.getByText('GPU device')).toBeInTheDocument();
    expect(screen.getByText('80 %')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(4);
  });

  it('maps GPU metrics using GPU_I_ID, UUID, or device when gpu label is absent', () => {
    const respWithAltLabels = {
      status: 'success',
      data: {
        resultType: 'vector' as const,
        result: [
          { metric: { GPU_I_ID: 'mig-0' }, value: [Date.now() / 1000, '40'] },
          { metric: { UUID: 'GPU-abc-123' }, value: [Date.now() / 1000, '60'] },
          { metric: { device: 'nvidia1' }, value: [Date.now() / 1000, '75'] },
        ],
      },
    };

    mockUsePrometheusPoll
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([respWithAltLabels, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false])
      .mockReturnValueOnce([emptyResponse, null, false]);

    render(<NodeDetailsGpuMetrics node={baseNode} />);
    expect(screen.getByText('40 %')).toBeInTheDocument();
    expect(screen.getByText('60 %')).toBeInTheDocument();
    expect(screen.getByText('75 %')).toBeInTheDocument();
    expect(screen.getByText(/GPU mig-0/)).toBeInTheDocument();
    expect(screen.getByText(/GPU GPU-abc-123/)).toBeInTheDocument();
    expect(screen.getByText(/GPU nvidia1/)).toBeInTheDocument();
  });
});
