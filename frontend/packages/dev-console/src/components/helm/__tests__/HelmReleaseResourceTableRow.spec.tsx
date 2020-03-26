import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import { Status } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { RowFunctionArgs } from '@console/internal/components/factory';
import HelmReleaseResourceTableRow from '../HelmReleaseResourceTableRow';

let rowArgs: RowFunctionArgs<K8sResourceKind>;

describe('HelmReleaseResourceTableRow', () => {
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
      index: 1,
      key: '1',
      style: {},
    } as any;
  });

  it('should render the TableRow component', () => {
    const helmReleaseResourceTableRow = shallow(HelmReleaseResourceTableRow(rowArgs));
    expect(helmReleaseResourceTableRow.find('tr').exists()).toBe(true);
  });

  it('should render the number of pods deployed for resources that support it', () => {
    const helmReleaseResourceTableRow = shallow(HelmReleaseResourceTableRow(rowArgs));
    expect(helmReleaseResourceTableRow.find(Status).exists()).toBe(true);
    expect(helmReleaseResourceTableRow.find(Status).props().status).toEqual('Created');

    rowArgs.obj.kind = 'Deployment';
    rowArgs.obj.spec = { replicas: 1 };
    rowArgs.obj.status = { replicas: 1 };

    const helmReleaseResourcesTableRow = shallow(HelmReleaseResourceTableRow(rowArgs));
    expect(helmReleaseResourcesTableRow.find(Link).exists()).toBe(true);
    expect(helmReleaseResourcesTableRow.find(Link).props().title).toEqual('pods');
  });
});
