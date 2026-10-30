import { screen } from '@testing-library/react';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type { PrometheusResponse } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { PrometheusStatusGroupMapper } from '@console/dynamic-plugin-sdk/src/extensions/dashboards';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { PodModel } from '@console/internal/models';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { getPrometheusPodStatusGroups } from '../prometheus-utils';
import { PrometheusInventoryItem } from '../PrometheusInventoryItem';

jest.mock('@console/internal/components/graphs/prometheus-poll-hook', () => ({
  usePrometheusPoll: jest.fn(),
}));
jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

const response: PrometheusResponse = {
  status: 'success',
  data: {
    resultType: 'vector',
    result: [
      { metric: { status: 'Running' }, value: [0, '9997'] },
      { metric: { status: 'CrashLoopBackOff' }, value: [0, '2'] },
      { metric: { status: 'Terminating' }, value: [0, '1'] },
    ],
  },
};
const props = {
  model: PodModel,
  prometheusIsAvailable: true,
  query: 'pod_inventory',
  mapper: getPrometheusPodStatusGroups,
  namespace: 'example',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useResolvedExtensions).mockReturnValue([[], true, []]);
  jest.mocked(usePrometheusPoll).mockReturnValue([response, undefined, false]);
});

it('renders ten thousand pods from aggregate counts with working status filters', () => {
  renderWithProviders(<PrometheusInventoryItem {...props} />);

  expect(screen.getByRole('link', { name: '10000 Pods' })).toHaveAttribute(
    'href',
    '/k8s/ns/example/pods',
  );
  expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
    'href',
    '/k8s/ns/example/pods?status=CrashLoopBackOff&status=CreateContainerError&status=Failed',
  );
  expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
    'href',
    '/k8s/ns/example/pods?status=Terminating&status=Pending',
  );
});

it('renders an explicit zero without status badges', () => {
  jest.mocked(usePrometheusPoll).mockReturnValue([
    {
      ...response,
      data: {
        resultType: 'vector',
        result: [{ metric: { status: 'Running' }, value: [0, '0'] }],
      },
    },
    undefined,
    false,
  ]);
  renderWithProviders(<PrometheusInventoryItem {...props} />);

  expect(screen.getByRole('link', { name: '0 Pods' })).toBeVisible();
  expect(screen.getAllByRole('link')).toHaveLength(1);
});

it('does not display a zero while the query is loading', () => {
  jest.mocked(usePrometheusPoll).mockReturnValue([undefined, undefined, true]);
  renderWithProviders(<PrometheusInventoryItem {...props} />);

  expect(screen.getByRole('link', { name: 'Pods' })).toBeVisible();
  expect(screen.queryByText('0 Pods')).not.toBeInTheDocument();
  expect(screen.queryByText('Not available')).not.toBeInTheDocument();
});

it('shows unavailable when the query fails', () => {
  jest.mocked(usePrometheusPoll).mockReturnValue([undefined, new Error('Forbidden'), false]);
  renderWithProviders(<PrometheusInventoryItem {...props} />);

  expect(screen.getByText('Not available')).toBeVisible();
  expect(screen.queryByText('0 Pods')).not.toBeInTheDocument();
});

it('shows unavailable when the mapper cannot find inventory metrics', () => {
  jest
    .mocked(usePrometheusPoll)
    .mockReturnValue([
      { ...response, data: { resultType: 'vector', result: [] } },
      undefined,
      false,
    ]);
  renderWithProviders(<PrometheusInventoryItem {...props} />);

  expect(screen.getByText('Not available')).toBeVisible();
});

it('rejects invalid aggregate counts', () => {
  for (const count of ['NaN', '-1', '0.5']) {
    jest.mocked(usePrometheusPoll).mockReturnValue([
      {
        ...response,
        data: {
          resultType: 'vector',
          result: [{ metric: { status: 'Running' }, value: [0, count] }],
        },
      },
      undefined,
      false,
    ]);
    const { unmount } = renderWithProviders(<PrometheusInventoryItem {...props} />);
    expect(screen.getByText('Not available')).toBeVisible();
    unmount();
  }
});

it('disables the query when monitoring is unavailable', () => {
  renderWithProviders(<PrometheusInventoryItem {...props} prometheusIsAvailable={false} />);
  expect(usePrometheusPoll).toHaveBeenCalledWith(expect.objectContaining({ query: '' }));
  expect(screen.getByText('Not available')).toBeVisible();
});

it('contains malformed plugin groups instead of crashing the card', () => {
  for (const group of [
    { count: 2, filterType: 'status' },
    { count: 2, statusIDs: null },
    { count: 2, statusIDs: [1], filterType: 'status' },
    null,
  ]) {
    const mapper = (() => ({ ERROR: group })) as unknown as PrometheusStatusGroupMapper;
    const { unmount } = renderWithProviders(<PrometheusInventoryItem {...props} mapper={mapper} />);
    expect(screen.getByText('Not available')).toBeVisible();
    unmount();
  }
});

it('rejects unsuccessful and non-vector responses', () => {
  jest
    .mocked(usePrometheusPoll)
    .mockReturnValue([{ ...response, status: 'error' }, undefined, false]);
  const { rerender } = renderWithProviders(<PrometheusInventoryItem {...props} />);
  expect(screen.getByText('Not available')).toBeVisible();

  jest
    .mocked(usePrometheusPoll)
    .mockReturnValue([
      { ...response, data: { ...response.data, resultType: 'matrix' } },
      undefined,
      false,
    ]);
  rerender(<PrometheusInventoryItem {...props} />);
  expect(screen.getByText('Not available')).toBeVisible();
});

it('contains a throwing query builder without making a request', () => {
  renderWithProviders(
    <PrometheusInventoryItem
      {...props}
      query={() => {
        throw new Error('bad input');
      }}
    />,
  );
  expect(usePrometheusPoll).toHaveBeenCalledWith(expect.objectContaining({ query: '' }));
  expect(screen.getByText('Not available')).toBeVisible();
});
