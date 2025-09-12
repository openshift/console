import { screen, configure } from '@testing-library/react';
import { RowFunctionArgs } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import HelmReleaseResourcesRow, { HelmReleaseResourceStatus } from '../HelmReleaseResourcesRow';

configure({ testIdAttribute: 'data-test' });

let rowArgs: RowFunctionArgs<K8sResourceKind>;

describe('helmReleaseResourcesRow', () => {
  beforeEach(() => {
    rowArgs = {
      obj: {
        kind: 'Secret',
        apiVersion: 'v1',
        metadata: {
          creationTimestamp: '2020-01-20T05:37:13Z',
          name: 'sh.helm.release.v1.helm-mysql.v1',
          namespace: 'deb',
        },
      } as K8sResourceKind,
      columns: [],
    };
  });

  it('should render the TableData component', () => {
    renderWithProviders(<HelmReleaseResourcesRow {...rowArgs} />);
    // Check for table row content - Secret name should be displayed
    expect(screen.getByText('sh.helm.release.v1.helm-mysql.v1')).toBeTruthy();
  });

  it('should render the number of pods deployed for resources that support it', () => {
    renderWithProviders(<HelmReleaseResourceStatus resource={rowArgs.obj} />);
    // Check for status display
    expect(screen.getByText('Created')).toBeTruthy();

    rowArgs.obj.kind = 'Deployment';
    rowArgs.obj.spec = { replicas: 1 };
    rowArgs.obj.status = { replicas: 1 };

    renderWithProviders(<HelmReleaseResourceStatus resource={rowArgs.obj} />);
    // Check for deployment-specific content like replica count
    expect(screen.getByText('1 of 1 pods')).toBeTruthy();
  });
});
