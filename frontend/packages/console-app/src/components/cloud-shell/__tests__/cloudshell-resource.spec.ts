import { newCloudShellWorkSpace } from '../utils/cloudshell-resource';

describe('CloudShell Resource Util', () => {
  it('creates new cloudshell Resource with correct name, kind, metadata', () => {
    const expectedData = {
      name: 'cloud-shell',
      namespace: 'default',
      kind: 'Workspace',
    };

    const newResource = newCloudShellWorkSpace(expectedData.name, expectedData.namespace);
    expect(newResource.kind).toEqual(expectedData.kind);
    expect(newResource.metadata.name).toEqual(expectedData.name);
    expect(newResource.metadata.namespace).toEqual(expectedData.namespace);
  });
});
