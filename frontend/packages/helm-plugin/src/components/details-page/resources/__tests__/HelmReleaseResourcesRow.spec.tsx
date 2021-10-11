import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import HelmReleaseResourcesRow, { HelmReleaseResourceStatus } from '../HelmReleaseResourcesRow';

let rowArgs: RowFunctionArgs<K8sResourceKind>;

describe('helmReleaseResourcesRow', () => {
  beforeEach(() => {
    rowArgs = {
      obj: {
        kind: 'Secret',
        metadata: {
          creationTimestamp: '2020-01-20T05:37:13Z',
          name: 'sh.helm.release.v1.helm-mysql.v1',
          namespace: 'deb',
        },
      },
    } as any;
  });

  it('should render the TableData component', () => {
    const helmReleaseResourcesRow = shallow(<HelmReleaseResourcesRow {...rowArgs} />);
    expect(helmReleaseResourcesRow.find(TableData).exists()).toBe(true);
  });

  it('should render the number of pods deployed for resources that support it', () => {
    const helmReleaseResourceStatus = shallow(<HelmReleaseResourceStatus resource={rowArgs.obj} />);
    expect(helmReleaseResourceStatus.find(Status).exists()).toBe(true);
    expect(helmReleaseResourceStatus.find(Status).props().status).toEqual('Created');

    rowArgs.obj.kind = 'Deployment';
    rowArgs.obj.spec = { replicas: 1 };
    rowArgs.obj.status = { replicas: 1 };

    const helmReleaseResourceStatus1 = shallow(
      <HelmReleaseResourceStatus resource={rowArgs.obj} />,
    );
    expect(helmReleaseResourceStatus1.find(Link).exists()).toBe(true);
    expect(helmReleaseResourceStatus1.find(Link).props().title).toEqual('Pods');
  });
});
