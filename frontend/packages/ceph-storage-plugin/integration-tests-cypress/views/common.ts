export const commonFlows = {
  navigateToOCS: (isOperatorsOpen = false) => {
    const path = isOperatorsOpen ? ['Installed Operators'] : ['Operators', 'Installed Operators'];
    cy.clickNavLink(path);
    cy.byLegacyTestID('item-filter').type('ocs');
    cy.byTestOperatorRow('OpenShift Container Storage').click();
  },
  checkAll: () => cy.get('input[name=check-all]'),
};

export const commandPoll = (
  cmd: string,
  expected: string,
  failOnNonZeroExit: boolean = true,
  retry: number = 300,
) => {
  cy.exec(cmd, { failOnNonZeroExit }).then((res) => {
    if (res.stdout === expected) {
      assert(true);
      return;
    }
    if (retry <= 0) {
      assert(false);
      return;
    }

    commandPoll(cmd, expected, failOnNonZeroExit, retry - 1);
  });
};
