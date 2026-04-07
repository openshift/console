import { checkErrors, create, testName } from '@console/cypress-integration-tests/support';
import { testDeprecatedCatalogSource, testDeprecatedSubscription } from '../mocks';
import { operator } from '../views/operator.view';

const TIMEOUT = { timeout: 300000 };
const testOperatorName = 'Kiali Community Operator';
const testOperator = {
  name: 'Kiali Operator',
};
const deprecatedBadge = 'Deprecated';
const deprecatedPackageMessage = 'package kiali is end of life';
const deprecatedChannelMessage = 'channel alpha is no longer supported';
const deprecatedVersionMessage = 'kiali-operator.v1.68.0 is deprecated';
const DEPRECATED_OPERATOR_WARNING_BADGE_ID = 'deprecated-operator-warning-badge';
const DEPRECATED_OPERATOR_WARNING_PACKAGE_ID = 'deprecated-operator-warning-package';
const DEPRECATED_OPERATOR_WARNING_CHANNEL_ID = 'deprecated-operator-warning-channel';
const DEPRECATED_OPERATOR_WARNING_VERSION_ID = 'deprecated-operator-warning-version';

describe('Deprecated operator warnings', () => {
  const subscriptionName = testDeprecatedSubscription.metadata.name;
  const subscriptionNamespace = testDeprecatedSubscription.metadata.namespace;
  const csvName = testDeprecatedSubscription.spec.startingCSV;
  const catalogSourceName = testDeprecatedCatalogSource.metadata.name;
  const catalogSourceNamespace = testDeprecatedCatalogSource.metadata.namespace;

  const cleanupOperatorResources = () => {
    // Delete subscription first to stop operator reconciliation
    cy.exec(
      `oc delete subscription ${subscriptionName} -n ${subscriptionNamespace} --ignore-not-found --wait=false`,
      { failOnNonZeroExit: false, timeout: 60000 },
    );
    // Delete CSV to remove the operator
    cy.exec(
      `oc delete clusterserviceversion ${csvName} -n ${subscriptionNamespace} --ignore-not-found --wait=false`,
      { failOnNonZeroExit: false, timeout: 60000 },
    );
    // Delete any InstallPlans related to the operator
    cy.exec(
      `oc delete installplan -n ${subscriptionNamespace} -l operators.coreos.com/${subscriptionName}.${subscriptionNamespace}= --ignore-not-found --wait=false`,
      { failOnNonZeroExit: false, timeout: 60000 },
    );
  };

  before(() => {
    cy.login();
    // Clean up any existing resources from previous failed runs
    cleanupOperatorResources();
    cy.exec(
      `oc delete catalogsource ${catalogSourceName} -n ${catalogSourceNamespace} --ignore-not-found --wait=false`,
      { failOnNonZeroExit: false, timeout: 60000 },
    );
    create(testDeprecatedCatalogSource);
  });

  after(() => {
    cy.visit('/');
    // Clean up operator resources
    cleanupOperatorResources();
    // Clean up catalog source
    cy.exec(
      `oc delete catalogsource ${catalogSourceName} -n ${catalogSourceNamespace} --ignore-not-found --wait=false`,
      { failOnNonZeroExit: false, timeout: 60000 },
    );
    checkErrors();
  });

  it('verify deprecated Operator warning badge on the Operator tile', () => {
    cy.visit(
      `/k8s/ns/${testDeprecatedCatalogSource.metadata.namespace}/operators.coreos.com~v1alpha1~CatalogSource/test-community-operator-deprecation`,
    );
    cy.log('verify the test-community-operator-deprecation CatalogSource is in "READY" status');
    cy.byTestSelector('details-item-value__Status', TIMEOUT).should('have.text', 'READY');

    cy.log('visit Software Catalog');
    cy.visit(`/catalog/ns/${testName}`);
    cy.byTestID('tab operator').click();

    cy.log('filter by the group name');
    cy.byTestID('source-community-operators-for-testing-deprecation').click();

    cy.log('filter by the operator name');
    cy.byTestID('search-catalog').type(testOperatorName);
    cy.get('.co-catalog-tile', TIMEOUT).its('length').should('eq', 1);

    cy.log('verify the Deprecated badge on Kiali Community Operator tile');
    cy.byTestID('Deprecated-badge').contains(deprecatedBadge).should('exist');
  });

  it('verify deprecated Operator warnings in the Operator details panel', () => {
    cy.visit(
      `/catalog/ns/${testName}?catalogType=operator&keyword=kia&selectedId=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0`,
    );
    cy.log('verify the deprecated operator badge exists');
    cy.byTestID('Deprecated-badge').contains(deprecatedBadge).should('exist');

    cy.log('verify the package deprecation warning exists when viewing a deprecated operator');
    cy.byTestID('deprecated-operator-warning-package')
      .contains(deprecatedPackageMessage)
      .should('exist');
  });

  it('verify deprecated channel warnings in the Operator details panel', () => {
    cy.visit(
      `/catalog/ns/${testName}?catalogType=operator&keyword=kia&selectedId=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0`,
    );

    cy.log('verify the channel deprecation warnings do not exist yet');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID)
      .contains(deprecatedChannelMessage)
      .should('not.exist');
    cy.byTestID('deprecated-operator-warning-channel-icon').should('not.exist');
    cy.log('verify the channel deprecation warning icon exists in the channel select menu');
    // force click because parent PF modal component causes button not to be "visible"
    cy.byTestID('operator-channel-select-toggle').should('exist').click({
      force: true,
    });
    cy.byTestID('deprecated-operator-warning-channel-icon').should('exist');
    // force click because parent PF modal component causes button not to be "visible"
    cy.get('[data-test="channel-option-alpha"] > button').click({ force: true });

    cy.log('verify the channel deprecation alert exists after selecting a deprecated channel');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID)
      .contains(deprecatedChannelMessage)
      .should('exist');
  });

  it('verify deprecated version warnings in the Operator details panel', () => {
    cy.visit(
      `/catalog/ns/${testName}?catalogType=operator&keyword=kia&selectedId=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0`,
    );

    cy.log('verify the version deprecation warnings do not exist yet');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('not.exist');
    cy.byTestID('deprecated-operator-warning-version-icon').should('not.exist');
    cy.log('verify the version deprecation warning icon exists in the version select menu');
    // force click because parent PF modal component causes button not to be "visible"
    cy.byTestID('operator-version-select-toggle').click({
      force: true,
    });
    cy.byTestID('deprecated-operator-warning-version-icon').should('exist');
    // force click because parent PF modal component causes button not to be "visible"
    cy.get('[data-test="version-option-kiali-operator.v1.68.0"] > button').click({ force: true });
    cy.log(
      'verify the version deprecation warning alert exists after selecting a deprecated version',
    );
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('exist');
  });

  it('verify deprecated Operator warnings on Install Operator details page', () => {
    cy.log('visit the Install Operator details page');
    cy.visit(
      '/operatorhub/subscribe?pkg=kiali&catalog=test-community-operator-deprecation&catalogNamespace=openshift-marketplace&targetNamespace=undefined&channel=alpha&version=1.68.0',
    );

    cy.log('verify the Deprecated badge on Kiali Community Operator logo');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID).contains(deprecatedBadge).should('exist');

    cy.log('verify the deprecation warning messages exists');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID)
      .contains(deprecatedPackageMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID)
      .contains(deprecatedChannelMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('exist');
  });

  // Tests for deprecation warnings on INSTALLED operators
  describe('Installed Operator deprecation warnings', () => {
    before(() => {
      const subscriptionYaml = JSON.stringify(testDeprecatedSubscription);

      cy.log('Install operator via CLI');
      cy.exec(`echo '${subscriptionYaml}' | oc apply -f -`, { timeout: 60000 });

      cy.log('Wait for InstallPlan to be created');
      cy.exec(
        `oc wait subscription/${subscriptionName} -n ${subscriptionNamespace} ` +
          `--for=jsonpath='{.status.installPlanRef.name}' --timeout=120s`,
        { timeout: 150000 },
      );

      cy.log('Approve InstallPlan via CLI');
      // eslint-disable-next-line promise/catch-or-return
      cy.exec(
        `oc get installplan -n ${subscriptionNamespace} -o jsonpath=` +
          `'{.items[?(@.spec.clusterServiceVersionNames[*]=="${csvName}")].metadata.name}'`,
        { timeout: 60000 },
      ).then((result) => {
        const installPlanName = result.stdout.trim();
        if (installPlanName) {
          return cy.exec(
            `oc patch installplan ${installPlanName} -n ${subscriptionNamespace} ` +
              `--type merge -p '{"spec":{"approved":true}}'`,
            { timeout: 60000 },
          );
        }
        return cy.wrap(null);
      });

      cy.log('Wait for CSV success and deprecation conditions');
      cy.exec(
        `oc wait csv/${csvName} -n ${subscriptionNamespace} ` +
          `--for=jsonpath='{.status.phase}'=Succeeded --timeout=300s && ` +
          `oc wait subscription/${subscriptionName} -n ${subscriptionNamespace} ` +
          `--for=condition=PackageDeprecated --timeout=180s`,
        { failOnNonZeroExit: false, timeout: 500000 },
      );
    });

    it('displays deprecated badge on Installed Operators list page', () => {
      cy.visit(
        `/k8s/ns/${subscriptionNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion`,
      );
      operator.filterByName(testOperator.name);
      cy.byTestOperatorRow(testOperator.name).should('exist');
      cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID, TIMEOUT)
        .should('exist')
        .and('contain.text', deprecatedBadge);
    });

    it('displays deprecation warnings on CSV details page', () => {
      cy.visit(
        `/k8s/ns/${subscriptionNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csvName}`,
      );
      cy.byLegacyTestID('horizontal-link-Details', { timeout: 60000 }).should('exist');

      cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID, TIMEOUT).should(
        'contain.text',
        deprecatedBadge,
      );
      cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID, TIMEOUT).should(
        'contain.text',
        deprecatedPackageMessage,
      );
      cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID, TIMEOUT).should(
        'contain.text',
        deprecatedChannelMessage,
      );
      cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID, TIMEOUT).should(
        'contain.text',
        deprecatedVersionMessage,
      );
    });

    it('displays deprecation warnings on CSV subscription tab', () => {
      cy.visit(
        `/k8s/ns/${subscriptionNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csvName}/subscription`,
      );
      cy.byLegacyTestID('horizontal-link-Subscription', { timeout: 60000 }).should('exist');

      cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID, TIMEOUT).should(
        'contain.text',
        deprecatedPackageMessage,
      );
      cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID, TIMEOUT).should(
        'contain.text',
        deprecatedChannelMessage,
      );
      cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID, TIMEOUT).should(
        'contain.text',
        deprecatedVersionMessage,
      );
      cy.byTestID('deprecated-operator-warning-subscription-update-icon', TIMEOUT).should('exist');

      cy.byTestID('subscription-channel-update-button', TIMEOUT).should('not.be.disabled').click();
      cy.get('.pf-v6-c-modal-box', { timeout: 30000 }).should('be.visible');
      cy.byTestID('kiali-operator.v1.83.0').should('exist');
    });
  });
});
