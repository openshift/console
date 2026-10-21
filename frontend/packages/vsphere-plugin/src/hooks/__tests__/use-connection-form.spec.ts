import { k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { encodeBase64 } from '../../components/utils';
import type { ConfigMap } from '../../resources/configMap';
import type { Infrastructure } from '../../resources/infrastructure';
import { initialLoad } from '../use-connection-form';

jest.mock('@console/dynamic-plugin-sdk/src/api/core-api', () => ({
  k8sGet: jest.fn(),
}));

const k8sGetMock = k8sGet as jest.Mock;

const secretModel = { kind: 'Secret', apiVersion: 'v1' } as any;
const infrastructureModel = {
  kind: 'Infrastructure',
  apiVersion: 'config.openshift.io/v1',
} as any;

const makeInfrastructure = (
  overrides: Partial<Infrastructure['spec']['platformSpec']['vsphere']> = {},
): Infrastructure =>
  ({
    spec: {
      platformSpec: {
        type: 'VSphere',
        vsphere: {
          vcenters: [{ server: 'vcenter.example.com', datacenters: ['dc1'] }],
          failureDomains: [
            {
              name: 'fd1',
              topology: {
                datacenter: 'dc1',
                datastore: '/dc1/datastore/vsanDatastore',
                folder: '/dc1/vm/myfolder',
                computeCluster: '/dc1/host/mycluster',
                networks: ['network1'],
              },
            },
          ],
          ...overrides,
        },
      },
    },
    status: { platform: 'VSphere' },
  }) as Infrastructure;

const makeSecret = (vcenter: string, username: string, password: string) => ({
  data: {
    [`${vcenter}.username`]: encodeBase64(username),
    [`${vcenter}.password`]: encodeBase64(password),
  },
});

const makeIniConfigMap = (): ConfigMap =>
  ({
    metadata: { name: 'cloud-provider-config', namespace: 'openshift-config' },
    data: {
      config: `[Global]
secret-name = "vsphere-creds"
secret-namespace = "kube-system"

[Workspace]
server = "vcenter.example.com"
datacenter = "dc1"
default-datastore = "/dc1/datastore/vsanDatastore"
folder = "/dc1/vm/myfolder"
resourcepool-path = "/dc1/host/mycluster/Resources/mypool"

[VirtualCenter "vcenter.example.com"]
datacenters = "dc1"`,
    },
  }) as ConfigMap;

describe('initialLoad', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should read from failureDomains when populated', async () => {
    k8sGetMock
      .mockResolvedValueOnce(makeInfrastructure())
      .mockResolvedValueOnce(makeSecret('vcenter.example.com', 'admin', 's3cret'));

    const result = await initialLoad(secretModel, infrastructureModel);

    expect(result.vcenter).toBe('vcenter.example.com');
    expect(result.datacenter).toBe('dc1');
    expect(result.defaultDatastore).toBe('/dc1/datastore/vsanDatastore');
    expect(result.folder).toBe('/dc1/vm/myfolder');
    expect(result.vCenterCluster).toBe('mycluster');
    expect(result.network).toBe('network1');
    expect(result.username).toBe('admin');
    expect(result.password).toBe('s3cret');
  });

  it('should fall back to ConfigMap when failureDomains is empty', async () => {
    k8sGetMock
      .mockResolvedValueOnce(makeInfrastructure({ failureDomains: [] }))
      .mockResolvedValueOnce(makeSecret('vcenter.example.com', 'admin', 's3cret'));

    const result = await initialLoad(secretModel, infrastructureModel, makeIniConfigMap());

    expect(result.vcenter).toBe('vcenter.example.com');
    expect(result.datacenter).toBe('dc1');
    expect(result.defaultDatastore).toBe('/dc1/datastore/vsanDatastore');
    expect(result.folder).toBe('/dc1/vm/myfolder');
    expect(result.vCenterCluster).toBe('mycluster');
    expect(result.network).toBe('');
    expect(result.username).toBe('admin');
    expect(result.password).toBe('s3cret');
  });

  it('should fall back to ConfigMap when failureDomains is undefined', async () => {
    k8sGetMock
      .mockResolvedValueOnce(makeInfrastructure({ failureDomains: undefined }))
      .mockResolvedValueOnce(makeSecret('vcenter.example.com', 'admin', 's3cret'));

    const result = await initialLoad(secretModel, infrastructureModel, makeIniConfigMap());

    expect(result.vcenter).toBe('vcenter.example.com');
    expect(result.datacenter).toBe('dc1');
    expect(result.defaultDatastore).toBe('/dc1/datastore/vsanDatastore');
    expect(result.folder).toBe('/dc1/vm/myfolder');
  });

  it('should return empty values when failureDomains is empty and no ConfigMap', async () => {
    k8sGetMock.mockResolvedValueOnce(makeInfrastructure({ failureDomains: [] }));

    const result = await initialLoad(secretModel, infrastructureModel);

    expect(result.vcenter).toBe('');
    expect(result.datacenter).toBe('');
    expect(result.defaultDatastore).toBe('');
    expect(result.folder).toBe('');
    expect(result.vCenterCluster).toBe('');
    expect(result.network).toBe('');
    expect(result.username).toBe('');
    expect(result.password).toBe('');
  });

  it('should return empty values with isInit when vCenter is placeholder', async () => {
    k8sGetMock.mockResolvedValueOnce(
      makeInfrastructure({
        failureDomains: [],
        vcenters: [{ server: 'vcenterplaceholder', datacenters: ['dc1'] }],
      } as any),
    );

    const result = await initialLoad(secretModel, infrastructureModel, makeIniConfigMap());

    expect(result.vcenter).toBe('');
    expect(result.isInit).toBe(true);
  });

  it('should extract vCenterCluster from resourcepool-path in ConfigMap fallback', async () => {
    k8sGetMock
      .mockResolvedValueOnce(makeInfrastructure({ failureDomains: [] }))
      .mockResolvedValueOnce(makeSecret('vcenter.example.com', 'admin', 's3cret'));

    const configMap: ConfigMap = {
      metadata: { name: 'cloud-provider-config', namespace: 'openshift-config' },
      data: {
        config: `server = "vcenter.example.com"
datacenter = "dc1"
default-datastore = "/dc1/datastore/ds1"
resourcepool-path = "/dc1/host/deep-cluster/Resources/pool"`,
      },
    } as ConfigMap;

    const result = await initialLoad(secretModel, infrastructureModel, configMap);

    expect(result.vCenterCluster).toBe('deep-cluster');
  });
});
