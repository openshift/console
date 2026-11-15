import {
  newCloudShellWorkSpace,
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_RESTRICTED_ANNOTATION,
} from '../cloud-shell-utils';

describe('CloudShell Utils', () => {
  it('should create a new workspace resource', () => {
    const name = 'cloudshell';
    const namespace = 'default';
    const kind = 'DevWorkspace';

    const newResource = newCloudShellWorkSpace(name, namespace, namespace, 'v1alpha2');
    expect(newResource.kind).toEqual(kind);
    expect(newResource.metadata.name).toEqual(name);
    expect(newResource.metadata.namespace).toEqual(namespace);
    expect(newResource.metadata.labels[CLOUD_SHELL_LABEL]).toEqual('true');
    expect(newResource.metadata.annotations[CLOUD_SHELL_RESTRICTED_ANNOTATION]).toEqual('true');
    expect(newResource.spec.routingClass).toEqual('web-terminal');
  });

  it('should use the routing class the bridge is configured with', () => {
    window.SERVER_FLAGS.webTerminalRoutingClass = 'web-terminal-k8s';
    try {
      const newResource = newCloudShellWorkSpace('cloudshell', 'default', 'default', 'v1alpha2');
      expect(newResource.spec.routingClass).toEqual('web-terminal-k8s');
    } finally {
      delete window.SERVER_FLAGS.webTerminalRoutingClass;
    }
  });
});
