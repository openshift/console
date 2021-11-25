import { plural } from 'pluralize';
import { K8sResourceKindReference } from '@console/internal/module/k8s';

export {};
declare global {
  namespace Cypress {
    interface Chainable {
      resourceShouldBeDeleted(
        namespace: string,
        resource: K8sResourceKindReference | string,
        name: string,
      ): Chainable<Element>;
    }
  }
}

// Convert types in the `user.openshift.io~v1~Group` format to `groups.v1.useropenshift.io`
// to pass to oc.
const toCLIType = (type: K8sResourceKindReference | string): string => {
  if (!type.includes('~')) {
    return type;
  }
  const [group, version, kind] = type.split('~');
  // Resources aren't required to follow this pattern when converting from kind to plural,
  // but this should work for most resources and is good enough for our tests.
  return `${plural(kind.toLowerCase())}.${version}.${group}`;
};

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add(
  'resourceShouldBeDeleted',
  (namespace: string, resource: K8sResourceKindReference | string, name: string) =>
    cy
      .exec(
        `oc get -n ${namespace} ${toCLIType(
          resource,
        )}/${name} -o template --template '{{.metadata.deletionTimestamp}}'`,
        { failOnNonZeroExit: false },
      )
      .then((result) => {
        if (result.code !== 0) {
          // if stderr === NotFound, means resource was succesfully deleted
          if (!result.stderr.includes('NotFound')) {
            // error other than 'NotFound', this typically would be a 'You must be logged in to the server (Unauthorized)'
            assert.fail('', '', `Error during 'oc get ${resource}/${name}', ${result.stderr} `);
          }
        } else {
          expect(result.stdout).not.toContain(`<no value>`);
        }
      }),
);
