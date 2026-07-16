import { withoutSensitiveInformations } from '../telemetry';

describe('withoutSensitiveInformations', () => {
  const createLocation = (pathname: string) => ({
    pathname,
    search: '',
    state: null,
    hash: '',
    key: '',
  });

  it('should not touch urls does not match any special rule', () => {
    expect(withoutSensitiveInformations(createLocation(''))).toEqual(createLocation(''));
    expect(withoutSensitiveInformations(createLocation('/builds'))).toEqual(
      createLocation('/builds'),
    );
    expect(
      withoutSensitiveInformations(createLocation('/k8s/ns/christoph/buildconfigs/example/yaml/')),
    ).toEqual(createLocation('/k8s/ns/christoph/buildconfigs/example/yaml/'));
    expect(
      withoutSensitiveInformations(createLocation('/k8s/cluster/user.openshift.io~v1~User')),
    ).toEqual(createLocation('/k8s/cluster/user.openshift.io~v1~User'));
  });

  it('should remove username from the telemetry pathname', () => {
    expect(
      withoutSensitiveInformations(
        createLocation('/k8s/cluster/user.openshift.io~v1~User/a-username'),
      ),
    ).toEqual(createLocation('/k8s/cluster/user.openshift.io~v1~User/removed-username'));
    expect(
      withoutSensitiveInformations(
        createLocation('/k8s/cluster/user.openshift.io~v1~User/a-username/yaml'),
      ),
    ).toEqual(createLocation('/k8s/cluster/user.openshift.io~v1~User/removed-username/yaml'));
    expect(
      withoutSensitiveInformations(
        createLocation('/k8s/cluster/user.openshift.io~v1~User/a-username/roles'),
      ),
    ).toEqual(createLocation('/k8s/cluster/user.openshift.io~v1~User/removed-username/roles'));
  });
});
