import { parseKeyValue, encodeBase64, decodeBase64 } from '../utils';

describe('parseKeyValue', () => {
  it('should parse INI-style key=value pairs', () => {
    const config = `server = "vcenter.example.com"
datacenter = "dc1"
default-datastore = "/dc1/datastore/vsanDatastore"`;

    const result = parseKeyValue(config);

    expect(result.server).toBe('vcenter.example.com');
    expect(result.datacenter).toBe('dc1');
    expect(result['default-datastore']).toBe('/dc1/datastore/vsanDatastore');
  });

  it('should handle values without quotes', () => {
    const config = `server = vcenter.example.com
datacenter = dc1`;

    const result = parseKeyValue(config);

    expect(result.server).toBe('vcenter.example.com');
    expect(result.datacenter).toBe('dc1');
  });

  it('should skip section headers and empty lines', () => {
    const config = `[Global]
secret-name = "vsphere-creds"

[Workspace]
server = "vcenter.example.com"`;

    const result = parseKeyValue(config);

    expect(result['secret-name']).toBe('vsphere-creds');
    expect(result.server).toBe('vcenter.example.com');
    expect(Object.keys(result)).not.toContain('[Global]');
  });

  it('should parse a full INI-format vSphere ConfigMap', () => {
    const config = `[Global]
secret-name = "vsphere-creds"
secret-namespace = "kube-system"

[Workspace]
server = "vcenter.example.com"
datacenter = "dc1"
default-datastore = "/dc1/datastore/vsanDatastore"
folder = "/dc1/vm/myfolder"
resourcepool-path = "/dc1/host/mycluster/Resources/mypool"

[VirtualCenter "vcenter.example.com"]
datacenters = "dc1"`;

    const result = parseKeyValue(config);

    expect(result['secret-name']).toBe('vsphere-creds');
    expect(result['secret-namespace']).toBe('kube-system');
    expect(result.server).toBe('vcenter.example.com');
    expect(result.datacenter).toBe('dc1');
    expect(result['default-datastore']).toBe('/dc1/datastore/vsanDatastore');
    expect(result.folder).toBe('/dc1/vm/myfolder');
    expect(result['resourcepool-path']).toBe('/dc1/host/mycluster/Resources/mypool');
  });

  it('should return empty object for empty string', () => {
    expect(parseKeyValue('')).toEqual({});
  });
});

describe('encodeBase64 / decodeBase64', () => {
  it('should round-trip a string', () => {
    const original = 'admin@vsphere.local';
    expect(decodeBase64(encodeBase64(original))).toBe(original);
  });
});
