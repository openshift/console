import {
  newCloudShellWorkSpace,
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_USER_ANNOTATION,
} from '../cloud-shell-utils';

describe('CloudShell Utils', () => {
  it('should create a new workspace resource', () => {
    const name = 'cloudshell';
    const namespace = 'default';
    const kind = 'Workspace';
    const username = 'test-user';

    const newResource = newCloudShellWorkSpace(name, namespace, username);
    expect(newResource.kind).toEqual(kind);
    expect(newResource.metadata.name).toEqual(name);
    expect(newResource.metadata.namespace).toEqual(namespace);
    expect(newResource.metadata.labels[CLOUD_SHELL_LABEL]).toEqual('true');
    expect(newResource.metadata.annotations[CLOUD_SHELL_USER_ANNOTATION]).toEqual(username);
  });
});
