// Unit tests: component has no Redux or Router dependencies.
import { DescriptionList } from '@patternfly/react-core';
import { render, screen, waitFor } from '@testing-library/react';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import { KubernetesUpdatesItem } from '../KubernetesUpdatesItem';

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetchJSON: jest.fn(),
}));

const mockCoFetchJSON = jest.mocked(coFetchJSON);

const response = {
  fetchedAt: '2026-06-01T00:00:00Z',
  releases: [
    { cycle: '1.35', latest: '1.35.1', eol: '2027-02-28' },
    { cycle: '1.33', latest: '1.33.7', eol: '2026-06-28' },
  ],
};

const renderItem = (gitVersion: string) =>
  render(
    <DescriptionList>
      <KubernetesUpdatesItem gitVersion={gitVersion} />
    </DescriptionList>,
  );

const fakeToday = (date: Date) =>
  jest.useFakeTimers({
    now: date,
    doNotFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'setImmediate',
      'clearImmediate',
      'queueMicrotask',
      'nextTick',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ],
  });

describe('KubernetesUpdatesItem', () => {
  afterEach(() => {
    jest.useRealTimers();
    mockCoFetchJSON.mockReset();
  });

  it('fetches the release list under the base path', async () => {
    mockCoFetchJSON.mockResolvedValue(response);
    renderItem('v1.33.2');
    expect(await screen.findByText('Update available')).toBeVisible();
    expect(mockCoFetchJSON).toHaveBeenCalledWith('/api/console/kubernetes-releases');
  });

  it('renders nothing when the feature is off', async () => {
    mockCoFetchJSON.mockRejectedValue(new HttpError('Not Found', 404, { status: 404 } as Response));
    renderItem('v1.33.2');
    expect(screen.getByTestId('detail-item-title')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('detail-item-title')).not.toBeInTheDocument());
  });

  it('renders nothing when the cluster version cannot be parsed', async () => {
    mockCoFetchJSON.mockResolvedValue(response);
    renderItem('unknown');
    await waitFor(() => expect(mockCoFetchJSON).toHaveBeenCalled());
    expect(screen.queryByTestId('detail-item-title')).not.toBeInTheDocument();
  });

  it('shows Not available when the release list is not ready', async () => {
    mockCoFetchJSON.mockRejectedValue(
      new HttpError('Service Unavailable', 503, { status: 503 } as Response),
    );
    renderItem('v1.33.2');
    expect(await screen.findByText('Not available')).toBeVisible();
  });

  it('lists newer versions and warns when EOL is within 30 days', async () => {
    fakeToday(new Date(2026, 5, 10));
    mockCoFetchJSON.mockResolvedValue(response);
    renderItem('v1.33.2+k3s1');
    expect(await screen.findByText('Latest patch for 1.33: v1.33.7')).toBeVisible();
    expect(screen.getByText('Latest release: v1.35.1')).toBeVisible();
    expect(screen.getByText('End of life soon')).toBeInTheDocument();
    expect(screen.queryByText('End of life', { exact: true })).not.toBeInTheDocument();
  });

  it('shows danger once EOL has passed', async () => {
    fakeToday(new Date(2026, 6, 1));
    mockCoFetchJSON.mockResolvedValue(response);
    renderItem('v1.33.7');
    expect(await screen.findByText('Latest patch for 1.33: up to date')).toBeVisible();
    expect(screen.getByText('End of life', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('End of life soon')).not.toBeInTheDocument();
  });

  it('says Kubernetes updates when nothing newer exists', async () => {
    fakeToday(new Date(2026, 0, 1));
    mockCoFetchJSON.mockResolvedValue(response);
    renderItem('v1.35.1');
    expect(await screen.findByText('Kubernetes updates')).toBeVisible();
    expect(screen.queryByText(/Latest release/)).not.toBeInTheDocument();
    expect(screen.getByTestId('kubernetes-eol')).not.toContainHTML('svg');
  });
});
