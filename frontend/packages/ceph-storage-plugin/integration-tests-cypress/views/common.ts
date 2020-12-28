export const commonFlows = {
  navigateToOCS: (isOperatorsOpen = false) => {
    const path = isOperatorsOpen ? ['Installed Operators'] : ['Operators', 'Installed Operators'];
    cy.clickNavLink(path);
    cy.byLegacyTestID('item-filter').type('ocs');
    cy.byTestOperatorRow('OpenShift Container Storage').click();
  },
  checkAll: () => cy.get('input[name=check-all]'),
};
