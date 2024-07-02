export const createShipwrightBuildUsingCLI = (retries: number = 3) => {
  const namespace = 'knative-eventing';
  const yamlFile = '../../shipwright-plugin/integration-tests/testData/sampleShipwrightBuild.yaml';
  cy.exec(`oc apply -f ${yamlFile} -n ${namespace}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout || result.stderr);
    if (result.stderr) {
      if (retries === 0) {
        throw new Error(result.stderr);
      }
      cy.wait(20000);
      createShipwrightBuildUsingCLI(retries - 1);
    }
  });
};
