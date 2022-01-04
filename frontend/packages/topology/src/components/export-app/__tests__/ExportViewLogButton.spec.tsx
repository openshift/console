import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { mount } from 'enzyme';
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
      if (!res) {
        return [null, true, null];
      }
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
        default: {
          return [null, true, null];
        }
      }
    });
  });
  it('should render a link and correct href path', () => {
    // mount required for using provider
    const logButtonWrapper = mount(
      <Provider store={store}>
        <ExportViewLogButton namespace="test" />
      </Provider>,
    );
    const logButton = logButtonWrapper.find('[data-test="export-view-log-btn"]').find(Button);
    expect(logButton.prop('variant')).toBe('link');
    expect(logButton.prop('component')).toBe('a');
    expect(logButton.prop('href')).toBe('/k8s/ns/test/pods/test/logs');
  });

  it('should call onViewLog callback', () => {
    const viewLogCallback = jest.fn();
    // mount required for using provider
    const logButtonWrapper = mount(
      <Provider store={store}>
        <ExportViewLogButton namespace="test" onViewLog={viewLogCallback} />
      </Provider>,
    );
    const logButton = logButtonWrapper.find('[data-test="export-view-log-btn"]').find(Button);
    logButton.simulate('click');
    expect(viewLogCallback).toHaveBeenCalled();
  });

  it('should not render a disabled button', () => {
    // mount required for using provider
    const logButtonWrapper = mount(
      <Provider store={store}>
        <ExportViewLogButton namespace="test" />
      </Provider>,
    );
    expect(
      logButtonWrapper
        .find('[data-test="export-view-log-btn"]')
        .find(Button)
        .prop('isAriaDisabled'),
    ).toBe(undefined);
  });

  it('should render a disabled button', () => {
    mockK8sWatchResource.mockImplementation((res) => {
      if (!res) {
        return [null, true, null];
      }
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
        default: {
          return [null, true, null];
        }
      }
    });
    // mount required for using provider
    const logButtonWrapper = mount(
      <Provider store={store}>
        <ExportViewLogButton namespace="test" />
      </Provider>,
    );
    const logButton = logButtonWrapper.find('[data-test="export-view-log-btn"]').find(Button);
    expect(logButton.prop('isAriaDisabled')).toBe(true);
  });

  it('should render correct tooltip', () => {
    mockK8sWatchResource.mockImplementation((res) => {
      if (!res) {
        return [null, true, null];
      }
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
        default: {
          return [null, true, null];
        }
      }
    });
    // mount required for using provider
    const logButtonWrapper = mount(
      <Provider store={store}>
        <ExportViewLogButton namespace="test" />
      </Provider>,
    );
    const logTooltip = logButtonWrapper.find(Tooltip);
    expect(logTooltip.exists()).toBe(true);
    expect(logTooltip.prop('content')).toBe('Logs not available yet');
  });
});
