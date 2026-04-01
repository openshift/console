import { isLocalDevEnvironment } from '../views/common';

declare global {
  namespace Cypress {
    interface Chainable {
      login(provider?: string, username?: string, password?: string): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

// This will add 'cy.login(...)'
// ex: cy.login('my-idp', 'my-user', 'my-password')
Cypress.Commands.add(
  'login',
  (provider: string = 'kube:admin', username: string = 'kubeadmin', password?: string) => {
    const doLogin = (resolvedPassword: string) => {
      cy.session(
        [provider, username],
        () => {
          cy.visit(Cypress.config('baseUrl'));
          cy.window().then((win: any) => {
            // Check if auth is disabled (for a local development environment)
            if (win.SERVER_FLAGS?.authDisabled) {
              cy.task('log', '  skipping login, console is running with auth disabled');
              return;
            }

            if (isLocalDevEnvironment) {
              cy.exec(
                'oc get route oauth-openshift -n openshift-authentication -o json | jq .spec.host',
              ).then((result) => {
                Cypress.expose('OAUTH_BASE_ADDRESS', result.stdout.replace(/"/g, ''));
                cy.origin(
                  Cypress.expose('OAUTH_BASE_ADDRESS'),
                  { args: { provider, username, password: resolvedPassword } },
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  ({ provider, username, password }) => {
                    // note required duplication in else below due to limitations of cy.origin
                    cy.task('log', `  Logging in as ${username}`);
                    cy.get('[data-test-id="login"]').should('be.visible');
                    cy.get('body').then(($body) => {
                      if ($body.text().includes(provider)) {
                        cy.contains(provider).should('be.visible').click();
                      }
                    });
                    cy.get('#inputUsername').type(username);
                    cy.get('#inputPassword').type(password);
                    cy.get('button[type=submit]').click();
                  },
                );
              });
            } else {
              // note required duplication in if above due to limitations of cy.origin
              cy.task('log', `  Logging in as ${username}`);
              cy.get('[data-test-id="login"]').should('be.visible');
              cy.get('body').then(($body) => {
                if ($body.text().includes(provider)) {
                  cy.contains(provider).should('be.visible').click();
                }
              });
              cy.get('#inputUsername').type(username);
              cy.get('#inputPassword').type(resolvedPassword);
              cy.get('button[type=submit]').click();
            }
          });
        },
        {
          cacheAcrossSpecs: true,
          validate() {
            cy.visit(Cypress.config('baseUrl'));
            cy.byTestID('user-dropdown-toggle').should('exist');
          },
        },
      );
    };

    if (password !== undefined) {
      doLogin(password);
    } else {
      cy.env(['BRIDGE_KUBEADMIN_PASSWORD']).then(({ BRIDGE_KUBEADMIN_PASSWORD }) => {
        doLogin(BRIDGE_KUBEADMIN_PASSWORD);
      });
    }
  },
);
