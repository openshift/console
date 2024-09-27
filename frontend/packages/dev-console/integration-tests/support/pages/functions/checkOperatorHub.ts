export const checkOperatorvailabilityStatus = (operatorName: string) => {
  cy.exec(`source ../../dev-console/integration-tests/testData/krew-install.sh ${operatorName}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(`Operator availability check :`);
    cy.log(result.stdout || result.stderr);
    if (result.stdout.includes(`"${operatorName}" not found`)) {
      throw new Error(`Failed to install ${operatorName} Operator - Operator not available.`);
    }
  });
};
