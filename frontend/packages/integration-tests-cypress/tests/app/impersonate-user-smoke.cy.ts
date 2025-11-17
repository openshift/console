/**
 * SMOKE TESTS for Multi-Group Impersonation
 *
 * These are quick, focused tests that verify the critical path works.
 * Run these tests first to catch major breaking changes quickly.
 *
 * Expected run time: 2-3 minutes
 *
 * What smoke tests check:
 * ✅ Can open modal
 * ✅ Can enter username
 * ✅ Can submit
 * ✅ Impersonation starts
 * ✅ Banner shows
 * ✅ Can stop
 *
 * What smoke tests DON'T check:
 * ❌ Edge cases
 * ❌ Error handling
 * ❌ Complex group scenarios
 * ❌ Special characters
 * ❌ Performance
 */

import { checkErrors } from '../../support';

/* eslint-disable cypress/no-unnecessary-waiting */
describe('Impersonation Smoke Tests', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    // Wait for page to load then close guided tour if it appears
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.wait(1000); // Give the tour time to appear
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
      }
    });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    // Cleanup: stop any active impersonation using dropdown (more reliable)
    cy.get('body').then(($body) => {
      // Only clean up if there's an impersonation banner (not other cluster banners)
      if ($body.find('.pf-v6-c-banner:contains("You are impersonating")').length > 0) {
        // Check if dropdown toggle exists and is visible
        cy.get('[data-test="user-dropdown-toggle"]').then(($toggle) => {
          if ($toggle.length > 0 && $toggle.is(':visible')) {
            cy.wrap($toggle).click();

            // Wait for dropdown to open and stop button to appear
            cy.get('body').then(($body2) => {
              if ($body2.find('[data-test="stop-impersonate"]').length > 0) {
                cy.byTestID('stop-impersonate').click();

                // Wait for impersonation banner to disappear
                cy.contains('You are impersonating', { timeout: 10000 }).should('not.exist');

                // Close guided tour after stopping
                cy.get('body').then(($body3) => {
                  if ($body3.find('[data-test="guided-tour-modal"]').length > 0) {
                    cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  it('SMOKE: Can open impersonation modal', () => {
    // Click dropdown and wait for it to open
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();

    // Wait for dropdown menu to be visible and click impersonate option
    cy.byTestID('impersonate-user').should('be.visible').click();

    // Modal should appear
    cy.byTestID('username-input', { timeout: 5000 }).should('be.visible');
    cy.byTestID('cancel-button').should('be.visible').click();

    // Wait for modal to close
    cy.byTestID('username-input').should('not.exist');
  });

  it('SMOKE: Can impersonate a user', () => {
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('impersonate-user').should('be.visible').click();

    // Fill in username
    cy.byTestID('username-input').should('be.visible').clear().type('smoke-test-user');

    // Click impersonate button
    cy.byTestID('impersonate-button').should('not.be.disabled').click();

    // Wait for navigation to happen (URL may not change but page reloads)
    cy.wait(1000);

    // Close guided tour if present
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
      }
    });

    // Verify impersonation banner appears
    cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');
    cy.contains('smoke-test-user', { timeout: 5000 }).should('be.visible');
  });

  it('SMOKE: Banner persists across page navigation', () => {
    // Impersonation should be active from previous test
    // Check specifically for the impersonation banner, not other banners (e.g., kubeadmin)
    cy.contains('.pf-v6-c-banner', 'You are impersonating', { timeout: 5000 }).should('be.visible');
    cy.contains('smoke-test-user').should('be.visible');

    // Navigate to Workloads > Pods using nav link (preserves Redux state)
    cy.clickNavLink(['Workloads', 'Pods']);
    cy.wait(1500);

    // Verify banner persists on Pods page
    cy.contains('.pf-v6-c-banner', 'You are impersonating').should('be.visible');
    cy.contains('smoke-test-user').should('be.visible');

    // Navigate to Workloads > Deployments
    cy.clickNavLink(['Workloads', 'Deployments']);
    cy.wait(1500);

    // Verify banner still persists on Deployments page
    cy.contains('.pf-v6-c-banner', 'You are impersonating').should('be.visible');
    cy.contains('smoke-test-user').should('be.visible');

    // Navigate to Build > Builds
    cy.clickNavLink(['Builds', 'BuildConfigs']);
    cy.wait(1500);

    // Verify banner still persists on Nodes page
    cy.contains('.pf-v6-c-banner', 'You are impersonating').should('be.visible');
    cy.contains('smoke-test-user').should('be.visible');

    cy.log('✅ Banner persists across multiple page navigations (SPA routing)');
  });

  it('SMOKE: Can stop impersonation', () => {
    cy.contains('You are impersonating', { timeout: 5000 }).should('be.visible');

    // Use dropdown to stop (more reliable than banner button)
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('stop-impersonate').should('be.visible').click();

    // Wait for impersonation banner to disappear (Redux state cleared and page reloaded)
    cy.contains('You are impersonating', { timeout: 10000 }).should('not.exist');

    // Close guided tour if present after reload
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
        cy.wait(500);
      }
    });
  });

  it('SMOKE: Submit button disabled when username empty', () => {
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('impersonate-user').should('be.visible').click();

    // Button should be disabled
    cy.byTestID('impersonate-button').should('be.disabled');

    // Type username
    cy.byTestID('username-input').should('be.visible').type('validation-smoke');

    // Button should be enabled
    cy.byTestID('impersonate-button').should('not.be.disabled');

    cy.byTestID('cancel-button').should('be.visible').click();
  });

  it('SMOKE: Can select groups if available', () => {
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('impersonate-user').should('be.visible').click();

    cy.byTestID('username-input').should('be.visible').type('group-smoke-user');

    // Try to open groups dropdown
    cy.get('[placeholder="Enter groups"]').should('be.visible').click();

    // Check if groups are available
    cy.get('body').then(($body) => {
      if ($body.find('.pf-v6-c-menu__list-item').length > 1) {
        // Groups available, select one
        cy.get('.pf-v6-c-menu__list-item').eq(1).click();

        // Verify chip appears
        cy.get('.pf-v6-c-label').should('have.length.gte', 1);

        cy.log('✅ Groups available and selectable');
      } else {
        cy.log('ℹ️ No groups available in cluster (this is OK for smoke test)');
      }
    });

    // Close dropdown by clicking outside to ensure button is visible
    cy.byTestID('username-input').click();

    cy.byTestID('impersonate-button').should('not.be.disabled').should('be.visible').click();

    cy.wait(1000);

    // Close guided tour if present
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
      }
    });

    cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

    // Cleanup - use dropdown for more reliable stop
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('stop-impersonate').should('be.visible').click();

    // Wait for impersonation banner to disappear (Redux state cleared and page reloaded)
    cy.contains('You are impersonating', { timeout: 10000 }).should('not.exist');

    // Close guided tour if present after reload
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
        cy.wait(500);
      }
    });
  });

  it('SMOKE: Group selection UI with mocked data', () => {
    // Mock groups API right before opening modal to ensure it's used
    cy.intercept('GET', '**/apis/user.openshift.io/v1/groups*', {
      statusCode: 200,
      body: {
        kind: 'GroupList',
        apiVersion: 'user.openshift.io/v1',
        metadata: {
          resourceVersion: '12345',
        },
        items: [
          {
            apiVersion: 'user.openshift.io/v1',
            kind: 'Group',
            metadata: {
              name: 'smoke-test-developers',
              resourceVersion: '12345',
              uid: 'test-uid-1',
            },
            users: [],
          },
          {
            apiVersion: 'user.openshift.io/v1',
            kind: 'Group',
            metadata: {
              name: 'smoke-test-viewers',
              resourceVersion: '12346',
              uid: 'test-uid-2',
            },
            users: [],
          },
          {
            apiVersion: 'user.openshift.io/v1',
            kind: 'Group',
            metadata: {
              name: 'smoke-test-admins',
              resourceVersion: '12347',
              uid: 'test-uid-3',
            },
            users: [],
          },
        ],
      },
    }).as('getGroups');

    // Open impersonation modal
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('impersonate-user').should('be.visible').click();

    cy.byTestID('username-input').should('be.visible').type('mock-groups-user');

    // Open groups dropdown
    cy.get('[placeholder="Enter groups"]').should('be.visible').click();

    // Verify mocked groups appear in dropdown
    cy.get('.pf-v6-c-menu__list-item').should('have.length.gte', 3);
    cy.contains('smoke-test-developers').should('be.visible');
    cy.contains('smoke-test-viewers').should('be.visible');
    cy.contains('smoke-test-admins').should('be.visible');

    // Select first group
    cy.contains('smoke-test-developers').click();

    // Close dropdown by clicking on username input
    cy.byTestID('username-input').click();

    // Verify chip appears
    cy.get('.pf-v6-c-label').should('have.length', 1);
    cy.contains('.pf-v6-c-label', 'smoke-test-developers').should('be.visible');

    // Open dropdown again and select second group
    cy.get('[placeholder="Enter groups"]').click();
    cy.contains('smoke-test-viewers').click();

    // Close dropdown by clicking on username input
    cy.byTestID('username-input').click();

    // Verify two chips now
    cy.get('.pf-v6-c-label').should('have.length', 2);
    cy.contains('.pf-v6-c-label', 'smoke-test-developers').should('be.visible');
    cy.contains('.pf-v6-c-label', 'smoke-test-viewers').should('be.visible');

    // Remove first group by clicking X button
    cy.contains('.pf-v6-c-label', 'smoke-test-developers').parent().find('button').first().click();

    // Verify only one chip remains
    cy.get('.pf-v6-c-label').should('have.length', 1);
    cy.contains('.pf-v6-c-label', 'smoke-test-viewers').should('be.visible');
    cy.contains('.pf-v6-c-label', 'smoke-test-developers').should('not.exist');

    // Add third group
    cy.get('[placeholder="Enter groups"]').click();
    cy.contains('smoke-test-admins').click();

    // Close dropdown by clicking on username input
    cy.byTestID('username-input').click();

    // Verify two chips again
    cy.get('.pf-v6-c-label').should('have.length', 2);

    // Test filtering by typing - the dropdown should stay open as we type
    cy.get('[placeholder="Enter groups"]').click().clear().type('admin');
    cy.wait(500);

    // Should only show filtered results in the dropdown menu
    cy.get('.pf-v6-c-menu__list-item:visible').should('have.length.gte', 1);
    cy.get('.pf-v6-c-menu__list-item').contains('smoke-test-admins').should('be.visible');

    // Close dropdown before trying to click cancel button
    cy.byTestID('username-input').click();

    // Close modal without submitting
    cy.byTestID('cancel-button').should('be.visible').click();

    // Modal should close
    cy.byTestID('username-input').should('not.exist');

    cy.log('✅ Group selection UI works correctly with mocked data');
  });

  it('SMOKE: Banner persists across navigation with groups', () => {
    // Mock groups API right before opening modal to ensure it's used
    cy.intercept('GET', '**/apis/user.openshift.io/v1/groups*', {
      statusCode: 200,
      body: {
        kind: 'GroupList',
        apiVersion: 'user.openshift.io/v1',
        metadata: {
          resourceVersion: '12345',
        },
        items: [
          {
            apiVersion: 'user.openshift.io/v1',
            kind: 'Group',
            metadata: {
              name: 'smoke-test-group-a',
              resourceVersion: '12345',
              uid: 'test-uid-a',
            },
            users: [],
          },
          {
            apiVersion: 'user.openshift.io/v1',
            kind: 'Group',
            metadata: {
              name: 'smoke-test-group-b',
              resourceVersion: '12346',
              uid: 'test-uid-b',
            },
            users: [],
          },
        ],
      },
    }).as('getGroups');

    // Start impersonation with groups
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('impersonate-user').should('be.visible').click();

    cy.byTestID('username-input').should('be.visible').type('groups-persist-user');

    // Select groups
    cy.get('[placeholder="Enter groups"]').click();
    cy.wait(500); // Wait for dropdown to open
    cy.contains('smoke-test-group-a').should('be.visible').click();
    cy.byTestID('username-input').click(); // Close dropdown

    cy.get('[placeholder="Enter groups"]').click();
    cy.wait(500); // Wait for dropdown to open
    cy.contains('smoke-test-group-b').should('be.visible').click();
    cy.byTestID('username-input').click(); // Close dropdown

    // Verify chips
    cy.get('.pf-v6-c-label').should('have.length', 2);

    // Start impersonation
    cy.byTestID('impersonate-button').should('not.be.disabled').should('be.visible').click();
    cy.wait(1000);

    // Close guided tour if present
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
      }
    });

    // Verify impersonation banner with groups
    cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');
    cy.contains('groups-persist-user').should('be.visible');
    cy.contains('with groups:').should('be.visible');

    // Navigate to Workloads > Pods
    cy.clickNavLink(['Workloads', 'Pods']);
    cy.wait(1500);

    // Verify banner and groups still visible
    cy.contains('.pf-v6-c-banner', 'You are impersonating').should('be.visible');
    cy.contains('groups-persist-user').should('be.visible');
    cy.contains('with groups:').should('be.visible');

    // Navigate to Workloads > Deployments
    cy.clickNavLink(['Workloads', 'Deployments']);
    cy.wait(1500);

    // Verify banner and groups still visible
    cy.contains('.pf-v6-c-banner', 'You are impersonating').should('be.visible');
    cy.contains('groups-persist-user').should('be.visible');
    cy.contains('with groups:').should('be.visible');

    // Navigate to Compute > Nodes
    cy.clickNavLink(['Builds', 'BuildConfigs']);
    cy.wait(1500);

    // Verify banner and groups still visible
    cy.contains('.pf-v6-c-banner', 'You are impersonating').should('be.visible');
    cy.contains('groups-persist-user').should('be.visible');
    cy.contains('with groups:').should('be.visible');

    cy.log('✅ Banner with groups persists across multiple page navigations');

    // Cleanup - stop impersonation
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('stop-impersonate').should('be.visible').click();
    cy.contains('You are impersonating', { timeout: 10000 }).should('not.exist');

    // Close guided tour if present after reload
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
        cy.wait(500);
      }
    });
  });

  it('SMOKE: Can stop from user dropdown', () => {
    // Start impersonation
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('impersonate-user').should('be.visible').click();
    cy.byTestID('username-input').should('be.visible').type('dropdown-smoke');
    cy.byTestID('impersonate-button').should('not.be.disabled').should('be.visible').click();

    cy.wait(1000);

    // Close guided tour if present
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
      }
    });

    cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

    // Stop from dropdown
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('stop-impersonate').should('be.visible').click();

    // Wait for impersonation banner to disappear (Redux state cleared and page reloaded)
    cy.contains('You are impersonating', { timeout: 10000 }).should('not.exist');

    // Close guided tour if present after reload
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="guided-tour-modal"]').length > 0) {
        cy.byTestID('tour-step-footer-secondary').contains('Skip tour').click();
        cy.wait(500);
      }
    });

    // Extra wait to ensure page has fully reloaded before next test
    cy.wait(1000);
  });

  it('SMOKE: Cancel does not start impersonation', () => {
    // Ensure we start from a clean state (no active impersonation)
    cy.get('body').then(($body) => {
      // Only clean up if there's an impersonation banner (not other cluster banners)
      if ($body.find('.pf-v6-c-banner:contains("You are impersonating")').length > 0) {
        // Clean up any leftover impersonation
        cy.byTestID('user-dropdown-toggle').should('be.visible').click();

        // Wait for dropdown to open and check if stop button exists
        cy.get('body').then(($body2) => {
          if ($body2.find('[data-test="stop-impersonate"]').length > 0) {
            cy.byTestID('stop-impersonate').should('be.visible').click();
            cy.contains('You are impersonating', { timeout: 10000 }).should('not.exist');
            cy.wait(1000);
          }
        });
      }
    });

    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('impersonate-user').should('be.visible').click();

    cy.byTestID('username-input').should('be.visible').type('cancel-smoke');
    cy.byTestID('cancel-button').should('be.visible').click();

    // Wait for modal to close
    cy.byTestID('username-input').should('not.exist');

    // Should not be impersonating (check for impersonation banner specifically)
    cy.contains('You are impersonating').should('not.exist');
  });
});

/**
 * SMOKE TEST SUMMARY
 *
 * These 10 tests verify the critical path:
 * 1. Modal opens
 * 2. User impersonation works
 * 3. Banner persists across navigation (without groups)
 * 4. Stop works
 * 5. Validation works
 * 6. Group selection works (if groups available)
 * 7. Group selection UI with mocked data (guaranteed groups for UI testing)
 * 8. Banner persists across navigation with groups
 * 9. Stop from dropdown works
 * 10. Cancel works
 *
 * If all smoke tests pass → Feature is working!
 * If any smoke test fails → Something is seriously broken!
 *
 * Run these tests:
 * - After every build
 * - Before deployment
 * - As a gate before running full E2E suite
 *
 * Expected run time: 3-4 minutes
 */
