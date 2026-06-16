import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { LabelComponent, InsightsPopup } from '../index';

jest.mock('@patternfly/react-charts/victory', () => ({
  ChartDonut: jest.fn(() => null),
  ChartLegend: jest.fn(() => null),
  ChartLabel: jest.fn(() => null),
  createContainer: jest.fn(() => 'div'),
}));

jest.mock('@console/internal/components/error', () => ({
  ErrorState: jest.fn(() => 'ErrorState'),
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: jest.fn(() => 'Timestamp'),
}));

jest.mock('@console/shared/src/components/links/ExternalLink', () => ({
  ExternalLink: jest.fn(({ text }) => text),
}));

jest.mock('@console/internal/components/utils', () => ({
  documentationURLs: { usingInsights: 'usingInsights' },
  getDocumentationURL: jest.fn(() => 'https://docs.example.com'),
  isManaged: jest.fn(() => false),
}));

describe('LabelComponent', () => {
  it('should generate correct href for a valid clusterID and risk level', () => {
    render(<LabelComponent clusterID="cluster-abc" datum={{ id: 'critical' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      'https://console.redhat.com/openshift/insights/advisor/clusters/cluster-abc?total_risk=4',
    );
  });

  it('should compute totalRisk for low as 1', () => {
    render(<LabelComponent clusterID="cluster-1" datum={{ id: 'low' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      'https://console.redhat.com/openshift/insights/advisor/clusters/cluster-1?total_risk=1',
    );
  });

  it('should compute totalRisk for moderate as 2', () => {
    render(<LabelComponent clusterID="cluster-1" datum={{ id: 'moderate' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      'https://console.redhat.com/openshift/insights/advisor/clusters/cluster-1?total_risk=2',
    );
  });

  it('should compute totalRisk for important as 3', () => {
    render(<LabelComponent clusterID="cluster-1" datum={{ id: 'important' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      'https://console.redhat.com/openshift/insights/advisor/clusters/cluster-1?total_risk=3',
    );
  });

  it('should compute totalRisk for critical as 4', () => {
    render(<LabelComponent clusterID="cluster-1" datum={{ id: 'critical' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      'https://console.redhat.com/openshift/insights/advisor/clusters/cluster-1?total_risk=4',
    );
  });

  it('should not render a link when clusterID is empty', () => {
    render(<LabelComponent clusterID="" datum={{ id: 'critical' }} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should not render a link when datum is undefined', () => {
    render(<LabelComponent clusterID="cluster-1" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should not render a link when datum.id is an unknown risk level', () => {
    render(<LabelComponent clusterID="cluster-1" datum={{ id: 'unknown-risk' }} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should set target="_blank" and rel="noopener noreferrer"', () => {
    render(<LabelComponent clusterID="cluster-1" datum={{ id: 'low' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should set tabIndex=0 for keyboard accessibility', () => {
    render(<LabelComponent clusterID="cluster-1" datum={{ id: 'low' }} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('tabindex', '0');
  });
});

const makePrometheusResponse = (
  results: { metric: Record<string, string>; value: [number, string] }[],
) => ({
  status: 'success' as const,
  data: {
    resultType: 'vector' as const,
    result: results,
  },
});

const metricsResponse = makePrometheusResponse([
  { metric: { metric: 'low' }, value: [0, '3'] },
  { metric: { metric: 'moderate' }, value: [0, '2'] },
  { metric: { metric: 'important' }, value: [0, '1'] },
  { metric: { metric: 'critical' }, value: [0, '0'] },
]);

const operatorAvailable = makePrometheusResponse([
  { metric: { condition: 'Available' }, value: [0, '1'] },
]);

const lastGatherResponse = makePrometheusResponse([
  { metric: {}, value: [0, `${Math.floor(Date.now() / 1000)}`] },
]);

const k8sCluster = {
  data: {
    apiVersion: 'config.openshift.io/v1',
    kind: 'ClusterVersion',
    spec: { clusterID: 'test-cluster-id' },
  },
  loaded: true,
  loadError: null,
} as any;

describe('InsightsPopup', () => {
  const baseResponses = [
    { response: metricsResponse, error: null },
    { response: operatorAvailable, error: null },
    { response: lastGatherResponse, error: null },
  ];

  it('should render ErrorState when upload is degraded', () => {
    const degradedOperator = makePrometheusResponse([
      { metric: { condition: 'Degraded' }, value: [0, '1'] },
      { metric: { condition: 'UploadDegraded' }, value: [0, '1'] },
    ]);
    const responses = [
      { response: metricsResponse, error: null },
      { response: degradedOperator, error: null },
      { response: lastGatherResponse, error: null },
    ];

    renderWithProviders(<InsightsPopup responses={responses} k8sResult={k8sCluster} />);
    expect(screen.getByText('ErrorState')).toBeInTheDocument();
  });

  it('should show "Temporarily unavailable" on metrics error', () => {
    const responses = [
      { response: metricsResponse, error: new Error('fail') },
      { response: operatorAvailable, error: null },
      { response: lastGatherResponse, error: null },
    ];

    renderWithProviders(<InsightsPopup responses={responses} k8sResult={k8sCluster} />);
    expect(screen.getByText('Temporarily unavailable.')).toBeInTheDocument();
  });

  it('should show "Disabled." when operator is disabled', () => {
    const disabledOperator = makePrometheusResponse([
      { metric: { condition: 'Disabled' }, value: [0, '1'] },
    ]);
    const responses = [
      { response: metricsResponse, error: null },
      { response: disabledOperator, error: null },
      { response: lastGatherResponse, error: null },
    ];

    renderWithProviders(<InsightsPopup responses={responses} k8sResult={k8sCluster} />);
    expect(screen.getByText('Disabled.')).toBeInTheDocument();
  });

  it('should show "Waiting for results." when operator status is not yet available', () => {
    const responses = [
      { response: metricsResponse, error: null },
      { response: null, error: null },
      { response: lastGatherResponse, error: null },
    ] as any;

    renderWithProviders(<InsightsPopup responses={responses} k8sResult={k8sCluster} />);
    expect(screen.getByText('Waiting for results.')).toBeInTheDocument();
  });

  it('should render chart area when metrics are available', () => {
    renderWithProviders(<InsightsPopup responses={baseResponses} k8sResult={k8sCluster} />);
    expect(screen.getByText('Fixable issues')).toBeInTheDocument();
    expect(screen.getByText('View all recommendations in Insights Advisor')).toBeInTheDocument();
  });

  it('should render generic advisor link when clusterID is missing', () => {
    renderWithProviders(
      <InsightsPopup
        responses={baseResponses}
        k8sResult={{ loaded: true, loadError: null } as any}
      />,
    );
    expect(screen.getByText('View more in Insights Advisor')).toBeInTheDocument();
  });
});
