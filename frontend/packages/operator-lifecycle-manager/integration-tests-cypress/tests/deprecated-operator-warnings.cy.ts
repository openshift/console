import { checkErrors, create, testName } from '../../../integration-tests-cypress/support';
import { testDeprecatedCatalogSource, testDeprecatedSubscription } from '../mocks';
import { operator } from '../views/operator.view';

const TIMEOUT = { timeout: 300000 };
const testOperatorName = 'Kiali Community Operator';
const testOperator = {
  name: 'Kiali Operator',
};
const deprecatedBadge = 'Deprecated';
const deprecatedPackageMessage =
  "package kiali is end of life. Please use 'kiali-new' package for support.";
const deprecatedChannelMessage =
  "channel alpha is no longer supported. Please switch to channel 'stable'.";
const deprecatedVersionMessage =
  'kiali-operator.v1.68.0 is deprecated. Uninstall and install kiali-operator.v1.72.0 for support.';
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

  it('verify deprecated Operator warning badge on Installed Operators page', () => {
    cy.log(
      'install the Kiali Community Operator with the deprecated package, channel and version messages',
    );
    create(testDeprecatedSubscription);

    cy.log('visit the Installed Operators Subscription tab');
    cy.visit(
      `/k8s/ns/${testDeprecatedSubscription.metadata.namespace}/operators.coreos.com~v1alpha1~Subscription/kiali`,
    );

    cy.log('verify the Kiali Community Operator Subscription requires approval');
    cy.byTestID('operator-subscription-requires-approval', TIMEOUT).should(
      'have.text',
      '1 requires approval',
    );

    cy.log('approve the Kiali Community Operator Subscription');
    cy.exec(
      `oc patch installplan $(oc get installplan -n ${testDeprecatedSubscription.metadata.namespace} --no-headers | grep kiali-operator.v1.68.0 | grep Manual | awk '{print $1}') -n ${testDeprecatedSubscription.metadata.namespace} --type merge --patch '{"spec":{"approved":true}}'`,
    );

    cy.log('visit the Installed Operators details page and verify the deprecated Operator badge');
    operator.installedSucceeded(testOperator.name, 'openshift-operators');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID, TIMEOUT)
      .contains(deprecatedBadge)
      .should('exist');
  });

  it('verify deprecated operator warnings on Installed Operator details page', () => {
    cy.log('visit the Installed Operators details page');
    cy.visit(
      `/k8s/ns/${testDeprecatedSubscription.metadata.namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/kiali-operator.v1.68.0`,
    );

    cy.log('verify the Deprecated badge on Kiali Community Operator logo');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID).contains(deprecatedBadge).should('exist');

    cy.log(
      'verify that the deprecated messages for package, channel, and version are displayed on the Installed Operator details tab.',
    );
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

  it('verify deprecated operator warnings on Installed Operator details subscription tab', () => {
    cy.log('visit the Installed Operators subscription tab');
    cy.visit(
      `/k8s/ns/${testDeprecatedSubscription.metadata.namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/kiali-operator.v1.68.0/subscription`,
    );

    cy.log(
      'verify that the deprecated messages for package, channel, and version are displayed on the Installed Operator subscription tab.',
    );
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID)
      .contains(deprecatedPackageMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID)
      .contains(deprecatedChannelMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('exist');

    cy.log('verify that the deprecated operator subscription update icon is displayed');
    cy.byTestID('deprecated-operator-warning-subscription-update-icon').should('exist');

    cy.log(
      'verify that the deprecated operator subscription update icon is displayed on the change subscription update channel modal',
    );
    cy.byTestID('subscription-channel-update-button').click();
    cy.byTestID('kiali-operator.v1.83.0').should('exist');
  });
});
