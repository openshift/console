import { render, screen } from '@testing-library/react';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import WebTerminalConfiguration from '../WebTerminalConfiguration';

jest.mock('@console/dynamic-plugin-sdk/src/api/core-api', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sUpdateResource: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: jest.fn(() => jest.fn()),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: () => ['', () => {}, true],
}));

jest.mock('../useCloudShellNamespace', () => ({
  __esModule: true,
  default: jest.fn(() => ['openshift-operators', null]),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

const execTemplate = {
  apiVersion: 'template.toolchain.dev.openshift.io/v1alpha1',
  kind: 'DevWorkspaceTemplate',
  metadata: { name: 'web-terminal-exec', namespace: 'openshift-operators' },
  spec: {
    components: [
      {
        name: 'web-terminal-exec',
        container: {
          image: 'registry.example/web-terminal-exec:1',
          env: [{ name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: '15m' }],
        },
      },
    ],
  },
};

const toolingTemplate = {
  apiVersion: 'template.toolchain.dev.openshift.io/v1alpha1',
  kind: 'DevWorkspaceTemplate',
  metadata: { name: 'web-terminal-tooling', namespace: 'openshift-operators' },
  spec: {
    components: [
      {
        name: 'web-terminal-tooling',
        container: {
          image: 'quay.io/example/web-terminal-tooling:9.1',
        },
      },
    ],
  },
};

describe('WebTerminalConfiguration', () => {
  it('seeds the timeout and image fields when the templates are already loaded on the first render', () => {
    // The redux watch can already hold the loaded templates when the
    // configuration (re)mounts; there is no later loaded-transition to
    // trigger the seeding.
    useK8sWatchResourceMock.mockImplementation((resource: { name: string }) =>
      resource.name === 'web-terminal-exec'
        ? [execTemplate, true, undefined]
        : [toolingTemplate, true, undefined],
    );

    render(<WebTerminalConfiguration readonly={false} />);

    expect(screen.getByTestId('timeout-value')).toHaveValue(15);
    expect(screen.getByTestId('web-terminal-image')).toHaveValue(
      'quay.io/example/web-terminal-tooling:9.1',
    );
  });
});
