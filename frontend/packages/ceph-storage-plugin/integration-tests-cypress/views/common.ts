export const commonFlows = {
  navigateToOCS: () => {
    cy.clickNavLink(['Operators', 'Installed Operators']);
    cy.byLegacyTestID('item-filter').type('ocs-operator');
    cy.byTestOperatorRow('OpenShift Container Storage').click();
  },
  checkAll: cy.get('input[name=check-all]'),
};
