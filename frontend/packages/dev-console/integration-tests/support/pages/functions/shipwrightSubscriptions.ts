export const createShipwrightBuildUsingCLI = (retries: number = 3) => {
  const yamlFile = '../../shipwright-plugin/integration-tests/testData/sampleShipwrightBuild.yaml';
  cy.exec(`oc apply -f ${yamlFile}`, {
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

export const createBuildsForOpenshiftBuildUsingCLI = (retries: number = 3) => {
  const yamlFile =
    '../../shipwright-plugin/integration-tests/testData/buildsForOpenshiftOperatorInstallation/openshiftBuilds.yaml';
  cy.exec(`oc apply -f ${yamlFile}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout || result.stderr);
    if (result.stderr) {
      if (retries === 0) {
        throw new Error(result.stderr);
      }
      cy.wait(20000);
      createBuildsForOpenshiftBuildUsingCLI(retries - 1);
    }
  });
};

/* Check whether the ShipwrightBuild Resource is created successfully */
export const checkShipwrightBuildStatus = (retries: number = 3) => {
  if (retries === 0) {
    throw new Error('Failed to install Builds for Openshift Operator - Pod timeout');
  } else {
    cy.exec(`oc wait --for=condition=ready ShipwrightBuild/openshift-builds --timeout=300s`, {
      failOnNonZeroExit: false,
    }).then(function (result) {
      if (result.stdout.includes('condition met')) {
        cy.log(`Success: ${result.stdout}`);
      } else {
        cy.log(result.stderr);
        cy.wait(30000);
        checkShipwrightBuildStatus(retries - 1);
      }
    });
  }
};

/* Note: To be removed with the newer version of operator in the future */
export const createClusterBuildStrategiesUsingCLI = (retries: number = 3) => {
  const clusterBuildStrategies = [
    '../../shipwright-plugin/integration-tests/testData/buildsForOpenshiftOperatorInstallation/buildah.yaml',
    '../../shipwright-plugin/integration-tests/testData/buildsForOpenshiftOperatorInstallation/s2i.yaml',
  ];

  for (const strategy of clusterBuildStrategies) {
    cy.exec(`oc apply -f ${strategy}`, {
      failOnNonZeroExit: false,
    }).then(function (result) {
      cy.log(result.stdout || result.stderr);
      if (result.stderr) {
        if (retries === 0) {
          throw new Error(result.stderr);
        }
        cy.wait(20000);
        createClusterBuildStrategiesUsingCLI(retries - 1);
      }
    });
  }
};
