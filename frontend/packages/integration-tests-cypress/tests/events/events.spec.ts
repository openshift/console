import { testName, checkErrors } from '../../support';
import { guidedTour } from '../../views/guided-tour';
import { nav } from '../../views/nav';

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
        image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
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
    guidedTour.close();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
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
    cy.deleteProject(testName);
    cy.logout();
  });

  it('event view displays created pod', () => {
    cy.visit(`/ns/${testName}/events`);
    cy.byTestID(name).should('exist');
  });
});
