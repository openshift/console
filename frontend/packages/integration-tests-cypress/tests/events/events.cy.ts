import { testName, checkErrors } from '../../support';

const name = `${testName}-event-test-pod`;
const testpod = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name,
    namespace: testName,
  },
  spec: {
    securityContext: {
      runAsNonRoot: true,
      seccompProfile: {
        type: 'RuntimeDefault',
      },
    },
    containers: [
      {
        name: 'httpd',
        image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest-error', // intentionally invalid image url
        securityContext: {
          allowPrivilegeEscalation: false,
          capabilities: {
            drop: ['ALL'],
          },
        },
      },
    ],
  },
};

describe('Events', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
    try {
      cy.exec(`echo '${JSON.stringify(testpod)}' | kubectl create -n ${testName} -f -`);
    } catch (error) {
      console.error(`\nFailed to create pod ${name}:\n${error}`);
    }
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    try {
      cy.exec(`kubectl delete pods ${name} -n ${testName}`);
    } catch (error) {
      console.error(`\nFailed to delete pod ${name}:\n${error}`);
    }
    cy.deleteProjectWithCLI(testName);
  });

  it('displays events for a newly created Pod', () => {
    cy.visit(`/k8s/ns/${testName}/events`);

    cy.log('Pod should exist in events list');
    cy.byTestID(name).should('exist');

    cy.log('Event type filter should work');
    cy.byLegacyTestID('dropdown-button').click();
    cy.get('[data-test-dropdown-menu="warning"]').click();
    cy.byTestID('event-totals').should('have.text', 'Showing 3 events');
    cy.byTestID('event-warning').should('have.length', 3);

    cy.log('Event text filter should work');
    cy.byLegacyTestID('item-filter').type('Error: ImagePullBackOff');
    cy.byTestID('event-totals').should('have.text', 'Showing 1 event');
    cy.byTestID('event-warning').should('have.length', 1);
  });
});
