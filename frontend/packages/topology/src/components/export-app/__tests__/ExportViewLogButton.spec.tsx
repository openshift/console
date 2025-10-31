import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { JobModel, PodModel } from '@console/internal/models';
import store from '@console/internal/redux';
import ExportViewLogButton from '../ExportViewLogButton';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockK8sWatchResource = useK8sWatchResource as jest.Mock;

describe('ExportViewLogButton', () => {
  beforeEach(() => {
    mockK8sWatchResource.mockImplementation((res) => {
      if (!res) return [null, true, null];
      switch (res?.kind) {
        case PodModel.kind:
          return [
            {
              kind: PodModel.kind,
              metadata: { name: 'test', namespace: 'test' },
              spec: { selector: { matchLabels: null } },
            },
            true,
            null,
          ];
        case JobModel.kind:
          return [
            {
              kind: JobModel.kind,
              metadata: { name: 'test', namespace: 'test' },
              spec: { selector: { matchLabels: null } },
            },
            true,
            null,
          ];
        default:
          return [null, true, null];
      }
    });
  });

  it('should render a link and correct href path', () => {
    render(
      <Provider store={store}>
        <ExportViewLogButton name="test" namespace="test" />
      </Provider>,
    );
    const logButton = screen.getByTestId('export-view-log-btn');
    expect(logButton).toHaveAttribute('href', '/k8s/ns/test/core~v1~Pod/test/logs');
  });

  it('should call onViewLog callback', async () => {
    const viewLogCallback = jest.fn();
    render(
      <Provider store={store}>
        <ExportViewLogButton name="test" namespace="test" onViewLog={viewLogCallback} />
      </Provider>,
    );
    const logButton = screen.getByTestId('export-view-log-btn');
    await userEvent.click(logButton);
    expect(viewLogCallback).toHaveBeenCalled();
  });

  it('should not render a disabled button', () => {
    render(
      <Provider store={store}>
        <ExportViewLogButton name="test" namespace="test" />
      </Provider>,
    );
    const logButton = screen.getByTestId('export-view-log-btn');
    expect(logButton).not.toHaveAttribute('aria-disabled');
  });

  it('should render a disabled button', () => {
    mockK8sWatchResource.mockImplementation((res) => {
      if (!res) return [null, true, null];
      switch (res?.kind) {
        case PodModel.kind:
          return [null, true, null];
        case JobModel.kind:
          return [
            {
              kind: JobModel.kind,
              metadata: { name: 'test', namespace: 'test' },
              spec: { selector: { matchLabels: null } },
            },
            true,
            null,
          ];
        default:
          return [null, true, null];
      }
    });
    render(
      <Provider store={store}>
        <ExportViewLogButton name="test" namespace="test" />
      </Provider>,
    );
    const logButton = screen.getByTestId('export-view-log-btn');
    expect(logButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('should render correct tooltip', async () => {
    mockK8sWatchResource.mockImplementation((res) => {
      if (!res) return [null, true, null];
      switch (res?.kind) {
        case PodModel.kind:
          return [null, true, null];
        case JobModel.kind:
          return [
            {
              kind: JobModel.kind,
              metadata: { name: 'test', namespace: 'test' },
              spec: { selector: { matchLabels: null } },
            },
            true,
            null,
          ];
        default:
          return [null, true, null];
      }
    });

    render(
      <Provider store={store}>
        <ExportViewLogButton name="test" namespace="test" />
      </Provider>,
    );

    const logButton = screen.getByTestId('export-view-log-btn');
    await userEvent.hover(logButton);

    const tooltip = await screen.findByText('Logs not available yet');
    expect(tooltip).toBeInTheDocument();
  });
});
