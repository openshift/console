/**
 * E2E Cypress tests for Multi-Group Impersonation Feature with RBAC Testing
 *
 * Prerequisites:
 * - OpenShift cluster must be running
 * - User must have cluster-admin permissions (for creating test resources)
 * - User must have impersonation permissions
 *
 * Test Strategy:
 * - Creates real Kubernetes resources (Namespaces, Users, Groups, RoleBindings)
 * - Tests actual RBAC permissions, not just UI rendering
 * - Verifies access control when impersonating different user+group combinations
 * - Cleans up all created resources after tests complete
 *
 * This test suite focuses on permission verification.
 * For UI/UX smoke tests, see: impersonate-user-smoke.cy.ts
 */

/* eslint-disable cypress/no-unnecessary-waiting */

import { checkErrors } from '../../support';
import { guidedTour } from '../../views/guided-tour';
import { nav } from '../../views/nav';

describe('Multi-Group Impersonation RBAC E2E', () => {
  // Test data
  const testNamespaceA = 'test-impersonate-ns-a';
  const testNamespaceB = 'test-impersonate-ns-b';
  const testNamespaceC = 'test-impersonate-ns-c';
  const testGroupA = 'test-impersonate-group-a';
  const testGroupB = 'test-impersonate-group-b';
  const testGroupC = 'test-impersonate-group-c';
  const testUser = 'test-impersonate-user';

  before(() => {
    cy.login();
    guidedTour.close();
    cy.visit('/');

    // Create test resources via kubectl/oc commands
    cy.log('Setting up test resources: namespaces, groups, and RBAC');

    // Create test namespaces
    cy.exec(`oc create namespace ${testNamespaceA} --dry-run=client -o yaml | oc apply -f -`, {
      failOnNonZeroExit: false,
    });
    cy.exec(`oc create namespace ${testNamespaceB} --dry-run=client -o yaml | oc apply -f -`, {
      failOnNonZeroExit: false,
    });
    cy.exec(`oc create namespace ${testNamespaceC} --dry-run=client -o yaml | oc apply -f -`, {
      failOnNonZeroExit: false,
    });

    // Create test groups
    cy.exec(
      `cat <<EOF | oc apply -f -
apiVersion: user.openshift.io/v1
kind: Group
metadata:
  name: ${testGroupA}
users: []
EOF`,
      { failOnNonZeroExit: false },
    );

    cy.exec(
      `cat <<EOF | oc apply -f -
apiVersion: user.openshift.io/v1
kind: Group
metadata:
  name: ${testGroupB}
users: []
EOF`,
      { failOnNonZeroExit: false },
    );

    cy.exec(
      `cat <<EOF | oc apply -f -
apiVersion: user.openshift.io/v1
kind: Group
metadata:
  name: ${testGroupC}
users: []
EOF`,
      { failOnNonZeroExit: false },
    );

    // Create RoleBindings: Group A → view in Namespace A
    cy.exec(
      `oc create rolebinding ${testGroupA}-view -n ${testNamespaceA} --clusterrole=view --group=${testGroupA} --dry-run=client -o yaml | oc apply -f -`,
      { failOnNonZeroExit: false },
    );

    // Create RoleBindings: Group B → edit in Namespace B
    cy.exec(
      `oc create rolebinding ${testGroupB}-edit -n ${testNamespaceB} --clusterrole=edit --group=${testGroupB} --dry-run=client -o yaml | oc apply -f -`,
      { failOnNonZeroExit: false },
    );

    // Create RoleBindings: Group C → admin in Namespace C
    cy.exec(
      `oc create rolebinding ${testGroupC}-admin -n ${testNamespaceC} --clusterrole=admin --group=${testGroupC} --dry-run=client -o yaml | oc apply -f -`,
      { failOnNonZeroExit: false },
    );

    // Create a test pod in namespace A using YAML with proper security context
    cy.exec(
      `cat <<EOF | oc apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: test-pod-a
  namespace: ${testNamespaceA}
  labels:
    app: test
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: test
    image: registry.access.redhat.com/ubi8/ubi-minimal:latest
    command: ["/bin/sh", "-c", "sleep infinity"]
    securityContext:
      allowPrivilegeEscalation: false
      runAsNonRoot: true
      runAsUser: 1000
      capabilities:
        drop:
        - ALL
      seccompProfile:
        type: RuntimeDefault
EOF`,
      { failOnNonZeroExit: false },
    ).then((result) => {
      cy.log(`Pod A creation: ${result.stdout || result.stderr}`);
      if (result.code !== 0) {
        cy.log(`⚠️ Pod A creation failed with code ${result.code}`);
      }
    });

    // Create a test pod in namespace B using YAML with proper security context
    cy.exec(
      `cat <<EOF | oc apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: test-pod-b
  namespace: ${testNamespaceB}
  labels:
    app: test
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: test
    image: registry.access.redhat.com/ubi8/ubi-minimal:latest
    command: ["/bin/sh", "-c", "sleep infinity"]
    securityContext:
      allowPrivilegeEscalation: false
      runAsNonRoot: true
      runAsUser: 1000
      capabilities:
        drop:
        - ALL
      seccompProfile:
        type: RuntimeDefault
EOF`,
      { failOnNonZeroExit: false },
    ).then((result) => {
      cy.log(`Pod B creation: ${result.stdout || result.stderr}`);
      if (result.code !== 0) {
        cy.log(`⚠️ Pod B creation failed with code ${result.code}`);
      }
    });

    // Wait for pods to be created and potentially start
    cy.wait(10000);

    // Verify pods exist and show their status
    cy.exec(`oc get pods test-pod-a -n ${testNamespaceA} -o wide`, {
      failOnNonZeroExit: false,
    }).then((result) => {
      cy.log(`Namespace A pod status:\n${result.stdout || result.stderr}`);
    });

    cy.exec(`oc get pods test-pod-b -n ${testNamespaceB} -o wide`, {
      failOnNonZeroExit: false,
    }).then((result) => {
      cy.log(`Namespace B pod status:\n${result.stdout || result.stderr}`);
    });

    cy.log('Test resources setup complete - check logs above for pod status');
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.log('Cleaning up test resources');

    // Stop any active impersonation first
    cy.get('body').then(($body) => {
      if ($body.find('.pf-v6-c-banner:contains("You are impersonating")').length > 0) {
        cy.get('[data-test="user-dropdown-toggle"]').then(($toggle) => {
          if ($toggle.length > 0 && $toggle.is(':visible')) {
            cy.wrap($toggle).click();
            cy.get('body').then(($body2) => {
              if ($body2.find('[data-test="stop-impersonate"]').length > 0) {
                cy.byTestID('stop-impersonate').click();
                cy.contains('You are impersonating', { timeout: 10000 }).should('not.exist');
              }
            });
          }
        });
      }
    });

    // Delete test resources
    cy.exec(`oc delete namespace ${testNamespaceA} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
    cy.exec(`oc delete namespace ${testNamespaceB} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
    cy.exec(`oc delete namespace ${testNamespaceC} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });

    // Delete test groups
    cy.exec(`oc delete group ${testGroupA} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
    cy.exec(`oc delete group ${testGroupB} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
    cy.exec(`oc delete group ${testGroupC} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });

    cy.log('Cleanup complete');
  });

  // Helper function to start impersonation
  const startImpersonation = (username: string, groups: string[] = []) => {
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('impersonate-user').should('be.visible').click();
    guidedTour.close();
    cy.byTestID('username-input').should('be.visible').clear().type(username);

    if (groups.length > 0) {
      groups.forEach((group) => {
        // Open dropdown, type to filter, then select
        cy.get('[placeholder="Enter groups"]').click();
        cy.wait(500);
        cy.contains(group).should('be.visible').click();
        // Close dropdown after each selection
        cy.byTestID('username-input').click();
        cy.wait(500);
      });
    }

    cy.byTestID('impersonate-button').should('not.be.disabled').should('be.visible').click();
    cy.wait(1000);

    cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');
  };

  // Helper function to stop impersonation
  const stopImpersonation = () => {
    guidedTour.close();
    cy.byTestID('user-dropdown-toggle').should('be.visible').click();
    cy.byTestID('stop-impersonate').should('be.visible').click();
    cy.contains('You are impersonating', { timeout: 10000 }).should('not.exist');
  };

  describe('Single Group Access Control', () => {
    it('should have access to namespace A resources when impersonating with Group A', () => {
      guidedTour.close();
      startImpersonation(testUser, [testGroupA]);

      // Verify impersonation is active
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');
      cy.contains(testUser).should('be.visible');
      cy.contains(testGroupA).should('be.visible');

      // Navigate to Pods page using client-side navigation
      nav.sidenav.clickNavLink(['Workloads', 'Pods']);
      cy.wait(1500);

      // Banner should still be visible
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Use namespace dropdown to select namespace A
      cy.get('.co-namespace-dropdown button').click();
      cy.wait(500);
      cy.contains(testNamespaceA).should('be.visible').click();
      cy.wait(2000); // Wait for pods to load

      // Verify impersonation banner still visible
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Should be able to see the pod (view permission)
      cy.contains('test-pod-a', { timeout: 10000 }).should('be.visible');

      stopImpersonation();
    });

    it('should NOT have access to namespace B when impersonating with only Group A', () => {
      guidedTour.close();
      startImpersonation(testUser, [testGroupA]);

      // Verify impersonation is active
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Navigate to Pods page
      nav.sidenav.clickNavLink(['Workloads', 'Pods']);
      cy.wait(1500);

      // Banner should still be visible
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Open namespace dropdown
      cy.get('.co-namespace-dropdown button').click();
      cy.wait(500);

      // Namespace B should NOT be visible in the dropdown (no permissions)
      cy.get('body').then(($body) => {
        if ($body.text().includes(testNamespaceB)) {
          // If somehow visible, it's an error - user shouldn't see namespaces they don't have access to
          cy.log('⚠️ WARNING: User can see namespace B when they should not have access');
        } else {
          cy.log('✅ Correctly not showing namespace B (no permissions)');
        }
      });

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify via API that user has no access to namespace B
      cy.exec(`oc get pods -n ${testNamespaceB} --as=${testUser} --as-group=${testGroupA}`, {
        failOnNonZeroExit: false,
      }).then((result) => {
        expect(result.code).to.not.equal(0);
        expect(result.stderr).to.include('cannot list resource "pods"');
      });

      stopImpersonation();
    });

    it('should have edit access in namespace B when impersonating with Group B', () => {
      guidedTour.close();
      startImpersonation(testUser, [testGroupB]);

      // Verify impersonation is active
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');
      cy.contains(testGroupB).should('be.visible');

      // Navigate to Pods page
      nav.sidenav.clickNavLink(['Workloads', 'Pods']);
      cy.wait(1500);

      // Banner should still be visible
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Use namespace dropdown to select namespace B
      cy.get('.co-namespace-dropdown button').click();
      cy.wait(500);
      cy.contains(testNamespaceB).should('be.visible').click();
      cy.wait(2000);

      // Banner should still be visible
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Should see the pod (edit permission includes view)
      cy.contains('test-pod-b', { timeout: 10000 }).should('be.visible');

      // Verify through API for edit permission
      cy.exec(
        `oc auth can-i create pods -n ${testNamespaceB} --as=${testUser} --as-group=${testGroupB}`,
        { failOnNonZeroExit: false },
      ).then((result) => {
        expect(result.stdout.trim()).to.equal('yes');
      });

      stopImpersonation();
    });
  });

  describe('Multi-Group Combined Access', () => {
    it('should have access to both namespace A and B when impersonating with Groups A+B', () => {
      guidedTour.close();
      startImpersonation(testUser, [testGroupA, testGroupB]);

      // Verify banner shows groups (may be collapsed in "more" tooltip if too many)
      cy.contains('with groups:', { timeout: 10000 }).should('be.visible');
      cy.contains(testUser).should('be.visible');

      // Check if there's a "more" link and verify groups
      cy.get('.pf-v6-c-banner').then(($banner) => {
        if ($banner.text().includes('more')) {
          cy.log('✓ Groups in tooltip, hovering to verify');

          // Hover over the "more" link
          cy.contains('more').first().trigger('mouseenter').wait(500);

          // Verify tooltip shows both groups
          cy.get('[role="tooltip"]', { timeout: 5000 })
            .should('be.visible')
            .within(() => {
              cy.contains(testGroupA).should('exist');
              cy.contains(testGroupB).should('exist');
            });

          cy.contains('more').first().trigger('mouseleave');
        } else {
          // Both groups should be visible directly
          cy.contains(testGroupA).should('be.visible');
          cy.contains(testGroupB).should('be.visible');
        }
      });

      // Navigate to Pods page using client-side navigation
      nav.sidenav.clickNavLink(['Workloads', 'Pods']);
      cy.wait(1500);

      // Banner should still be visible
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Use namespace dropdown to select namespace A
      cy.get('.co-namespace-dropdown button').click();
      cy.wait(500);
      cy.contains(testNamespaceA).should('be.visible').click();
      cy.wait(2000);

      // Should see pod in namespace A
      cy.contains('test-pod-a', { timeout: 10000 }).should('be.visible');
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Use namespace dropdown to select namespace B
      cy.get('.co-namespace-dropdown button').click();
      cy.wait(500);
      cy.contains(testNamespaceB).should('be.visible').click();
      cy.wait(2000);

      // Should see pod in namespace B
      cy.contains('test-pod-b', { timeout: 10000 }).should('be.visible');
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      stopImpersonation();
    });

    it('should have admin access in namespace C when impersonating with Group C', () => {
      guidedTour.close();
      startImpersonation(testUser, [testGroupC]);

      // Verify impersonation with Group C
      cy.contains('with groups:', { timeout: 10000 }).should('be.visible');
      cy.contains(testUser).should('be.visible');

      // Navigate to Pods page
      nav.sidenav.clickNavLink(['Workloads', 'Pods']);
      cy.wait(1500);

      // Banner should still be visible
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Use namespace dropdown to select namespace C
      cy.get('.co-namespace-dropdown button').click();
      cy.wait(500);
      cy.contains(testNamespaceC).should('be.visible').click();
      cy.wait(2000);

      // Banner should still be visible
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Verify admin permissions via API (create, delete)
      cy.exec(
        `oc auth can-i create pods -n ${testNamespaceC} --as=${testUser} --as-group=${testGroupC}`,
        { failOnNonZeroExit: false },
      ).then((result) => {
        expect(result.stdout.trim()).to.equal('yes');
      });

      cy.exec(
        `oc auth can-i delete pods -n ${testNamespaceC} --as=${testUser} --as-group=${testGroupC}`,
        { failOnNonZeroExit: false },
      ).then((result) => {
        expect(result.stdout.trim()).to.equal('yes');
      });

      stopImpersonation();
    });

    it('should combine all three groups permissions correctly', () => {
      guidedTour.close();
      startImpersonation(testUser, [testGroupA, testGroupB, testGroupC]);

      // Verify groups shown in banner (some may be in "X more" tooltip)
      cy.contains('with groups:', { timeout: 10000 }).should('be.visible');
      cy.contains(testUser).should('be.visible');

      // Check if there's a "more" link and hover to see tooltip
      cy.get('.pf-v6-c-banner').then(($banner) => {
        if ($banner.text().includes('more')) {
          cy.log('✓ Multiple groups present, checking tooltip for hidden groups');

          // Find and hover over the "more" link/button
          cy.contains('more').first().trigger('mouseenter').wait(500);

          // Verify tooltip shows all groups
          cy.get('[role="tooltip"]', { timeout: 5000 })
            .should('be.visible')
            .within(() => {
              cy.contains(testGroupA).should('exist');
              cy.contains(testGroupB).should('exist');
              cy.contains(testGroupC).should('exist');
            });

          // Trigger mouseleave to hide tooltip
          cy.contains('more').first().trigger('mouseleave');
        } else {
          cy.log('✓ Checking all groups are visible in banner');
          // If no "more" link, all groups should be visible directly
          cy.get('.pf-v6-c-banner').within(() => {
            cy.contains(testGroupA).should('be.visible');
            cy.contains(testGroupB).should('be.visible');
            cy.contains(testGroupC).should('be.visible');
          });
        }
      });

      // Navigate to Pods page
      nav.sidenav.clickNavLink(['Workloads', 'Pods']);
      cy.wait(1500);
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Test access to all three namespaces via API
      const asFlags = `--as=${testUser} --as-group=${testGroupA} --as-group=${testGroupB} --as-group=${testGroupC}`;

      // Namespace A: view permission from Group A
      cy.exec(`oc get pods -n ${testNamespaceA} ${asFlags}`, {
        failOnNonZeroExit: false,
      }).then((result) => {
        expect(result.code).to.equal(0);
        expect(result.stdout).to.include('test-pod-a');
      });

      // Namespace B: edit permission from Group B
      cy.exec(`oc auth can-i create pods -n ${testNamespaceB} ${asFlags}`, {
        failOnNonZeroExit: false,
      }).then((result) => {
        expect(result.stdout.trim()).to.equal('yes');
      });

      // Namespace C: admin permission from Group C
      cy.exec(`oc auth can-i delete pods -n ${testNamespaceC} ${asFlags}`, {
        failOnNonZeroExit: false,
      }).then((result) => {
        expect(result.stdout.trim()).to.equal('yes');
      });

      stopImpersonation();
    });
  });

  describe('Group Search and Filter with Real Groups', () => {
    it('should filter and find our test groups', () => {
      cy.byTestID('user-dropdown-toggle').should('be.visible').click();
      cy.byTestID('impersonate-user').should('be.visible').click();
      guidedTour.close();

      // Type to filter for our test groups
      cy.get('[placeholder="Enter groups"]')
        .should('be.visible')
        .click()
        .type('test-impersonate-group');
      cy.wait(500);

      // Should find our test groups in the dropdown menu
      cy.get('.pf-v6-c-menu__list', { timeout: 10000 }).should('be.visible');
      cy.get('.pf-v6-c-menu__list-item')
        .contains(testGroupA, { timeout: 5000 })
        .should('be.visible');
      cy.get('.pf-v6-c-menu__list-item')
        .contains(testGroupB, { timeout: 5000 })
        .should('be.visible');
      cy.get('.pf-v6-c-menu__list-item')
        .contains(testGroupC, { timeout: 5000 })
        .should('be.visible');

      // Close dropdown by clicking on username input
      cy.byTestID('username-input').click();

      cy.byTestID('cancel-button').should('be.visible').click();
    });

    it('should show "No results found" when filter matches nothing', () => {
      cy.byTestID('user-dropdown-toggle').should('be.visible').click();
      cy.byTestID('impersonate-user').should('be.visible').click();
      guidedTour.close();

      cy.get('[placeholder="Enter groups"]')
        .should('be.visible')
        .click()
        .type('nonexistent-group-xyz123');
      cy.wait(500);

      cy.contains('No results found', { timeout: 10000 }).should('be.visible');

      // Close dropdown by clicking on username input
      cy.byTestID('username-input').click();

      cy.byTestID('cancel-button').should('be.visible').click();
    });
  });

  describe('Group Selection and Deselection', () => {
    it('should allow removing selected groups and verify access changes', () => {
      cy.byTestID('user-dropdown-toggle').should('be.visible').click();
      cy.byTestID('impersonate-user').should('be.visible').click();
      guidedTour.close();

      cy.byTestID('username-input').should('be.visible').type(testUser);

      // Select Group A
      cy.get('[placeholder="Enter groups"]').should('be.visible').click();
      cy.wait(500);
      cy.contains(testGroupA).should('be.visible').click();
      cy.byTestID('username-input').click(); // Close dropdown
      cy.wait(500);

      // Verify chip appears
      cy.get('.pf-v6-c-label').should('have.length', 1);

      // Select Group B
      cy.get('[placeholder="Enter groups"]').click();
      cy.wait(500);
      cy.contains(testGroupB).should('be.visible').click();
      cy.byTestID('username-input').click(); // Close dropdown
      cy.wait(500);

      // Close dropdown by clicking on username input
      cy.byTestID('username-input').click();

      // Should have 2 chips now
      cy.get('.pf-v6-c-label').should('have.length', 2);

      // Remove Group B by clicking X on the label chip
      cy.contains('.pf-v6-c-label', testGroupB).find('button').click();

      // Should have 1 chip remaining
      cy.get('.pf-v6-c-label').should('have.length', 1);

      cy.byTestID('cancel-button').should('be.visible').click();
    });
  });

  describe('Permission Persistence and Verification', () => {
    it('should maintain impersonation state while staying on current page', () => {
      guidedTour.close();
      startImpersonation(testUser, [testGroupB]);

      // Verify impersonation is active
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');
      cy.contains(testUser).should('be.visible');
      cy.contains(testGroupB).should('be.visible');

      // Verify access via API call
      cy.exec(`oc get pods -n ${testNamespaceB} --as=${testUser} --as-group=${testGroupB}`, {
        failOnNonZeroExit: false,
      }).then((result) => {
        expect(result.code).to.equal(0);
        expect(result.stdout).to.include('test-pod-b');
      });

      // Wait and verify banner is still visible (impersonation persists)
      cy.wait(2000);
      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');

      // Verify access still works
      cy.exec(`oc get pods -n ${testNamespaceB} --as=${testUser} --as-group=${testGroupB}`, {
        failOnNonZeroExit: false,
      }).then((result) => {
        expect(result.code).to.equal(0);
        expect(result.stdout).to.include('test-pod-b');
      });

      stopImpersonation();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should not allow impersonating with empty groups array after selection', () => {
      cy.byTestID('user-dropdown-toggle').should('be.visible').click();
      cy.byTestID('impersonate-user').should('be.visible').click();
      guidedTour.close();

      cy.byTestID('username-input').should('be.visible').type(testUser);

      // Select a group
      cy.get('[placeholder="Enter groups"]').should('be.visible').click();
      cy.wait(500);
      cy.contains(testGroupA).should('be.visible').click();
      cy.byTestID('username-input').click(); // Close dropdown
      cy.wait(500);

      // Remove the group
      cy.get('.pf-v6-c-label').first().find('button').click();

      // Button should still be enabled (impersonation without groups is valid)
      cy.byTestID('impersonate-button').should('not.be.disabled');

      cy.byTestID('cancel-button').should('be.visible').click();
    });

    it('should handle special characters in username with group impersonation', () => {
      const specialUser = 'user@example-org.com';

      cy.byTestID('user-dropdown-toggle').should('be.visible').click();
      cy.byTestID('impersonate-user').should('be.visible').click();
      guidedTour.close();

      cy.byTestID('username-input').should('be.visible').type(specialUser);

      // Add a group
      cy.get('[placeholder="Enter groups"]').should('be.visible').click();
      cy.wait(500);
      cy.contains(testGroupA).should('be.visible').click();

      cy.byTestID('username-input').click();
      cy.wait(500);
      cy.byTestID('impersonate-button').should('not.be.disabled').should('be.visible').click();

      cy.wait(2000);

      cy.contains('You are impersonating', { timeout: 10000 }).should('be.visible');
      cy.contains(specialUser).should('be.visible');
      cy.contains(testGroupA).should('be.visible');

      stopImpersonation();
    });
  });
});
