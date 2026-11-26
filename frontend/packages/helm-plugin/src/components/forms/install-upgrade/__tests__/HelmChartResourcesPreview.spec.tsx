import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import HelmChartResourcesPreview from '../HelmChartResourcesPreview';

const mockManifestYaml = `---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: main
          image: nginx
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
spec:
  selector:
    app: my-app
  ports:
    - port: 80
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
data:
  key: value
`;

const mockCoFetch = jest.fn();

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetch: (...args: any[]) => mockCoFetch(...args),
}));

jest.mock('@console/shared/src/components/dynamic-form/utils', () => ({
  prune: jest.fn((v: any) => v),
}));

const defaultProps = {
  chartURL: 'https://charts.example.com/my-chart-1.0.0.tgz',
  indexEntry: 'my-chart--my-repo',
  releaseName: 'my-release',
  namespace: 'test-ns',
  editorType: 'yaml' as any,
  yamlData: 'replicas: 1',
  formData: null,
};

describe('HelmChartResourcesPreview', () => {
  beforeEach(() => {
    mockCoFetch.mockReset();
  });

  it('should render the expandable section with "Resource preview" text', () => {
    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    expect(screen.getByText('Resource preview')).toBeVisible();
  });

  it('should not fetch template before expanding', () => {
    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    expect(mockCoFetch).not.toHaveBeenCalled();
  });

  it('should fetch template when expanded and show loading state', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve(mockManifestYaml) });

    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    await user.click(screen.getByText('Resource preview'));

    expect(mockCoFetch).toHaveBeenCalledWith(
      '/api/helm/template',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('should show resource count and kind labels after successful fetch', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve(mockManifestYaml) });

    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    await user.click(screen.getByText('Resource preview'));

    await waitFor(() => {
      expect(screen.getByText('Resource preview (3 resources)')).toBeVisible();
    });

    expect(screen.getByText('Deployment: 1')).toBeVisible();
    expect(screen.getByText('Service: 1')).toBeVisible();
    expect(screen.getByText('ConfigMap: 1')).toBeVisible();
  });

  it('should show resource list items after successful fetch', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve(mockManifestYaml) });

    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    await user.click(screen.getByText('Resource preview'));

    await waitFor(() => {
      expect(screen.getByText('Deployment: my-app')).toBeVisible();
    });

    expect(screen.getByText('Service: my-app-svc')).toBeVisible();
    expect(screen.getByText('ConfigMap: my-app-config')).toBeVisible();
  });

  it('should show error alert when template fetch fails', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockImplementation(() => Promise.reject(new Error('Chart not found')));

    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    await user.click(screen.getByText('Resource preview'));

    await waitFor(
      () => {
        expect(screen.getByText('Chart not found')).toBeVisible();
      },
      { timeout: 5000 },
    );
  });

  it('should show Refresh button after successful fetch', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve(mockManifestYaml) });

    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    await user.click(screen.getByText('Resource preview'));

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeVisible();
    });
  });

  it('should send correct payload with chart URL and values', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve('') });

    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    await user.click(screen.getByText('Resource preview'));

    const fetchCall = mockCoFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body).toEqual({
      name: 'my-release',
      namespace: 'test-ns',
      chart_url: 'https://charts.example.com/my-chart-1.0.0.tgz',
      indexEntry: 'my-chart--my-repo',
      values: { replicas: 1 },
    });
  });

  it('should handle empty manifest response gracefully', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve('') });

    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} />);
    await user.click(screen.getByText('Resource preview'));

    await waitFor(() => {
      expect(mockCoFetch).toHaveBeenCalled();
    });

    expect(screen.queryByText(/Deployment/)).not.toBeInTheDocument();
  });

  it('should not fetch when no chart identification or release name is provided', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve('') });

    renderWithProviders(
      <HelmChartResourcesPreview
        {...defaultProps}
        chartURL={undefined}
        indexEntry={undefined}
        releaseName=""
      />,
    );
    await user.click(screen.getByText('Resource preview'));

    expect(mockCoFetch).not.toHaveBeenCalled();
  });

  it('should fetch when only indexEntry is provided (upgrade from repo)', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve(mockManifestYaml) });

    renderWithProviders(<HelmChartResourcesPreview {...defaultProps} chartURL={undefined} />);
    await user.click(screen.getByText('Resource preview'));

    await waitFor(() => {
      expect(mockCoFetch).toHaveBeenCalled();
    });

    const fetchCall = mockCoFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.indexEntry).toBe('my-chart--my-repo');
    expect(body.chart_url).toBeUndefined();
  });

  it('should fetch using release name when neither chartURL nor indexEntry is provided (upgrade)', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve(mockManifestYaml) });

    renderWithProviders(
      <HelmChartResourcesPreview {...defaultProps} chartURL={undefined} indexEntry={undefined} />,
    );
    await user.click(screen.getByText('Resource preview'));

    await waitFor(() => {
      expect(mockCoFetch).toHaveBeenCalled();
    });

    const fetchCall = mockCoFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.name).toBe('my-release');
    expect(body.chart_url).toBeUndefined();
    expect(body.indexEntry).toBeUndefined();
  });

  it('should send noRepo flag for URL-installed chart upgrades', async () => {
    const user = userEvent.setup();
    mockCoFetch.mockResolvedValue({ text: () => Promise.resolve(mockManifestYaml) });

    renderWithProviders(
      <HelmChartResourcesPreview {...defaultProps} indexEntry={undefined} noRepo />,
    );
    await user.click(screen.getByText('Resource preview'));

    await waitFor(() => {
      expect(mockCoFetch).toHaveBeenCalled();
    });

    const fetchCall = mockCoFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.noRepo).toBe(true);
  });
});
