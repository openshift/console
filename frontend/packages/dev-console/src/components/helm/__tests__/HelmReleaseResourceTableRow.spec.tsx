import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import { Status } from '@console/shared';
import { TableRow } from '@console/internal/components/factory';
import HelmReleaseResourceTableRow from '../HelmReleaseResourceTableRow';

let helmReleaseResourceTableRowProps: React.ComponentProps<typeof HelmReleaseResourceTableRow>;

describe('HelmReleaseResourceTableRow', () => {
  helmReleaseResourceTableRowProps = {
    obj: {
      kind: 'Secret',
      metadata: {
        creationTimestamp: '2020-01-20T05:37:13Z',
        name: 'sh.helm.release.v1.helm-mysql.v1',
        namespace: 'deb',
      },
    },
    index: 1,
    style: {},
  };

  it('should render the TableRow component', () => {
    const helmReleaseResourceTableRow = shallow(
      <HelmReleaseResourceTableRow {...helmReleaseResourceTableRowProps} />,
    );
    expect(helmReleaseResourceTableRow.find(TableRow).exists()).toBe(true);
  });
  it('should render the number of pods deployed for resources that support it', () => {
    const helmReleaseResourceTableRow = shallow(
      <HelmReleaseResourceTableRow {...helmReleaseResourceTableRowProps} />,
    );
    expect(helmReleaseResourceTableRow.find(Status).exists()).toBe(true);
    expect(helmReleaseResourceTableRow.find(Status).props().status).toEqual('Created');
    helmReleaseResourceTableRowProps.obj.kind = 'Deployment';
    helmReleaseResourceTableRowProps.obj.spec = { replicas: 1 };
    helmReleaseResourceTableRowProps.obj.status = { replicas: 1 };
    const helmReleaseResourcesTableRow = shallow(
      <HelmReleaseResourceTableRow {...helmReleaseResourceTableRowProps} />,
    );
    expect(helmReleaseResourcesTableRow.find(Link).exists()).toBe(true);
    expect(helmReleaseResourcesTableRow.find(Link).props().title).toEqual('pods');
  });
});
